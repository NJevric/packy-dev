<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FixLogEntry } from '@shared/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History, CheckCircle2, XCircle, Clock, Wrench, ChevronDown, ChevronRight } from 'lucide-vue-next'

const expandedLogs = ref<Set<string>>(new Set())

interface Props {
  logs: FixLogEntry[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})

const formattedLogs = computed(() => {
  return props.logs.map((log) => ({
    ...log,
  }))
})

function formatDate(date: Date | string): string {
  const dateObj = new Date(date)
  return dateObj.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
      return 'default'
    case 'failed':
      return 'destructive'
    case 'running':
      return 'secondary'
    default:
      return 'outline'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return CheckCircle2
    case 'failed':
      return XCircle
    case 'running':
      return Clock
    default:
      return Clock
  }
}

function toggleExpanded(logId: string) {
  if (expandedLogs.value.has(logId)) {
    expandedLogs.value.delete(logId)
  } else {
    expandedLogs.value.add(logId)
  }
}

function isExpanded(logId: string): boolean {
  return expandedLogs.value.has(logId)
}

function formatOutput(output: string | undefined): string {
  if (!output) return 'No output available'
  // Limit output to first 500 characters
  return output.length > 500 ? output.substring(0, 500) + '...' : output
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <History class="h-5 w-5" />
        Fix History
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div
        v-if="isLoading"
        class="text-center py-8 text-muted-foreground"
      >
        Loading fix history...
      </div>

      <div
        v-else-if="formattedLogs.length === 0"
        class="text-center py-8 text-muted-foreground"
      >
        <Wrench class="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No fix history yet</p>
        <p class="text-sm">
          Fix vulnerabilities to see results here
        </p>
      </div>

      <div
        v-else
        class="space-y-3"
      >
        <div
          v-for="log in formattedLogs.slice(0, 10)"
          :key="log.id"
          class="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <component
                :is="getStatusIcon(log.status)"
                class="h-4 w-4"
                :class="{
                  'text-green-600': log.status === 'completed',
                  'text-destructive': log.status === 'failed',
                  'text-muted-foreground': log.status === 'pending' || log.status === 'running',
                }"
              />
              <span class="font-medium">
                {{ log.packageName || 'All vulnerabilities' }}
              </span>
            </div>
            <Badge :variant="getStatusVariant(log.status)">
              {{ log.status }}
            </Badge>
          </div>

          <div class="flex flex-wrap gap-2 mt-2">
            <Badge
              v-if="log.force"
              variant="destructive"
            >
              Force update
            </Badge>
            <Badge
              v-if="log.exitCode !== undefined"
              variant="outline"
            >
              Exit code: {{ log.exitCode }}
            </Badge>
          </div>

          <div class="text-sm text-muted-foreground mt-2">
            <span>Started: {{ formatDate(log.timestamp) }}</span>
            <template v-if="log.completedAt">
              <span class="mx-2">•</span>
              <span>Completed: {{ formatDate(log.completedAt) }}</span>
            </template>
          </div>

          <!-- Show details button if there's output or error -->
          <div
            v-if="log.output || log.error"
            class="mt-3"
          >
            <button
              class="flex items-center gap-1 text-sm text-primary hover:underline"
              @click="toggleExpanded(log.id)"
            >
              <component
                :is="isExpanded(log.id) ? ChevronDown : ChevronRight"
                class="h-4 w-4"
              />
              {{ isExpanded(log.id) ? 'Hide' : 'Show' }} details
            </button>

            <!-- Expanded details section -->
            <div
              v-if="isExpanded(log.id)"
              class="mt-2 space-y-2"
            >
              <div
                v-if="log.output"
                class="p-3 bg-muted rounded-md"
              >
                <div class="text-xs font-medium text-muted-foreground mb-1">
                  Output:
                </div>
                <pre class="text-xs overflow-x-auto whitespace-pre-wrap">{{ formatOutput(log.output) }}</pre>
              </div>
              <div
                v-if="log.error"
                class="p-3 bg-destructive/10 rounded-md"
              >
                <div class="text-xs font-medium text-destructive mb-1">
                  Error:
                </div>
                <pre class="text-xs overflow-x-auto whitespace-pre-wrap text-destructive">{{ formatOutput(log.error) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
