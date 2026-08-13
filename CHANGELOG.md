# Changelog

All notable changes to Toolkit are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and releases follow [Semantic Versioning](https://semver.org/).

## Unreleased

## [1.1.0] — 2026-08-13

### Added

- Expanded the catalogue from 78 to **100 browser-only tools**, including AES-GCM, RSA key pairs, TOTP, certificate inspection, CSP and cURL builders, a header analyzer, cron and Unix permission helpers, CSS calculators, JSON conversion tools, a CSV viewer, Unicode inspection, time-zone and date-duration utilities, image compression, a sitemap generator, and WCAG contrast checking.
- Added a global keyboard-accessible tool finder, opened with <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>K</kbd>, plus an optional local-only recent-tools list.
- Added an English/Turkish client-side interface. English is the source and default language; an explicit language choice is persisted only in the visitor's browser.
- Added static site auditing and Firefox browser E2E coverage for the expansion-tool flows, desktop/mobile presentation, and language switching.

### Changed

- Renamed the public product to **Toolkit** and moved public repository and Pages references to `abel0x/toolkit`.
- Split the stylesheet into focused core, component, compatibility, page, and feature modules for easier maintenance.
- Centralised and regenerated tool navigation, static count copy, offline precache entries, and generated expansion-page shells through `build.py`.
- Completed Turkish coverage for shared interface text, tool descriptions, controls, placeholders, and dynamic result strings while leaving technical values such as algorithms and headers intact.

### Fixed

- Normalised shared footer behaviour and layout across existing and generated tool pages.
- Isolated browser E2E checks from service-worker precache timing so functional tests are deterministic.

## [1.0.0] — 2026-03-15

### Added

- **78 browser-based developer tools** across nine categories: Security & Crypto, Encoding & Decoding, JSON & Data, Text Tools, Web & URL, Image & QR, Code Tools, Converters, and Generators.
- A modular JavaScript architecture, with each original tool implemented in `assets/js/tools/*.js` as an IIFE module.
- A Service Worker for offline support, self-hosted fonts, locally vendored QR libraries, canonical and social metadata, responsive layouts, live search, category filters, a mega menu, and a PWA manifest.
- The stdlib-only `build.py` helper, a shared navigation partial, and browser smoke-test coverage.

[Unreleased]: https://github.com/abel0x/toolkit/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/abel0x/toolkit/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/abel0x/toolkit/releases/tag/v1.0.0
