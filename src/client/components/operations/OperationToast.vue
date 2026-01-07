<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { useOperationsStore } from '@/stores/operations'

const store = useOperationsStore()

const latestOperation = computed(() => {
  return store.activeOperations[0] || store.completedOperations[0]
})

const isVisible = computed(() => {
  return store.hasActiveOperations
})
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    leave-active-class="transition-all duration-200 ease-in"
    enter-from-class="translate-y-full opacity-0"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="isVisible && latestOperation"
      class="fixed bottom-4 right-4 bg-card border rounded-lg shadow-lg p-4 max-w-sm"
    >
      <div class="flex items-center gap-3">
        <div class="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate">
            {{ latestOperation.packageName || 'Running operation' }}
          </div>
          <div class="text-xs text-muted-foreground truncate">
            {{ latestOperation.command }}
          </div>
        </div>
        <Badge variant="secondary">
          {{ latestOperation.status }}
        </Badge>
      </div>
    </div>
  </Transition>
</template>
