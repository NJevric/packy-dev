import { useQuery } from '@tanstack/vue-query'
import { useApi } from './useApi'
import type { ProjectInfo } from '@shared/types'

export function useProject() {
  const api = useApi()

  const project = useQuery({
    queryKey: ['project'],
    queryFn: () => api.get<ProjectInfo>('/project'),
    staleTime: Infinity, // Project info doesn't change during session
  })

  return project
}
