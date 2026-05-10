import { Router, type Request, type Response } from 'express'
import { getPackageInfo, getDownloadCounts, getPackageVersions } from '../services/registryClient.js'

export function createRegistryRouter(): Router {
  const router = Router()

  // GET /api/registry/:name/versions - Get all versions for a package
  router.get('/:name/versions', async (req: Request<{ name: string }>, res: Response) => {
    try {
      const packageName = decodeURIComponent(req.params.name)
      const versions = await getPackageVersions(packageName)
      res.json({ success: true, data: versions })
    } catch (error) {
      console.error('Error getting package versions:', error)
      res.status(500).json({ success: false, error: 'Failed to get package versions' })
    }
  })

  // GET /api/registry/:name - Get package info from npm registry
  router.get('/:name', async (req: Request<{ name: string }>, res: Response) => {
    try {
      const { name } = req.params

      // Handle scoped packages
      const packageName = decodeURIComponent(name)
      const [info, downloads] = await Promise.all([
        getPackageInfo(packageName),
        getDownloadCounts(packageName),
      ])

      if (!info) {
        res.status(404).json({
          success: false,
          error: 'Package not found in registry',
        })
        return
      }

      if (downloads) {
        info.downloads = downloads
      }

      res.json({
        success: true,
        data: info,
      })
    } catch (error) {
      console.error('Error getting registry info:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get registry info',
      })
    }
  })

  return router
}
