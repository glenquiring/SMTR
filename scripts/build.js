#!/usr/bin/env node
/*
 * Show Me the Receipts: site build
 *
 * Reads notes.json and:
 *   1. Writes the note lists into every page that has a notes block
 *      (between <!-- notes:begin {...} --> and <!-- notes:end -->).
 *   2. Writes the RSS feeds MailerLite reads:
 *        feed.xml                    all notes
 *        feed-field-notes.xml        Field Notes only
 *        feed-leadership-notes.xml   Leadership Notes only
 *
 * Vercel runs this on every push (see vercel.json). You can also run it
 * yourself with:  node scripts/build.js
 *
 * No packages to install. Plain Node.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE_URL = 'https://www.showmereceipts.org';
const PAGES = ['index.html', 'field-notes.html', 'leadership-notes.html'];

const STREAMS = {
  field: { folder: 'field-notes', label: 'Field Note', plural: 'Field Notes', listPage: 'field-notes.html' },
  leadership: { folder: 'leadership-notes', label: 'Leadership Note', plural: 'Leadership Notes', listPage: 'leadership-notes.html' }
};

/* ---------- load and check notes.json ---------- */

function fail(msg) {
  console.error('\nBUILD STOPPED: ' + msg + '\n');
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(path.join(ROOT, 'notes.json'), 'utf8'));
} catch (e) {
  fail('notes.json could not be read. Check for a missing comma or quote near: ' + e.message);
}

const settings = data.settings || {};
const notes = (data.notes || []).map((n, i) => {
  const where = 'note #' + (i + 1) + (n.title ? ' ("' + n.title + '")' : '');
  for (const key of ['stream', 'slug', 'date', 'type', 'title', 'summary']) {
    if (!n[key] || typeof n[key] !== 'string') fail(where + ' is missing "' + key + '".');
  }
  if (!STREAMS[n.stream]) fail(where + ' has stream "' + n.stream + '". Use "field" or "leadership".');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(n.date)) fail(where + ' has date "' + n.date + '". Use YYYY-MM-DD, for example 2026-10-16.');
  if (!/^[a-z0-9-]+$/.test(n.slug)) fail(where + ' has slug "' + n.slug + '". Use lowercase letters, numbers and dashes only.');
  const file = path.join(ROOT, STREAMS[n.stream].folder, n.slug + '.html');
  if (!fs.existsSync(file)) fail(where + ' points to ' + STREAMS[n.stream].folder + '/' + n.slug + '.html, which does not exist.');
  if (n.image && !fs.existsSync(path.join(ROOT, n.image))) fail(where + ' uses image "' + n.image + '", which does not exist.');
  return { ...n, _order: i };
});

// Newest first; notes on the same date keep their order in notes.json.
notes.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a._order - b._order));

/* ---------- helpers ---------- */

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const code = (date) => date.slice(5, 7) + date.slice(8, 10) + date.slice(2, 4); // 2026-10-16 -> 101626

const url = (n) => STREAMS[n.stream].folder + '/' + n.slug + '.html';

// The stream's journal mark (images/notes/field-note.svg, leadership-note.svg).
const mark = (n) => '<img class="list-mark" src="/images/notes/' + n.stream + '-note.svg" alt="" width="18" height="18">';

const meta = (n) => STREAMS[n.stream].label + ' ' + code(n.date) + ' &middot; ' + esc(n.type);

/* ---------- list renderers ---------- */

function renderHome(list, stream) {
  if (!list.length) return emptyState(stream, 'home');
  return list.map((n) => [
    '<a href="' + url(n) + '" class="note-row">',
    '  <span class="note-row-meta">' + mark(n) + meta(n) + '</span>',
    '  <span class="note-row-title">' + esc(n.title) + '</span>',
    '  <span class="note-row-summary">' + esc(n.summary) + '</span>',
    '</a>'
  ].join('\n')).join('\n');
}

function renderIndex(list, stream) {
  if (!list.length) return emptyState(stream, 'index');
  const read = 'Read the ' + STREAMS[stream].label.toLowerCase() + ' &rarr;';
  return list.map((n) => [
    '<a href="' + url(n) + '" class="fn-entry">',
    '  <div class="fn-entry-meta">' + mark(n) + meta(n) + '</div>',
    '  <div class="fn-entry-title">' + esc(n.title) + '</div>',
    n.descriptor ? '  <div class="fn-entry-desc">' + esc(n.descriptor) + '</div>' : '',
    '  <p class="fn-entry-summary">' + esc(n.summary) + '</p>',
    '  <span class="fn-read">' + read + '</span>',
    '</a>'
  ].filter(Boolean).join('\n')).join('\n');
}

function emptyState(stream, style) {
  const plural = STREAMS[stream].plural;
  const month = (settings.leadershipNotesFirstMonth || '').trim();
  const line = month
    ? 'The first ' + plural + ' publish in ' + esc(month) + '. Subscribe to get them when they do.'
    : 'The first ' + plural + ' are on the way. Subscribe to get them when they publish.';
  return [
    '<div class="notes-empty notes-empty-' + style + '">',
    '  <span class="notes-empty-label">First notes coming</span>',
    '  <p class="notes-empty-line">' + line + '</p>',
    '</div>'
  ].join('\n');
}

/* ---------- write lists into pages ---------- */

const BLOCK = /(<!-- notes:begin (\{.*?\}) -->)([\s\S]*?)(\s*<!-- notes:end -->)/g;

for (const page of PAGES) {
  const file = path.join(ROOT, page);
  if (!fs.existsSync(file)) continue;
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(BLOCK, (all, open, json, _old, close) => {
    let opts;
    try { opts = JSON.parse(json); } catch (e) { fail(page + ' has a notes block with bad settings: ' + json); }
    if (!STREAMS[opts.stream]) fail(page + ' has a notes block for unknown stream "' + opts.stream + '".');
    let list = notes.filter((n) => n.stream === opts.stream);
    if (opts.limit) list = list.slice(0, opts.limit);
    const html = opts.style === 'index' ? renderIndex(list, opts.stream) : renderHome(list, opts.stream);
    return open + '\n' + html + close;
  });
  if (after !== before) fs.writeFileSync(file, after);
  console.log('lists   ' + page);
}

/* ---------- note pages: email sign-up and link previews ---------- */

// The MailerLite form that adds readers to the notes list.
const SIGNUP_ACTION = 'https://assets.mailerlite.com/jsonp/2364457/forms/201691017100920369/subscribe';
// Image LinkedIn shows with a shared link. A note can use its own by adding
// "image": "images/your-file.png" to its entry in notes.json (1200 x 627).
const DEFAULT_IMAGE = 'images/share-default.png';

// Replace whatever sits between <!-- name:begin --> and <!-- name:end -->.
function fillBlock(html, name, content) {
  const re = new RegExp('(<!-- ' + name + ':begin -->)[\\s\\S]*?(<!-- ' + name + ':end -->)');
  return re.test(html) ? html.replace(re, (all, open, close) => open + '\n' + content + '\n' + close) : html;
}

function signupTop() {
  return '<p class="signup-top"><a href="#subscribe">Get new notes by email &darr;</a></p>';
}

function signupCard() {
  return [
    '<section class="signup-card" id="subscribe" aria-label="Get new notes by email">',
    '  <div class="signup-card-inner">',
    '    <p class="signup-eyebrow">Field Notes and Leadership Notes</p>',
    '    <p class="signup-head">Get the next note by email.</p>',
    '    <iframe name="ml_signup_target" style="display:none;width:0;height:0;border:0;" title="MailerLite submission target"></iframe>',
    '    <form class="signup-form" id="signup-form" action="' + SIGNUP_ACTION + '" method="post" target="ml_signup_target">',
    '      <label class="signup-label" for="signup-email">Your email</label>',
    '      <input type="email" id="signup-email" name="fields[email]" placeholder="you@organization.org" autocomplete="email" required>',
    '      <input type="hidden" name="ml-submit" value="1">',
    '      <input type="hidden" name="anticsrf" value="true">',
    '      <button type="submit">Subscribe</button>',
    '      <p class="signup-note">Only when something new publishes. Unsubscribe anytime.</p>',
    '      <p class="signup-msg" id="signup-msg" role="status"></p>',
    '    </form>',
    '  </div>',
    '</section>'
  ].join('\n');
}

function shareTags({ title, description, path, image, alt, type, date }) {
  const pageUrl = SITE_URL + '/' + path;
  const img = SITE_URL + '/' + (image || DEFAULT_IMAGE);
  return [
    '<link rel="canonical" href="' + pageUrl + '">',
    '<meta property="og:site_name" content="Show Me the Receipts">',
    '<meta property="og:type" content="' + (type || 'website') + '">',
    '<meta property="og:title" content="' + esc(title) + '">',
    '<meta property="og:description" content="' + esc(description) + '">',
    '<meta property="og:url" content="' + pageUrl + '">',
    '<meta property="og:image" content="' + img + '">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="627">',
    '<meta property="og:image:alt" content="' + esc(alt || 'Show Me the Receipts: a receipt of promises kept, with the balance reading Trust') + '">',
    date ? '<meta property="article:published_time" content="' + date + '">' : '',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + esc(title) + '">',
    '<meta name="twitter:description" content="' + esc(description) + '">',
    '<meta name="twitter:image" content="' + img + '">'
  ].filter(Boolean).join('\n');
}

// Every note listed in notes.json.
for (const n of notes) {
  const rel = url(n);
  const file = path.join(ROOT, rel);
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  html = fillBlock(html, 'share', shareTags({
    title: n.title, description: n.summary, path: rel, image: n.image, alt: n.imageAlt, type: 'article', date: n.date
  }));
  html = fillBlock(html, 'signup-top', signupTop());
  html = fillBlock(html, 'signup', signupCard());
  if (html !== before) fs.writeFileSync(file, html);
}
console.log('notes   ' + notes.length + ' note pages (sign-up and link previews)');

// The note templates, so a copied template already has the sign-up.
for (const stream of Object.values(STREAMS)) {
  const file = path.join(ROOT, stream.folder, '_TEMPLATE.html');
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  html = fillBlock(html, 'signup-top', signupTop());
  html = fillBlock(html, 'signup', signupCard());
  if (html !== before) fs.writeFileSync(file, html);
}

// The two listing pages: sign-up box at the top of the list.
for (const page of ['field-notes.html', 'leadership-notes.html']) {
  const file = path.join(ROOT, page);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const out = fillBlock(html, 'signup', signupCard());
  if (out !== html) fs.writeFileSync(file, out);
}

// Link previews for the main pages.
const MAIN_PAGES = [
  { path: 'index.html', share: '', title: 'Show Me the Receipts: Trust is what the receipts add up to.',
    description: 'Durable donor trust is a record of promises made and kept. Field Notes, Leadership Notes and working tools for Executive Directors and Directors of Development.' },
  { path: 'field-notes.html', title: 'Field Notes | Show Me the Receipts',
    description: 'What the field repeats, and what the receipts show. Field Notes by Glen E. Quiring, CFRE.' },
  { path: 'leadership-notes.html', title: 'Leadership Notes | Show Me the Receipts',
    description: 'On building an organization where promises to donors get kept. Leadership Notes by Glen E. Quiring, CFRE.' },
  { path: 'promise.html', title: 'Make Your Promise | Show Me the Receipts',
    description: 'Make one promise you will keep in the next thirty days. You will hear from us twice along the way, and once on day thirty: the receipt.' },
  { path: 'coaching.html', share: 'coaching', image: 'images/share-coaching.png',
    alt: 'The Four Receipts coaching: You keep a ledger, not just a coach. A ledger card reading Made, Owned, Kept, Proved, with the balance reading Confidence',
    title: 'The Four Receipts Coaching | Show Me the Receipts',
    description: 'Coaching for executive directors and directors of development: skills you can show, persistent challenges resolved, a private ledger of kept promises. Three months from $1,500.' },
  { path: 'speaking.html', share: 'speaking', image: 'images/share-speaking.png',
    alt: 'Show Me the Receipts keynote: Name it. Trace it. Repair it. Three acts for AFP chapters and conferences',
    title: 'Speaking: the Show Me the Receipts keynote',
    description: 'A keynote for AFP chapters, conferences and development teams: name the promise donors lost, trace it to the handoff, and repair it in thirty days. Designed for CFRE credit.' },
  { path: 'ledger.html', title: 'Four Receipts Ledger | Show Me the Receipts',
    description: 'A private, two-week receipts review for leaders and their coaches. Made, Owned, Kept, Proved.' },
  { path: 'about.html', title: 'About | Show Me the Receipts',
    description: 'The argument behind Show Me the Receipts, and the person accountable for it: Glen E. Quiring, CFRE.' }
];
for (const p of MAIN_PAGES) {
  const file = path.join(ROOT, p.path);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const out = fillBlock(html, 'share', shareTags({
    title: p.title, description: p.description, image: p.image, alt: p.alt, path: p.share !== undefined ? p.share : p.path
  }));
  if (out !== html) fs.writeFileSync(file, out);
}
console.log('share   main pages');

/* ---------- RSS feeds ---------- */

function rss(file, title, description, list, linkPage, image) {
  const self = SITE_URL + '/' + file;
  const items = list.map((n) => {
    const link = SITE_URL + '/' + url(n);
    // pubDate at 8:00 a.m. Pacific (15:00 UTC) on the note's date.
    const pub = new Date(n.date + 'T15:00:00Z').toUTCString();
    return [
      '    <item>',
      '      <title>' + esc(n.title) + '</title>',
      '      <link>' + link + '</link>',
      '      <guid isPermaLink="true">' + link + '</guid>',
      '      <pubDate>' + pub + '</pubDate>',
      '      <category>' + STREAMS[n.stream].label + '</category>',
      '      <description>' + esc('<img src="' + SITE_URL + '/images/notes/' + n.stream + '-note.png" width="32" height="32" alt="' + STREAMS[n.stream].label + '"> ') + esc(n.summary) + '</description>',
      '    </item>'
    ].join('\n');
  }).join('\n');
  // Date of the newest note; an empty feed gets none, so rebuilding never changes it.
  const last = list.length ? new Date(list[0].date + 'T15:00:00Z').toUTCString() : '';
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>' + esc(title) + '</title>',
    '    <link>' + SITE_URL + '/' + linkPage + '</link>',
    '    <atom:link href="' + self + '" rel="self" type="application/rss+xml" />',
    '    <description>' + esc(description) + '</description>',
    '    <language>en-us</language>',
    '    <image><url>' + SITE_URL + '/images/notes/' + image + '</url><title>' + esc(title) + '</title><link>' + SITE_URL + '/' + linkPage + '</link><width>96</width><height>96</height></image>',
    last ? '    <lastBuildDate>' + last + '</lastBuildDate>' : '',
    items,
    '  </channel>',
    '</rss>',
    ''
  ].filter((l) => l !== '').join('\n') + '\n';
  fs.writeFileSync(path.join(ROOT, file), xml);
  console.log('feed    ' + file + ' (' + list.length + ' items)');
}

rss('feed.xml', 'Show Me the Receipts',
  'Field Notes and Leadership Notes on how donor trust actually gets built. By Glen E. Quiring, CFRE.',
  notes, '', 'field-note.png');
rss('feed-field-notes.xml', 'Show Me the Receipts: Field Notes',
  'What the field repeats, and what the receipts show. By Glen E. Quiring, CFRE.',
  notes.filter((n) => n.stream === 'field'), 'field-notes.html', 'field-note.png');
rss('feed-leadership-notes.xml', 'Show Me the Receipts: Leadership Notes',
  'On building an organization where promises get kept. By Glen E. Quiring, CFRE.',
  notes.filter((n) => n.stream === 'leadership'), 'leadership-notes.html', 'leadership-note.png');

console.log('\nBuild finished: ' + notes.length + ' notes.');
