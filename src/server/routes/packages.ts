import { Router, type Request, type Response } from 'express'
import { getPackages } from '../services/packageJson.js'
import { getLatestVersion, getSmartMetadata } from '../services/registryClient.js'
import {
  detectPackageManager,
  getUninstallCommand,
  getUpdateCommand,
  getUpdateAllCommand,
} from '../services/packageManager.js'
import { runCommand } from '../services/operationRunner.js'
import type { UpdatePackageRequest, Package } from '@shared/types'

export function createPackagesRouter(projectPath: string): Router {
  const router = Router()
  const packageManager = detectPackageManager(projectPath)

  // GET /api/packages - List all packages with latest versions
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const packages = getPackages(projectPath)

      // Fetch latest versions in parallel
      const packagesWithVersions = await Promise.all(
        packages.map(async (pkg): Promise<Package> => {
          const latest = await getLatestVersion(pkg.name)
          return {
            ...pkg,
            latest: latest || pkg.current,
            wanted: latest || pkg.current,
            hasUpdate: latest ? pkg.current !== latest : false,
          }
        })
      )

      res.json({
        success: true,
        data: packagesWithVersions,
      })
    } catch (error) {
      console.error('Error getting packages:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get packages',
      })
    }
  })

  // GET /api/packages/smart-data - Batch enriched metadata for smart filters
  router.get('/smart-data', async (_req: Request, res: Response) => {
    try {
      const packages = getPackages(projectPath)
      const smartData = await Promise.all(
        packages.map(async (pkg) => {
          const meta = await getSmartMetadata(pkg.name)
          return { name: pkg.name, ...meta }
        })
      )
      res.json({ success: true, data: smartData })
    } catch (error) {
      console.error('Error fetching smart data:', error)
      res.status(500).json({ success: false, error: 'Failed to fetch smart metadata' })
    }
  })

  // GET /api/packages/:name - Get a single package
  router.get('/:name', async (req: Request<{ name: string }>, res: Response) => {
    try {
      const { name } = req.params
      const packages = getPackages(projectPath)
      const pkg = packages.find((p) => p.name === name)

      if (!pkg) {
        res.status(404).json({
          success: false,
          error: 'Package not found',
        })
        return
      }

      const latest = await getLatestVersion(name)
      const packageWithVersion: Package = {
        ...pkg,
        latest: latest || pkg.current,
        wanted: latest || pkg.current,
        hasUpdate: latest ? pkg.current !== latest : false,
      }

      res.json({
        success: true,
        data: packageWithVersion,
      })
    } catch (error) {
      console.error('Error getting package:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get package',
      })
    }
  })

  // POST /api/packages/update-all - Update all outdated packages
  router.post('/update-all', async (_req: Request, res: Response) => {
    try {
      const packages = getPackages(projectPath)

      const packagesWithVersions = await Promise.all(
        packages.map(async (pkg) => {
          const latest = await getLatestVersion(pkg.name)
          return { ...pkg, latest, hasUpdate: latest ? pkg.current !== latest : false }
        })
      )

      const outdated = packagesWithVersions.filter((p) => p.hasUpdate).map((p) => p.name)

      if (outdated.length === 0) {
        res.json({ success: true, data: { operationId: null, message: 'All packages are up to date' } })
        return
      }

      const operationId = runCommand(getUpdateAllCommand(packageManager, outdated), projectPath, 'update', undefined, undefined)

      res.json({ success: true, data: { operationId } })
    } catch (error) {
      console.error('Error updating all packages:', error)
      res.status(500).json({ success: false, error: 'Failed to update all packages' })
    }
  })

  // DELETE /api/packages/:name - Remove a package
  router.delete('/:name', (req: Request<{ name: string }>, res: Response) => {
    try {
      const { name } = req.params

      // Handle scoped packages - the name might be URL encoded
      const packageName = decodeURIComponent(name)
      const operationId = runCommand(getUninstallCommand(packageManager, packageName), projectPath, 'remove', packageName)

      res.json({
        success: true,
        data: { operationId },
      })
    } catch (error) {
      console.error('Error removing package:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to remove package',
      })
    }
  })

  // PATCH /api/packages/:name - Update a package
  router.patch('/:name', (req: Request<{ name: string }>, res: Response) => {
    try {
      const { name } = req.params
      const { version } = req.body as UpdatePackageRequest

      if (version !== undefined && !/^[^\s]+$/.test(version)) {
        res.status(400).json({ success: false, error: 'Invalid version string' })
        return
      }

      const packageName = decodeURIComponent(name)
      const fromVersion = getPackages(projectPath).find((p) => p.name === packageName)?.current
      const operationId = runCommand(getUpdateCommand(packageManager, packageName, version), projectPath, 'update', packageName, fromVersion)

      res.json({
        success: true,
        data: { operationId },
      })
    } catch (error) {
      console.error('Error updating package:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update package',
      })
    }
  })

  return router
}
