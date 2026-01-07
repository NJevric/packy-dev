<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  add: [payload: { name: string; version?: string; isDev: boolean }]
}>()

const packageName = ref('')
const packageVersion = ref('')
const isDev = ref(false)
const isSubmitting = ref(false)

watch(() => props.open, (open) => {
  if (!open) {
    // Reset form when dialog closes
    packageName.value = ''
    packageVersion.value = ''
    isDev.value = false
    isSubmitting.value = false
  }
})

function handleSubmit() {
  if (!packageName.value.trim()) return

  isSubmitting.value = true
  emit('add', {
    name: packageName.value.trim(),
    version: packageVersion.value.trim() || undefined,
    isDev: isDev.value,
  })
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Package</DialogTitle>
        <DialogDescription>
          Install a new npm package to your project.
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div class="space-y-2">
          <Label for="package-name">Package name</Label>
          <Input
            id="package-name"
            v-model="packageName"
            placeholder="e.g., lodash, @types/node"
            autofocus
          />
        </div>

        <div class="space-y-2">
          <Label for="package-version">Version (optional)</Label>
          <Input
            id="package-version"
            v-model="packageVersion"
            placeholder="e.g., ^4.0.0, latest"
          />
        </div>

        <div class="flex items-center gap-2">
          <Checkbox
            id="is-dev"
            :checked="isDev"
            @update:checked="isDev = $event as boolean"
          />
          <Label for="is-dev" class="cursor-pointer">
            Install as dev dependency
          </Label>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            @click="emit('update:open', false)"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            :disabled="!packageName.trim() || isSubmitting"
          >
            {{ isSubmitting ? 'Installing...' : 'Install' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
