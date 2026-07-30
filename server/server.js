// server.js
// Minimal backend that keeps your Gemini API key secret and forwards
// requests from the React app to Google's Gemini API.
//
// Setup:
//   1. npm install express cors dotenv
//      (no node-fetch needed — Node 18+ has fetch built in)
//   2. Create a .env file next to this one with:
//        GEMINI_API_KEY=your_key_here
//        PORT=3001
//   3. node server.js
//
// Get a free key at: https://aistudio.google.com/apikey (no credit card needed)

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
// In production, set ALLOWED_ORIGIN to your deployed frontend's URL (e.g. https://your-app.vercel.app).
// Left unset, it allows all origins — fine for local dev, not recommended once deployed.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
app.use(cors(ALLOWED_ORIGIN ? { origin: ALLOWED_ORIGIN } : {}));
app.use(express.json({ limit: '25mb' })); // raised limit so base64 PDFs/images fit

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Tried in order: if the first is overloaded (503) or retired (404), fall back to the next.
// Check https://ai.google.dev/gemini-api/docs/models if all of these ever stop working —
// Google renames/retires models fairly often.
const MODEL_FALLBACKS = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

if (!GEMINI_API_KEY) {
  console.warn('WARNING: GEMINI_API_KEY is not set. Create a .env file — see comments at the top of server.js');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiModel(model, body) {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify(body)
    }
  );
  const data = await resp.json();
  return { ok: resp.ok, status: resp.status, data };
}

// Uploads raw bytes to Gemini's Files API ONCE, returning a small file URI
// that the frontend can then reference (via a `fileData` part) in every
// follow-up generateContent call instead of re-embedding the full base64
// payload each time. A multi-batch extraction can make dozens of calls —
// previously each one re-sent the entire source (e.g. a multi-MB PDF) to
// Google, which is what was driving huge "Service-Initiated" egress. Now the
// bytes cross the wire to Google exactly once, no matter how many turns the
// extraction takes.
// Files uploaded this way live on Google's side for ~48h before expiring —
// plenty for one extraction session, even a slow/interrupted one.
async function uploadFileToGemini(bytes, mimeType, displayName) {
  // Step 1: start a resumable upload session (metadata-only request).
  const startResp = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': String(bytes.length),
        'X-Goog-Upload-Header-Content-Type': mimeType,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ file: { display_name: displayName || 'upload' } })
    }
  );
  const uploadUrl = startResp.headers.get('x-goog-upload-url');
  if (!uploadUrl) {
    const errBody = await startResp.text().catch(() => '');
    throw new Error(`Failed to start Gemini upload session: ${errBody || startResp.status}`);
  }

  // Step 2: push the actual bytes and finalize in one shot.
  const finalizeResp = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': String(bytes.length),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize'
    },
    body: bytes
  });
  const fileInfo = await finalizeResp.json();
  if (!finalizeResp.ok || !fileInfo.file) {
    throw new Error(`Failed to finalize Gemini upload: ${JSON.stringify(fileInfo)}`);
  }

  // PDFs/images are normally ACTIVE immediately, but poll briefly just in
  // case Google is still post-processing it (this happens sometimes for
  // larger files) — a request that references the file before it's ACTIVE
  // would just fail and force a retry (i.e. more egress), so it's cheaper
  // to wait a few seconds here instead.
  let file = fileInfo.file;
  let attempts = 0;
  while (file.state === 'PROCESSING' && attempts < 10) {
    await sleep(1000);
    const checkResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${file.name}?key=${GEMINI_API_KEY}`
    );
    file = await checkResp.json();
    attempts++;
  }
  if (file.state === 'FAILED') {
    throw new Error('Gemini file processing failed');
  }

  return file;
}

app.post('/api/gemini/upload', async (req, res) => {
  try {
    const { data, mimeType, displayName } = req.body;
    if (!data || !mimeType) {
      return res.status(400).json({ error: 'Missing data or mimeType' });
    }
    const bytes = Buffer.from(data, 'base64');
    const file = await uploadFileToGemini(bytes, mimeType, displayName);
    res.json({ uri: file.uri, mimeType: file.mimeType, name: file.name, expirationTime: file.expirationTime });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload file to Gemini' });
  }
});

app.post('/api/gemini', async (req, res) => {
  try {
    const { contents, systemInstruction, maxOutputTokens, tools } = req.body;
    const body = {
      contents,
      systemInstruction,
      generationConfig: { maxOutputTokens: maxOutputTokens || 8192 },
      // Optional — the frontend passes tools: [{ codeExecution: {} }] when it
      // wants Gemini to actually run Python (its real sandbox, not a guess)
      // to verify the output of a "what does this code print?" question.
      ...(tools ? { tools } : {})
    };

    let lastResult = null;

    for (const model of MODEL_FALLBACKS) {
      // Retry the same model on transient 503s before moving to the next model.
      // A retry has to resend the request — there's no getting around that,
      // a 503 means no response was produced to reuse — but `body` is now
      // tiny (a Gemini file URI instead of a raw PDF, plus a bounded
      // conversation history instead of one that grows every iteration), so
      // what actually gets resent here is a rounding error compared to
      // before. Trimmed from 3 attempts down to 2 per model (6 total across
      // the 3 fallbacks instead of 9) to shave the worst-case multiplier
      // further, since two short backoffs is already enough to ride out most
      // momentary overload.
      for (let attempt = 0; attempt < 2; attempt++) {
        lastResult = await callGeminiModel(model, body);

        if (lastResult.ok) {
          return res.json(lastResult.data);
        }

        if (lastResult.status === 503) {
          console.warn(`${model} overloaded (attempt ${attempt + 1}/2), retrying...`);
          await sleep(1000 * (attempt + 1)); // 1s, 2s backoff
          continue;
        }

        // Non-503 error (e.g. 404 model not found/retired) — stop retrying this model, try the next one.
        console.error(`Gemini API error on ${model}:`, lastResult.data);
        break;
      }
    }

    // All models/attempts exhausted — return the last error we got.
    return res.status(lastResult.status).json(lastResult.data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Failed to reach Gemini API' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Gemini proxy server running on http://localhost:${PORT}`));