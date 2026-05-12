import express, { type Express, type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import { join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { createPackagesRouter } from './routes/packages.js'
import { createRegistryRouter } from './routes/registry.js'
import { createOperationsRouter } from './routes/operations.js'
import { createProjectRouter } from './routes/project.js'
import { createAuditRouter } from './routes/audit.js'
import { createScriptsRouter } from './routes/scripts.js'

export function createServer(projectPath: string, clientDistPath: string, port?: number, token?: string): Express {
  const app = express()

  app.use(cors(port ? { origin: `http://localhost:${port}` } : {}))
  app.use(express.json())

  if (token) {
    app.use('/api', (req: Request, res: Response, next: NextFunction) => {
      if (req.method === 'GET' || req.method === 'OPTIONS' || req.method === 'HEAD') {
        return next()
      }
      if (req.headers['x-packy-token'] !== token) {
        res.status(401).json({ success: false, error: 'Unauthorized' })
        return
      }
      next()
    })
  }

  app.use('/api/packages', createPackagesRouter(projectPath))
  app.use('/api/registry', createRegistryRouter())
  app.use('/api/operations', createOperationsRouter(projectPath))
  app.use('/api/project', createProjectRouter(projectPath))
  app.use('/api/audit', createAuditRouter(projectPath))
  app.use('/api/scripts', createScriptsRouter(projectPath))

  if (existsSync(clientDistPath)) {
    const rawHtml = readFileSync(join(clientDistPath, 'index.html'), 'utf-8')
    const indexHtml = token
      ? rawHtml.replace('</head>', `<script>window.__PACKY_TOKEN__="${token}"</script></head>`)
      : rawHtml

    app.use(express.static(clientDistPath, { index: false }))

    app.get('/{*path}', (req: Request, res: Response) => {
      if (!req.path.startsWith('/api')) {
        res.type('html').send(indexHtml)
      }
    })
  }

  return app
}
