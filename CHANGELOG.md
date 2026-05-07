# Changelog

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
