import { Router, type Request, type Response } from 'express'
import { detectPackageManager } from '../services/packageManager.js'
import { runCommand, getOperationStatus, operationEvents } from '../services/operationRunner.js'
import {
  parseAuditOutput,
  getCachedAuditResults,
  setCachedAuditResults,
  getAuditCommand,
  getAuditFixCommand,
  clearCache,
} from '../services/auditService.js'
import {
  addAuditLog,
  addFixLog,
  getAuditLogs,
  getFixLogs,
  updateFixLogStatus,
  findFixLogByOperationId,
} from '../services/auditLogService.js'
import type { AuditFixRequest, OperationEvent } from '@shared/types'
import { existsSync } from 'fs'
import { join } from 'path'

export function createAuditRouter(projectPath: string): Router {
  const router = Router()
  const packageManager = detectPackageManager(projectPath)

  // Store operation outputs for fix logs
  const operationOutputs = new Map<string, { stdout: string; stderr: string }>()

  // Listen to operation events to update fix logs
  operationEvents.on('event', (event: OperationEvent) => {
    if (event.type === 'start') {
      // Initialize output storage
      operationOutputs.set(event.operationId, { stdout: '', stderr: '' })

      // Find and update fix log to 'running' status
      const fixLog = findFixLogByOperationId(projectPath, event.operationId)
      if (fixLog) {
        updateFixLogStatus(projectPath, fixLog.id, 'running')
      }
    } else if (event.type === 'stdout') {
      // Accumulate stdout
      const output = operationOutputs.get(event.operationId)
      if (output) {
        output.stdout += event.data
      }
    } else if (event.type === 'stderr') {
      // Accumulate stderr
      const output = operationOutputs.get(event.operationId)
      if (output) {
        output.stderr += event.data
      }
    } else if (event.type === 'complete' || event.type === 'error') {
      // Update fix log with final status
      const fixLog = findFixLogByOperationId(projectPath, event.operationId)
      if (fixLog) {
        const output = operationOutputs.get(event.operationId)
        const status = event.type === 'complete' && event.exitCode === 0 ? 'completed' : 'failed'
        const exitCode = event.type === 'complete' ? event.exitCode : 1
        const outputText = output ? output.stdout : undefined
        const errorText = event.type === 'error' ? event.error : output?.stderr

        updateFixLogStatus(projectPath, fixLog.id, status, exitCode, outputText, errorText)

        // Clean up output storage
        operationOutputs.delete(event.operationId)
      }
    }
  })

  // GET /api/audit/run - Run audit and return summary
  router.get('/run', async (_req: Request, res: Response) => {
    try {
      // Verify package.json exists
      if (!existsSync(join(projectPath, 'package.json'))) {
        res.status(404).json({
          success: false,
          error: 'No package.json found in project',
        })
        return
      }

      const command = getAuditCommand(packageManager)
      const operationId = runCommand(command, projectPath, 'audit')

      // Wait for operation to complete and capture output
      let attempts = 0
      const maxAttempts = 30 // 30 seconds max wait

      const checkOperation = setInterval(async () => {
        attempts++
        const operation = getOperationStatus(operationId)

        if (!operation) {
          clearInterval(checkOperation)
          res.status(500).json({
            success: false,
            error: 'Operation not found',
          })
          return
        }

        if (operation.status === 'completed' || operation.status === 'failed' || attempts >= maxAttempts) {
          clearInterval(checkOperation)

          // Even if audit "fails" (non-zero exit), we can often still parse JSON
          // npm audit returns exit code 1 if vulnerabilities are found
          try {
            // Note: In a real implementation, we'd need to capture stdout from the operation
            // For now, we'll run the command again to get output synchronously
            const { spawn } = await import('child_process')
            const parts = command.split(' ')
            const cmd = parts[0]
            const args = parts.slice(1)

            const child = spawn(cmd, args, { cwd: projectPath, shell: true })
            let stdout = ''
            let stderr = ''

            child.stdout?.on('data', (data) => {
              stdout += data.toString()
            })

            child.stderr?.on('data', (data) => {
              stderr += data.toString()
            })

            child.on('close', (_code) => {
              try {
                const report = parseAuditOutput(stdout, packageManager)
                setCachedAuditResults(report)

                // Log the audit run
                addAuditLog(
                  projectPath,
                  report.metadata,
                  report.vulnerabilities.length,
                  packageManager
                )

                res.json({
                  success: true,
                  data: {
                    operationId,
                    summary: report.metadata,
                  },
                })
              } catch (error) {
                console.error('Error parsing audit output:', error)
                res.status(500).json({
                  success: false,
                  error: 'Failed to parse audit output',
                })
              }
            })
          } catch (error) {
            console.error('Error running audit:', error)
            res.status(500).json({
              success: false,
              error: 'Failed to run audit',
            })
          }
        }
      }, 1000)
    } catch (error) {
      console.error('Error starting audit:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to start audit',
      })
    }
  })

  // GET /api/audit/results - Get cached audit results
  router.get('/results', (_req: Request, res: Response) => {
    try {
      const results = getCachedAuditResults()

      if (!results) {
        // No cached results - return empty state (not an error)
        res.json({
          success: true,
          data: null,
        })
        return
      }

      res.json({
        success: true,
        data: results,
      })
    } catch (error) {
      console.error('Error getting audit results:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get audit results',
      })
    }
  })

  // POST /api/audit/fix - Fix vulnerabilities
  router.post('/fix', (req: Request, res: Response) => {
    try {
      const { force = false, packageName } = req.body as AuditFixRequest

      const command = getAuditFixCommand(packageManager, force, packageName)
      console.log('[AUDIT FIX] Running command:', command)
      console.log('[AUDIT FIX] Force:', force, 'Package:', packageName)

      const operationId = runCommand(command, projectPath, 'audit-fix', packageName)

      // Log the fix attempt
      addFixLog(projectPath, packageName, force, operationId)

      // Clear cache so next audit results fetch will be fresh
      clearCache()

      res.json({
        success: true,
        data: { operationId },
      })
    } catch (error) {
      console.error('Error fixing vulnerabilities:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fix vulnerabilities',
      })
    }
  })

  // GET /api/audit/logs - Get audit history
  router.get('/logs', (_req: Request, res: Response) => {
    try {
      const logs = getAuditLogs(projectPath)

      res.json({
        success: true,
        data: logs,
      })
    } catch (error) {
      console.error('Error getting audit logs:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get audit logs',
      })
    }
  })

  // GET /api/audit/fix-logs - Get fix history
  router.get('/fix-logs', (_req: Request, res: Response) => {
    try {
      const logs = getFixLogs(projectPath)

      res.json({
        success: true,
        data: logs,
      })
    } catch (error) {
      console.error('Error getting fix logs:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get fix logs',
      })
    }
  })

  return router
}
