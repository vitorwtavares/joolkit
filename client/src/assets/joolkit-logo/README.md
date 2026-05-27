# joolkit — logo assets

Brand color: **`#4a8cf0`** (blue)
Typography: **Geist** Variable, weight 600
Concept: outlined toolbox silhouette — handle arch + body — referencing "job toolkit"

## Files

### SVG (always prefer for web)

- `joolkit-mark.svg` — the toolbox mark only. Works on any background. Use for favicons, app icons, small UI placements.
- `joolkit-wordmark-light.svg` — mark + "joolkit" text in **light text** (`#ededeb`). For **dark backgrounds** (your app, dark splash screens).
- `joolkit-wordmark-dark.svg` — mark + "joolkit" text in **dark text** (`#161616`). For **light backgrounds** (white pages, light marketing).
- `joolkit-stacked-light.svg` / `joolkit-stacked-dark.svg` — vertical layout (mark above text). For square placements like social-media profile shots, splash screens.
- `favicon.svg` — square mark on dark `#161616` background. For browser favicons.

### PNG (for places SVG isn't supported — embeds, slides, image fields)

Generated at 1024×1024 (mark) / 1840×440 (wordmark) / 1248×1056 (stacked) for high-DPI use. Plus 32 / 128 favicons. PNGs are tightly cropped to content; if you need a square crop for a profile-photo field, render the SVG with padding via stylesheet.

- `joolkit-mark-1024.png` · `joolkit-mark-256.png`
- `joolkit-wordmark-light-1024.png` · `joolkit-wordmark-dark-1024.png`
- `joolkit-stacked-light-1024.png` · `joolkit-stacked-dark-1024.png`
- `favicon-32.png` · `favicon-128.png`

## Clear-space & sizing

- **Minimum clear space**: at least the height of the mark on every side. Never crowd the wordmark.
- **Minimum mark size**: 16px (use the favicon variant below 24px).
- **Minimum wordmark size**: 88px wide.
- **Maximum size**: no upper limit — SVG scales cleanly.

## Don't

- Don't recolor the mark — only `#4a8cf0` blue.
- Don't fill the toolbox body or outline the handle differently from the body (both are outlined in the same weight).
- Don't use the mark and text in different colors from each other on the same lock-up.
- Don't add drop-shadows, glows, or gradients.

## Color codes

| Use                      | Hex                    | OKLCH                 |
| ------------------------ | ---------------------- | --------------------- |
| Brand blue               | `#4a8cf0`              | `oklch(64% 0.16 250)` |
| Brand soft (16% bg fill) | `rgba(74,140,240,.16)` | —                     |
| Brand border (45% line)  | `rgba(74,140,240,.45)` | —                     |
| Text on dark             | `#ededeb`              | `oklch(94% 0.005 80)` |
| Text on light            | `#161616`              | `oklch(15% 0 0)`      |

## Usage examples

| Where                           | Which file                           |
| ------------------------------- | ------------------------------------ |
| App sidebar (dark UI)           | `joolkit-wordmark-light.svg`         |
| `<link rel="icon">`             | `favicon.svg` (and `favicon-32.png`) |
| iOS app icon / Apple touch icon | `favicon-128.png` (or 256 if needed) |
| Open Graph image                | `joolkit-stacked-light-1024.png`     |
| Email signature, light mode     | `joolkit-wordmark-dark.svg`          |
| GitHub social preview           | `joolkit-stacked-light-1024.png`     |
| Avatar / Twitter profile        | `joolkit-mark-1024.png` on dark bg   |
