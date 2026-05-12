# Packy

<p align="center">
  <img src="https://raw.githubusercontent.com/njevric/packy-dev/main/public/banner.svg" alt="Packy — modern browser UI for npm package management" width="900"/>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/packydash"><img src="https://img.shields.io/npm/v/packydash" alt="npm version"/></a>
  <a href="https://www.npmjs.com/package/packydash"><img src="https://img.shields.io/npm/dm/packydash" alt="npm downloads"/></a>
  <a href="https://github.com/NJevric/packy-dev/actions/workflows/ci.yml"><img src="https://github.com/NJevric/packy-dev/actions/workflows/ci.yml/badge.svg" alt="CI"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"/></a>
  <a href="https://www.npmjs.com/package/packydash"><img src="https://img.shields.io/node/v/packydash" alt="Node version"/></a>
</p>

Modern browser UI for managing npm dependencies and packages.

Run `packy` in any Node.js project to open a fully responsive dashboard for installing, removing, and updating packages — with real-time output streaming and a built-in security auditor.

## Features

- **Dashboard** — stats bar showing total packages, outdated count, vulnerability summary, node_modules install size, and last audit time with sparkline
- **Package management** — view all dependencies with current vs. latest versions, install, remove, and update individual packages; pick any specific version from the full registry history before installing
- **Update All** — one-click bulk update for all outdated packages with live progress
- **Package detail** — per-package view with npm registry info: version history, license, weekly downloads, homepage, repository, and keywords
- **Security audit** — run `npm audit` from the browser with severity breakdown (critical / high / moderate / low / info)
- **Audit fixes** — apply fixes individually or all at once, with automatic force-fix for breaking major version changes
- **Audit & fix history** — persistent logs of every audit run and fix applied
- **Activity feed** — timeline of recent installs, updates, removals, and audits across sessions
- **Real-time streaming** — command output streamed live to the browser via SSE
- **Smart filtering** — search packages by name, filter by type (all / outdated / dependencies / devDependencies)
- **Unused dependency detection** — powered by `depcheck`; highlights packages declared in `package.json` but not imported in the project
- **Smart filters panel** — contextual filter chips that surface the most relevant package subsets at a glance
- **Script runner** — run any `package.json` script from the browser with live output streaming and per-script run history
- **Dark mode** — system-aware theme with a manual toggle; preference persisted across sessions
- **Fully responsive** — works on mobile, tablet, and desktop

## Requirements

Node.js >= 18.0.0

## Installation

```bash
npm install -g packydash
```

## Usage

Navigate to any Node.js project directory and run:

```bash
cd your-project
packy
```

Packy starts a local server, opens your browser, and serves the dashboard pointed at your project's `package.json`.

### Options

```
--port <number>   Port to listen on (default: auto-selects from 5173–5177)
--help            Show help
```

Example with a custom port:

```bash
packy --port 4000
```

## Supported Package Managers

Packy auto-detects the package manager from your project:

| Lock file | Package manager |
|---|---|
| `pnpm-lock.yaml` | pnpm |
| `yarn.lock` | yarn |
| `package-lock.json` or none | npm |

## License

MIT — [Nikola Jevric](https://github.com/NJevric)
