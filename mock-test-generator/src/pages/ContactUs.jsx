// ContactUs.jsx
// NOTE: there's no contact email anywhere in the existing repo (README,
// package.json, LICENSE), so CONTACT_EMAIL below is a placeholder — swap
// it for a real address before deploying. GitHub Issues is a real,
// already-existing channel, so that link works as-is.
import React from 'react';
import { Mail, Code2, MessageCircleQuestion } from 'lucide-react';
import MarketingLayout from '../components/MarketingLayout';
import { useLanguage } from '../i18n/LanguageContext';
import { CONTACT_STRINGS } from '../i18n/strings';

const CONTACT_EMAIL = 'admin.mocksy@gmail.com'; // TODO: replace with your real contact email
const GITHUB_REPO = 'https://github.com/tprateek01/Mock-Test-Generator';

export default function ContactUs() {
  const { lang } = useLanguage();
  const t = CONTACT_STRINGS[lang];

  return (
    <MarketingLayout
      seo={{
        path: '/contact',
        title: 'Contact Us - Mocksy',
        description:
          'Get in touch with the Mocksy team — questions, feedback, or bug reports about the free mock test generator.',
      }}
    >
      <div className="mt-marketing-page">
        <div className="mt-hero" style={{ padding: '2rem 0 1.5rem' }}>
          <span className="mt-hero-eyebrow"><MessageCircleQuestion size={13} /> {t.eyebrow}</span>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)' }}>{t.title}</h1>
          <p>{t.intro}</p>
        </div>

        <div className="mt-card mt-contact-card">
          <div className="mt-seal" style={{ flexShrink: 0 }}><Mail size={16} /></div>
          <div>
            <h3>{t.emailTitle}</h3>
            <p>{t.emailDesc}</p>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </div>
        </div>

        <div className="mt-card mt-contact-card">
          <div className="mt-seal" style={{ flexShrink: 0 }}><Code2 size={16} /></div>
          <div>
            <h3>{t.githubTitle}</h3>
            <p>{t.githubDesc}</p>
            <a href={`${GITHUB_REPO}/issues`} target="_blank" rel="noopener noreferrer">{t.githubLinkText}</a>
          </div>
        </div>

        <div className="mt-prose" style={{ marginTop: '1.5rem' }}>
          <p>{t.footerNote}</p>
        </div>
      </div>
    </MarketingLayout>
  );
}