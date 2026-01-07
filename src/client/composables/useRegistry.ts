import { useQuery } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'
import { useApi } from './useApi'
import type { RegistryInfo } from '@shared/types'

export function useRegistry(packageName: MaybeRef<string | undefined>) {
  const api = useApi()

  const registry = useQuery({
    queryKey: ['registry', packageName],
    queryFn: () => {
      const name = unref(packageName)
      if (!name) throw new Error('No package name provided')
      return api.get<RegistryInfo>(`/registry/${encodeURIComponent(name)}`)
    },
    enabled: () => !!unref(packageName),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return registry
}

export function useRegistryBatch(packageNames: MaybeRef<string[]>) {
  const api = useApi()

  const queries = computed(() => {
    const names = unref(packageNames)
    return names.map((name) => ({
      queryKey: ['registry', name],
      queryFn: () => api.get<RegistryInfo>(`/registry/${encodeURIComponent(name)}`),
      staleTime: 5 * 60 * 1000,
    }))
  })

  return queries
}
