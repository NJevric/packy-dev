<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { usePackageVersions } from '@/composables/useRegistry'

const props = defineProps<{
  open: boolean
  packageName: string
  currentVersion: string
  latestVersion: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [version: string]
}>()

const packageNameRef = computed(() => props.open ? props.packageName : undefined)
const { data: versions, isLoading } = usePackageVersions(packageNameRef)

const selected = ref<string>('')

function handleOpen(value: boolean) {
  if (!value) selected.value = ''
  emit('update:open', value)
}

function handleConfirm() {
  if (!selected.value) return
  emit('confirm', selected.value)
  handleOpen(false)
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpen">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Choose Version</DialogTitle>
        <DialogDescription>
          Select a version of <span class="font-medium text-foreground">{{ packageName }}</span> to install.
          Currently on <span class="font-mono">{{ currentVersion }}</span>.
        </DialogDescription>
      </DialogHeader>

      <div class="max-h-72 overflow-y-auto rounded-md border">
        <div v-if="isLoading" class="p-3 space-y-2">
          <Skeleton v-for="i in 6" :key="i" class="h-8 w-full" />
        </div>
        <div v-else-if="!versions?.length" class="p-4 text-center text-sm text-muted-foreground">
          No versions found
        </div>
        <button
          v-else
          v-for="version in versions"
          :key="version"
          class="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
          :class="selected === version ? 'bg-accent' : ''"
          @click="selected = version"
        >
          <span class="font-mono">{{ version }}</span>
          <div class="flex items-center gap-1.5 shrink-0">
            <Badge v-if="version === latestVersion" variant="secondary" class="text-xs">latest</Badge>
            <Badge v-if="version === currentVersion" variant="outline" class="text-xs">current</Badge>
          </div>
        </button>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleOpen(false)">Cancel</Button>
        <Button :disabled="!selected" @click="handleConfirm">
          Install {{ selected || '...' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
