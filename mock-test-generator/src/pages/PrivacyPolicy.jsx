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

export default function PrivacyPolicy() {
  return (
    <MarketingLayout>
      <div className="mt-marketing-page">
        <div className="mt-hero" style={{ padding: '2rem 0 1.5rem' }}>
          <span className="mt-hero-eyebrow"><ShieldCheck size={13} /> Privacy Policy</span>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)' }}>Privacy Policy</h1>
        </div>
        <div className="mt-updated-badge">Last updated: August 2026</div>

        <div className="mt-prose">
          <p>
            Mocksy is a free tool for turning a question paper into a mock test. This page
            explains what happens to your data when you use it. There's no account system —
            everything here is about what's processed in your browser session and what's sent
            to the third-party service that powers question extraction.
          </p>

          <h2>What we collect</h2>
          <p>
            Mocksy itself does not collect or store your data on any server we operate. There's
            no sign-up, no user database, and no analytics or advertising trackers in the app —
            we don't know who you are or what you've uploaded.
          </p>

          <h2>What happens to an uploaded paper</h2>
          <p>
            When you upload a PDF, Word document, image, or pasted text, it's sent — through our
            backend, which only forwards the request — to <strong>Google's Gemini API</strong> so
            it can extract the questions and sections. That's the only third party involved.
            Files uploaded this way live on Google's infrastructure for roughly 48 hours before
            they automatically expire. Google's handling of that data is governed by their own
            policies — see the <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer">Gemini API Additional Terms of Service</a> and{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>.
          </p>
          <p>
            If you paste text instead of uploading a file, the same applies: the pasted text is
            sent to Gemini to extract questions from it.
          </p>

          <h2>What stays on your device</h2>
          <p>
            Everything else lives only in your browser, using standard web storage — never sent
            to us:
          </p>
          <ul>
            <li><strong>Your in-progress test</strong> (answers, flags, timers) is autosaved to your browser's <code>localStorage</code> so you can resume if you close the tab or reload the page.</li>
            <li><strong>Extracted questions</strong> from a recent upload may be cached in your browser's IndexedDB, so re-processing isn't needed if you revisit the review screen.</li>
            <li>None of this data is transmitted anywhere else. Clearing your browser's site data removes it completely.</li>
          </ul>

          <h2>Cookies and tracking</h2>
          <p>
            Mocksy does not use cookies, analytics, or advertising trackers of any kind. We have
            no way to identify individual visitors or follow you across sites.
          </p>

          <h2>Installing Mocksy as an app</h2>
          <p>
            Mocksy can be installed as a Progressive Web App (an icon on your home screen). This
            uses a service worker to cache the app's own code for offline use — it does not
            change anything about how your files or answers are handled.
          </p>

          <h2>Children's privacy</h2>
          <p>
            Mocksy is a study tool that may be used by students of any age preparing for exams.
            We don't knowingly collect personal information from anyone, regardless of age,
            since there's no account system or data collection in the first place.
          </p>

          <h2>Changes to this policy</h2>
          <p>
            If how Mocksy handles data changes — for example, if we introduce accounts or
            analytics in the future — we'll update this page and the "last updated" date above.
          </p>

          <h2>Questions</h2>
          <p>
            If you have questions about any of this, reach out via the <Link to="/contact">Contact Us</Link> page.
          </p>
        </div>
      </div>
    </MarketingLayout>
  );
}
