import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { OperationEvent, OperationLogEntry } from '@shared/types'

interface ScriptRun {
  operationId: string
  scriptName: string
  startedAt: Date
  status: 'running' | 'completed' | 'failed'
  completedAt?: Date
  exitCode?: number
}

const MAX_RUNS_PER_SCRIPT = 5

export const useScriptsStore = defineStore('scripts', () => {
  // operationId → ScriptRun
  const runs = ref<Map<string, ScriptRun>>(new Map())
  // operationId → logs
  const logs = ref<Map<string, OperationLogEntry[]>>(new Map())
  // scriptName → operationId (current/latest)
  const activeRun = ref<Map<string, string>>(new Map())
  // ordered list of operationIds per scriptName (most recent last)
  const runHistory = ref<Map<string, string[]>>(new Map())

  const scriptOperationIds = computed(() => new Set(runs.value.keys()))

  function isRunning(scriptName: string): boolean {
    const opId = activeRun.value.get(scriptName)
    if (!opId) return false
    return runs.value.get(opId)?.status === 'running'
  }

  function getRunsForScript(scriptName: string): ScriptRun[] {
    const ids = runHistory.value.get(scriptName) ?? []
    return ids.map((id) => runs.value.get(id)).filter((r): r is ScriptRun => r !== undefined)
  }

  function getLogsForRun(operationId: string): OperationLogEntry[] {
    return logs.value.get(operationId) ?? []
  }

  function handleEvent(event: OperationEvent) {
    if (event.type === 'start') {
      if (event.operationType !== 'script') return
      const scriptName = event.scriptName ?? event.operationId

      const run: ScriptRun = {
        operationId: event.operationId,
        scriptName,
        startedAt: new Date(),
        status: 'running',
      }
      runs.value.set(event.operationId, run)
      logs.value.set(event.operationId, [])
      activeRun.value.set(scriptName, event.operationId)

      const history = runHistory.value.get(scriptName) ?? []
      history.push(event.operationId)
      if (history.length > MAX_RUNS_PER_SCRIPT) {
        const removed = history.splice(0, history.length - MAX_RUNS_PER_SCRIPT)
        for (const id of removed) {
          runs.value.delete(id)
          logs.value.delete(id)
        }
      }
      runHistory.value.set(scriptName, history)
      return
    }

    if (!scriptOperationIds.value.has(event.operationId)) return

    if (event.type === 'stdout' || event.type === 'stderr') {
      const runLogs = logs.value.get(event.operationId)
      if (runLogs) {
        runLogs.push({
          operationId: event.operationId,
          timestamp: new Date(),
          stream: event.type,
          data: event.data,
        })
      }
    } else if (event.type === 'complete') {
      const run = runs.value.get(event.operationId)
      if (run) {
        run.status = event.exitCode === 0 ? 'completed' : 'failed'
        run.completedAt = new Date()
        run.exitCode = event.exitCode
      }
    } else if (event.type === 'error') {
      const run = runs.value.get(event.operationId)
      if (run) {
        run.status = 'failed'
        run.completedAt = new Date()
      }
      const runLogs = logs.value.get(event.operationId)
      if (runLogs) {
        runLogs.push({
          operationId: event.operationId,
          timestamp: new Date(),
          stream: 'stderr',
          data: event.error,
        })
      }
    }
  }

  function clearRun(operationId: string) {
    const run = runs.value.get(operationId)
    if (!run) return
    logs.value.delete(operationId)
    runs.value.delete(operationId)
    const history = runHistory.value.get(run.scriptName)
    if (history) {
      const idx = history.indexOf(operationId)
      if (idx !== -1) history.splice(idx, 1)
    }
    if (activeRun.value.get(run.scriptName) === operationId) {
      activeRun.value.delete(run.scriptName)
    }
  }

  return {
    runs,
    logs,
    activeRun,
    runHistory,
    isRunning,
    getRunsForScript,
    getLogsForRun,
    handleEvent,
    clearRun,
  }
})
