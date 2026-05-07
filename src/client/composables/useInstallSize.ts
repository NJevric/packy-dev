import { useQuery } from '@tanstack/vue-query'
import { useApi } from './useApi'

export interface InstallSize {
  bytes: number
  fileCount: number
}

export function useInstallSize() {
  const api = useApi()

  return useQuery({
    queryKey: ['project', 'install-size'],
    queryFn: () => api.get<InstallSize | null>('/project/install-size'),
    staleTime: 5 * 60 * 1000,
  })
}
