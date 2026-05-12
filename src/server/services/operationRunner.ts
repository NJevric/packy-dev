import { spawn, type ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import type { Operation, OperationEvent } from '@shared/types'
import { addOperationLog } from './operationLogService.js'
import { getPackages } from './packageJson.js'

// Generate unique operation IDs
let operationCounter = 0
function generateOperationId(): string {
  return `op_${Date.now()}_${++operationCounter}`
}

// Store active operations
const activeOperations = new Map<string, Operation>()

// Store active child processes for kill support
const activeProcesses = new Map<string, ReturnType<typeof spawn>>()

// Event emitter for SSE
export const operationEvents = new EventEmitter()

/**
 * Runs a shell command and streams output via events
 */
export function runCommand(
  command: string,
  cwd: string,
  type: Operation['type'],
  packageName?: string,
  fromVersion?: string,
  scriptName?: string
): string {
  const operationId = generateOperationId()

  const operation: Operation = {
    id: operationId,
    type,
    packageName,
    scriptName,
    fromVersion,
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
    operationType: operation.type,
    packageName: operation.packageName,
    scriptName: operation.scriptName,
    fromVersion: operation.fromVersion,
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
    activeProcesses.set(operationId, childProcess)
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

    if (code === 0 && operation.type === 'update' && operation.packageName) {
      try {
        const pkg = getPackages(cwd).find((p) => p.name === operation.packageName)
        if (pkg) operation.toVersion = pkg.current
      } catch { /* ignore */ }
    }

    addOperationLog(cwd, { ...operation })

    const completeEvent: OperationEvent = {
      type: 'complete',
      operationId,
      exitCode: code ?? 1,
      fromVersion: operation.fromVersion,
      toVersion: operation.toVersion,
    }
    operationEvents.emit('event', completeEvent)

    activeProcesses.delete(operationId)

    // Clean up after a delay
    setTimeout(() => {
      activeOperations.delete(operationId)
    }, 60000) // Keep for 1 minute for status queries
  })

  // Handle errors
  childProcess.on('error', (error) => {
    operation.status = 'failed'
    operation.completedAt = new Date()
    activeProcesses.delete(operationId)

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

/**
 * Kills a running operation by its ID
 */
export function killOperation(operationId: string): boolean {
  const process = activeProcesses.get(operationId)
  if (!process) return false
  process.kill()
  return true
}
