import { ref, onMounted, onUnmounted } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useOperationsStore } from '@/stores/operations'
import type { OperationEvent } from '@shared/types'

export function useOperations() {
  const store = useOperationsStore()
  const queryClient = useQueryClient()
  const isConnected = ref(false)
  let eventSource: EventSource | null = null

  function connect() {
    if (eventSource) {
      eventSource.close()
    }

    eventSource = new EventSource('/api/operations/stream')

    eventSource.onopen = () => {
      isConnected.value = true
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as OperationEvent | { type: 'connected' | 'heartbeat' }

        if (data.type === 'connected' || data.type === 'heartbeat') {
          return
        }

        store.handleEvent(data as OperationEvent)

        if (data.type === 'complete' || data.type === 'error') {
          queryClient.invalidateQueries({ queryKey: ['operations', 'history'] })
          queryClient.invalidateQueries({ queryKey: ['packages'] })
        }
      } catch (error) {
        console.error('Failed to parse SSE event:', error)
      }
    }

    eventSource.onerror = () => {
      isConnected.value = false
      // Try to reconnect after 3 seconds
      setTimeout(() => {
        if (!isConnected.value) {
          connect()
        }
      }, 3000)
    }
  }

  function disconnect() {
    if (eventSource) {
      eventSource.close()
      eventSource = null
      isConnected.value = false
    }
  }

  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected,
    activeOperations: store.activeOperations,
    completedOperations: store.completedOperations,
    logs: store.logs,
    getLogsForOperation: store.getLogsForOperation,
  }
}
