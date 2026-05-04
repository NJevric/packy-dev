import express, { type Express } from 'express'
import cors from 'cors'
import { join } from 'path'
import { existsSync } from 'fs'
import { createPackagesRouter } from './routes/packages.js'
import { createRegistryRouter } from './routes/registry.js'
import { createOperationsRouter } from './routes/operations.js'
import { createProjectRouter } from './routes/project.js'
import { createAuditRouter } from './routes/audit.js'

export function createServer(projectPath: string, clientDistPath: string): Express {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.use('/api/packages', createPackagesRouter(projectPath))
  app.use('/api/registry', createRegistryRouter())
  app.use('/api/operations', createOperationsRouter())
  app.use('/api/project', createProjectRouter(projectPath))
  app.use('/api/audit', createAuditRouter(projectPath))

  if (existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath))

    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(join(clientDistPath, 'index.html'))
      }
    })
  }

  return app
}
