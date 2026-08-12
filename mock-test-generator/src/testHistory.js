// testHistory.js
// Split out the same way testProgress.js is: a tiny, React-free module for
// reading/writing the local "past attempts" list, so pages that just need to
// list/clear history (PastAttemptsPage) don't have to pull in anything else.
//
// This is intentionally NOT synced anywhere — it's plain localStorage, so
// history is local to this one browser (profile) on this one device. A
// different browser, a different device, or clearing site data all start
// fresh. There's no login, so there's nothing to sync it against anyway.
//
// Capped at MAX_ATTEMPTS entries, oldest-first (FIFO) eviction: entries are
// stored newest-first, so once the list would exceed the cap, the oldest
// entry (the last one in the array) is dropped.
const TEST_HISTORY_KEY = 'mocksy_test_history_v1';
export const MAX_ATTEMPTS = 30;

export function getTestHistory() {
  try {
    const raw = localStorage.getItem(TEST_HISTORY_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

// entry: { id, savedAt, title, obtained, maxObjective, correctCount,
//          wrongCount, unansweredObjective, totalQuestions,
//          timeUsedSeconds, totalMinutes }
export function addTestHistoryEntry(entry) {
  try {
    const current = getTestHistory();
    const next = [{ id: entry.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...entry }, ...current];
    // Newest-first list, so trimming the end drops the oldest entries —
    // this is the FIFO eviction once we're over MAX_ATTEMPTS.
    const trimmed = next.length > MAX_ATTEMPTS ? next.slice(0, MAX_ATTEMPTS) : next;
    localStorage.setItem(TEST_HISTORY_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch (e) {
    // Saving history is best-effort — never let it break the results screen.
    return getTestHistory();
  }
}

export function clearTestHistory() {
  try { localStorage.removeItem(TEST_HISTORY_KEY); } catch (e) { /* ignore */ }
}