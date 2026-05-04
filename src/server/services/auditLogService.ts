import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { AuditLogEntry, FixLogEntry, AuditMetadata, PackageManager } from '@shared/types'

const LOGS_DIR = '.packy-logs'
const AUDIT_LOGS_FILE = 'audit-history.json'
const FIX_LOGS_FILE = 'fix-history.json'

/**
 * Ensures the logs directory exists
 */
function ensureLogsDirectory(projectPath: string): string {
  const logsPath = join(projectPath, LOGS_DIR)
  if (!existsSync(logsPath)) {
    mkdirSync(logsPath, { recursive: true })
  }
  return logsPath
}

/**
 * Reads audit log entries from file
 */
export function getAuditLogs(projectPath: string): AuditLogEntry[] {
  const logsPath = ensureLogsDirectory(projectPath)
  const filePath = join(logsPath, AUDIT_LOGS_FILE)

  if (!existsSync(filePath)) {
    return []
  }

  try {
    const content = readFileSync(filePath, 'utf-8')
    const logs = JSON.parse(content) as AuditLogEntry[]
    // Convert timestamp strings back to Date objects
    return logs.map((log) => ({
      ...log,
      timestamp: new Date(log.timestamp),
    }))
  } catch (error) {
    console.error('Error reading audit logs:', error)
    return []
  }
}

/**
 * Reads fix log entries from file
 */
export function getFixLogs(projectPath: string): FixLogEntry[] {
  const logsPath = ensureLogsDirectory(projectPath)
  const filePath = join(logsPath, FIX_LOGS_FILE)

  if (!existsSync(filePath)) {
    return []
  }

  try {
    const content = readFileSync(filePath, 'utf-8')
    const logs = JSON.parse(content) as FixLogEntry[]
    // Convert timestamp strings back to Date objects
    return logs.map((log) => ({
      ...log,
      timestamp: new Date(log.timestamp),
      completedAt: log.completedAt ? new Date(log.completedAt) : undefined,
    }))
  } catch (error) {
    console.error('Error reading fix logs:', error)
    return []
  }
}

/**
 * Adds an audit log entry
 */
export function addAuditLog(
  projectPath: string,
  metadata: AuditMetadata,
  vulnerabilitiesCount: number,
  packageManager: PackageManager
): AuditLogEntry {
  const logsPath = ensureLogsDirectory(projectPath)
  const filePath = join(logsPath, AUDIT_LOGS_FILE)

  const logs = getAuditLogs(projectPath)

  const newLog: AuditLogEntry = {
    id: generateId(),
    timestamp: new Date(),
    metadata,
    vulnerabilitiesCount,
    packageManager,
  }

  logs.unshift(newLog) // Add to beginning for chronological order (newest first)

  // Keep only last 100 entries
  const trimmedLogs = logs.slice(0, 100)

  try {
    writeFileSync(filePath, JSON.stringify(trimmedLogs, null, 2))
  } catch (error) {
    console.error('Error writing audit log:', error)
  }

  return newLog
}

/**
 * Adds a fix log entry
 */
export function addFixLog(
  projectPath: string,
  packageName: string | undefined,
  force: boolean,
  operationId: string
): FixLogEntry {
  const logsPath = ensureLogsDirectory(projectPath)
  const filePath = join(logsPath, FIX_LOGS_FILE)

  const logs = getFixLogs(projectPath)

  const newLog: FixLogEntry = {
    id: generateId(),
    timestamp: new Date(),
    packageName,
    force,
    operationId,
    status: 'pending',
  }

  logs.unshift(newLog)

  // Keep only last 100 entries
  const trimmedLogs = logs.slice(0, 100)

  try {
    writeFileSync(filePath, JSON.stringify(trimmedLogs, null, 2))
  } catch (error) {
    console.error('Error writing fix log:', error)
  }

  return newLog
}

/**
 * Updates a fix log entry status
 */
export function updateFixLogStatus(
  projectPath: string,
  logId: string,
  status: 'running' | 'completed' | 'failed',
  exitCode?: number,
  output?: string,
  error?: string
): void {
  const logsPath = ensureLogsDirectory(projectPath)
  const filePath = join(logsPath, FIX_LOGS_FILE)

  const logs = getFixLogs(projectPath)

  const logIndex = logs.findIndex((log) => log.id === logId)
  if (logIndex === -1) {
    console.error('Fix log not found:', logId)
    return
  }

  logs[logIndex].status = status
  if (exitCode !== undefined) {
    logs[logIndex].exitCode = exitCode
  }
  if (output) {
    logs[logIndex].output = output
  }
  if (error) {
    logs[logIndex].error = error
  }
  if (status === 'completed' || status === 'failed') {
    logs[logIndex].completedAt = new Date()
  }

  try {
    writeFileSync(filePath, JSON.stringify(logs, null, 2))
  } catch (error) {
    console.error('Error updating fix log:', error)
  }
}

/**
 * Finds a fix log by operation ID
 */
export function findFixLogByOperationId(
  projectPath: string,
  operationId: string
): FixLogEntry | undefined {
  const logs = getFixLogs(projectPath)
  return logs.find((log) => log.operationId === operationId)
}

/**
 * Generates a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
