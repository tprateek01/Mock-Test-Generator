// PrivacyPolicy.jsx
// Describes what actually happens in the code: uploaded files go to
// Google's Gemini API (via our backend proxy) purely to extract questions;
// test progress and extraction results are cached client-side only
// (localStorage / IndexedDB); there is no account system, no analytics,
// and no cookies. Keep this in sync if that ever changes.
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import MarketingLayout from '../components/MarketingLayout';
import { useLanguage } from '../i18n/LanguageContext';
import { PRIVACY_STRINGS, interpolate } from '../i18n/strings';

export default function PrivacyPolicy() {
  const { lang } = useLanguage();
  const t = PRIVACY_STRINGS[lang];

  return (
    <MarketingLayout
      seo={{
        path: '/privacy',
        title: 'Privacy Policy - Mocksy',
        description:
          'Read how Mocksy handles uploaded question papers and test data — what is processed, what is stored locally, and what never leaves your device.',
      }}
    >
      <div className="mt-marketing-page">
        <div className="mt-hero" style={{ padding: '2rem 0 1.5rem' }}>
          <span className="mt-hero-eyebrow"><ShieldCheck size={13} /> {t.eyebrow}</span>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)' }}>{t.title}</h1>
        </div>
        <div className="mt-updated-badge">{t.lastUpdated}</div>

        <div className="mt-prose">
          <p>{t.intro}</p>

          <h2>{t.h1}</h2>
          <p>{t.p1}</p>

          <h2>{t.h2}</h2>
          <p>
            {interpolate(t.p2, {
              GEMINI: <strong>{t.geminiText}</strong>,
              TERMS: <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer">{t.termsText}</a>,
              GPRIVACY: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">{t.gprivacyText}</a>,
            })}
          </p>
          <p>{t.p3}</p>

          <h2>{t.h3}</h2>
          <p>{t.p4}</p>
          <ul>
            <li><strong>{t.li1Bold}</strong>{interpolate(t.li1Rest, { CODE: <code>localStorage</code> })}</li>
            <li><strong>{t.li2Bold}</strong>{t.li2Rest}</li>
            <li>{t.li3}</li>
          </ul>

          <h2>{t.h4}</h2>
          <p>{t.p5}</p>

          <h2>{t.h5}</h2>
          <p>{t.p6}</p>

          <h2>{t.h6}</h2>
          <p>{t.p7}</p>

          <h2>{t.h7}</h2>
          <p>{t.p8}</p>

          <h2>{t.h8}</h2>
          <p>{interpolate(t.p9, { CONTACT: <Link to="/contact">{t.contactText}</Link> })}</p>
        </div>
      </div>
    </MarketingLayout>
  );
}