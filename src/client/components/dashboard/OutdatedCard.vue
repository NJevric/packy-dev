<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useVersionCompare } from '@/composables/useVersionCompare'
import type { Package } from '@shared/types'

const props = defineProps<{
  packages: Package[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  update: [name: string]
}>()

const outdatedPackages = computed(() => {
  return props.packages.filter(p => p.hasUpdate).slice(0, 5)
})

const totalOutdated = computed(() => {
  return props.packages.filter(p => p.hasUpdate).length
})
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="text-base font-semibold">Outdated Packages</CardTitle>
          <CardDescription>
            {{ totalOutdated }} package{{ totalOutdated !== 1 ? 's' : '' }} can be updated
          </CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="isLoading" class="space-y-3">
        <Skeleton v-for="i in 3" :key="i" class="h-12 w-full" />
      </div>
      <div v-else-if="outdatedPackages.length === 0" class="text-center py-6 text-muted-foreground">
        All packages are up to date!
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="pkg in outdatedPackages"
          :key="pkg.name"
          class="flex items-center justify-between p-3 rounded-lg border"
        >
          <div class="space-y-1">
            <div class="font-medium">{{ pkg.name }}</div>
            <div class="text-sm text-muted-foreground">
              {{ pkg.current }} → {{ pkg.latest }}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <VersionBadge :current="pkg.current" :latest="pkg.latest" />
            <Button size="sm" variant="outline" @click="emit('update', pkg.name)">
              Update
            </Button>
          </div>
        </div>
        <div v-if="totalOutdated > 5" class="text-center text-sm text-muted-foreground pt-2">
          And {{ totalOutdated - 5 }} more...
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script lang="ts">
import { defineComponent, h } from 'vue'

const VersionBadge = defineComponent({
  props: {
    current: { type: String, required: true },
    latest: { type: String, required: true },
  },
  setup(props) {
    const { badgeVariant, badgeText } = useVersionCompare(
      () => props.current,
      () => props.latest
    )
    return () => h(Badge, { variant: badgeVariant.value }, () => badgeText.value)
  },
})
</script>
