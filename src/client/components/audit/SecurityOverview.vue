<script setup lang="ts">
import { computed } from 'vue'
import OverviewCard from '@/components/dashboard/OverviewCard.vue'
import { ShieldAlert, AlertTriangle, AlertCircle, Info } from 'lucide-vue-next'
import type { AuditMetadata } from '@shared/types'

const props = defineProps<{
  metadata: AuditMetadata | null
  isLoading?: boolean
}>()

const totalVulnerabilities = computed(() => props.metadata?.vulnerabilities.total ?? 0)
const criticalCount = computed(() => props.metadata?.vulnerabilities.critical ?? 0)
const highCount = computed(() => props.metadata?.vulnerabilities.high ?? 0)
const moderateCount = computed(() => props.metadata?.vulnerabilities.moderate ?? 0)
const lowCount = computed(() => props.metadata?.vulnerabilities.low ?? 0)
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
    <OverviewCard title="Total Vulnerabilities" :value="totalVulnerabilities" :isLoading="isLoading">
      <template #icon>
        <ShieldAlert class="h-4 w-4 text-muted-foreground" />
      </template>
    </OverviewCard>

    <OverviewCard title="Critical" :value="criticalCount" :isLoading="isLoading">
      <template #icon>
        <AlertTriangle class="h-4 w-4 text-red-600" />
      </template>
    </OverviewCard>

    <OverviewCard title="High" :value="highCount" :isLoading="isLoading">
      <template #icon>
        <AlertTriangle class="h-4 w-4 text-orange-600" />
      </template>
    </OverviewCard>

    <OverviewCard title="Moderate" :value="moderateCount" :isLoading="isLoading">
      <template #icon>
        <AlertCircle class="h-4 w-4 text-yellow-600" />
      </template>
    </OverviewCard>

    <OverviewCard title="Low" :value="lowCount" :isLoading="isLoading">
      <template #icon>
        <Info class="h-4 w-4 text-blue-600" />
      </template>
    </OverviewCard>
  </div>
</template>
