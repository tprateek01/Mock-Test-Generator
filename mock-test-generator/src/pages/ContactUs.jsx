// ContactUs.jsx
// NOTE: there's no contact email anywhere in the existing repo (README,
// package.json, LICENSE), so CONTACT_EMAIL below is a placeholder — swap
// it for a real address before deploying. GitHub Issues is a real,
// already-existing channel, so that link works as-is.
import React from 'react';
import { Mail, Code2, MessageCircleQuestion } from 'lucide-react';
import MarketingLayout from '../components/MarketingLayout';

const CONTACT_EMAIL = 'hello@example.com'; // TODO: replace with your real contact email
const GITHUB_REPO = 'https://github.com/tprateek01/Mock-Test-Generator';

export default function ContactUs() {
  return (
    <MarketingLayout>
      <div className="mt-marketing-page">
        <div className="mt-hero" style={{ padding: '2rem 0 1.5rem' }}>
          <span className="mt-hero-eyebrow"><MessageCircleQuestion size={13} /> Contact</span>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)' }}>Contact us</h1>
          <p>
            Found a bug, have a feature request, or a question about how Mocksy handles your
            data? Here's how to reach us.
          </p>
        </div>

        <div className="mt-card mt-contact-card">
          <div className="mt-seal" style={{ flexShrink: 0 }}><Mail size={16} /></div>
          <div>
            <h3>Email</h3>
            <p>For general questions, privacy questions, or anything else.</p>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </div>
        </div>

        <div className="mt-card mt-contact-card">
          <div className="mt-seal" style={{ flexShrink: 0 }}><Code2 size={16} /></div>
          <div>
            <h3>GitHub Issues</h3>
            <p>The fastest way to report a bug or request a feature — the source is open.</p>
            <a href={`${GITHUB_REPO}/issues`} target="_blank" rel="noopener noreferrer">Open an issue on GitHub</a>
          </div>
        </div>

        <div className="mt-prose" style={{ marginTop: '1.5rem' }}>
          <p>
            Mocksy is a free, independently-run tool with no support team on standby, so
            responses may take a little while — but every message is read.
          </p>
        </div>
      </div>
    </MarketingLayout>
  );
}
