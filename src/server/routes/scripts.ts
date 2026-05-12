import { Router, type Request, type Response } from 'express'
import { readPackageJson } from '../services/packageJson.js'
import { runCommand, killOperation, getOperationStatus } from '../services/operationRunner.js'
import type { ApiResponse, ScriptDefinition } from '@shared/types'

type ParamsDictionary = Record<string, string>

export function createScriptsRouter(projectPath: string): Router {
  const router = Router()

  // Map scriptName → operationId for currently running scripts
  const runningScripts = new Map<string, string>()

  // GET /api/scripts — list all scripts from package.json
  router.get('/', (_req: Request, res: Response) => {
    try {
      const pkg = readPackageJson(projectPath)
      const scripts: ScriptDefinition[] = Object.entries(pkg.scripts ?? {}).map(
        ([name, command]) => ({ name, command })
      )
      const response: ApiResponse<ScriptDefinition[]> = { success: true, data: scripts }
      res.json(response)
    } catch (error) {
      const response: ApiResponse<never> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read scripts',
      }
      res.status(500).json(response)
    }
  })

  // POST /api/scripts/:name/run — run a script
  router.post('/:name/run', (req: Request<ParamsDictionary>, res: Response) => {
    const name = req.params.name

    try {
      const pkg = readPackageJson(projectPath)
      const command = pkg.scripts?.[name]

      if (!command) {
        const response: ApiResponse<never> = { success: false, error: `Script "${name}" not found` }
        res.status(404).json(response)
        return
      }

      // Only one instance of each script at a time
      const existingOpId = runningScripts.get(name)
      if (existingOpId) {
        const op = getOperationStatus(existingOpId)
        if (op && (op.status === 'pending' || op.status === 'running')) {
          const response: ApiResponse<never> = {
            success: false,
            error: `Script "${name}" is already running`,
          }
          res.status(409).json(response)
          return
        }
      }

      const operationId = runCommand(
        `npm run ${name}`,
        projectPath,
        'script',
        undefined,
        undefined,
        name
      )

      runningScripts.set(name, operationId)

      const response: ApiResponse<{ operationId: string }> = {
        success: true,
        data: { operationId },
      }
      res.json(response)
    } catch (error) {
      const response: ApiResponse<never> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run script',
      }
      res.status(500).json(response)
    }
  })

  // POST /api/scripts/:name/stop — stop a running script
  router.post('/:name/stop', (req: Request<ParamsDictionary>, res: Response) => {
    const name = req.params.name
    const operationId = (req.body as { operationId?: string }).operationId ?? runningScripts.get(name)

    if (!operationId) {
      const response: ApiResponse<never> = {
        success: false,
        error: `No running instance found for script "${name}"`,
      }
      res.status(404).json(response)
      return
    }

    const killed = killOperation(operationId)
    runningScripts.delete(name)

    const response: ApiResponse<{ killed: boolean }> = { success: true, data: { killed } }
    res.json(response)
  })

  return router
}
