# Mocksy — Mock Test Generator

Turn any question paper — a PDF, a Word doc, an image, or pasted text — into a timed, proctored mock test you can take right in the browser.

Upload a paper, review the questions Mocksy extracts, configure timing and negative marking, sit the test with a live palette and optional calculator, and get a scored results screen at the end.

## How it works

The repo has two parts:

```
Mock-Test-Generator-main/
├── mock-test-generator/   React frontend (Create React App)
└── server/                Express backend — proxies requests to Google's Gemini API
```

- **Frontend** (`mock-test-generator/`) — the whole app UI: upload screen, review/edit screen, configure screen, the timed test itself, and the results screen with a score breakdown.
- **Backend** (`server/`) — a small Express server that keeps your Gemini API key secret and forwards question-extraction requests from the frontend to Google's Gemini API. It also serves a simple visitor counter (see below).

## Features

- Extract questions from PDF, Word (`.docx`), images, or pasted text using Gemini
- Review and edit extracted questions and sections before starting
- Configure total time, per-section or per-question timing, and negative marking
- Take the test with a question palette, flagging, and an optional in-test calculator
- Auto-scored results with a breakdown chart
- Visitor counter shown in the footer of the home page

## Getting started

### 1. Backend

```bash
cd server
npm install
```

Create a `.env` file in `server/` with your Gemini API key:

```
GEMINI_API_KEY=your_key_here
PORT=3001
```

Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — no credit card needed.

Start the server:

```bash
node server.js
```

### 2. Frontend

```bash
cd mock-test-generator
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). In development the frontend proxies API requests to `http://localhost:3001` automatically (see `src/setupProxy.js`).

### Deploying

The frontend and backend are meant to be deployed separately (e.g. frontend on Vercel, backend on Render/Railway). Once the backend is deployed, set `REACT_APP_API_BASE` when building the frontend to point at its URL:

```
REACT_APP_API_BASE=https://your-backend-url.example.com
```

## Visitor counter

The home page footer shows a running visitor count. Each time the site is loaded (or reloaded), the frontend calls `GET /api/visitors` on the backend, which increments a counter persisted in `server/visitors.json` and returns the new total. It's a plain file-based counter — fine for a small project, but swap it for a real database if you expect meaningful traffic.

## Tech stack

- React (Create React App), Tailwind CSS
- Express backend proxy to Google Gemini
- `mammoth` for `.docx` text extraction, `recharts` for the results chart

## License

MIT — see [LICENSE](./LICENSE).