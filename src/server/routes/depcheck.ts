import { Router, type Request, type Response } from 'express'
import { runDepcheck } from '../services/depcheckService.js'
import type { DepcheckResult } from '@shared/types'

interface CacheEntry {
  result: DepcheckResult
  timestamp: number
}

const CACHE_TTL = 60 * 1000 // 60 seconds

let cache: CacheEntry | null = null

export function createDepcheckRouter(projectPath: string): Router {
  const router = Router()

  // GET /api/depcheck - run analysis (cached for 60s)
  router.get('/', async (_req: Request, res: Response) => {
    try {
      if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
        res.json({ success: true, data: cache.result })
        return
      }

      const result = await runDepcheck(projectPath)
      cache = { result, timestamp: Date.now() }
      res.json({ success: true, data: result })
    } catch (error) {
      console.error('Depcheck error:', error)
      res.status(500).json({ success: false, error: 'Failed to run dependency analysis' })
    }
  })

  // GET /api/depcheck/refresh - force fresh run
  router.get('/refresh', async (_req: Request, res: Response) => {
    try {
      cache = null
      const result = await runDepcheck(projectPath)
      cache = { result, timestamp: Date.now() }
      res.json({ success: true, data: result })
    } catch (error) {
      console.error('Depcheck error:', error)
      res.status(500).json({ success: false, error: 'Failed to run dependency analysis' })
    }
  })

  return router
}
