// PastAttemptsPage.jsx
// Shows the local "past attempts" history saved by ResultsScreen (see
// addTestHistoryEntry in MockTestApp.jsx). Purely local/localStorage-backed
// — see testHistory.js — capped at MAX_ATTEMPTS entries with oldest-first
// (FIFO) eviction, so this page never needs pagination or a backend.
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { History, Trash2 } from 'lucide-react';
import MarketingLayout from '../components/MarketingLayout';
import { useLanguage } from '../i18n/LanguageContext';
import { HISTORY_STRINGS } from '../i18n/strings';
import { getTestHistory, clearTestHistory, MAX_ATTEMPTS } from '../testHistory';

function fmtDate(ms) {
  try {
    return new Date(ms).toLocaleString(undefined, {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function fmtDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${String(rem).padStart(2, '0')}s`;
}

export default function PastAttemptsPage() {
  const { lang } = useLanguage();
  const t = HISTORY_STRINGS[lang];
  const [attempts, setAttempts] = useState(() => getTestHistory());

  const handleClear = () => {
    if (!window.confirm(t.clearConfirm)) return;
    clearTestHistory();
    setAttempts([]);
  };

  return (
    <MarketingLayout
      seo={{
        path: '/history',
        title: 'Past Attempts - Mocksy',
        description: 'Your locally-saved history of completed Mocksy mock tests — scores and timing for your last attempts on this device.',
      }}
    >
      <div className="mt-marketing-page mt-marketing-wide">
        <div className="mt-hero" style={{ padding: '2rem 0 1.5rem' }}>
          <span className="mt-hero-eyebrow"><History size={13} /> {t.eyebrow}</span>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)' }}>{t.title}</h1>
          <p>{t.intro}</p>
        </div>

        {attempts.length === 0 ? (
          <div className="mt-card mt-history-empty">
            <History size={28} style={{ color: 'var(--ink-faint)', marginBottom: '0.75rem' }} />
            <div className="mt-serif text-lg font-semibold" style={{ marginBottom: '0.35rem' }}>{t.emptyTitle}</div>
            <p style={{ marginBottom: '1.1rem' }}>{t.emptyDesc}</p>
            <Link to="/create" className="mt-btn mt-btn-brass" style={{ textDecoration: 'none', display: 'inline-flex' }}>{t.emptyCta}</Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 flex-wrap" style={{ marginBottom: '0.9rem' }}>
              <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>{t.countNote(attempts.length, MAX_ATTEMPTS)}</span>
              <button type="button" className="mt-btn mt-btn-danger" onClick={handleClear}>
                <Trash2 size={14} /> {t.clearBtn}
              </button>
            </div>

            <div className="mt-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="mt-history-table-wrap">
                <table className="mt-history-table">
                  <thead>
                    <tr>
                      <th>{t.colDate}</th>
                      <th>{t.colTest}</th>
                      <th>{t.colScore}</th>
                      <th>{t.colCorrect}</th>
                      <th>{t.colWrong}</th>
                      <th>{t.colUnanswered}</th>
                      <th>{t.colTime}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((a) => (
                      <tr key={a.id}>
                        <td style={{ color: 'var(--ink-soft)' }}>{fmtDate(a.savedAt)}</td>
                        <td className="mt-serif" style={{ maxWidth: '18rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title || t.notGraded}</td>
                        <td className="mt-mono">{a.maxObjective > 0 ? `${a.obtained}/${a.maxObjective}` : t.notGraded}</td>
                        <td className="mt-mono" style={{ color: 'var(--answered)' }}>{a.correctCount}</td>
                        <td className="mt-mono" style={{ color: 'var(--alert)' }}>{a.wrongCount}</td>
                        <td className="mt-mono" style={{ color: 'var(--ink-faint)' }}>{a.unansweredObjective}</td>
                        <td className="mt-mono">{fmtDuration(a.timeUsedSeconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </MarketingLayout>
  );
}