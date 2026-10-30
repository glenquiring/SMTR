# Show Me the Receipts: Brand Standards

The brand standards for ShowMeReceipts.org and everything published under the Show Me the Receipts name.
Sources: the project style sheet (version 060626) and the live site templates.
For how a note is written, see the Notes Guide, Part 1. For how a note is published, see `PUBLISHING.md`.

Version 103026.

## Name and byline

- **Show Me the Receipts.** Capital S, M, R. A lowercase "the."
- **ShowMeReceipts.org** when naming the website.
- **SMTR** is shorthand. Spell out the full name first in anything public.
- **Byline:** Glen E. Quiring, CFRE

## Colors

| Name | Hex | Where it goes |
|---|---|---|
| AFP Purple | `#3D00A4` | Primary. Page hero, headings, links, table headers, pull lines. |
| Nav Blue | `#28006C` | The top menu bar only. |
| Gold | `#C9A24A` | Accents: rules, the active-menu underline, eyebrows, the note icons. |
| Light Gold | `#F0E4C2` | The meta line on the purple hero. |
| Cream | `#FAF7F0` | Page background. |
| Charcoal | `#2A1F3D` | Body text. |
| Soft Gray | `#6B6378` | Secondary text: the About block, endnotes, captions. |
| White | `#FFFFFF` | Text on purple. |

Author every file to these exact hex values. Exported images may round a channel by one
(for example, purple sampling as `#3D00A5`). That is expected.

On the site, the colors live as CSS variables: `--afp-blue`, `--nav-blue`, `--gold`, `--light-gold`,
`--cream`, `--charcoal`, `--soft-gray`. Use the variables, not raw hex values.

## Type

Four type families, one for each kind of work. Don't cross them.

| Where | Typeface | Used for |
|---|---|---|
| Website | Newsreader + system sans | Newsreader for titles, section headers, subtitles, and pull lines. The system sans for body text, menus, and eyebrows. |
| Word documents | Arial | Guides, research briefs, worksheets, drafts. |
| Slide decks | Mulish | The keynote and presentations. Embed the font and set it on each text run. |
| Graphics | Lora | LinkedIn cards and shared images. Use the static Regular, Bold, and Italic files, not the variable font. |

In Word documents: eyebrows are bold Gold in all caps with wide letter spacing, headings are AFP Purple,
and body text is Charcoal.

## Marks and icons

Each stream has its own mark, used everywhere that stream appears: the menu, page heroes,
browser tabs, note lists, and emails. The files are in `images/notes/`.

| Stream | On purple | Elsewhere |
|---|---|---|
| Field Notes | `field-note-gold.svg` | `field-note.svg`, `.ico`, `.png` |
| Leadership Notes | `leadership-note-gold.svg` | `leadership-note.svg`, `.ico`, `.png` |

The rest of the site uses the receipt icon. Never put one stream's mark on the other stream's notes.

## Page elements

- **Eyebrows and meta lines:** small, uppercase, widely letter-spaced.
- **Pull lines:** Newsreader, AFP Purple, used sparingly. One or two per note.
- **One image per note.** It shows the note's one picture. Save it as a file in the note's folder; never embed it as code.
- **Share images:** 1200 x 627. The default is `images/share-default.png`.
- **Notes always start from the stream's template** (`field-notes/_TEMPLATE.html` or `leadership-notes/_TEMPLATE.html`)
  so the menu, sign-up box, and link previews stay current.

## Images

- Use only images Glen made or has the right to use. Give credit when the license asks for it.
- Every image has alt text that says what it shows.

## Accessibility

- Every image has alt text.
- Link text says where it goes. Not "click here."
- Keep text in the brand colors above, which read clearly on cream and on purple.

## Writing on the site

- Plain, conversational, about a 9th grade reading level. Short sentences and short paragraphs.
- No em dashes.
- Every claim matches its source. Details go in endnotes; sources go below them in APA style.

## Not this brand

Allan Hancock College's brand standards (logos, colors, slogan, voice) do not apply to ShowMeReceipts.org.
Glen's role at the college appears only in his author bio.
