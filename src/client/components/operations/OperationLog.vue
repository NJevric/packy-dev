<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useOperationsStore } from '@/stores/operations'
import type { Operation } from '@shared/types'

const store = useOperationsStore()

const selectedOperationId = ref<string | null>(null)
const logContainer = ref<HTMLDivElement | null>(null)

const operations = computed(() => {
  return [...store.activeOperations, ...store.completedOperations.slice(0, 10)]
})

const selectedOperation = computed(() => {
  if (!selectedOperationId.value) return operations.value[0]
  return operations.value.find(op => op.id === selectedOperationId.value)
})

const logs = computed(() => {
  if (!selectedOperation.value) return []
  return store.getLogsForOperation(selectedOperation.value.id)
})

// Auto-scroll to bottom when new logs come in
watch(logs, async () => {
  await nextTick()
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  }
}, { deep: true })

// Auto-select first operation
watch(operations, (ops) => {
  if (ops.length > 0 && !selectedOperationId.value) {
    selectedOperationId.value = ops[0].id
  }
}, { immediate: true })

function getStatusBadge(status: Operation['status']) {
  switch (status) {
    case 'running':
      return { variant: 'default' as const, text: 'Running' }
    case 'completed':
      return { variant: 'success' as const, text: 'Completed' }
    case 'failed':
      return { variant: 'destructive' as const, text: 'Failed' }
    default:
      return { variant: 'secondary' as const, text: 'Pending' }
  }
}

function formatCommand(command: string): string {
  // Truncate long commands
  return command.length > 40 ? command.slice(0, 40) + '...' : command
}
</script>

<template>
  <Card class="h-full flex flex-col">
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <CardTitle class="text-lg">Operations</CardTitle>
        <Button
          v-if="store.completedOperations.length > 0"
          size="sm"
          variant="ghost"
          @click="store.clearCompletedOperations()"
        >
          Clear
        </Button>
      </div>
    </CardHeader>
    <CardContent class="flex-1 flex flex-col gap-4 overflow-hidden">
      <!-- Operation list -->
      <div v-if="operations.length === 0" class="text-center py-8 text-muted-foreground">
        No operations yet
      </div>
      <template v-else>
        <div class="flex gap-2 flex-wrap">
          <Button
            v-for="op in operations"
            :key="op.id"
            size="sm"
            :variant="selectedOperationId === op.id ? 'default' : 'outline'"
            class="text-xs"
            @click="selectedOperationId = op.id"
          >
            {{ formatCommand(op.command) }}
            <Badge :variant="getStatusBadge(op.status).variant" class="ml-1 text-xs">
              {{ getStatusBadge(op.status).text }}
            </Badge>
          </Button>
        </div>

        <!-- Log output -->
        <div
          ref="logContainer"
          class="flex-1 bg-muted rounded-lg p-4 font-mono text-sm overflow-auto"
        >
          <div v-if="selectedOperation" class="mb-2 text-muted-foreground">
            $ {{ selectedOperation.command }}
          </div>
          <div
            v-for="(log, index) in logs"
            :key="index"
            :class="[
              'whitespace-pre-wrap',
              log.stream === 'stderr' ? 'text-destructive' : ''
            ]"
          >{{ log.data }}</div>
          <div
            v-if="selectedOperation?.status === 'running'"
            class="animate-pulse text-muted-foreground"
          >
            Running...
          </div>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
