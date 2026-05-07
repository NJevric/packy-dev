import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { Operation } from '@shared/types'

const LOGS_DIR = '.packy-logs'
const OPERATION_LOGS_FILE = 'operation-history.json'

function ensureLogsDirectory(projectPath: string): string {
  const logsPath = join(projectPath, LOGS_DIR)
  if (!existsSync(logsPath)) {
    mkdirSync(logsPath, { recursive: true })
  }
  return logsPath
}

export function getOperationLogs(projectPath: string): Operation[] {
  const logsPath = ensureLogsDirectory(projectPath)
  const filePath = join(logsPath, OPERATION_LOGS_FILE)

  if (!existsSync(filePath)) return []

  try {
    const content = readFileSync(filePath, 'utf-8')
    const logs = JSON.parse(content) as Operation[]
    return logs.map((log) => ({
      ...log,
      startedAt: new Date(log.startedAt),
      completedAt: log.completedAt ? new Date(log.completedAt) : undefined,
    }))
  } catch {
    return []
  }
}

export function addOperationLog(projectPath: string, operation: Operation): void {
  const logsPath = ensureLogsDirectory(projectPath)
  const filePath = join(logsPath, OPERATION_LOGS_FILE)

  const logs = getOperationLogs(projectPath)
  logs.unshift(operation)

  try {
    writeFileSync(filePath, JSON.stringify(logs.slice(0, 100), null, 2))
  } catch (error) {
    console.error('Error writing operation log:', error)
  }
}
