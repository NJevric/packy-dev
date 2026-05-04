#!/usr/bin/env node

import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import getPort from 'get-port'
import open from 'open'
import { createServer } from '../server/app.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

function parseArgs(): { port?: number; help: boolean } {
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.includes('-h')) {
    return { help: true }
  }
  const portIdx = args.indexOf('--port')
  const port = portIdx !== -1 ? parseInt(args[portIdx + 1], 10) : undefined
  return { port: port && !isNaN(port) ? port : undefined, help: false }
}

async function main() {
  const { port: preferredPort, help } = parseArgs()

  if (help) {
    console.log('Usage: packy [--port <number>]')
    console.log('')
    console.log('Options:')
    console.log('  --port <number>   Port to listen on (default: auto-select from 5173-5177)')
    console.log('  --help            Show this help message')
    process.exit(0)
  }

  const projectPath = process.cwd()

  const packageJsonPath = resolve(projectPath, 'package.json')
  if (!existsSync(packageJsonPath)) {
    console.error('Error: No package.json found in the current directory.')
    console.error('Please run packy from a directory containing a package.json file.')
    process.exit(1)
  }

  let port: number
  if (preferredPort) {
    const available = await getPort({ port: preferredPort })
    if (available !== preferredPort) {
      console.error(`Error: Port ${preferredPort} is already in use.`)
      process.exit(1)
    }
    port = preferredPort
  } else {
    port = await getPort({ port: [5173, 5174, 5175, 5176, 5177] })
  }
  const clientDistPath = join(__dirname, '../client')

  const app = createServer(projectPath, clientDistPath, port)

  app.listen(port, () => {
    const url = `http://localhost:${port}`
    console.log('')
    console.log('  🎒 Packy is running!')
    console.log('')
    console.log(`  ➜  Local:   ${url}`)
    console.log(`  ➜  Project: ${projectPath}`)
    console.log('')
    console.log('  Press Ctrl+C to stop')
    console.log('')

    // Open browser
    open(url).catch(() => {
      // Ignore errors when opening browser
    })
  })
}

main().catch((error) => {
  console.error('Failed to start Packy:', error)
  process.exit(1)
})
