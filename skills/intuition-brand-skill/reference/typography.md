# Typography

## Contents

- Typefaces
- Type scale
- Setting text
- Fallbacks and loading

## Typefaces

Three typefaces, all open source under the SIL Open Font License.

| Typeface | Role | Weights used | Source |
|---|---|---|---|
| Instrument Sans | Titles | 500 | Google Fonts |
| Inter | Text: every word that is not a title or code | 400, 500, 600 | Google Fonts |
| Ioskeley Mono | Code, values and labels | 400 | github.com/ahatem/IoskeleyMono, version 2.2.0 |

Ioskeley Mono is always set with the slashed zero (`font-variant-numeric: slashed-zero`), in code and everywhere else it appears: its default dotted zero reads as an 8 at small sizes.

## Type scale

Eight sizes, named by size. Titles sit above the text: no title is smaller than the largest text. Label, Kicker and Code are styles on those sizes, not sizes of their own.

**Titles**: Instrument Sans, 500

| Name | Size | Line height | Tracking | For |
|---|---|---|---|---|
| Title xl | 36px | 40px | −0.025em | The page title (h1) |
| Title lg | 30px | 36px | −0.025em | Hero lines |
| Title md | 24px | 32px | −0.025em | Section titles (h2) |
| Title sm | 20px | 28px | 0 | Subsection and card titles (h3) |

**Text**: Inter, 400

| Name | Size | Line height | For |
|---|---|---|---|
| Text lg | 18px | 28px | Lead paragraphs, captions that tell a story |
| Text md | 16px | 24px | Body text |
| Text sm | 14px | 20px | Secondary text, links, buttons |
| Text xs | 12px | 16px | Captions, metadata |

**Styles on those sizes**

| Name | Size | Face | Setting | For |
|---|---|---|---|---|
| Label | 12px, 16px line | Ioskeley Mono 400 | Capitals, +0.18em tracking, indented 0.18em | Tags: short labels, never sentences |
| Kicker | 12px, 16px line | Inter 500 | Sentence case, no tracking | The line above a title |
| Code | 14px, 20px line | Ioskeley Mono 400 | Slashed zero | Code blocks and inline code |
| Diagram label | 12px, 12px line | Inter 400 | Drafting red, 10px from its line | Measures on the logo's drawings: see [logo.md](logo.md) |

The indent on Label matches its tracking, so the trailing space after the last letter does not push the word off its column.

## Setting text

- **Sentence case** for every title, heading, button and label written as words. Never set a title, a heading or a sentence in capitals: it shouts. Capitals are for short tags (the Label style), acronyms and key names only.
- **Measure:** keep body text to 45 to 75 characters a line, 66 at best; never more than 80. On the web, body text spans at most 8 of the page's 12 grid columns.
- **Weights:** titles 500. In text, 400 for reading, 500 for emphasis and button labels, 600 only where 500 is not enough. Never bold a whole paragraph.
- **Colors:** text in Midnight; muted text in Graphite 500 on white, Graphite 300 on Midnight. Never a protocol color.
- **Numbers and values** in Ioskeley Mono: hashes, addresses, color values, code.
- **Balance** titles and **pretty-wrap** paragraphs where the medium allows (`text-wrap: balance` and `pretty`), so no line ends on a lone word.
- **Spelling:** US English, as in "color" and "centered".

## Fallbacks and loading

| Role | Stack |
|---|---|
| Titles | `'Instrument Sans', 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` |
| Text | `'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` |
| Code | `'Ioskeley Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace` |

On the web, load the title and text faces early and the mono face only where code appears. Titles fall back to Inter, then to the system sans. In tools without these fonts (slides, documents), install Instrument Sans and Inter from Google Fonts; if they cannot be installed, use the system sans, never a serif.
