<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Users } from 'lucide-vue-next'
import { useActivity, formatTimeAgo, type ActivityType } from '@/composables/useActivity'

const PAGE_SIZE = 25

const { activities, isLoading } = useActivity()

const search = ref('')
const typeFilter = ref<ActivityType | 'all' | 'failed'>('all')
const actorFilter = ref<'all' | 'you' | 'system'>('all')
const currentPage = ref(1)

// ── Type badge styles ──────────────────────────────────────────────────────────
const TYPE_BADGE: Record<ActivityType, string> = {
  install: 'bg-green-500/10 text-green-700 dark:text-green-400',
  update: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  remove: 'bg-red-500/10 text-red-700 dark:text-red-400',
  audit: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  'audit-fix': 'bg-green-500/10 text-green-700 dark:text-green-400',
  'audit-log': 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  script: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
}

const TYPE_LABEL: Record<ActivityType, string> = {
  install: 'Install',
  update: 'Update',
  remove: 'Remove',
  audit: 'Audit',
  'audit-fix': 'Fix',
  'audit-log': 'Audit',
  script: 'Script',
}

// ── Stats ──────────────────────────────────────────────────────────────────────
const stats = computed(() => {
  const counts: Record<string, number> = {
    install: 0, update: 0, remove: 0, audit: 0, 'audit-fix': 0, 'audit-log': 0, failed: 0,
  }
  for (const a of activities.value) {
    counts[a.type] = (counts[a.type] ?? 0) + 1
    if (a.status === 'failed') counts.failed++
  }
  return counts
})

const failedByType = computed(() => {
  let install = 0, audit = 0
  for (const a of activities.value) {
    if (a.status !== 'failed') continue
    if (a.type === 'install' || a.type === 'update') install++
    if (a.type === 'audit' || a.type === 'audit-log' || a.type === 'audit-fix') audit++
  }
  return { install, audit }
})

const recentCount = computed(() => {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  return activities.value.filter(a => a.timestamp >= cutoff).length
})

const activitySpanDays = computed(() => {
  if (activities.value.length < 2) return 1
  const sorted = [...activities.value].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  const diff = sorted[sorted.length - 1].timestamp.getTime() - sorted[0].timestamp.getTime()
  return Math.max(1, Math.round(diff / 86400000))
})

const lastAuditAgo = computed(() => {
  const last = activities.value.find(a => a.type === 'audit' || a.type === 'audit-log')
  return last ? formatTimeAgo(last.timestamp) : null
})

// ── Sparklines ─────────────────────────────────────────────────────────────────
const SPARKLINE_DAYS = 7

const dailyStats = computed(() => {
  const result: { date: string; total: number; installUpdate: number; audit: number }[] = []
  const now = new Date()
  for (let i = SPARKLINE_DAYS - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    result.push({ date: d.toISOString().slice(0, 10), total: 0, installUpdate: 0, audit: 0 })
  }
  for (const a of activities.value) {
    const dateStr = a.timestamp.toISOString().slice(0, 10)
    const entry = result.find(r => r.date === dateStr)
    if (!entry) continue
    entry.total++
    if (a.type === 'install' || a.type === 'update') entry.installUpdate++
    if (a.type === 'audit' || a.type === 'audit-log' || a.type === 'audit-fix') entry.audit++
  }
  return result
})

function sparklinePath(counts: number[], w = 64, h = 28): string {
  if (counts.length < 2) return ''
  const max = Math.max(...counts, 1)
  const pts = counts.map((c, i) => {
    const x = (i / (counts.length - 1)) * w
    const y = h - (c / max) * (h - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return `M${pts.join(' L')}`
}

function sparklineArea(counts: number[], w = 64, h = 28): string {
  const line = sparklinePath(counts, w, h)
  if (!line) return ''
  return `${line} L${w},${h} L0,${h} Z`
}

const totalSparkline = computed(() => dailyStats.value.map(d => d.total))
const installUpdateSparkline = computed(() => dailyStats.value.map(d => d.installUpdate))
const auditSparkline = computed(() => dailyStats.value.map(d => d.audit))

// ── Filter options with counts ─────────────────────────────────────────────────
const TYPE_OPTIONS = computed(() => [
  { value: 'all' as const,       label: 'All',    count: activities.value.length },
  { value: 'install' as const,   label: 'Install', count: stats.value.install ?? 0 },
  { value: 'update' as const,    label: 'Update',  count: stats.value.update ?? 0 },
  { value: 'remove' as const,    label: 'Remove',  count: stats.value.remove ?? 0 },
  { value: 'audit' as const,     label: 'Audit',   count: (stats.value.audit ?? 0) + (stats.value['audit-log'] ?? 0) },
  { value: 'audit-fix' as const, label: 'Fix',     count: stats.value['audit-fix'] ?? 0 },
  { value: 'failed' as const,    label: 'Failed',  count: stats.value.failed ?? 0 },
])

// ── Filtering / pagination ─────────────────────────────────────────────────────
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return activities.value.filter(a => {
    if (typeFilter.value === 'failed' && a.status !== 'failed') return false
    if (typeFilter.value !== 'all' && typeFilter.value !== 'failed' && a.type !== typeFilter.value) return false
    if (actorFilter.value !== 'all' && a.actor !== actorFilter.value) return false
    if (q && !a.label.toLowerCase().includes(q)) return false
    return true
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))

const paginated = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

// ── Date grouping ──────────────────────────────────────────────────────────────
type DateGroup = { label: string; dayLabel: string; items: typeof paginated.value }

const grouped = computed<DateGroup[]>(() => {
  const groups: Map<string, DateGroup> = new Map()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)

  for (const item of paginated.value) {
    const d = new Date(item.timestamp.getFullYear(), item.timestamp.getMonth(), item.timestamp.getDate())
    let label: string
    let dayLabel: string
    if (d.getTime() === today.getTime()) {
      label = 'Today'
      dayLabel = 'TODAY'
    } else if (d.getTime() === yesterday.getTime()) {
      label = 'Yesterday'
      dayLabel = d.toLocaleDateString('en', { day: 'numeric', month: 'short' }).toUpperCase()
    } else {
      const dow = d.toLocaleDateString(undefined, { weekday: 'long' })
      label = d.getFullYear() !== now.getFullYear()
        ? d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
        : dow
      dayLabel = d.toLocaleDateString('en', { day: 'numeric', month: 'short' }).toUpperCase()
    }
    const key = d.getTime().toString()
    if (!groups.has(key)) groups.set(key, { label, dayLabel, items: [] })
    groups.get(key)!.items.push(item)
  }

  return Array.from(groups.values())
})

// ── Helpers ────────────────────────────────────────────────────────────────────
function parseLabelParts(label: string): { text: string; isVersion: boolean }[] {
  const parts: { text: string; isVersion: boolean }[] = []
  const regex = /(\d+\.\d+[\d.]*[-.\w]*)/g
  let last = 0
  let match
  while ((match = regex.exec(label)) !== null) {
    if (match.index > last) parts.push({ text: label.slice(last, match.index), isVersion: false })
    parts.push({ text: match[0], isVersion: true })
    last = regex.lastIndex
  }
  if (last < label.length) parts.push({ text: label.slice(last), isVersion: false })
  return parts
}

function setTypeFilter(v: ActivityType | 'all' | 'failed') {
  typeFilter.value = v
  currentPage.value = 1
}

function setActorFilter(v: 'all' | 'you' | 'system') {
  actorFilter.value = v
  currentPage.value = 1
}

function onSearch() { currentPage.value = 1 }
function prev() { if (currentPage.value > 1) currentPage.value-- }
function next() { if (currentPage.value < totalPages.value) currentPage.value++ }
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">
        Activity
      </h1>
      <p class="text-sm text-muted-foreground mt-1">
        Full history of operations and audit runs
      </p>
    </div>

    <!-- Stats cards -->
    <div
      v-if="!isLoading && activities.length > 0"
      class="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      <!-- Total events -->
      <div class="relative overflow-hidden rounded-xl border bg-card p-4 flex flex-col gap-0.5">
        <p class="text-xs text-muted-foreground">
          Total events
        </p>
        <div class="flex items-baseline gap-2 mt-1">
          <span class="text-3xl font-bold">{{ activities.length }}</span>
          <span
            v-if="recentCount"
            class="text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full px-1.5 py-0.5"
          >+{{ recentCount }}</span>
        </div>
        <p class="text-xs text-muted-foreground">
          last {{ activitySpanDays }} days
        </p>
        <div class="absolute bottom-3 right-3 text-blue-500 opacity-60">
          <svg
            width="64"
            height="28"
            viewBox="0 0 64 28"
            fill="none"
          >
            <path
              :d="sparklineArea(totalSparkline)"
              fill="currentColor"
              opacity="0.15"
            />
            <path
              :d="sparklinePath(totalSparkline)"
              stroke="currentColor"
              stroke-width="1.5"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>

      <!-- Installs / updates -->
      <div class="relative overflow-hidden rounded-xl border bg-card p-4 flex flex-col gap-0.5">
        <p class="text-xs text-muted-foreground">
          Installs / updates
        </p>
        <div class="flex items-baseline gap-2 mt-1">
          <span class="text-3xl font-bold">{{ (stats.install ?? 0) + (stats.update ?? 0) }}</span>
        </div>
        <p class="text-xs text-muted-foreground">
          {{ stats.install ?? 0 }} installs · {{ stats.update ?? 0 }} updates
        </p>
        <div class="absolute bottom-3 right-3 text-orange-500 opacity-60">
          <svg
            width="64"
            height="28"
            viewBox="0 0 64 28"
            fill="none"
          >
            <path
              :d="sparklineArea(installUpdateSparkline)"
              fill="currentColor"
              opacity="0.15"
            />
            <path
              :d="sparklinePath(installUpdateSparkline)"
              stroke="currentColor"
              stroke-width="1.5"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>

      <!-- Audit runs -->
      <div class="relative overflow-hidden rounded-xl border bg-card p-4 flex flex-col gap-0.5">
        <p class="text-xs text-muted-foreground">
          Audit runs
        </p>
        <div class="flex items-baseline gap-2 mt-1">
          <span class="text-3xl font-bold">{{ (stats.audit ?? 0) + (stats['audit-log'] ?? 0) }}</span>
        </div>
        <p class="text-xs text-muted-foreground">
          <template v-if="lastAuditAgo">
            last run · {{ lastAuditAgo }}
          </template>
          <template v-else>
            no audit runs yet
          </template>
        </p>
        <div class="absolute bottom-3 right-3 text-blue-400 opacity-60">
          <svg
            width="64"
            height="28"
            viewBox="0 0 64 28"
            fill="none"
          >
            <path
              :d="sparklineArea(auditSparkline)"
              fill="currentColor"
              opacity="0.15"
            />
            <path
              :d="sparklinePath(auditSparkline)"
              stroke="currentColor"
              stroke-width="1.5"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>

      <!-- Failed -->
      <div class="rounded-xl border bg-card p-4 flex flex-col gap-0.5">
        <p class="text-xs text-muted-foreground">
          Failed
        </p>
        <div class="flex items-baseline gap-2 mt-1">
          <span
            class="text-3xl font-bold"
            :class="(stats.failed ?? 0) > 0 ? 'text-destructive' : ''"
          >{{ stats.failed ?? 0 }}</span>
          <span
            v-if="(stats.failed ?? 0) === 0"
            class="inline-flex items-center gap-0.5 text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 rounded-full px-1.5 py-0.5"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
            ><path
              d="M5 2v6M2 6l3 3 3-3"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            /></svg>
            0
          </span>
        </div>
        <p class="text-xs text-muted-foreground">
          <template v-if="failedByType.install || failedByType.audit">
            {{ failedByType.install }} install · {{ failedByType.audit }} audit
          </template>
          <template v-else>
            no failures
          </template>
        </p>
      </div>
    </div>

    <!-- Skeleton stats -->
    <div
      v-else-if="isLoading"
      class="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      <div
        v-for="i in 4"
        :key="i"
        class="rounded-xl border bg-card p-4 space-y-2"
      >
        <Skeleton class="h-3 w-20" />
        <Skeleton class="h-8 w-12" />
        <Skeleton class="h-3 w-28" />
      </div>
    </div>

    <!-- Activity card -->
    <div class="rounded-xl border bg-card">
      <!-- Header + search + filters -->
      <div class="p-4 pb-0 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-base font-semibold">All activity</span>
          <span class="text-sm text-muted-foreground">
            {{ filtered.length }}{{ filtered.length !== activities.length ? ` of ${activities.length}` : '' }} events
          </span>
        </div>

        <div class="relative">
          <svg
            class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle
              cx="6.5"
              cy="6.5"
              r="4.5"
              stroke="currentColor"
              stroke-width="1.5"
            />
            <path
              d="M10.5 10.5L14 14"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
          <Input
            v-model="search"
            placeholder="Search activity by package, actor, or message..."
            class="h-8 text-sm pl-8"
            @input="onSearch"
          />
        </div>

        <!-- Filter pills -->
        <div class="flex flex-wrap items-center gap-1.5 pb-3 border-b">
          <button
            v-for="opt in TYPE_OPTIONS"
            :key="opt.value"
            class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors"
            :class="typeFilter === opt.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border bg-background text-muted-foreground hover:text-foreground'"
            @click="setTypeFilter(opt.value)"
          >
            {{ opt.label }}
            <span :class="typeFilter === opt.value ? 'opacity-70' : 'opacity-60'">{{ opt.count }}</span>
          </button>

          <div class="ml-auto flex items-center gap-1.5">
            <button
              class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors"
              :class="actorFilter === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border bg-background text-muted-foreground hover:text-foreground'"
              @click="setActorFilter('all')"
            >
              <Users class="h-3 w-3" />
              All actors
            </button>
            <button
              v-for="actor in (['you', 'system'] as const)"
              :key="actor"
              class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border capitalize transition-colors"
              :class="actorFilter === actor
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border bg-background text-muted-foreground hover:text-foreground'"
              @click="setActorFilter(actor)"
            >
              {{ actor }}
            </button>
          </div>
        </div>
      </div>

      <!-- List -->
      <div class="p-4 pt-3">
        <!-- Loading -->
        <div
          v-if="isLoading"
          class="space-y-6"
        >
          <div
            v-for="g in 2"
            :key="g"
            class="flex gap-6"
          >
            <div class="w-16 shrink-0 space-y-1 pt-1">
              <Skeleton class="h-2.5 w-10" />
              <Skeleton class="h-3 w-14" />
            </div>
            <div class="flex-1 space-y-4">
              <div
                v-for="i in 4"
                :key="i"
                class="flex items-start gap-3"
              >
                <Skeleton class="mt-1.5 h-2 w-2 rounded-full flex-shrink-0" />
                <div class="flex-1 space-y-1">
                  <Skeleton class="h-4 w-3/4" />
                  <Skeleton class="h-3 w-24" />
                </div>
                <Skeleton class="h-3 w-12" />
              </div>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div
          v-else-if="filtered.length === 0"
          class="py-12 text-center text-sm text-muted-foreground"
        >
          {{ activities.length === 0 ? 'No activity yet' : 'No results match your filters' }}
        </div>

        <!-- Grouped items — stacked on mobile, two-column on desktop -->
        <div
          v-else
          class="space-y-6"
        >
          <div
            v-for="group in grouped"
            :key="group.label"
            class="flex flex-col sm:flex-row sm:gap-8"
          >
            <!-- Date header -->
            <div class="sm:w-20 sm:shrink-0 sm:text-right sm:pt-0.5 mb-2 sm:mb-0 flex items-baseline gap-1.5 sm:block">
              <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 leading-none">
                {{ group.dayLabel }}
              </p>
              <p class="text-xs text-muted-foreground sm:mt-0.5">
                {{ group.label }}
              </p>
            </div>

            <!-- Items column -->
            <div class="flex-1 min-w-0 space-y-2.5">
              <div
                v-for="item in group.items"
                :key="item.id"
                class="flex items-start gap-2.5 rounded-md px-2 py-1.5 -mx-2 hover:bg-muted/40 transition-colors"
              >
                <div class="mt-[7px] flex-shrink-0">
                  <div :class="['h-2 w-2 rounded-full', item.dotColor]" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm leading-snug">
                    <template
                      v-for="(part, i) in parseLabelParts(item.label)"
                      :key="i"
                    >
                      <code
                        v-if="part.isVersion"
                        class="font-mono bg-muted rounded px-[3px] text-[11px]"
                      >{{ part.text }}</code>
                      <template v-else>
                        {{ part.text }}
                      </template>
                    </template>
                  </p>
                  <div class="mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span
                      class="inline-flex items-center rounded-md border px-1.5 py-px text-[10px] font-medium"
                      :class="TYPE_BADGE[item.type]"
                    >
                      {{ TYPE_LABEL[item.type] }}
                    </span>
                    <span class="text-xs text-muted-foreground">{{ item.actor }}</span>
                    <span
                      v-if="item.status === 'failed'"
                      class="text-[10px] font-medium text-destructive"
                    >· failed</span>
                  </div>
                </div>
                <span class="flex-shrink-0 whitespace-nowrap text-xs text-muted-foreground pt-0.5">
                  {{ formatTimeAgo(item.timestamp) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div
          v-if="totalPages > 1"
          class="mt-6 flex items-center justify-between border-t pt-4"
        >
          <span class="text-sm text-muted-foreground">Page {{ currentPage }} of {{ totalPages }}</span>
          <div class="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="currentPage === 1"
              @click="prev"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              :disabled="currentPage === totalPages"
              @click="next"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
