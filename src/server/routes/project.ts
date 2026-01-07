import { Router, type Request, type Response } from 'express'
import { getProjectInfo } from '../services/packageJson.js'
import { detectPackageManager } from '../services/packageManager.js'
import type { ProjectInfo } from '@shared/types'

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

  return router
}
