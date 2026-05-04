<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAudit } from '@/composables/useAudit'
import SecurityOverview from '@/components/audit/SecurityOverview.vue'
import VulnerabilityList from '@/components/audit/VulnerabilityList.vue'
import VulnerabilityDetail from '@/components/audit/VulnerabilityDetail.vue'
import AuditHistory from '@/components/audit/AuditHistory.vue'
import FixHistory from '@/components/audit/FixHistory.vue'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'
import { RefreshCw, Wrench, ShieldAlert } from 'lucide-vue-next'
import type { Vulnerability } from '@shared/types'

const { auditResults, auditLogs, fixLogs, runAudit, fixAll, fixPackage } = useAudit()

const selectedVulnerability = ref<Vulnerability | null>(null)
const showDetailDialog = ref(false)
const showFixAllDialog = ref(false)

const vulnerabilities = computed(() => auditResults.data.value?.vulnerabilities ?? [])
const metadata = computed(() => auditResults.data.value?.metadata ?? null)
const lastRun = computed(() => auditResults.data.value?.lastRun ?? null)

const fixableCount = computed(() => {
  return vulnerabilities.value.filter(
    (v) => typeof v.fixAvailable === 'object' || v.fixAvailable === true
  ).length
})

const hasBreakingChanges = computed(() => {
  return vulnerabilities.value.some(
    (v) => typeof v.fixAvailable === 'object' && v.fixAvailable.isSemVerMajor
  )
})

function handleRunAudit() {
  runAudit.mutate()
}

function handleViewDetails(vulnerabilityId: string) {
  const vuln = vulnerabilities.value.find((v) => v.id === vulnerabilityId)
  if (vuln) {
    selectedVulnerability.value = vuln
    showDetailDialog.value = true
  }
}

function handleFixVulnerability(vulnerabilityId: string) {
  const vuln = vulnerabilities.value.find((v) => v.id === vulnerabilityId)
  if (!vuln) return

  const force = typeof vuln.fixAvailable === 'object' && vuln.fixAvailable.isSemVerMajor

  fixPackage.mutate(
    { packageName: vuln.name, force },
    {
      onSuccess: () => {
        showDetailDialog.value = false
      },
    }
  )
}

function handleFixAllConfirm() {
  const force = hasBreakingChanges.value

  fixAll.mutate(force, {
    onSuccess: () => {
      showFixAllDialog.value = false
    },
  })
}

function formatLastRun(date: Date | string | null): string {
  if (!date) return 'Never'

  const now = new Date()
  const lastRunDate = new Date(date)
  const diffMs = now.getTime() - lastRunDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins === 1) return '1 minute ago'
  if (diffMins < 60) return `${diffMins} minutes ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours === 1) return '1 hour ago'
  if (diffHours < 24) return `${diffHours} hours ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return '1 day ago'
  return `${diffDays} days ago`
}
</script>

<template>
  <div class="container mx-auto p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <div class="flex items-center gap-3">
          <ShieldAlert class="h-8 w-8 text-primary" />
          <h1 class="text-3xl font-bold">Security Audit</h1>
        </div>
        <p class="text-muted-foreground mt-2">
          Monitor and fix security vulnerabilities in your dependencies
        </p>
      </div>
    </div>

    <!-- Overview Stats -->
    <SecurityOverview :metadata="metadata" :isLoading="auditResults.isLoading.value" />

    <!-- Actions Bar -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
      <div class="flex gap-3">
        <Button
          @click="handleRunAudit"
          :disabled="runAudit.isPending.value"
          variant="default"
        >
          <RefreshCw :class="{ 'animate-spin': runAudit.isPending.value }" class="h-4 w-4 mr-2" />
          {{ runAudit.isPending.value ? 'Running Audit...' : 'Run Audit' }}
        </Button>
        <Button
          v-if="fixableCount > 0"
          @click="showFixAllDialog = true"
          :disabled="fixAll.isPending.value"
          variant="secondary"
        >
          <Wrench class="h-4 w-4 mr-2" />
          Fix All ({{ fixableCount }})
        </Button>
      </div>

      <div v-if="lastRun" class="text-sm text-muted-foreground">
        Last run: {{ formatLastRun(lastRun) }}
      </div>
    </div>

    <!-- Vulnerabilities List -->
    <VulnerabilityList
      :vulnerabilities="vulnerabilities"
      :isLoading="auditResults.isLoading.value"
      @fix="handleFixVulnerability"
      @view-details="handleViewDetails"
    />

    <!-- History Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      <AuditHistory
        :logs="auditLogs.data.value ?? []"
        :isLoading="auditLogs.isLoading.value"
      />
      <FixHistory
        :logs="fixLogs.data.value ?? []"
        :isLoading="fixLogs.isLoading.value"
      />
    </div>

    <!-- Vulnerability Detail Dialog -->
    <VulnerabilityDetail
      :vulnerability="selectedVulnerability"
      :open="showDetailDialog"
      @close="showDetailDialog = false"
      @fix="handleFixVulnerability(selectedVulnerability?.id ?? '')"
    />

    <!-- Fix All Confirmation Dialog -->
    <ConfirmDialog
      v-model:open="showFixAllDialog"
      title="Fix All Vulnerabilities?"
      :description="`This will attempt to fix ${fixableCount} fixable vulnerabilities.${
        hasBreakingChanges
          ? ' Some fixes may include breaking changes that require major version updates.'
          : ''
      } Do you want to continue?`"
      confirm-text="Fix All"
      variant="default"
      @confirm="handleFixAllConfirm"
    />
  </div>
</template>
