# noloop — logo assets

Brand color: **`#4a8cf0`** (blue)
Typography: **Geist** Variable, weight 600

## Files

### SVG (always prefer for web)

- `noloop-mark.svg` — the orbit mark only. Works on any background. Use for favicons, app icons, small UI placements.
- `noloop-wordmark-light.svg` — mark + "noloop" text in **light text** (`#ededeb`). For **dark backgrounds** (your app, dark splash screens).
- `noloop-wordmark-dark.svg` — mark + "noloop" text in **dark text** (`#161616`). For **light backgrounds** (white pages, light marketing).
- `noloop-stacked-light.svg` / `noloop-stacked-dark.svg` — vertical layout (mark above text). For square placements like social-media profile shots, splash screens.
- `favicon.svg` — square mark on dark `#161616` background. For browser favicons.

### PNG (for places SVG isn't supported — embeds, slides, image fields)

Generated at 1024×1024 (mark) / 2048×512 (wordmark) / 1024×1024 (stacked) for high-DPI use. Plus 32 / 128 favicons.

- `noloop-mark-1024.png` · `noloop-mark-256.png`
- `noloop-wordmark-light-1024.png` · `noloop-wordmark-dark-1024.png`
- `noloop-stacked-light-1024.png` · `noloop-stacked-dark-1024.png`
- `favicon-32.png` · `favicon-128.png`

## Clear-space & sizing

- **Minimum clear space**: at least the height of the mark on every side. Never crowd the wordmark.
- **Minimum mark size**: 16px (use the favicon variant below 24px).
- **Minimum wordmark size**: 80px wide.
- **Maximum size**: no upper limit — SVG scales cleanly.

## Don't

- Don't recolor the mark — only `#4a8cf0` blue.
- Don't outline the dot or fill the ring (that inverts the design).
- Don't use the mark and text in different colors from each other on the same lock-up.
- Don't add drop-shadows, glows, or gradients.

## Color codes

| Use                     | Hex                    | OKLCH                 |
| ----------------------- | ---------------------- | --------------------- |
| Brand blue              | `#4a8cf0`              | `oklch(64% 0.16 250)` |
| Brand soft (8% bg fill) | `rgba(74,140,240,.16)` | —                     |
| Brand border (45% line) | `rgba(74,140,240,.45)` | —                     |
| Text on dark            | `#ededeb`              | `oklch(94% 0.005 80)` |
| Text on light           | `#161616`              | `oklch(15% 0 0)`      |

## Usage examples

| Where                           | Which file                           |
| ------------------------------- | ------------------------------------ |
| App sidebar (dark UI)           | `noloop-wordmark-light.svg`          |
| `<link rel="icon">`             | `favicon.svg` (and `favicon-32.png`) |
| iOS app icon / Apple touch icon | `favicon-128.png` (or 256 if needed) |
| Open Graph image                | `noloop-stacked-light-1024.png`      |
| Email signature, light mode     | `noloop-wordmark-dark.svg`           |
| GitHub social preview           | `noloop-stacked-light-1024.png`      |
| Avatar / Twitter profile        | `noloop-mark-1024.png` on dark bg    |
