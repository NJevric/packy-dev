<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useVersionCompare } from '@/composables/useVersionCompare'
import VersionPickerDialog from './VersionPickerDialog.vue'
import type { Package } from '@shared/types'

const props = defineProps<{
  package: Package
}>()

const emit = defineEmits<{
  update: [name: string]
  'update-version': [name: string, version: string]
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

const isVersionPickerOpen = ref(false)
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
      <div class="flex items-center">
        <template v-if="package.hasUpdate">
          <Button
            size="sm"
            variant="outline"
            class="rounded-r-none border-r-0"
            @click="emit('update', package.name)"
          >
            Update
          </Button>
          <Button
            size="sm"
            variant="outline"
            class="rounded-l-none px-2"
            title="Choose version"
            @click="isVersionPickerOpen = true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </Button>
        </template>
        <Button
          v-else
          size="sm"
          variant="outline"
          @click="isVersionPickerOpen = true"
        >
          Choose version
        </Button>
      </div>
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

  <VersionPickerDialog
    :open="isVersionPickerOpen"
    :package-name="package.name"
    :current-version="package.current"
    :latest-version="package.latest"
    @update:open="isVersionPickerOpen = $event"
    @confirm="emit('update-version', package.name, $event)"
  />
</template>
