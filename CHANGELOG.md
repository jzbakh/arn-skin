# Changelog

All notable changes to ARN-Skin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] — 2026-11-28

### Changed

- The README shows the demo video instead of the animation.

## [1.1.0] — 2026-11-28

### Added

- Export Customizations and Import Customizations save every ARN-Skin customization to a portable file and restore it, on another machine or after a reinstall.
- Quick reads every notation the color picker writes: hex, rgb, hsl, hwb, lab, lch, oklab and oklch.
- A rejected Quick color is underlined and the previous one stays applied.
- On a changed Quick line, the light bulb restores the theme's value.
- The four Status colors also paint the squiggles, the Problems icons, the F8 widget and the minimap marks.
- Nebula: thin violet borders between the side bar, the editor groups and the panel, and around the notifications and the suggest list.
- A notification asks for a GitHub star or a store review once per minor version.

### Changed

- Quick and Advanced edits combine color by color: the last change wins.
- Saved customizations are rebuilt at startup, so theme updates reach them. Customizations from 1.0.5 are migrated.
- Quick colors are derived the way the themes are, and a color set in Quick wins over a display option.
- Pure-Black keeps the theme's hue and darkens more surfaces.
- Vivid-Selection's neutral selection is softer.
- The highlighted tab label and the Glow line number reach a 4.5:1 contrast.
- A Borders color also recolors the theme's own borders.
- The Skin button shows with any color theme. With another theme, it opens the list of ARN-Skin themes.
- Change Theme has a rocket in the Skin menu.
- Mars: a redesigned interface, with fields and floating windows that stand out.
- Jupiter uses dark gold for gold text and selected rows, and blue for info.
- Spaceport uses steel blue for info, and its interface text is brighter.
- User-facing texts spell the name ARN-Skin and use American spelling.
- Repository, issue and security links point to GitHub.

### Fixed

- Semantic token colors set in Advanced Syntax now take effect.
- The warning that names a rejected Quick color now shows.
- With Pure-Black off, the dark themes keep their backgrounds and readable menus.
- An invalid color in the Advanced files raises a single warning.
- Input placeholders, line numbers and idle activity-bar icons are readable in every theme.
- A selected list row keeps its icon colors, so a selected error stays red.
- Markdown quotes get their color in every theme.
- The status bar keeps its color when no folder is open.
- Spaceport: find matches have an outline.
- Nebula: the unfocused active tab has its shape back, the terminal greens, cyans and blues are distinct, and properties have one color.
- Neptune: the selection stays visible when the editor loses focus, and the active panel title uses the accent.
- Jupiter: the settings fields show, the active tab no longer looks like an error, and the active icon, the remote item and the tab line are darker.
- Mars: the hover widget is back in the palette, and the input fields, the count badges and the active panel title are visible.
- Io and Uranus: Peek highlights no longer hide the text. Uranus's F8 widget has its frame back.
- Jupiter and Uranus: the terminal yellows are distinct, and so are Jupiter's grays.

## [1.0.5] — 2026-07-13

### Changed

- Migrated all repository, issue tracker, and project URLs to the new `arn_inside` GitLab group.
- Perfected Markdown alignment and layout in the documentation across all 6 languages (EN, FR, ZH, ES, AR, TH).
- Simplified and fixed presentation links in the README to point to the new root domain.

## [1.0.4] — 2026-07-03

### Documentation

- Updated README badges for the extension stores (Marketplace and Open VSX) to point to the new GitLab infrastructure.

## [1.0.3] — 2026-06-26

### Changed

- Migrated project hosting and Pages infrastructure from GitHub to GitLab.
- Updated all repository, issue, and presentation URLs across package manifests and documentation.
- Fixed image alignment in the Arabic README translation table.

## [1.0.2] — 2026-05-25

### Changed

- Dark themes: `meta.paragraph.markdown` brightened from `#8a9098` to
  `#f3f4f6` for better contrast on markdown body text (Jupiter light
  theme is unchanged).
- README — install tip "filter search results by Name" added to the
  VSIX section in all 6 languages. Language selector promoted to H2
  for better navigation.

## [1.0.1] — 2026-05-10

### Added

- README — "five smart toggles" section in EN/FR/CN/ES/AR/TH.
- `SECURITY.md` describing the GitHub Private Security Advisory flow.

### Security

- Override `serialize-javascript` to `^7.0.5` in `test/package.json`.
  Closes Dependabot alerts: high-severity RCE (incomplete fix for
  CVE-2020-7660) and moderate-severity DoS (CVE-2026-34043). devDep
  only — never bundled in the `.vsix`.

### Notes

- No runtime change in `extension.js`, no theme JSON change. v1.0.1 is
  functionally identical to v1.0.0 for end users.

## [1.0.0] — 2026-05-09

First public release.

### Themes

- Seven space-themed colour palettes:
  - **Spaceport** · *Tungsten Grid* — industrial charcoal grey with golden accents
  - **Nebula** · *Amethyst Void* — violet, magenta and cyan cosmos
  - **Neptune** · *Glacial Navy* — teal ocean ice
  - **Uranus** · *Glacial Teal* — teal and ultramarine variant
  - **Io** · *Acid Haze* — neon lime green on deep black
  - **Jupiter** · *Amber Light* — light parchment (the only light theme)
  - **Mars** · *Amber Storm* — burnt orange on red earth

### Customisation

- **Quick Customization** — edit 12 base colours and 5 toggles; the extension
  derives every other workbench colour automatically.
- **Advanced: UI Colors** — full JSONC editor for every workbench key, with
  IntelliSense from a bundled JSON Schema (~480+ keys).
- **Advanced: Syntax Colors** — semantic-token and TextMate-rule editor with
  the gutter colour picker active on every entry.
- **Reset** — revert all customisation for the active theme in one action.
- Real-time apply pipeline (400 ms debounced).
- The `Skin` status-bar item shows whether the active theme is customised
  and acts as the entry point for every action.

### Compatibility

- Antigravity IDE, VSCode, Cursor, VSCodium, Windsurf and any other
  VSCode-based editor that supports the Marketplace or Open VSX.
- Requires VSCode `^1.95.0` (for `chat.linesAddedForeground` and the rest
  of the `chat.*` surface keys).

### Engineering

- Zero runtime dependencies — single-file JavaScript extension.
- GPL-3.0-or-later licensed.

[1.1.1]: https://gitlab.com/arn_inside/arn-skin/-/tags/v1.1.1
[1.1.0]: https://gitlab.com/arn_inside/arn-skin/-/tags/v1.1.0
[1.0.5]: https://gitlab.com/arn_inside/arn-skin/-/tags/v1.0.5
[1.0.4]: https://gitlab.com/arn_inside/arn-skin/-/tags/v1.0.4
[1.0.3]: https://gitlab.com/arn_inside/arn-skin/-/tags/v1.0.3
[1.0.2]: https://gitlab.com/arn_inside/arn-skin/-/tags/v1.0.2
[1.0.1]: https://gitlab.com/arn_inside/arn-skin/-/tags/v1.0.1
[1.0.0]: https://gitlab.com/arn_inside/arn-skin/-/tags/v1.0.0
