import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useOperationsStore } from '@/stores/operations'
import { useAudit } from '@/composables/useAudit'
import { useApi } from '@/composables/useApi'
import type { Operation } from '@shared/types'

export type ActivityType = Operation['type'] | 'audit-log'

export interface ActivityItem {
  id: string
  label: string
  actor: 'you' | 'system'
  timestamp: Date
  dotColor: string
  type: ActivityType
  status: 'completed' | 'failed'
}

export function formatTimeAgo(date: Date): string {
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
    type: op.type,
    status: op.status === 'failed' ? 'failed' : 'completed',
  }
}

export function useActivity() {
  const store = useOperationsStore()
  const { auditLogs } = useAudit()
  const api = useApi()

  const operationHistory = useQuery({
    queryKey: ['operations', 'history'],
    queryFn: () => api.get<Operation[]>('/operations/history'),
    staleTime: 30 * 1000,
  })

  const isLoading = computed(
    () => operationHistory.isLoading.value || auditLogs.isLoading.value,
  )

  const activities = computed<ActivityItem[]>(() => {
    const seen = new Set<string>()
    const items: ActivityItem[] = []

    for (const op of store.completedOperations) {
      const item = operationToItem(op, 'op-')
      if (!item) continue
      seen.add(op.id)
      items.push(item)
    }

    for (const op of (operationHistory.data.value ?? [])) {
      if (seen.has(op.id)) continue
      const item = operationToItem(op, 'hist-')
      if (!item) continue
      items.push(item)
    }

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
        type: 'audit-log',
        status: 'completed',
      })
    }

    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  })

  return { activities, isLoading }
}
