import { ref, computed, type Ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useApi } from './useApi'
import type { SmartPackageData } from '@shared/types'

export type PopularityFilter = 'all' | 'very-popular' | 'popular' | 'niche'
export type AgeFilter = 'all' | 'active' | 'recent' | 'stable' | 'stale'

export function normalizeLicense(license: string | null): string {
  if (!license) return 'Unknown'
  return license.replace(/^\(|\)$/g, '').trim()
}

function getAgeCategory(lastPublished: string | null): Exclude<AgeFilter, 'all'> {
  if (!lastPublished) return 'stale'
  const ageDays = (Date.now() - new Date(lastPublished).getTime()) / 86_400_000
  if (ageDays < 180) return 'active'
  if (ageDays < 365) return 'recent'
  if (ageDays < 730) return 'stable'
  return 'stale'
}

function getPopularityCategory(weeklyDownloads: number | null): Exclude<PopularityFilter, 'all'> {
  if (!weeklyDownloads) return 'niche'
  if (weeklyDownloads >= 1_000_000) return 'very-popular'
  if (weeklyDownloads >= 100_000) return 'popular'
  return 'niche'
}

export function useSmartFilters(_packages: Ref<unknown[]>) {
  const { get } = useApi()

  const enabled = ref(false)

  const { data: smartData, isLoading, isFetching } = useQuery({
    queryKey: ['packages', 'smart-data'],
    queryFn: () => get<SmartPackageData[]>('/packages/smart-data'),
    enabled,
    staleTime: 5 * 60 * 1000,
  })

  const selectedLicenses = ref<string[]>([])
  const popularityFilter = ref<PopularityFilter>('all')
  const ageFilter = ref<AgeFilter>('all')

  const smartDataMap = computed(() => {
    const map = new Map<string, SmartPackageData>()
    smartData.value?.forEach(d => map.set(d.name, d))
    return map
  })

  const availableLicenses = computed(() => {
    if (!smartData.value) return []
    const licenses = new Set<string>()
    smartData.value.forEach(d => licenses.add(normalizeLicense(d.license)))
    return [...licenses].sort()
  })

  // Returns null when no smart filters are active (skip filtering), otherwise a Set of passing names
  const filteredNames = computed((): Set<string> | null => {
    if (!smartData.value) return null

    const hasFilters = selectedLicenses.value.length > 0
      || popularityFilter.value !== 'all'
      || ageFilter.value !== 'all'

    if (!hasFilters) return null

    return new Set(
      smartData.value
        .filter(d => {
          if (selectedLicenses.value.length > 0) {
            if (!selectedLicenses.value.includes(normalizeLicense(d.license))) return false
          }
          if (popularityFilter.value !== 'all') {
            if (getPopularityCategory(d.weeklyDownloads) !== popularityFilter.value) return false
          }
          if (ageFilter.value !== 'all') {
            if (getAgeCategory(d.lastPublished) !== ageFilter.value) return false
          }
          return true
        })
        .map(d => d.name)
    )
  })

  const activeFilterCount = computed(() => {
    let count = 0
    if (selectedLicenses.value.length > 0) count++
    if (popularityFilter.value !== 'all') count++
    if (ageFilter.value !== 'all') count++
    return count
  })

  function loadSmartData() {
    enabled.value = true
  }

  function clearFilters() {
    selectedLicenses.value = []
    popularityFilter.value = 'all'
    ageFilter.value = 'all'
  }

  return {
    smartData,
    smartDataMap,
    isLoading: computed(() => isLoading.value || isFetching.value),
    hasData: computed(() => !!smartData.value),
    selectedLicenses,
    popularityFilter,
    ageFilter,
    availableLicenses,
    filteredNames,
    activeFilterCount,
    loadSmartData,
    clearFilters,
  }
}
