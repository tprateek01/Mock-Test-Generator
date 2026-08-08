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
import { useLanguage } from '../i18n/LanguageContext';
import { HOME_PAGE_STRINGS, interpolate } from '../i18n/strings';

export default function HomePage() {
  const resumable = hasResumableTest();
  const { lang } = useLanguage();
  const t = HOME_PAGE_STRINGS[lang];

  return (
    <MarketingLayout
      seo={{
        path: '/',
        title: 'Mocksy – Free Mock Test Generator | Turn Any Question Paper Into a Timed Test',
        description:
          'Mocksy is a free online mock test generator. Upload any question paper (PDF, Word, image, or pasted text) and instantly get a timed, proctored, auto-graded mock test — perfect for GATE, SSC, UPSC, banking, and other competitive exam prep.',
      }}
    >
      <div className="mt-marketing-page mt-marketing-wide">
        {resumable && (
          <div className="mt-resume-banner">
            <p>{t.resumeBannerText}</p>
            <Link to="/create" className="mt-btn mt-btn-brass">{t.resumeBtn} <ArrowRight size={15} /></Link>
          </div>
        )}

        <div className="mt-hero">
          <span className="mt-hero-eyebrow"><Sparkles size={13} /> {t.heroEyebrow}</span>
          <h1>{t.heroTitle}</h1>
          <p>{t.heroDesc}</p>
          <div className="mt-hero-actions">
            <Link to="/create" className="mt-btn mt-btn-brass"><Upload size={15} /> {t.heroUploadBtn}</Link>
            <Link to="/create" className="mt-btn mt-btn-ghost">{t.heroBlankBtn}</Link>
          </div>
        </div>

        <div className="mt-steps">
          <div className="mt-card mt-step">
            <h3>{t.stepUploadTitle}</h3>
            <p>{t.stepUploadDesc}</p>
          </div>
          <div className="mt-card mt-step">
            <h3>{t.stepReviewTitle}</h3>
            <p>{t.stepReviewDesc}</p>
          </div>
          <div className="mt-card mt-step">
            <h3>{t.stepConfigureTitle}</h3>
            <p>{t.stepConfigureDesc}</p>
          </div>
          <div className="mt-card mt-step">
            <h3>{t.stepTakeTitle}</h3>
            <p>{t.stepTakeDesc}</p>
          </div>
        </div>

        <div className="mt-feature-grid">
          <div className="mt-card mt-feature-card">
            <div className="mt-seal"><FileText size={16} /></div>
            <h3>{t.featFormatTitle}</h3>
            <p>{t.featFormatDesc}</p>
          </div>
          <div className="mt-card mt-feature-card">
            <div className="mt-seal"><ListChecks size={16} /></div>
            <h3>{t.featEditTitle}</h3>
            <p>{t.featEditDesc}</p>
          </div>
          <div className="mt-card mt-feature-card">
            <div className="mt-seal"><Timer size={16} /></div>
            <h3>{t.featTimingTitle}</h3>
            <p>{t.featTimingDesc}</p>
          </div>
          <div className="mt-card mt-feature-card">
            <div className="mt-seal"><BarChart3 size={16} /></div>
            <h3>{t.featNegTitle}</h3>
            <p>{t.featNegDesc}</p>
          </div>
          <div className="mt-card mt-feature-card">
            <div className="mt-seal"><Calculator size={16} /></div>
            <h3>{t.featCalcTitle}</h3>
            <p>{t.featCalcDesc}</p>
          </div>
          <div className="mt-card mt-feature-card">
            <div className="mt-seal"><Languages size={16} /></div>
            <h3>{t.featLangTitle}</h3>
            <p>{t.featLangDesc}</p>
          </div>
        </div>

        <div className="mt-card p-5 mb-4" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.9rem' }}>
          <div className="mt-seal" style={{ flexShrink: 0 }}><ShieldCheck size={16} /></div>
          <div>
            <div className="mt-label mb-1">{t.whoBuiltForLabel}</div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              {interpolate(t.whoBuiltForP, { LINK: <Link to="/privacy">{t.privacyLinkText}</Link> })}
            </p>
          </div>
        </div>

        <div className="mt-hero" style={{ paddingBottom: 0 }}>
          <div className="mt-hero-actions">
            <Link to="/create" className="mt-btn mt-btn-brass"><Play size={15} /> {t.getStartedBtn}</Link>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}