# Publishing a note

Field Notes and Leadership Notes are published the same way. Three steps, then push.

## 1. Make the page

Copy the template for the stream:

- Field Note: `field-notes/_TEMPLATE.html`
- Leadership Note: `leadership-notes/_TEMPLATE.html`

Save the copy in the same folder with a short lowercase name and dashes, for example
`leadership-notes/the-handoff-nobody-owned.html`. That file name (without `.html`) is the note's **slug**.

Fill in the title, the meta line (`Leadership Note 102026 · Essay`), the descriptor and the body.

## 2. Add one entry to `notes.json`

Add a block like this inside the `"notes"` list. Order does not matter; the site sorts by date.

```json
{
  "stream": "leadership",
  "slug": "the-handoff-nobody-owned",
  "date": "2026-10-20",
  "type": "Essay",
  "title": "The Handoff Nobody Owned",
  "descriptor": "The italic line under the title on the listing page",
  "summary": "One or two sentences for the home page, the listing page and the email."
}
```

- `stream` is `"field"` or `"leadership"`.
- `date` is `YYYY-MM-DD`. The meta code (102026) is made from it automatically.
- Watch the commas: every block except the last one in the list ends with `},`.

## 3. Push

Commit and push. Vercel runs `node scripts/build.js`, which:

- puts the newest two notes of each stream on the home page,
- rebuilds the Field Notes and Leadership Notes listing pages,
- rewrites the RSS feeds that MailerLite reads,
- adds the email sign-up to the note page (top link and end-of-note box),
- writes the note's link-preview tags, so LinkedIn shows its title, summary and the share image.

If something in `notes.json` is wrong (missing comma, misspelled slug, a page that does not exist),
the build stops and the Vercel deployment shows a plain-English message saying which note to fix.
The live site stays as it was until the fix is pushed.

To check on your own machine first: `node scripts/build.js`

## Rules that protect subscribers

- **Never rename a note's file after it is published.** The URL is how MailerLite recognizes a note.
  A new URL looks like a new note and gets emailed again.
- MailerLite only sends notes published after the RSS campaign was set up, so older notes are not re-sent.

## Feeds

| Feed | Contents |
|---|---|
| `https://www.showmereceipts.org/feed.xml` | All notes |
| `https://www.showmereceipts.org/feed-field-notes.xml` | Field Notes only |
| `https://www.showmereceipts.org/feed-leadership-notes.xml` | Leadership Notes only |

## Settings in `notes.json`

`settings.leadershipNotesFirstMonth`: while there are no Leadership Notes, the site shows
"The first Leadership Notes are on the way." Put a month here (for example `"November"`) to show
"The first Leadership Notes publish in November." instead. It disappears on its own once the first note is live.

## Sharing on LinkedIn

- Put the link in the first comment, and add `?src=linkedin` to the end of it, for example
  `https://www.showmereceipts.org/field-notes/the-second-draw.html?src=linkedin`.
  Vercel Analytics will then show which visits came from LinkedIn.
- Every note uses `images/share-default.png` for its preview. To give one note its own image,
  add `"image": "images/your-file.png"` (1200 x 627) to that note's entry in `notes.json`.
- If LinkedIn shows an old or blank preview, paste the link into LinkedIn's Post Inspector
  (linkedin.com/post-inspector) to refresh it.
