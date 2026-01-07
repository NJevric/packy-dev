import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Operation, OperationEvent, OperationLogEntry } from '@shared/types'

export const useOperationsStore = defineStore('operations', () => {
  // State
  const operations = ref<Map<string, Operation>>(new Map())
  const logs = ref<OperationLogEntry[]>([])

  // Getters
  const activeOperations = computed(() => {
    return Array.from(operations.value.values()).filter(
      (op) => op.status === 'pending' || op.status === 'running'
    )
  })

  const completedOperations = computed(() => {
    return Array.from(operations.value.values())
      .filter((op) => op.status === 'completed' || op.status === 'failed')
      .sort((a, b) => {
        const aTime = a.completedAt?.getTime() || 0
        const bTime = b.completedAt?.getTime() || 0
        return bTime - aTime
      })
  })

  const hasActiveOperations = computed(() => activeOperations.value.length > 0)

  // Actions
  function handleEvent(event: OperationEvent) {
    switch (event.type) {
      case 'start': {
        const operation: Operation = {
          id: event.operationId,
          type: 'install', // Will be updated when we have more context
          command: event.command,
          status: 'running',
          startedAt: new Date(),
        }
        operations.value.set(event.operationId, operation)
        break
      }

      case 'stdout':
      case 'stderr': {
        logs.value.push({
          operationId: event.operationId,
          timestamp: new Date(),
          stream: event.type,
          data: event.data,
        })
        break
      }

      case 'complete': {
        const operation = operations.value.get(event.operationId)
        if (operation) {
          operation.status = event.exitCode === 0 ? 'completed' : 'failed'
          operation.completedAt = new Date()
          operation.exitCode = event.exitCode
        }
        break
      }

      case 'error': {
        const operation = operations.value.get(event.operationId)
        if (operation) {
          operation.status = 'failed'
          operation.completedAt = new Date()
        }
        logs.value.push({
          operationId: event.operationId,
          timestamp: new Date(),
          stream: 'stderr',
          data: event.error,
        })
        break
      }
    }
  }

  function getLogsForOperation(operationId: string): OperationLogEntry[] {
    return logs.value.filter((log) => log.operationId === operationId)
  }

  function clearCompletedOperations() {
    for (const [id, op] of operations.value) {
      if (op.status === 'completed' || op.status === 'failed') {
        operations.value.delete(id)
      }
    }
  }

  function clearLogs() {
    logs.value = []
  }

  return {
    // State
    operations,
    logs,
    // Getters
    activeOperations,
    completedOperations,
    hasActiveOperations,
    // Actions
    handleEvent,
    getLogsForOperation,
    clearCompletedOperations,
    clearLogs,
  }
})
