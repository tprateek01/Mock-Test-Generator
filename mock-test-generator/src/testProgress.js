// testProgress.js
// Split out of MockTestApp.jsx: reading/writing the autosaved in-progress
// test. Kept as its own tiny module (no React, no other app imports) so
// HomePage can check "is there a test to resume?" without pulling in the
// entire exam-flow bundle (mammoth, pdfjs, all five screens) just for a
// one-line localStorage check.
const TEST_PROGRESS_KEY = 'mocksy_test_progress_v1';

export function saveTestProgress(paper, config, state) {
  try {
    localStorage.setItem(TEST_PROGRESS_KEY, JSON.stringify({ paper, config, state, savedAt: Date.now() }));
  } catch (e) { /* ignore — autosave is best-effort */ }
}

export function loadTestProgress() {
  try {
    const raw = localStorage.getItem(TEST_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

export function clearTestProgress() {
  try { localStorage.removeItem(TEST_PROGRESS_KEY); } catch (e) { /* ignore */ }
}

// Used by HomePage to offer a "resume your test" shortcut instead of the
// user having to click through Upload again and lose their attempt.
export function hasResumableTest() {
  const saved = loadTestProgress();
  return !!(saved && saved.state && !saved.state.finished && saved.paper && saved.config);
}
