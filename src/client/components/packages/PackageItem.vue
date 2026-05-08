<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useVersionCompare } from '@/composables/useVersionCompare'
import type { Package } from '@shared/types'

const props = defineProps<{
  package: Package
}>()

const emit = defineEmits<{
  update: [name: string]
  remove: [name: string]
  select: [name: string]
}>()

const { badgeVariant, badgeText } = useVersionCompare(
  () => props.package.current,
  () => props.package.latest
)

const typeLabel = computed(() => {
  return props.package.type === 'devDependency' ? 'dev' : 'prod'
})
</script>

<template>
  <div
    class="flex items-center justify-between p-4 rounded-lg border bg-white hover:bg-accent/50 transition-colors cursor-pointer gap-3"
    @click="emit('select', package.name)"
  >
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="font-medium truncate">{{ package.name }}</span>
        <Badge variant="outline" class="text-xs shrink-0">{{ typeLabel }}</Badge>
      </div>
      <div class="flex items-center gap-2 mt-1 flex-wrap">
        <span class="text-sm text-muted-foreground">{{ package.current }}</span>
        <template v-if="package.hasUpdate">
          <span class="text-muted-foreground">→</span>
          <span class="text-sm font-medium">{{ package.latest }}</span>
          <Badge :variant="badgeVariant">{{ badgeText }}</Badge>
        </template>
      </div>
    </div>
    <div class="flex items-center gap-2 shrink-0" @click.stop>
      <Button
        v-if="package.hasUpdate"
        size="sm"
        variant="outline"
        @click="emit('update', package.name)"
      >
        Update
      </Button>
      <Button
        size="sm"
        variant="ghost"
        class="text-destructive hover:text-destructive"
        @click="emit('remove', package.name)"
      >
        Remove
      </Button>
    </div>
  </div>
</template>
