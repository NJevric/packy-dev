<script setup lang="ts">
import { computed } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import PackageItem from './PackageItem.vue'
import SmartFiltersPanel from './SmartFiltersPanel.vue'
import { useSearch, type FilterType } from '@/composables/useSearch'
import { useSmartFilters } from '@/composables/useSmartFilters'
import type { Package } from '@shared/types'

const props = defineProps<{
  packages: Package[]
  isLoading?: boolean
  limit?: number
}>()

const emit = defineEmits<{
  update: [name: string]
  'update-version': [name: string, version: string]
  remove: [name: string]
  select: [name: string]
  viewAll: []
}>()

const packagesRef = computed(() => props.packages)
const { query, filter, filtered, counts, setQuery, setFilter } = useSearch(packagesRef)

const {
  availableLicenses,
  isLoading: isSmartLoading,
  hasData: hasSmartData,
  selectedLicenses,
  popularityFilter,
  ageFilter,
  filteredNames,
  activeFilterCount,
  loadSmartData,
  clearFilters,
} = useSmartFilters(packagesRef)

const baseFilters: { value: FilterType; label: string; countKey: keyof typeof counts.value }[] = [
  { value: 'all', label: 'All', countKey: 'total' },
  { value: 'outdated', label: 'Outdated', countKey: 'outdated' },
  { value: 'dependencies', label: 'Dependencies', countKey: 'dependencies' },
  { value: 'devDependencies', label: 'Dev', countKey: 'devDependencies' },
]

const popularityLabels: Record<string, string> = {
  'very-popular': '>1M / wk',
  popular: '>100K / wk',
  niche: '<100K / wk',
}

const ageLabels: Record<string, string> = {
  active: '<6 months',
  recent: '6–12 months',
  stable: '1–2 years',
  stale: '>2 years',
}

// Tags to show below the controls row for active smart filters
const activeTags = computed(() => {
  const tags: { key: string; label: string; onRemove: () => void }[] = []
  for (const lic of selectedLicenses.value) {
    tags.push({ key: `lic:${lic}`, label: lic, onRemove: () => {
      selectedLicenses.value = selectedLicenses.value.filter(l => l !== lic)
    }})
  }
  if (popularityFilter.value !== 'all') {
    tags.push({ key: 'pop', label: popularityLabels[popularityFilter.value] ?? popularityFilter.value, onRemove: () => {
      popularityFilter.value = 'all'
    }})
  }
  if (ageFilter.value !== 'all') {
    tags.push({ key: 'age', label: ageLabels[ageFilter.value] ?? ageFilter.value, onRemove: () => {
      ageFilter.value = 'all'
    }})
  }
  return tags
})

const displayedPackages = computed(() => {
  let result = filtered.value
  if (filteredNames.value !== null) {
    result = result.filter(pkg => filteredNames.value!.has(pkg.name))
  }
  return props.limit ? result.slice(0, props.limit) : result
})

const hasMore = computed(() =>
  !!props.limit && props.packages.length > props.limit
)
</script>

<template>
  <div class="space-y-3">
    <!-- Search + filter controls (hidden in limited mode) -->
    <template v-if="!limit">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="flex-1">
          <Input
            :model-value="query"
            placeholder="Search packages..."
            @update:model-value="setQuery($event as string)"
          />
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Button
            v-for="f in baseFilters"
            :key="f.value"
            size="sm"
            :variant="filter === f.value ? 'default' : 'outline'"
            @click="setFilter(f.value)"
          >
            {{ f.label }}
            <Badge
              variant="secondary"
              class="ml-1"
            >
              {{ counts[f.countKey] }}
            </Badge>
          </Button>

          <SmartFiltersPanel
            :available-licenses="availableLicenses"
            :is-loading="isSmartLoading"
            :has-data="hasSmartData"
            :selected-licenses="selectedLicenses"
            :popularity-filter="popularityFilter"
            :age-filter="ageFilter"
            :active-filter-count="activeFilterCount"
            @update:selected-licenses="selectedLicenses = $event"
            @update:popularity-filter="popularityFilter = $event"
            @update:age-filter="ageFilter = $event"
            @load="loadSmartData"
            @clear="clearFilters"
          />
        </div>
      </div>

      <!-- Active smart filter tags -->
      <div
        v-if="activeTags.length > 0"
        class="flex flex-wrap items-center gap-1.5"
      >
        <span class="text-xs text-muted-foreground">Filtered by:</span>
        <button
          v-for="tag in activeTags"
          :key="tag.key"
          class="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
          @click="tag.onRemove()"
        >
          {{ tag.label }}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          ><line
            x1="18"
            y1="6"
            x2="6"
            y2="18"
          /><line
            x1="6"
            y1="6"
            x2="18"
            y2="18"
          /></svg>
        </button>
        <button
          class="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
          @click="clearFilters"
        >
          Clear all
        </button>
      </div>
    </template>

    <!-- Package list -->
    <div
      v-if="isLoading"
      class="space-y-3"
    >
      <Skeleton
        v-for="i in (limit ?? 5)"
        :key="i"
        class="h-20 w-full"
      />
    </div>
    <div
      v-else-if="displayedPackages.length === 0"
      class="text-center py-12 text-muted-foreground"
    >
      <template v-if="query">
        No packages found matching "{{ query }}"
      </template>
      <template v-else>
        No packages to display
      </template>
    </div>
    <div
      v-else
      class="space-y-2"
    >
      <PackageItem
        v-for="pkg in displayedPackages"
        :key="pkg.name"
        :package="pkg"
        @update="emit('update', $event)"
        @update-version="(name, version) => emit('update-version', name, version)"
        @remove="emit('remove', $event)"
        @select="emit('select', $event)"
      />
      <div
        v-if="hasMore"
        class="pt-1"
      >
        <Button
          variant="outline"
          class="w-full"
          @click="emit('viewAll')"
        >
          View all {{ packages.length }} packages
        </Button>
      </div>
    </div>
  </div>
</template>
