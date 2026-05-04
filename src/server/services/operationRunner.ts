import { spawn, type ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import type { Operation, OperationEvent } from '@shared/types'

// Generate unique operation IDs
let operationCounter = 0
function generateOperationId(): string {
  return `op_${Date.now()}_${++operationCounter}`
}

// Store active operations
const activeOperations = new Map<string, Operation>()

// Event emitter for SSE
export const operationEvents = new EventEmitter()

/**
 * Runs a shell command and streams output via events
 */
export function runCommand(
  command: string,
  cwd: string,
  type: Operation['type'],
  packageName?: string
): string {
  const operationId = generateOperationId()

  const operation: Operation = {
    id: operationId,
    type,
    packageName,
    command,
    status: 'pending',
    startedAt: new Date(),
  }

  activeOperations.set(operationId, operation)

  // Start operation asynchronously
  setImmediate(() => {
    executeCommand(operationId, command, cwd)
  })

  return operationId
}

async function executeCommand(operationId: string, command: string, cwd: string): Promise<void> {
  const operation = activeOperations.get(operationId)
  if (!operation) return

  operation.status = 'running'

  // Emit start event
  const startEvent: OperationEvent = {
    type: 'start',
    operationId,
    command,
  }
  operationEvents.emit('event', startEvent)

  // Parse command into parts
  const parts = command.split(' ')
  const cmd = parts[0]
  const args = parts.slice(1)

  let childProcess: ChildProcess

  try {
    childProcess = spawn(cmd, args, {
      cwd,
      env: { ...process.env, FORCE_COLOR: '1' },
    })
  } catch (error) {
    const errorEvent: OperationEvent = {
      type: 'error',
      operationId,
      error: error instanceof Error ? error.message : 'Failed to spawn process',
    }
    operationEvents.emit('event', errorEvent)
    operation.status = 'failed'
    return
  }

  // Stream stdout
  childProcess.stdout?.on('data', (data: Buffer) => {
    const stdoutEvent: OperationEvent = {
      type: 'stdout',
      operationId,
      data: data.toString(),
    }
    operationEvents.emit('event', stdoutEvent)
  })

  // Stream stderr
  childProcess.stderr?.on('data', (data: Buffer) => {
    const stderrEvent: OperationEvent = {
      type: 'stderr',
      operationId,
      data: data.toString(),
    }
    operationEvents.emit('event', stderrEvent)
  })

  // Handle completion
  childProcess.on('close', (code) => {
    operation.status = code === 0 ? 'completed' : 'failed'
    operation.completedAt = new Date()
    operation.exitCode = code ?? 1

    const completeEvent: OperationEvent = {
      type: 'complete',
      operationId,
      exitCode: code ?? 1,
    }
    operationEvents.emit('event', completeEvent)

    // Clean up after a delay
    setTimeout(() => {
      activeOperations.delete(operationId)
    }, 60000) // Keep for 1 minute for status queries
  })

  // Handle errors
  childProcess.on('error', (error) => {
    operation.status = 'failed'
    operation.completedAt = new Date()

    const errorEvent: OperationEvent = {
      type: 'error',
      operationId,
      error: error.message,
    }
    operationEvents.emit('event', errorEvent)
  })
}

/**
 * Gets the current status of an operation
 */
export function getOperationStatus(operationId: string): Operation | undefined {
  return activeOperations.get(operationId)
}

/**
 * Gets all active operations
 */
export function getActiveOperations(): Operation[] {
  return Array.from(activeOperations.values())
}
