import { Router, type Request, type Response } from 'express'
import { detectPackageManager } from '../services/packageManager.js'
import { runCommand, operationEvents } from '../services/operationRunner.js'
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

  // POST /api/audit/run - Run audit and return summary
  router.post('/run', (_req: Request, res: Response) => {
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

      // Accumulate stdout from the operation event stream directly — no second spawn needed
      let stdout = ''
      let resolved = false

      const timeout = setTimeout(() => {
        if (resolved) return
        resolved = true
        operationEvents.off('event', onEvent)
        res.status(504).json({ success: false, error: 'Audit timed out after 30s' })
      }, 30000)

      const onEvent = (event: OperationEvent) => {
        if (event.operationId !== operationId) return

        if (event.type === 'stdout') {
          stdout += event.data
        } else if (event.type === 'complete' || event.type === 'error') {
          if (resolved) return
          resolved = true
          clearTimeout(timeout)
          operationEvents.off('event', onEvent)

          try {
            const report = parseAuditOutput(stdout, packageManager)
            setCachedAuditResults(report)
            addAuditLog(projectPath, report.metadata, report.vulnerabilities.length, packageManager)
            res.json({
              success: true,
              data: { operationId, summary: report.metadata },
            })
          } catch (error) {
            console.error('Error parsing audit output:', error)
            res.status(500).json({ success: false, error: 'Failed to parse audit output' })
          }
        }
      }

      operationEvents.on('event', onEvent)
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
      const { packageName } = req.body as AuditFixRequest
      const force = req.body.force === true

      if (packageName !== undefined && !/^[^\s]+$/.test(packageName)) {
        res.status(400).json({ success: false, error: 'Invalid package name' })
        return
      }

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
