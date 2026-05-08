<script setup lang="ts">
import { computed } from 'vue'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Package, AuditReport, AuditLogEntry } from '@shared/types'
import type { InstallSize } from '@/composables/useInstallSize'

const props = defineProps<{
  packages: Package[]
  auditReport?: AuditReport | null
  auditLogs?: AuditLogEntry[]
  installSize?: InstallSize | null
  isLoading?: boolean
}>()

// --- Total Packages ---
const total = computed(() => props.packages.length)
const prodCount = computed(() => props.packages.filter(p => p.type === 'dependency').length)
const devCount = computed(() => props.packages.filter(p => p.type === 'devDependency').length)

// --- Outdated ---
const outdatedPackages = computed(() => props.packages.filter(p => p.hasUpdate))
const outdatedCount = computed(() => outdatedPackages.value.length)

function parseSemver(v: string) {
  const clean = v.replace(/^[^\d]*/, '')
  const [major = 0, minor = 0, patch = 0] = clean.split('.').map(Number)
  return { major, minor, patch }
}

const outdatedBreakdown = computed(() => {
  let major = 0, minor = 0, patch = 0
  for (const pkg of outdatedPackages.value) {
    const curr = parseSemver(pkg.current)
    const latest = parseSemver(pkg.latest)
    if (latest.major > curr.major) major++
    else if (latest.minor > curr.minor) minor++
    else patch++
  }
  return { major, minor, patch }
})

// --- Vulnerabilities ---
const vulnMeta = computed(() => props.auditReport?.metadata.vulnerabilities)
const vulnTotal = computed(() => vulnMeta.value?.total ?? 0)

const vulnSeverities = computed(() => {
  const v = vulnMeta.value
  if (!v) return []
  return [
    { label: 'critical', count: v.critical, color: 'text-red-600' },
    { label: 'high',     count: v.high,     color: 'text-orange-500' },
    { label: 'moderate', count: v.moderate, color: 'text-yellow-600' },
    { label: 'low',      count: v.low,      color: 'text-blue-500' },
    { label: 'info',     count: v.info,     color: 'text-muted-foreground' },
  ].filter(s => s.count > 0)
})

// --- Last Audit ---
const lastLog = computed(() => {
  const logs = props.auditLogs
  return logs && logs.length > 0 ? logs[0] : null
})

const lastAuditTime = computed(() => {
  if (!lastLog.value) return null
  return formatRelativeTime(new Date(lastLog.value.timestamp))
})

const auditPassed = computed(() => {
  if (!lastLog.value) return null
  return lastLog.value.vulnerabilitiesCount === 0
})

// Sparkline from last 8 audit log entries (oldest → newest)
const sparklinePoints = computed(() => {
  const logs = [...(props.auditLogs ?? [])].reverse().slice(-8)
  if (logs.length < 2) return ''
  const values = logs.map(l => l.vulnerabilitiesCount)
  const max = Math.max(...values, 1)
  const w = 64, h = 28
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - (v / max) * h
    return `${x},${y}`
  })
  return pts.join(' ')
})

// --- Install Size ---
const installSizeFormatted = computed(() => {
  const b = props.installSize?.bytes
  if (b == null) return null
  if (b >= 1_073_741_824) return `${(b / 1_073_741_824).toFixed(1)} GB`
  if (b >= 1_048_576) return `${(b / 1_048_576).toFixed(0)} MB`
  if (b >= 1_024) return `${(b / 1_024).toFixed(0)} KB`
  return `${b} B`
})

const fileCountFormatted = computed(() => {
  const n = props.installSize?.fileCount
  if (n == null) return null
  return n.toLocaleString()
})

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
</script>

<template>
  <Card class="overflow-hidden">
    <div v-if="isLoading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-border">
      <div v-for="i in 5" :key="i" class="bg-card px-5 py-4 space-y-2">
        <Skeleton class="h-3 w-24" />
        <Skeleton class="h-8 w-12" />
        <Skeleton class="h-3 w-32" />
      </div>
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-border">
      <!-- Total Packages -->
      <div class="bg-card px-5 py-4">
        <div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Total Packages
        </div>
        <div class="text-3xl font-bold leading-none">{{ total }}</div>
        <div class="text-xs text-muted-foreground mt-2">
          {{ prodCount }} prod · {{ devCount }} dev
        </div>
      </div>

      <!-- Outdated -->
      <div class="bg-card px-5 py-4">
        <div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Outdated
        </div>
        <div class="text-3xl font-bold leading-none">{{ outdatedCount }}</div>
        <template v-if="outdatedCount > 0">
          <div class="flex h-1 rounded-full overflow-hidden mt-3 gap-px">
            <div
              class="bg-red-500 rounded-l-full transition-all"
              :style="{ width: `${(outdatedBreakdown.major / outdatedCount) * 100}%` }"
            />
            <div
              class="bg-orange-400 transition-all"
              :style="{ width: `${(outdatedBreakdown.minor / outdatedCount) * 100}%` }"
            />
            <div
              class="bg-blue-400 rounded-r-full transition-all"
              :style="{ width: `${(outdatedBreakdown.patch / outdatedCount) * 100}%` }"
            />
          </div>
          <div class="flex items-center gap-1 text-xs mt-2">
            <span class="text-red-500 font-medium">{{ outdatedBreakdown.major }} major</span>
            <span class="text-muted-foreground">·</span>
            <span class="text-orange-400 font-medium">{{ outdatedBreakdown.minor }} minor</span>
            <span class="text-muted-foreground">·</span>
            <span class="text-blue-400 font-medium">{{ outdatedBreakdown.patch }} patch</span>
          </div>
        </template>
        <div v-else class="text-xs text-muted-foreground mt-2">All up to date</div>
      </div>

      <!-- Vulnerabilities -->
      <div class="bg-card px-5 py-4">
        <div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Vulnerabilities
        </div>
        <div class="text-3xl font-bold leading-none">
          {{ auditReport !== undefined ? vulnTotal : '—' }}
        </div>
        <div class="text-xs mt-2">
          <template v-if="auditReport === null || auditReport === undefined">
            <span class="text-muted-foreground">No audit run yet</span>
          </template>
          <template v-else-if="vulnTotal === 0">
            <span class="text-muted-foreground">No vulnerabilities</span>
          </template>
          <template v-else>
            <span
              v-for="(s, i) in vulnSeverities"
              :key="s.label"
            >
              <span :class="s.color" class="font-medium">{{ s.count }} {{ s.label }}</span>
              <span v-if="i < vulnSeverities.length - 1" class="text-muted-foreground"> · </span>
            </span>
          </template>
        </div>
      </div>

      <!-- Install Size -->
      <div class="bg-card px-5 py-4">
        <div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Install Size
        </div>
        <template v-if="installSize">
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold leading-none">{{ installSizeFormatted }}</span>
            <span class="text-sm text-muted-foreground">node_modules</span>
          </div>
          <div class="text-xs text-muted-foreground mt-2">{{ fileCountFormatted }} files</div>
        </template>
        <template v-else>
          <div class="text-3xl font-bold leading-none">—</div>
          <div class="text-xs text-muted-foreground mt-2">not installed</div>
        </template>
      </div>

      <!-- Last Audit -->
      <div class="bg-card px-5 py-4">
        <div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Last Audit
        </div>
        <div class="flex items-center gap-3">
          <div class="text-3xl font-bold leading-none">{{ lastAuditTime ?? '—' }}</div>
          <svg
            v-if="sparklinePoints"
            width="64"
            height="28"
            viewBox="0 0 64 28"
            class="text-indigo-400 shrink-0"
          >
            <polyline
              :points="sparklinePoints"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <div class="text-xs text-muted-foreground mt-2">
          <template v-if="lastLog">
            {{ lastLog.packageManager }} audit ·
            <span :class="auditPassed ? 'text-green-600' : 'text-red-500'" class="font-medium">
              {{ auditPassed ? 'passed' : 'failed' }}
            </span>
          </template>
          <template v-else>
            No audit history
          </template>
        </div>
      </div>
    </div>
  </Card>
</template>
