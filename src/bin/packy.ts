#!/usr/bin/env node

import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import getPort from 'get-port'
import open from 'open'
import { createServer } from '../server/app.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  const projectPath = process.cwd()

  const packageJsonPath = resolve(projectPath, 'package.json')
  if (!existsSync(packageJsonPath)) {
    console.error('Error: No package.json found in the current directory.')
    console.error('Please run packy from a directory containing a package.json file.')
    process.exit(1)
  }

  const port = await getPort({ port: [5173, 5174, 5175, 5176, 5177] })
  const clientDistPath = join(__dirname, '../client')

  const app = createServer(projectPath, clientDistPath)

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
