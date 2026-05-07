import { Router, type Request, type Response } from 'express'
import { operationEvents, getOperationStatus, getActiveOperations } from '../services/operationRunner.js'
import { getOperationLogs } from '../services/operationLogService.js'
import type { OperationEvent } from '@shared/types'

export function createOperationsRouter(projectPath: string): Router {
  const router = Router()

  // GET /api/operations/stream - SSE endpoint for operation events
  router.get('/stream', (req: Request, res: Response) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)

    // Listen for operation events
    const eventHandler = (event: OperationEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`)
    }

    operationEvents.on('event', eventHandler)

    // Send heartbeat every 30 seconds to keep connection alive
    const heartbeat = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`)
    }, 30000)

    // Clean up on client disconnect
    req.on('close', () => {
      operationEvents.off('event', eventHandler)
      clearInterval(heartbeat)
    })
  })

  // GET /api/operations - Get all active operations
  router.get('/', (_req: Request, res: Response) => {
    const operations = getActiveOperations()
    res.json({
      success: true,
      data: operations,
    })
  })

  // GET /api/operations/history - Get persisted operation history
  router.get('/history', (_req: Request, res: Response) => {
    const logs = getOperationLogs(projectPath)
    res.json({
      success: true,
      data: logs,
    })
  })

  // GET /api/operations/:id - Get operation status
  router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params
    const operation = getOperationStatus(id)

    if (!operation) {
      res.status(404).json({
        success: false,
        error: 'Operation not found',
      })
      return
    }

    res.json({
      success: true,
      data: operation,
    })
  })

  return router
}
