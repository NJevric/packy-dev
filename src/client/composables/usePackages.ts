import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useApi } from './useApi'
import type { Package, AddPackageRequest, UpdatePackageRequest } from '@shared/types'

export function usePackages() {
  const api = useApi()
  const queryClient = useQueryClient()

  // Query: Get all packages
  const packages = useQuery({
    queryKey: ['packages'],
    queryFn: () => api.get<Package[]>('/packages'),
    staleTime: 30 * 1000, // 30 seconds
  })

  // Mutation: Add a package
  const addPackage = useMutation({
    mutationFn: (payload: AddPackageRequest) =>
      api.post<{ operationId: string }>('/packages', payload),
    onSuccess: () => {
      // Invalidate after a delay to let the install finish
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['packages'] })
      }, 2000)
    },
  })

  // Mutation: Remove a package
  const removePackage = useMutation({
    mutationFn: (name: string) =>
      api.delete<{ operationId: string }>(`/packages/${encodeURIComponent(name)}`),
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['packages'] })
      }, 2000)
    },
  })

  // Mutation: Update a package
  const updatePackage = useMutation({
    mutationFn: ({ name, version }: { name: string; version?: string }) =>
      api.patch<{ operationId: string }, UpdatePackageRequest>(
        `/packages/${encodeURIComponent(name)}`,
        { version }
      ),
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['packages'] })
      }, 2000)
    },
  })

  // Mutation: Update all packages
  const updateAllPackages = useMutation({
    mutationFn: () => api.post<{ operationId: string }>('/packages/update-all'),
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['packages'] })
      }, 5000)
    },
  })

  // Refresh packages list
  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['packages'] })
  }

  return {
    packages,
    addPackage,
    removePackage,
    updatePackage,
    updateAllPackages,
    refresh,
  }
}
