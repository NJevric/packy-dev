# Packy

<p align="center">
  <img src="https://raw.githubusercontent.com/njevric/packy-dev/main/public/banner.svg" alt="Packy — modern browser UI for npm package management" width="900"/>
</p>

Modern browser UI for managing npm dependencies and packages.

Run `packy` in any Node.js project to open a dashboard for installing, removing, and updating packages — with real-time output streaming and a built-in security auditor.

## Features

- View all dependencies with current vs. latest versions
- Install, remove, and update packages (npm, yarn, pnpm)
- One-click "update all" with confirmation
- Security audit with severity breakdown (critical / high / moderate / low)
- Apply audit fixes — including force fixes for breaking changes
- Persistent audit and fix history logs
- Real-time command output streamed to the browser

## Requirements

Node.js >= 18.0.0

## Installation

```bash
npm install -g packy
```

## Usage

Navigate to any Node.js project directory and run:

```bash
cd your-project
packy
```

Packy starts a local server, opens your browser, and serves the UI pointing at your project's `package.json`.

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
