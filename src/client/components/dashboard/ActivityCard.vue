<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useOperationsStore } from '@/stores/operations'
import { useAudit } from '@/composables/useAudit'
import { useApi } from '@/composables/useApi'
import type { Operation } from '@shared/types'

interface ActivityItem {
  id: string
  label: string
  actor: 'you' | 'system'
  timestamp: Date
  dotColor: string
}

const store = useOperationsStore()
const { auditLogs } = useAudit()
const api = useApi()

const operationHistory = useQuery({
  queryKey: ['operations', 'history'],
  queryFn: () => api.get<Operation[]>('/operations/history'),
  staleTime: 30 * 1000,
})

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

function getOperationLabel(op: Operation): string {
  switch (op.type) {
    case 'update': {
      if (!op.packageName) return 'Updated all packages'
      if (op.fromVersion && op.toVersion && op.fromVersion !== op.toVersion) {
        return `Updated ${op.packageName} from ${op.fromVersion} → ${op.toVersion}`
      }
      return `Updated ${op.packageName}`
    }
    case 'install':
      return op.packageName ? `Installed ${op.packageName}` : 'Installed packages'
    case 'remove':
      return op.packageName ? `Removed ${op.packageName}` : 'Removed packages'
    case 'audit':
      return 'Ran security audit'
    case 'audit-fix':
      return op.packageName ? `Fixed vulnerabilities in ${op.packageName}` : 'Applied security fixes'
    default:
      return op.command
  }
}

function getOperationDotColor(op: Operation): string {
  if (op.status === 'failed') return 'bg-destructive'
  switch (op.type) {
    case 'update': return 'bg-orange-500'
    case 'install': return 'bg-green-500'
    case 'remove': return 'bg-red-500'
    case 'audit': return 'bg-blue-500'
    case 'audit-fix': return 'bg-green-500'
    default: return 'bg-muted-foreground'
  }
}

function isUserInitiated(type: Operation['type']): boolean {
  return type === 'install' || type === 'update' || type === 'remove' || type === 'audit-fix'
}

function operationToItem(op: Operation, idPrefix: string): ActivityItem | null {
  const timestamp = op.completedAt ? new Date(op.completedAt) : null
  if (!timestamp) return null
  return {
    id: `${idPrefix}${op.id}`,
    label: getOperationLabel(op),
    actor: isUserInitiated(op.type) ? 'you' : 'system',
    timestamp,
    dotColor: getOperationDotColor(op),
  }
}

const activities = computed<ActivityItem[]>(() => {
  const seen = new Set<string>()
  const items: ActivityItem[] = []

  // In-memory operations from this session (highest priority — already deduped by id)
  for (const op of store.completedOperations) {
    const item = operationToItem(op, 'op-')
    if (!item) continue
    seen.add(op.id)
    items.push(item)
  }

  // Persisted operation history (skip any already shown from this session)
  for (const op of (operationHistory.data.value ?? [])) {
    if (seen.has(op.id)) continue
    const item = operationToItem(op, 'hist-')
    if (!item) continue
    items.push(item)
  }

  // Audit logs
  for (const log of (auditLogs.data.value ?? [])) {
    const total = log.vulnerabilitiesCount
    const parts: string[] = []
    const v = log.metadata.vulnerabilities
    if (v.critical) parts.push(`${v.critical} critical`)
    if (v.high) parts.push(`${v.high} high`)
    if (v.moderate) parts.push(`${v.moderate} moderate`)
    if (v.low) parts.push(`${v.low} low`)

    const suffix = parts.length ? ` — ${parts.join(', ')}` : ''
    const label = total === 0
      ? 'Audit found no vulnerabilities'
      : `Audit found ${total} ${total === 1 ? 'vulnerability' : 'vulnerabilities'}${suffix}`

    items.push({
      id: `audit-${log.id}`,
      label,
      actor: 'system',
      timestamp: new Date(log.timestamp),
      dotColor: total > 0 ? 'bg-orange-500' : 'bg-green-500',
    })
  }

  return items
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 8)
})
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <CardTitle class="text-base font-semibold">Activity</CardTitle>
        <span class="text-sm text-muted-foreground">
          {{ activities.length }} recent
        </span>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="activities.length === 0" class="py-8 text-center text-sm text-muted-foreground">
        No recent activity
      </div>
      <div v-else class="space-y-4">
        <div
          v-for="item in activities"
          :key="item.id"
          class="flex items-start gap-3"
        >
          <div class="mt-1.5 flex-shrink-0">
            <div :class="['h-2 w-2 rounded-full', item.dotColor]" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm leading-snug">{{ item.label }}</p>
            <p class="mt-0.5 text-xs text-muted-foreground">{{ item.actor }}</p>
          </div>
          <span class="flex-shrink-0 whitespace-nowrap text-xs text-muted-foreground">
            {{ formatTimeAgo(item.timestamp) }}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
