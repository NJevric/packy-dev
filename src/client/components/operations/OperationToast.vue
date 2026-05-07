<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Badge } from '@/components/ui/badge'
import { useOperationsStore } from '@/stores/operations'

const store = useOperationsStore()

const latestOperation = computed(() => {
  return store.activeOperations[0] || store.completedOperations[0]
})

const isCompleted = computed(() => {
  const op = latestOperation.value
  return op?.status === 'completed' || op?.status === 'failed'
})

const badgeVariant = computed(() => {
  const status = latestOperation.value?.status
  if (status === 'completed') return 'default'
  if (status === 'failed') return 'destructive'
  return 'secondary'
})

const label = computed(() => {
  const op = latestOperation.value
  if (!op) return 'Running operation'
  const name = op.packageName || 'package'
  if (op.type === 'remove') return `Removing ${name}`
  if (op.type === 'update') return `Updating ${name}`
  if (op.type === 'install') return `Installing ${name}`
  if (op.type === 'audit') return 'Running security audit'
  if (op.type === 'audit-fix') return op.packageName ? `Fixing ${name}` : 'Fixing all vulnerabilities'
  return name
})

const visible = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => store.hasActiveOperations,
  (active) => {
    if (active) {
      if (hideTimer) {
        clearTimeout(hideTimer)
        hideTimer = null
      }
      visible.value = true
    } else {
      hideTimer = setTimeout(() => {
        visible.value = false
        hideTimer = null
      }, 2500)
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible && latestOperation"
      class="operation-toast fixed bottom-6 right-6 z-[100] bg-card border rounded-lg shadow-lg p-4 w-80 max-w-[calc(100vw-3rem)]"
    >
      <div class="flex items-center gap-3">
        <div
          v-if="!isCompleted"
          class="shrink-0 animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"
        />
        <div
          v-else
          class="shrink-0 h-4 w-4 rounded-full flex items-center justify-center"
          :class="latestOperation.status === 'failed' ? 'bg-destructive' : 'bg-primary'"
        >
          <svg class="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
            <path
              v-if="latestOperation.status === 'completed'"
              d="M1.5 5L4 7.5L8.5 3"
              stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
            />
            <path
              v-else
              d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5"
              stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
            />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate">{{ label }}</div>
          <div class="text-xs text-muted-foreground truncate">
            {{ latestOperation.command }}
          </div>
        </div>
        <Badge :variant="badgeVariant" class="shrink-0">
          {{ latestOperation.status }}
        </Badge>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.operation-toast {
  animation: toast-slide-in 280ms ease-out;
}

@keyframes toast-slide-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
