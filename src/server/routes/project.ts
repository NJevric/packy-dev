import { Router, type Request, type Response } from 'express'
import { readdirSync, lstatSync, existsSync } from 'fs'
import { join } from 'path'
import { getProjectInfo } from '../services/packageJson.js'
import { detectPackageManager } from '../services/packageManager.js'
import type { ProjectInfo } from '@shared/types'

interface InstallSizeCache {
  data: { bytes: number; fileCount: number }
  at: number
}

let installSizeCache: InstallSizeCache | null = null
const CACHE_TTL = 5 * 60 * 1000

function calcDirSize(dir: string): { bytes: number; fileCount: number } {
  let bytes = 0
  let fileCount = 0
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      try {
        const stat = lstatSync(full)
        if (stat.isSymbolicLink()) continue
        if (stat.isDirectory()) {
          const sub = calcDirSize(full)
          bytes += sub.bytes
          fileCount += sub.fileCount
        } else {
          bytes += stat.size
          fileCount++
        }
      } catch {}
    }
  } catch {}
  return { bytes, fileCount }
}

export function createProjectRouter(projectPath: string): Router {
  const router = Router()

  // GET /api/project - Get project info
  router.get('/', (_req: Request, res: Response) => {
    try {
      const { name, version } = getProjectInfo(projectPath)
      const packageManager = detectPackageManager(projectPath)

      const projectInfo: ProjectInfo = {
        name,
        version,
        path: projectPath,
        packageManager,
      }

      res.json({
        success: true,
        data: projectInfo,
      })
    } catch (error) {
      console.error('Error getting project info:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get project info',
      })
    }
  })

  // GET /api/project/install-size - Get node_modules size and file count
  router.get('/install-size', (_req: Request, res: Response) => {
    const nmPath = join(projectPath, 'node_modules')
    if (!existsSync(nmPath)) {
      return res.json({ success: true, data: null })
    }

    if (installSizeCache && Date.now() - installSizeCache.at < CACHE_TTL) {
      return res.json({ success: true, data: installSizeCache.data })
    }

    const result = calcDirSize(nmPath)
    installSizeCache = { data: result, at: Date.now() }
    res.json({ success: true, data: result })
  })

  return router
}
