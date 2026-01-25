import express, { type Express } from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import { createPackagesRouter } from './routes/packages.js'
import { createRegistryRouter } from './routes/registry.js'
import { createOperationsRouter } from './routes/operations.js'
import { createProjectRouter } from './routes/project.js'
import { createAuditRouter } from './routes/audit.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function createServer(projectPath: string): Express {
  const app = express()

  // Middleware
  app.use(cors())
  app.use(express.json())

  // API routes
  app.use('/api/packages', createPackagesRouter(projectPath))
  app.use('/api/registry', createRegistryRouter())
  app.use('/api/operations', createOperationsRouter())
  app.use('/api/project', createProjectRouter(projectPath))
  app.use('/api/audit', createAuditRouter(projectPath))

  // Serve static files in production
  const clientDistPath = join(__dirname, '../client')
  if (existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath))

    // SPA fallback - serve index.html for all non-API routes
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(join(clientDistPath, 'index.html'))
      }
    })
  }

  return app
}
