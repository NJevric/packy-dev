import { ref, computed, type Ref } from 'vue'
import type { Package } from '@shared/types'

export type FilterType = 'all' | 'outdated' | 'dependencies' | 'devDependencies'

export function useSearch(packages: Ref<Package[] | undefined>) {
  const query = ref('')
  const filter = ref<FilterType>('all')

  const filtered = computed(() => {
    if (!packages.value) return []

    return packages.value.filter((pkg) => {
      // Search filter
      if (query.value) {
        const searchLower = query.value.toLowerCase()
        if (!pkg.name.toLowerCase().includes(searchLower)) {
          return false
        }
      }

      // Type filter
      switch (filter.value) {
        case 'outdated':
          return pkg.hasUpdate
        case 'dependencies':
          return pkg.type === 'dependency'
        case 'devDependencies':
          return pkg.type === 'devDependency'
        default:
          return true
      }
    })
  })

  const counts = computed(() => {
    if (!packages.value) {
      return {
        total: 0,
        outdated: 0,
        dependencies: 0,
        devDependencies: 0,
      }
    }

    return {
      total: packages.value.length,
      outdated: packages.value.filter((p) => p.hasUpdate).length,
      dependencies: packages.value.filter((p) => p.type === 'dependency').length,
      devDependencies: packages.value.filter((p) => p.type === 'devDependency').length,
    }
  })

  function setQuery(value: string) {
    query.value = value
  }

  function setFilter(value: FilterType) {
    filter.value = value
  }

  function reset() {
    query.value = ''
    filter.value = 'all'
  }

  return {
    query,
    filter,
    filtered,
    counts,
    setQuery,
    setFilter,
    reset,
  }
}
