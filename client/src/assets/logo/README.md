# joolkit - logo assets

Brand color: **`#4a8cf0`** (blue)
Typography: **Bricolage Grotesque**, weight 700
Concept: soft rounded toolkit mark with a bold rendered wordmark

## Files

### SVG

- `svg/joolkit-mark.svg` - the standalone mark in brand blue. Use for scalable UI marks, app icons, and small brand placements.
- `svg/joolkit-mark-white.svg` - the standalone mark in white. Use on dark backgrounds.
- `favicon.svg` - vector favicon tile. Use for browser favicons.

### PNG

Lockups are PNGs with the Bricolage Grotesque 700 wordmark rendered to pixels, so the font is always correct and there is no font dependency. Every file has a transparent background.

- `png/joolkit-horizontal-dark.png` - mark + ink wordmark, for light backgrounds. Exported at 810 x 340.
- `png/joolkit-horizontal-dark-no-border.png` - tightly cropped horizontal dark lockup. Exported at 654 x 184.
- `png/joolkit-horizontal-light.png` - mark + white wordmark, for dark backgrounds. Exported at 810 x 340.
- `png/joolkit-horizontal-light-no-border.png` - tightly cropped horizontal light lockup. Exported at 654 x 184.
- `png/joolkit-stacked-dark.png` - mark over ink wordmark, for light backgrounds. Exported at 466 x 435.
- `png/joolkit-stacked-dark-no-border.png` - tightly cropped stacked dark lockup. Exported at 388 x 357.
- `png/joolkit-stacked-light.png` - mark over white wordmark, for dark backgrounds. Exported at 466 x 435.
- `png/joolkit-stacked-light-no-border.png` - tightly cropped stacked light lockup. Exported at 388 x 357.
- `png/joolkit-mark-512.png` - standalone brand mark at 512 x 512.
- `png/joolkit-mark-512-no-border.png` - tightly cropped standalone brand mark at 456 x 512.
- `png/joolkit-mark-1024.png` - standalone brand mark at 1024 x 1024.
- `png/joolkit-mark-1024-no-border.png` - tightly cropped standalone brand mark at 912 x 1024.
- `png/joolkit-favicon-64.png` - favicon tile at 64 x 64.
- `png/joolkit-favicon-64-no-border.png` - favicon tile at 64 x 64.

## Clear-space & sizing

- **Minimum clear space**: keep at least the height of the mark around every side of the logo when possible.
- **Minimum mark size**: 16px. Use `png/joolkit-favicon-64.png` or `favicon.svg` for favicon-sized placements.
- **Minimum horizontal lockup size**: 88px wide.
- **Maximum size**: no upper limit for SVG marks; use the highest-resolution PNG export available for large raster placements.

## Don't

- Don't recolor the mark or wordmark.
- Don't recreate the wordmark in live text; use the rendered PNG lockups.
- Don't place the dark lockups on dark backgrounds or the light lockups on light backgrounds.
- Don't add drop shadows, glows, outlines, gradients, or extra backgrounds to the transparent assets.
- Don't crop the transparent canvas so tightly that the mark or wordmark loses breathing room.

## Color codes

| Use        | Hex       |
| ---------- | --------- |
| Brand blue | `#4a8cf0` |
| Ink        | `#17161d` |
| Muted      | `#8a87a0` |
| Background | `#f4f5f8` |
| Line       | `#e8e6f0` |

## Usage examples

| Where                           | Which file                                   |
| ------------------------------- | -------------------------------------------- |
| App sidebar (dark UI)           | `png/joolkit-horizontal-light-no-border.png` |
| Auth screen (dark UI)           | `png/joolkit-stacked-light-no-border.png`    |
| `<link rel="icon">`             | `favicon.svg`                                |
| iOS app icon / Apple touch icon | `png/joolkit-favicon-64.png`                 |
| Open Graph image                | `png/joolkit-stacked-light.png`              |
| Email signature, light mode     | `png/joolkit-horizontal-dark-no-border.png`  |
| Avatar / profile image          | `png/joolkit-mark-1024-no-border.png`        |
