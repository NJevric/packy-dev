# Changelog

## [1.3.3] — 2026-05-10

### Added
- **Activity page** — full paginated activity log with search, type filter (install / update / remove / audit), actor filter, and per-entry stats
- **Version picker** — choose any specific version from the full npm registry history before installing a package
- **404 Not Found page** — terminal-style animated error output for unmatched routes

### Fixed
- Removed broken logo asset reference

### Changed
- Dependency updates

---

## [1.1.2] — 2026-05-08

### Added
- **Update All** — one-click bulk update for all outdated packages with live progress streaming
- Dashboard package list capped to most relevant entries for a cleaner overview

### Changed
- Responsive layout improvements across all views

---

## [1.0.1] — 2026-05-08

### Fixed
- Tailwind CSS v3 → v4 syntax migration
- TypeScript type errors

---

## [1.0.0] — 2026-05-08

### Added
- Dashboard with overview cards: total packages, outdated count, dependencies/devDependencies split
- Activity card showing recent package operations on the dashboard
- Stats bar with at-a-glance dependency health metrics
- Package list with current vs. latest version comparison
- Install size estimation shown before installing a package
- Install packages with optional version pinning and dev flag
- Remove packages with confirmation dialog
- Update individual packages or all outdated packages at once
- Security audit powered by `npm audit --json` with severity breakdown (critical / high / moderate / low / info)
- Audit fix — apply safe fixes or force fixes for major-version breaking changes
- Fix specific vulnerable packages by name
- Persistent audit history and fix history logs (`.packy-logs/` in project root, last 100 entries each)
- Operation log service for tracking command history across sessions
- Real-time command output streaming via Server-Sent Events
- Auto-detection of package manager: pnpm (via `pnpm-lock.yaml`), yarn (via `yarn.lock`), npm (default)
- `--port` flag to specify the listen port
- `--help` flag
- Custom confirm dialog (no browser `alert()` or `confirm()` calls)

### Fixed
- Command injection vulnerability — all shell arguments are now validated and escaped before execution
- API access restricted to localhost only; remote requests are rejected
