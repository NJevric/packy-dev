import { useQuery, useMutation } from '@tanstack/vue-query'
import { useApi } from './useApi'
import type { ScriptDefinition } from '@shared/types'

export function useScripts() {
  const api = useApi()

  const scripts = useQuery({
    queryKey: ['scripts'],
    queryFn: () => api.get<ScriptDefinition[]>('/scripts'),
    staleTime: 60 * 1000,
  })

  const runScript = useMutation({
    mutationFn: (name: string) =>
      api.post<{ operationId: string }, Record<string, never>>(
        `/scripts/${encodeURIComponent(name)}/run`,
        {}
      ),
  })

  const stopScript = useMutation({
    mutationFn: ({ name, operationId }: { name: string; operationId: string }) =>
      api.post<{ killed: boolean }, { operationId: string }>(
        `/scripts/${encodeURIComponent(name)}/stop`,
        { operationId }
      ),
  })

  return { scripts, runScript, stopScript }
}
