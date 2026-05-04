<script setup lang="ts">
import { computed } from 'vue'
import type { AuditLogEntry } from '@shared/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, AlertTriangle, ShieldCheck } from 'lucide-vue-next'

interface Props {
  logs: AuditLogEntry[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})

const formattedLogs = computed(() => {
  return props.logs.map((log) => ({
    ...log,
    totalVulnerabilities: log.metadata.vulnerabilities.total,
    criticalCount: log.metadata.vulnerabilities.critical,
    highCount: log.metadata.vulnerabilities.high,
    moderateCount: log.metadata.vulnerabilities.moderate,
    lowCount: log.metadata.vulnerabilities.low,
    infoCount: log.metadata.vulnerabilities.info,
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

function getSeverityColor(severity: string): 'default' | 'destructive' | 'warning' | 'secondary' {
  switch (severity) {
    case 'critical':
      return 'destructive'
    case 'high':
      return 'destructive'
    case 'moderate':
      return 'warning'
    case 'low':
      return 'secondary'
    default:
      return 'secondary'
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Clock class="h-5 w-5" />
        Audit History
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="isLoading" class="text-center py-8 text-muted-foreground">
        Loading audit history...
      </div>

      <div v-else-if="formattedLogs.length === 0" class="text-center py-8 text-muted-foreground">
        <ShieldCheck class="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No audit history yet</p>
        <p class="text-sm">Run your first audit to see results here</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="log in formattedLogs.slice(0, 10)"
          :key="log.id"
          class="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <AlertTriangle
                v-if="log.totalVulnerabilities > 0"
                class="h-4 w-4 text-destructive"
              />
              <ShieldCheck v-else class="h-4 w-4 text-green-600" />
              <span class="font-medium">
                {{ log.totalVulnerabilities }} vulnerabilities found
              </span>
            </div>
            <span class="text-sm text-muted-foreground">
              {{ formatDate(log.timestamp) }}
            </span>
          </div>

          <div class="flex flex-wrap gap-2 mt-2">
            <Badge v-if="log.criticalCount > 0" :variant="getSeverityColor('critical')">
              Critical: {{ log.criticalCount }}
            </Badge>
            <Badge v-if="log.highCount > 0" :variant="getSeverityColor('high')">
              High: {{ log.highCount }}
            </Badge>
            <Badge v-if="log.moderateCount > 0" :variant="getSeverityColor('moderate')">
              Moderate: {{ log.moderateCount }}
            </Badge>
            <Badge v-if="log.lowCount > 0" variant="secondary">
              Low: {{ log.lowCount }}
            </Badge>
            <Badge v-if="log.infoCount > 0" variant="secondary">
              Info: {{ log.infoCount }}
            </Badge>
          </div>

          <div class="text-sm text-muted-foreground mt-2">
            <span>{{ log.metadata.totalDependencies }} total dependencies</span>
            <span class="mx-2">•</span>
            <span>{{ log.packageManager }}</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
