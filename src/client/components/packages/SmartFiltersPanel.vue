<script setup lang="ts">
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from 'radix-vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { PopularityFilter, AgeFilter } from '@/composables/useSmartFilters'

const props = defineProps<{
  availableLicenses: string[]
  isLoading: boolean
  hasData: boolean
  selectedLicenses: string[]
  popularityFilter: PopularityFilter
  ageFilter: AgeFilter
  activeFilterCount: number
}>()

const emit = defineEmits<{
  'update:selectedLicenses': [value: string[]]
  'update:popularityFilter': [value: PopularityFilter]
  'update:ageFilter': [value: AgeFilter]
  load: []
  clear: []
}>()

function toggleLicense(license: string) {
  const current = props.selectedLicenses
  emit(
    'update:selectedLicenses',
    current.includes(license) ? current.filter(l => l !== license) : [...current, license]
  )
}

const popularityOptions: { value: PopularityFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'very-popular', label: '>1M / wk' },
  { value: 'popular', label: '>100K / wk' },
  { value: 'niche', label: '<100K / wk' },
]

const ageOptions: { value: AgeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: '<6 months' },
  { value: 'recent', label: '6–12 months' },
  { value: 'stable', label: '1–2 years' },
  { value: 'stale', label: '>2 years' },
]

function onOpenChange(open: boolean) {
  if (open && !props.hasData && !props.isLoading) {
    emit('load')
  }
}
</script>

<template>
  <PopoverRoot @update:open="onOpenChange">
    <PopoverTrigger as-child>
      <Button
        size="sm"
        :variant="activeFilterCount > 0 ? 'default' : 'outline'"
        class="gap-1.5"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        ><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
        Smart Filters
        <Badge
          v-if="activeFilterCount > 0"
          variant="secondary"
          class="ml-0.5 h-4 min-w-4 px-1 text-[10px]"
        >
          {{ activeFilterCount }}
        </Badge>
      </Button>
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        :side-offset="8"
        align="end"
        class="z-50 w-80 rounded-xl border bg-card shadow-xl outline-none"
      >
        <div class="p-4 space-y-4">
          <!-- Loading -->
          <template v-if="isLoading">
            <div class="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="animate-spin"
              ><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              Fetching package metadata…
            </div>
          </template>

          <!-- No data yet -->
          <template v-else-if="!hasData">
            <div class="text-center py-4 space-y-3">
              <p class="text-sm text-muted-foreground">
                Load license, popularity, and age data from npm.
              </p>
              <Button
                size="sm"
                class="w-full"
                @click="emit('load')"
              >
                Load filter data
              </Button>
            </div>
          </template>

          <!-- Filters ready -->
          <template v-else>
            <!-- License -->
            <div
              v-if="availableLicenses.length > 0"
              class="space-y-2"
            >
              <p class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                License
              </p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="license in availableLicenses"
                  :key="license"
                  class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors"
                  :class="selectedLicenses.includes(license)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:bg-accent'"
                  @click="toggleLicense(license)"
                >
                  <svg
                    v-if="selectedLicenses.includes(license)"
                    xmlns="http://www.w3.org/2000/svg"
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ><polyline points="20 6 9 17 4 12" /></svg>
                  {{ license }}
                </button>
              </div>
            </div>

            <div class="border-t" />

            <!-- Popularity -->
            <div class="space-y-2">
              <p class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Popularity (weekly downloads)
              </p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="opt in popularityOptions"
                  :key="opt.value"
                  class="rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors"
                  :class="popularityFilter === opt.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:bg-accent'"
                  @click="emit('update:popularityFilter', opt.value)"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <div class="border-t" />

            <!-- Age -->
            <div class="space-y-2">
              <p class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Last Published
              </p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="opt in ageOptions"
                  :key="opt.value"
                  class="rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors"
                  :class="ageFilter === opt.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:bg-accent'"
                  @click="emit('update:ageFilter', opt.value)"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <!-- Clear -->
            <div
              v-if="activeFilterCount > 0"
              class="border-t pt-1"
            >
              <button
                class="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                @click="emit('clear')"
              >
                Clear all filters
              </button>
            </div>
          </template>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
