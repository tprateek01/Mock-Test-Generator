// HomePage.jsx
// The site's actual "home page" — an information/marketing page explaining
// what Mocksy is and how it works, with a CTA into the tool itself (which
// now lives at /create). Previously the Upload screen doubled as the home
// page with no explanation of the product; this gives first-time visitors
// (and search engines) something to land on before diving into the tool.
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Upload, ListChecks, Timer, Play, BarChart3, FileText,
  Languages, Calculator, ShieldCheck, Sparkles, ArrowRight
} from 'lucide-react';
import MarketingLayout from '../components/MarketingLayout';
import { hasResumableTest } from '../testProgress';

export default function HomePage() {
  const resumable = hasResumableTest();

  return (
    <MarketingLayout>
      <div className="mt-marketing-page mt-marketing-wide">
        {resumable && (
          <div className="mt-resume-banner">
            <p>You have a mock test in progress — pick it back up where you left off.</p>
            <Link to="/create" className="mt-btn mt-btn-brass">Resume test <ArrowRight size={15} /></Link>
          </div>
        )}

        <div className="mt-hero">
          <span className="mt-hero-eyebrow"><Sparkles size={13} /> Free · No sign-up</span>
          <h1>Turn any question paper into a timed mock test</h1>
          <p>
            Upload a PDF, Word document, image, or pasted text, and Mocksy extracts the
            questions, lets you review and edit them, and turns them into a proctored,
            auto-graded mock test you take right in your browser.
          </p>
          <div className="mt-hero-actions">
            <Link to="/create" className="mt-btn mt-btn-brass"><Upload size={15} /> Upload a paper</Link>
            <Link to="/create" className="mt-btn mt-btn-ghost">Start blank instead</Link>
          </div>
        </div>

        <div className="mt-steps">
          <div className="mt-card mt-step">
            <h3>Upload</h3>
            <p>Drop in a PDF, Word doc, image, or paste the raw text of a question paper.</p>
          </div>
          <div className="mt-card mt-step">
            <h3>Review</h3>
            <p>Check the extracted questions and sections, and fix anything before you start.</p>
          </div>
          <div className="mt-card mt-step">
            <h3>Configure</h3>
            <p>Set total or per-question timing and negative marking to match the real exam.</p>
          </div>
          <div className="mt-card mt-step">
            <h3>Take it &amp; get scored</h3>
            <p>Sit the test with a live question palette, then get an instant score breakdown.</p>
          </div>
        </div>

        <div className="mt-feature-grid">
          <div className="mt-card mt-feature-card">
            <div className="mt-seal"><FileText size={16} /></div>
            <h3>Any source format</h3>
            <p>PDF, Word (.docx), an image of a printed paper, or text you paste directly.</p>
          </div>
          <div className="mt-card mt-feature-card">
            <div className="mt-seal"><ListChecks size={16} /></div>
            <h3>Editable extraction</h3>
            <p>Nothing starts a test until you've reviewed and corrected the questions.</p>
          </div>
          <div className="mt-card mt-feature-card">
            <div className="mt-seal"><Timer size={16} /></div>
            <h3>Flexible timing</h3>
            <p>Total-test, per-section, or per-question timers — whatever the real exam uses.</p>
          </div>
          <div className="mt-card mt-feature-card">
            <div className="mt-seal"><BarChart3 size={16} /></div>
            <h3>Negative marking</h3>
            <p>Configure penalties per question type, including GATE-style fractional marking.</p>
          </div>
          <div className="mt-card mt-feature-card">
            <div className="mt-seal"><Calculator size={16} /></div>
            <h3>Optional calculator</h3>
            <p>An in-test scientific calculator you can turn on when the exam allows it.</p>
          </div>
          <div className="mt-card mt-feature-card">
            <div className="mt-seal"><Languages size={16} /></div>
            <h3>Hindi &amp; English</h3>
            <p>The upload screen and prompts are available in both languages.</p>
          </div>
        </div>

        <div className="mt-card p-5 mb-4" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.9rem' }}>
          <div className="mt-seal" style={{ flexShrink: 0 }}><ShieldCheck size={16} /></div>
          <div>
            <div className="mt-label mb-1">Who it's built for</div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              Mocksy is aimed at students prepping for competitive exams — GATE, SSC, UPSC,
              banking, and similar — who have a question paper (a past paper, a practice set,
              a scanned worksheet) and want to actually sit it under exam-like conditions
              instead of just reading through it. Read more about how your file is handled in
              our <Link to="/privacy">Privacy Policy</Link>.
            </p>
          </div>
        </div>

        <div className="mt-hero" style={{ paddingBottom: 0 }}>
          <div className="mt-hero-actions">
            <Link to="/create" className="mt-btn mt-btn-brass"><Play size={15} /> Get started</Link>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
