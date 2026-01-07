<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

defineProps<{
  title: string
  value: number | string
  description?: string
  isLoading?: boolean
}>()
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="text-sm font-medium">
        {{ title }}
      </CardTitle>
      <slot name="icon" />
    </CardHeader>
    <CardContent>
      <Skeleton v-if="isLoading" class="h-8 w-16" />
      <div v-else class="text-2xl font-bold">{{ value }}</div>
      <p v-if="description" class="text-xs text-muted-foreground">
        {{ description }}
      </p>
    </CardContent>
  </Card>
</template>
