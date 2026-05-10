<script setup lang="ts">
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

defineProps<{
  title: string
  value: number | string
  description?: string
  isLoading?: boolean
}>()
</script>

<template>
  <Card class="px-4 py-3">
    <div class="flex items-center justify-between">
      <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">{{ title }}</span>
      <slot name="icon" />
    </div>
    <Skeleton
      v-if="isLoading"
      class="mt-2 h-6 w-12"
    />
    <div
      v-else
      class="mt-1 text-2xl font-bold leading-none"
    >
      {{ value }}
    </div>
    <p
      v-if="description"
      class="mt-1 text-xs text-muted-foreground"
    >
      {{ description }}
    </p>
  </Card>
</template>
