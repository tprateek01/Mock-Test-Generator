// SeoHead.jsx
//
// Per-route <title>, meta description, and self-referencing canonical tag.
//
// React 19 renders <title>/<meta>/<link> anywhere in the tree and hoists
// them into <head> automatically (no react-helmet-async needed). When two
// components render a <title>, only the deepest one wins, so it's safe to
// mount this once per page without clashing with anything else.
//
// IMPORTANT: this only works if there is no *competing* static tag of the
// same kind sitting in public/index.html — a JS-rendered <link rel="canonical">
// next to a hard-coded one in index.html produces two canonical tags, which
// Google explicitly treats as unreliable. That's why the static canonical/
// title/description/OG/Twitter tags were removed from public/index.html;
// this component is now the single source of truth for all of them, on
// every route including "/".
const SITE_URL = 'https://mocksy-app.vercel.app';
const DEFAULT_IMAGE = `${SITE_URL}/logo512.png`;

export default function SeoHead({ title, description, path, image = DEFAULT_IMAGE }) {
  // path should be the route as declared in App.js, e.g. "/", "/contact"
  const url = path === '/' ? SITE_URL : `${SITE_URL}${path}`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
}
