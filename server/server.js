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
      // Retry the same model up to 3 times on transient 503s before moving to the next model.
      for (let attempt = 0; attempt < 3; attempt++) {
        lastResult = await callGeminiModel(model, body);

        if (lastResult.ok) {
          return res.json(lastResult.data);
        }

        if (lastResult.status === 503) {
          console.warn(`${model} overloaded (attempt ${attempt + 1}/3), retrying...`);
          await sleep(1000 * (attempt + 1)); // 1s, 2s, 3s backoff
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