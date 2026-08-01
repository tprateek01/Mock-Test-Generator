// strings.js
// EN/HI copy for every "chrome" and marketing page on the site (header nav,
// footer, Home, Privacy Policy, Contact Us). The exam-tool screens
// (upload/review/configure/test/results) keep their own HOME_STRINGS
// dictionary in MockTestApp.jsx as before — this file covers everything
// around them so the toggle now translates every page, not just one.
import React from 'react';

// Splits a translated sentence on {{TOKEN}} markers and substitutes React
// nodes (typically <Link>/<a> elements) in their place, so a link can sit
// naturally inside a fully-translated sentence instead of being bolted on
// before/after it. Usage:
//   interpolate(t.sentence, { LINK: <Link to="/privacy">{t.linkText}</Link> })
export function interpolate(template, nodesByToken) {
  const parts = String(template).split(/(\{\{[A-Z0-9_]+\}\})/g);
  return parts.map((part, i) => {
    const match = part.match(/^\{\{([A-Z0-9_]+)\}\}$/);
    if (match && nodesByToken && nodesByToken[match[1]] != null) {
      return React.createElement(React.Fragment, { key: i }, nodesByToken[match[1]]);
    }
    return part;
  });
}

export const NAV_STRINGS = {
  en: { home: 'Home', createTest: 'Create a test', contact: 'Contact', privacy: 'Privacy' },
  hi: { home: 'होम', createTest: 'टेस्ट बनाएं', contact: 'संपर्क करें', privacy: 'गोपनीयता' },
};

export const FOOTER_STRINGS = {
  en: {
    copy: (year) => `© ${year} Mocksy — free, ad-free mock test generator.`,
    home: 'Home',
    createTest: 'Create a test',
    privacy: 'Privacy Policy',
    contact: 'Contact Us',
    github: 'GitHub',
  },
  hi: {
    copy: (year) => `© ${year} Mocksy — मुफ़्त, विज्ञापन-रहित मॉक टेस्ट जनरेटर।`,
    home: 'होम',
    createTest: 'टेस्ट बनाएं',
    privacy: 'गोपनीयता नीति',
    contact: 'हमसे संपर्क करें',
    github: 'GitHub',
  },
};

export const HOME_PAGE_STRINGS = {
  en: {
    resumeBannerText: 'You have a mock test in progress — pick it back up where you left off.',
    resumeBtn: 'Resume test',
    heroEyebrow: 'Free · No sign-up',
    heroTitle: 'Turn any question paper into a timed mock test',
    heroDesc: 'Upload a PDF, Word document, image, or pasted text, and Mocksy extracts the questions, lets you review and edit them, and turns them into a proctored, auto-graded mock test you take right in your browser.',
    heroUploadBtn: 'Upload a paper',
    heroBlankBtn: 'Start blank instead',
    stepUploadTitle: 'Upload',
    stepUploadDesc: 'Drop in a PDF, Word doc, image, or paste the raw text of a question paper.',
    stepReviewTitle: 'Review',
    stepReviewDesc: "Check the extracted questions and sections, and fix anything before you start.",
    stepConfigureTitle: 'Configure',
    stepConfigureDesc: 'Set total or per-question timing and negative marking to match the real exam.',
    stepTakeTitle: 'Take it & get scored',
    stepTakeDesc: 'Sit the test with a live question palette, then get an instant score breakdown.',
    featFormatTitle: 'Any source format',
    featFormatDesc: 'PDF, Word (.docx), an image of a printed paper, or text you paste directly.',
    featEditTitle: 'Editable extraction',
    featEditDesc: "Nothing starts a test until you've reviewed and corrected the questions.",
    featTimingTitle: 'Flexible timing',
    featTimingDesc: 'Total-test, per-section, or per-question timers — whatever the real exam uses.',
    featNegTitle: 'Negative marking',
    featNegDesc: 'Configure penalties per question type, including GATE-style fractional marking.',
    featCalcTitle: 'Optional calculator',
    featCalcDesc: 'An in-test scientific calculator you can turn on when the exam allows it.',
    featLangTitle: 'Hindi & English',
    featLangDesc: 'The whole site — including the upload screen and prompts — is available in both languages.',
    whoBuiltForLabel: "Who it's built for",
    whoBuiltForP: 'Mocksy is aimed at students prepping for competitive exams — GATE, SSC, UPSC, banking, and similar — who have a question paper (a past paper, a practice set, a scanned worksheet) and want to actually sit it under exam-like conditions instead of just reading through it. Read more about how your file is handled in our {{LINK}}.',
    privacyLinkText: 'Privacy Policy',
    getStartedBtn: 'Get started',
  },
  hi: {
    resumeBannerText: 'आपका एक मॉक टेस्ट अधूरा है — जहाँ छोड़ा था वहीं से जारी रखें।',
    resumeBtn: 'टेस्ट फिर से शुरू करें',
    heroEyebrow: 'मुफ़्त · साइन-अप ज़रूरी नहीं',
    heroTitle: 'किसी भी प्रश्न पत्र को टाइम्ड मॉक टेस्ट में बदलें',
    heroDesc: 'PDF, Word डॉक्यूमेंट, इमेज या पेस्ट किया गया टेक्स्ट अपलोड करें, और Mocksy प्रश्न निकालकर आपको उन्हें देखने और संपादित करने देता है, फिर उन्हें एक प्रॉक्टर्ड, ऑटो-ग्रेडेड मॉक टेस्ट में बदल देता है जिसे आप सीधे अपने ब्राउज़र में देते हैं।',
    heroUploadBtn: 'पेपर अपलोड करें',
    heroBlankBtn: 'इसके बजाय खाली शुरू करें',
    stepUploadTitle: 'अपलोड करें',
    stepUploadDesc: 'PDF, Word डॉक्यूमेंट, इमेज डालें, या प्रश्न पत्र का टेक्स्ट सीधे पेस्ट करें।',
    stepReviewTitle: 'समीक्षा करें',
    stepReviewDesc: 'निकाले गए प्रश्नों और सेक्शन को जाँचें, और शुरू करने से पहले जो भी ठीक करना हो कर लें।',
    stepConfigureTitle: 'कॉन्फ़िगर करें',
    stepConfigureDesc: 'असली परीक्षा जैसी टाइमिंग और नेगेटिव मार्किंग सेट करें — कुल या प्रति-प्रश्न।',
    stepTakeTitle: 'टेस्ट दें और स्कोर पाएं',
    stepTakeDesc: 'लाइव क्वेश्चन पैलेट के साथ टेस्ट दें, फिर तुरंत स्कोर का पूरा ब्रेकडाउन पाएं।',
    featFormatTitle: 'किसी भी फ़ॉर्मेट से',
    featFormatDesc: 'PDF, Word (.docx), प्रिंटेड पेपर की इमेज, या सीधे पेस्ट किया गया टेक्स्ट।',
    featEditTitle: 'संपादन योग्य एक्सट्रैक्शन',
    featEditDesc: 'जब तक आप प्रश्नों की समीक्षा और सुधार नहीं कर लेते, तब तक टेस्ट शुरू नहीं होता।',
    featTimingTitle: 'लचीली टाइमिंग',
    featTimingDesc: 'कुल-टेस्ट, प्रति-सेक्शन, या प्रति-प्रश्न टाइमर — जो भी असली परीक्षा में इस्तेमाल हो।',
    featNegTitle: 'नेगेटिव मार्किंग',
    featNegDesc: 'हर प्रश्न प्रकार के लिए पेनल्टी सेट करें, GATE जैसी फ्रैक्शनल मार्किंग सहित।',
    featCalcTitle: 'वैकल्पिक कैलकुलेटर',
    featCalcDesc: 'एक इन-टेस्ट साइंटिफिक कैलकुलेटर, जिसे परीक्षा अनुमति देने पर चालू कर सकते हैं।',
    featLangTitle: 'हिंदी और अंग्रेज़ी',
    featLangDesc: 'पूरी साइट — अपलोड स्क्रीन और प्रॉम्प्ट सहित — दोनों भाषाओं में उपलब्ध है।',
    whoBuiltForLabel: 'यह किसके लिए बनाया गया है',
    whoBuiltForP: 'Mocksy खासतौर पर उन छात्रों के लिए है जो GATE, SSC, UPSC, बैंकिंग और ऐसी ही प्रतियोगी परीक्षाओं की तैयारी कर रहे हैं — जिनके पास एक प्रश्न पत्र है (पुराना पेपर, प्रैक्टिस सेट, स्कैन की गई वर्कशीट) और जो उसे सिर्फ़ पढ़ने के बजाय असली परीक्षा जैसी स्थिति में देना चाहते हैं। आपकी फ़ाइल के साथ क्या होता है, यह जानने के लिए हमारी {{LINK}} पढ़ें।',
    privacyLinkText: 'गोपनीयता नीति',
    getStartedBtn: 'शुरू करें',
  },
};

export const PRIVACY_STRINGS = {
  en: {
    eyebrow: 'Privacy Policy',
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: August 2026',
    intro: "Mocksy is a free tool for turning a question paper into a mock test. This page explains what happens to your data when you use it. There's no account system — everything here is about what's processed in your browser session and what's sent to the third-party service that powers question extraction.",
    h1: 'What we collect',
    p1: "Mocksy itself does not collect or store your data on any server we operate. There's no sign-up, no user database, and no analytics or advertising trackers in the app — we don't know who you are or what you've uploaded.",
    h2: 'What happens to an uploaded paper',
    p2: "When you upload a PDF, Word document, image, or pasted text, it's sent — through our backend, which only forwards the request — to {{GEMINI}} so it can extract the questions and sections. That's the only third party involved. Files uploaded this way live on Google's infrastructure for roughly 48 hours before they automatically expire. Google's handling of that data is governed by their own policies — see the {{TERMS}} and {{GPRIVACY}}.",
    geminiText: "Google's Gemini API",
    termsText: 'Gemini API Additional Terms of Service',
    gprivacyText: 'Google Privacy Policy',
    p3: 'If you paste text instead of uploading a file, the same applies: the pasted text is sent to Gemini to extract questions from it.',
    h3: 'What stays on your device',
    p4: "Everything else lives only in your browser, using standard web storage — never sent to us:",
    li1Bold: 'Your in-progress test',
    li1Rest: " (answers, flags, timers) is autosaved to your browser's {{CODE}} so you can resume if you close the tab or reload the page.",
    li2Bold: 'Extracted questions',
    li2Rest: " from a recent upload may be cached in your browser's IndexedDB, so re-processing isn't needed if you revisit the review screen.",
    li3: "None of this data is transmitted anywhere else. Clearing your browser's site data removes it completely.",
    h4: 'Cookies and tracking',
    p5: 'Mocksy does not use cookies, analytics, or advertising trackers of any kind. We have no way to identify individual visitors or follow you across sites.',
    h5: 'Installing Mocksy as an app',
    p6: 'Mocksy can be installed as a Progressive Web App (an icon on your home screen), or downloaded directly as an Android app. Either way, this only changes how you open Mocksy — it does not change anything about how your files or answers are handled.',
    h6: "Children's privacy",
    p7: "Mocksy is a study tool that may be used by students of any age preparing for exams. We don't knowingly collect personal information from anyone, regardless of age, since there's no account system or data collection in the first place.",
    h7: 'Changes to this policy',
    p8: 'If how Mocksy handles data changes — for example, if we introduce accounts or analytics in the future — we\'ll update this page and the "last updated" date above.',
    h8: 'Questions',
    p9: 'If you have questions about any of this, reach out via the {{CONTACT}} page.',
    contactText: 'Contact Us',
  },
  hi: {
    eyebrow: 'गोपनीयता नीति',
    title: 'गोपनीयता नीति',
    lastUpdated: 'आख़िरी बार अपडेट: अगस्त 2026',
    intro: 'Mocksy एक मुफ़्त टूल है जो प्रश्न पत्र को मॉक टेस्ट में बदलता है। यह पेज बताता है कि आप इसका इस्तेमाल करते समय आपके डेटा के साथ क्या होता है। यहाँ कोई अकाउंट सिस्टम नहीं है — यह सब आपके ब्राउज़र सेशन में क्या प्रोसेस होता है और प्रश्न निकालने वाली थर्ड-पार्टी सर्विस को क्या भेजा जाता है, इसके बारे में है।',
    h1: 'हम क्या इकट्ठा करते हैं',
    p1: 'Mocksy खुद हमारे किसी भी सर्वर पर आपका डेटा इकट्ठा या स्टोर नहीं करता। यहाँ न कोई साइन-अप है, न कोई यूज़र डेटाबेस, और ऐप में न कोई एनालिटिक्स न कोई विज्ञापन ट्रैकर — हमें पता ही नहीं होता कि आप कौन हैं या आपने क्या अपलोड किया।',
    h2: 'अपलोड किए गए पेपर के साथ क्या होता है',
    p2: 'जब आप PDF, Word डॉक्यूमेंट, इमेज या पेस्ट किया गया टेक्स्ट अपलोड करते हैं, तो यह — हमारे बैकएंड के ज़रिए, जो सिर्फ़ रिक्वेस्ट आगे भेजता है — {{GEMINI}} को भेजा जाता है ताकि वह प्रश्न और सेक्शन निकाल सके। यही एकमात्र थर्ड पार्टी शामिल है। इस तरह अपलोड की गई फ़ाइलें Google के इन्फ्रास्ट्रक्चर पर लगभग 48 घंटे रहती हैं, फिर अपने-आप हट जाती हैं। उस डेटा के साथ Google क्या करता है, यह उन्हीं की नीतियों से तय होता है — देखें {{TERMS}} और {{GPRIVACY}}।',
    geminiText: 'Google का Gemini API',
    termsText: 'Gemini API अतिरिक्त सेवा शर्तें',
    gprivacyText: 'Google गोपनीयता नीति',
    p3: 'अगर आप फ़ाइल अपलोड करने के बजाय टेक्स्ट पेस्ट करते हैं, तो भी यही लागू होता है: पेस्ट किया गया टेक्स्ट भी प्रश्न निकालने के लिए Gemini को भेजा जाता है।',
    h3: 'आपकी डिवाइस पर क्या रहता है',
    p4: 'बाकी सब कुछ सिर्फ़ आपके ब्राउज़र में, स्टैंडर्ड वेब स्टोरेज का इस्तेमाल करके रहता है — हमें कभी नहीं भेजा जाता:',
    li1Bold: 'आपका चालू टेस्ट',
    li1Rest: ' (उत्तर, फ़्लैग, टाइमर) आपके ब्राउज़र के {{CODE}} में ऑटोसेव होता है, ताकि टैब बंद करने या पेज रीलोड करने पर भी आप वहीं से जारी रख सकें।',
    li2Bold: 'हाल के अपलोड से निकाले गए प्रश्न',
    li2Rest: ' आपके ब्राउज़र के IndexedDB में कैश हो सकते हैं, ताकि समीक्षा स्क्रीन पर दोबारा जाने पर दोबारा प्रोसेस न करना पड़े।',
    li3: 'इसमें से कोई भी डेटा और कहीं नहीं भेजा जाता। अपने ब्राउज़र का साइट डेटा साफ़ करने पर यह पूरी तरह हट जाता है।',
    h4: 'कुकीज़ और ट्रैकिंग',
    p5: 'Mocksy किसी भी तरह की कुकीज़, एनालिटिक्स या विज्ञापन ट्रैकर का इस्तेमाल नहीं करता। हमारे पास अलग-अलग विज़िटर को पहचानने या साइटों पर आपका पीछा करने का कोई तरीका नहीं है।',
    h5: 'Mocksy को ऐप के रूप में इंस्टॉल करना',
    p6: 'Mocksy को Progressive Web App (होम स्क्रीन पर एक आइकन) के रूप में इंस्टॉल किया जा सकता है, या Android ऐप के रूप में सीधे डाउनलोड भी किया जा सकता है। दोनों ही तरीकों से सिर्फ़ Mocksy खोलने का तरीका बदलता है — इससे आपकी फ़ाइलों या उत्तरों के साथ क्या होता है, उसमें कोई बदलाव नहीं आता।',
    h6: 'बच्चों की गोपनीयता',
    p7: 'Mocksy एक स्टडी टूल है जिसे परीक्षा की तैयारी करने वाला किसी भी उम्र का छात्र इस्तेमाल कर सकता है। हम जान-बूझकर किसी से भी, उम्र चाहे जो हो, व्यक्तिगत जानकारी इकट्ठा नहीं करते, क्योंकि शुरुआत में ही कोई अकाउंट सिस्टम या डेटा कलेक्शन है ही नहीं।',
    h7: 'इस नीति में बदलाव',
    p8: 'अगर Mocksy डेटा को संभालने का तरीका बदलता है — जैसे कि भविष्य में हम अकाउंट या एनालिटिक्स जोड़ें — तो हम इस पेज और ऊपर दी गई "आख़िरी बार अपडेट" तारीख़ को अपडेट कर देंगे।',
    h8: 'सवाल',
    p9: 'अगर आपके कोई सवाल हैं, तो {{CONTACT}} पेज के ज़रिए हमसे संपर्क करें।',
    contactText: 'हमसे संपर्क करें',
  },
};

export const CONTACT_STRINGS = {
  en: {
    eyebrow: 'Contact',
    title: 'Contact us',
    intro: "Found a bug, have a feature request, or a question about how Mocksy handles your data? Here's how to reach us.",
    emailTitle: 'Email',
    emailDesc: 'For general questions, privacy questions, or anything else.',
    githubTitle: 'GitHub Issues',
    githubDesc: 'The fastest way to report a bug or request a feature — the source is open.',
    githubLinkText: 'Open an issue on GitHub',
    footerNote: 'Mocksy is a free, independently-run tool with no support team on standby, so responses may take a little while — but every message is read.',
  },
  hi: {
    eyebrow: 'संपर्क',
    title: 'हमसे संपर्क करें',
    intro: 'कोई बग मिला, कोई फ़ीचर चाहिए, या Mocksy आपके डेटा के साथ क्या करता है इस बारे में सवाल है? यहाँ बताया गया है कि हम तक कैसे पहुँचें।',
    emailTitle: 'ईमेल',
    emailDesc: 'सामान्य सवालों, गोपनीयता से जुड़े सवालों, या किसी और चीज़ के लिए।',
    githubTitle: 'GitHub Issues',
    githubDesc: 'बग रिपोर्ट करने या फ़ीचर मांगने का सबसे तेज़ तरीका — सोर्स कोड ओपन है।',
    githubLinkText: 'GitHub पर इशू खोलें',
    footerNote: 'Mocksy एक मुफ़्त, स्वतंत्र रूप से चलाया जाने वाला टूल है जिसमें कोई सपोर्ट टीम हाज़िर नहीं बैठी है, इसलिए जवाब आने में थोड़ा समय लग सकता है — लेकिन हर मैसेज पढ़ा जाता है।',
  },
};