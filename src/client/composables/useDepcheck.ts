import { ref } from 'vue'
import { useApi } from './useApi'
import type { DepcheckResult } from '@shared/types'

export function useDepcheck() {
  const { get } = useApi()

  const result = ref<DepcheckResult | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function run() {
    isLoading.value = true
    error.value = null
    try {
      result.value = await get<DepcheckResult>('/depcheck')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to run analysis'
    } finally {
      isLoading.value = false
    }
  }

  async function refresh() {
    isLoading.value = true
    error.value = null
    try {
      result.value = await get<DepcheckResult>('/depcheck/refresh')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to run analysis'
    } finally {
      isLoading.value = false
    }
  }

  return { result, isLoading, error, run, refresh }
}
