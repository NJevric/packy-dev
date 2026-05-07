import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useApi } from './useApi'
import type { AuditReport, AuditFixRequest, AuditLogEntry, FixLogEntry } from '@shared/types'

export function useAudit() {
  const api = useApi()
  const queryClient = useQueryClient()

  // Query: Get cached audit results
  const auditResults = useQuery({
    queryKey: ['audit', 'results'],
    queryFn: () => api.get<AuditReport | null>('/audit/results'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })

  // Query: Get audit logs
  const auditLogs = useQuery({
    queryKey: ['audit', 'logs'],
    queryFn: () => api.get<AuditLogEntry[]>('/audit/logs'),
    staleTime: 60 * 1000, // 1 minute
  })

  // Query: Get fix logs
  const fixLogs = useQuery({
    queryKey: ['audit', 'fix-logs'],
    queryFn: () => api.get<FixLogEntry[]>('/audit/fix-logs'),
    staleTime: 60 * 1000, // 1 minute
  })

  // Mutation: Run audit
  const runAudit = useMutation({
    mutationFn: () =>
      api.post<{ operationId: string; summary: any }, Record<string, never>>('/audit/run', {}),
    onSuccess: () => {
      // Invalidate after a delay to let the audit finish
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['audit', 'results'] })
        queryClient.invalidateQueries({ queryKey: ['audit', 'logs'] })
      }, 3000)
    },
  })

  // Mutation: Fix all vulnerabilities
  const fixAll = useMutation({
    mutationFn: (force: boolean = false) =>
      api.post<{ operationId: string }, AuditFixRequest>('/audit/fix', { force }),
    onSuccess: async () => {
      // Wait for fix to complete
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Invalidate fix logs and packages
      queryClient.invalidateQueries({ queryKey: ['audit', 'fix-logs'] })
      queryClient.invalidateQueries({ queryKey: ['packages'] })

      // Automatically run a new audit to show updated status
      try {
        await api.post<{ operationId: string; summary: any }, Record<string, never>>('/audit/run', {})
        // Wait a bit for audit to complete
        await new Promise(resolve => setTimeout(resolve, 3000))
        queryClient.invalidateQueries({ queryKey: ['audit', 'results'] })
        queryClient.invalidateQueries({ queryKey: ['audit', 'logs'] })
      } catch (error) {
        console.error('Failed to run audit after fix:', error)
      }
    },
  })

  // Mutation: Fix specific package
  const fixPackage = useMutation({
    mutationFn: ({ packageName, force = false }: { packageName: string; force?: boolean }) =>
      api.post<{ operationId: string }, AuditFixRequest>('/audit/fix', {
        packageName,
        force,
      }),
    onSuccess: async () => {
      // Wait for fix to complete
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Invalidate fix logs and packages
      queryClient.invalidateQueries({ queryKey: ['audit', 'fix-logs'] })
      queryClient.invalidateQueries({ queryKey: ['packages'] })

      // Automatically run a new audit to show updated status
      try {
        await api.post<{ operationId: string; summary: any }, Record<string, never>>('/audit/run', {})
        // Wait a bit for audit to complete
        await new Promise(resolve => setTimeout(resolve, 3000))
        queryClient.invalidateQueries({ queryKey: ['audit', 'results'] })
        queryClient.invalidateQueries({ queryKey: ['audit', 'logs'] })
      } catch (error) {
        console.error('Failed to run audit after fix:', error)
      }
    },
  })

  // Refresh audit results
  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['audit', 'results'] })
  }

  return {
    auditResults,
    auditLogs,
    fixLogs,
    runAudit,
    fixAll,
    fixPackage,
    refresh,
  }
}
