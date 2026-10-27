# Changelog

All notable changes to Mazkiplay Pentester AI are documented here. This project is under active development; entries describe repository changes and do not imply every planned capability is production-ready.

## [Unreleased] — 2026-10-27

### Added
- Google Dork Builder for passive, domain-scoped Google queries with domain validation, copy actions, and direct search links.
- IP Geolocation Lookup using ipapi.co for approximate public-IP metadata and optional approximate-coordinate links to Google Maps.
- Responsive cyber-style motion effects with a `prefers-reduced-motion` accessibility fallback.
- Security documentation covering authorization, IP geolocation limitations, external data sharing, and release readiness.
- Automated source-level checks for the passive dork builder and IP lookup UI.

### Changed
- Updated README badges and repository links to point to the Mazkiplay fork.
- Clarified local model endpoint default and offline assistant limitations.

### Security and privacy
- IP lookup is not GPS tracking and cannot reliably identify a person's exact location.
- The IP lookup sends the entered IP, or the visitor's public IP when left blank, to the external provider ipapi.co.
- Keep security testing limited to systems you own or have explicit permission to assess.
- Existing MIT license terms are retained from the upstream project; see [LICENSE](LICENSE).

### Validation status
- CI validation is running for the active development branch. Do not treat this entry as a successful release announcement until the workflow completes successfully.


## Unreleased — 2026-10-27 (Security Toolkit)

- Added a client-side Security Toolkit dialog with cryptographically generated passwords, local SHA-256 text hashing, and URL encode/decode helpers.
- Added responsive tool cards and clear limitations/security guidance.
- Inputs stay in the browser for these utilities; no remote scanning or upload is performed by the toolkit.
