<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { ProjectInfo } from '@shared/types'

defineProps<{
  project?: ProjectInfo
  isLoading?: boolean
}>()

function getPackageManagerLabel(pm: string): string {
  switch (pm) {
    case 'pnpm': return 'pnpm'
    case 'yarn': return 'Yarn'
    default: return 'npm'
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Project</CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="isLoading" class="space-y-3">
        <Skeleton class="h-6 w-32" />
        <Skeleton class="h-4 w-48" />
      </div>
      <div v-else-if="project" class="space-y-3">
        <div>
          <div class="text-xl font-bold">{{ project.name }}</div>
          <div class="text-sm text-muted-foreground">v{{ project.version }}</div>
        </div>
        <div class="flex items-center gap-2">
          <Badge variant="secondary">
            {{ getPackageManagerLabel(project.packageManager) }}
          </Badge>
        </div>
        <div class="text-xs text-muted-foreground truncate" :title="project.path">
          {{ project.path }}
        </div>
      </div>
    </CardContent>
  </Card>
</template>
