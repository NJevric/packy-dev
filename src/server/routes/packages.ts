import { Router, type Request, type Response } from 'express'
import { getPackages } from '../services/packageJson.js'
import { getLatestVersion } from '../services/registryClient.js'
import {
  detectPackageManager,
  getInstallCommand,
  getUninstallCommand,
  getUpdateCommand,
  getUpdateAllCommand,
} from '../services/packageManager.js'
import { runCommand } from '../services/operationRunner.js'
import type { AddPackageRequest, UpdatePackageRequest, Package } from '@shared/types'

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

  // GET /api/packages/:name - Get a single package
  router.get('/:name', async (req: Request, res: Response) => {
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

  // POST /api/packages - Add a new package
  router.post('/', (req: Request, res: Response) => {
    try {
      const { name, version, isDev } = req.body as AddPackageRequest

      if (!name) {
        res.status(400).json({
          success: false,
          error: 'Package name is required',
        })
        return
      }

      const command = getInstallCommand(packageManager, name, version, isDev)
      const operationId = runCommand(command, projectPath, 'install', name)

      res.json({
        success: true,
        data: { operationId },
      })
    } catch (error) {
      console.error('Error adding package:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to add package',
      })
    }
  })

  // DELETE /api/packages/:name - Remove a package
  router.delete('/:name', (req: Request, res: Response) => {
    try {
      const { name } = req.params

      // Handle scoped packages - the name might be URL encoded
      const packageName = decodeURIComponent(name)
      const command = getUninstallCommand(packageManager, packageName)
      const operationId = runCommand(command, projectPath, 'remove', packageName)

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
  router.patch('/:name', (req: Request, res: Response) => {
    try {
      const { name } = req.params
      const { version } = req.body as UpdatePackageRequest

      const packageName = decodeURIComponent(name)
      const command = getUpdateCommand(packageManager, packageName, version)
      const operationId = runCommand(command, projectPath, 'update', packageName)

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

  // POST /api/packages/update-all - Update all packages
  router.post('/update-all', (_req: Request, res: Response) => {
    try {
      const command = getUpdateAllCommand(packageManager)
      const operationId = runCommand(command, projectPath, 'update')

      res.json({
        success: true,
        data: { operationId },
      })
    } catch (error) {
      console.error('Error updating all packages:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update all packages',
      })
    }
  })

  return router
}
