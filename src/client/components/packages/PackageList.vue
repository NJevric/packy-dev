<script setup lang="ts">
import { computed } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import PackageItem from './PackageItem.vue'
import { useSearch, type FilterType } from '@/composables/useSearch'
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

const filters: { value: FilterType; label: string; countKey: keyof typeof counts.value }[] = [
  { value: 'all', label: 'All', countKey: 'total' },
  { value: 'outdated', label: 'Outdated', countKey: 'outdated' },
  { value: 'dependencies', label: 'Dependencies', countKey: 'dependencies' },
  { value: 'devDependencies', label: 'Dev', countKey: 'devDependencies' },
]

const displayedPackages = computed(() =>
  props.limit ? filtered.value.slice(0, props.limit) : filtered.value
)

const hasMore = computed(() =>
  !!props.limit && props.packages.length > props.limit
)
</script>

<template>
  <div class="space-y-4">
    <!-- Search and filters (hidden in limited mode) -->
    <template v-if="!limit">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <Input
            :model-value="query"
            placeholder="Search packages..."
            @update:model-value="setQuery($event as string)"
          />
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Button
            v-for="f in filters"
            :key="f.value"
            size="sm"
            :variant="filter === f.value ? 'default' : 'outline'"
            @click="setFilter(f.value)"
          >
            {{ f.label }}
            <Badge variant="secondary" class="ml-1">
              {{ counts[f.countKey] }}
            </Badge>
          </Button>
        </div>
      </div>
    </template>

    <!-- Package list -->
    <div v-if="isLoading" class="space-y-3">
      <Skeleton v-for="i in (limit ?? 5)" :key="i" class="h-20 w-full" />
    </div>
    <div v-else-if="displayedPackages.length === 0" class="text-center py-12 text-muted-foreground">
      <template v-if="query">
        No packages found matching "{{ query }}"
      </template>
      <template v-else>
        No packages to display
      </template>
    </div>
    <div v-else class="space-y-2">
      <PackageItem
        v-for="pkg in displayedPackages"
        :key="pkg.name"
        :package="pkg"
        @update="emit('update', $event)"
        @update-version="(name, version) => emit('update-version', name, version)"
        @remove="emit('remove', $event)"
        @select="emit('select', $event)"
      />
      <div v-if="hasMore" class="pt-1">
        <Button variant="outline" class="w-full" @click="emit('viewAll')">
          View all {{ packages.length }} packages
        </Button>
      </div>
    </div>
  </div>
</template>
