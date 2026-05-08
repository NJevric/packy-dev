<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import StatsBar from '@/components/dashboard/StatsBar.vue'
import PackageList from '@/components/packages/PackageList.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { useAudit } from '@/composables/useAudit'
import { useInstallSize } from '@/composables/useInstallSize'
import ActivityCard from '@/components/dashboard/ActivityCard.vue'
import OperationToast from '@/components/operations/OperationToast.vue'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { usePackages } from '@/composables/usePackages'
import { useProject } from '@/composables/useProject'
import { useOperations } from '@/composables/useOperations'
const router = useRouter()

const { packages, removePackage, updatePackage } = usePackages()
const { data: project, isLoading: isProjectLoading } = useProject()
const { auditResults, auditLogs } = useAudit()
const installSize = useInstallSize()

useOperations()

const packageList = computed(() => packages.data.value || [])
const isLoading = computed(() => packages.isLoading.value)

const isRemoveDialogOpen = ref(false)
const packageToRemove = ref<string>('')

function handleUpdatePackage(name: string) {
  updatePackage.mutate({ name })
}

function handleRemovePackage(name: string) {
  packageToRemove.value = name
  isRemoveDialogOpen.value = true
}

function confirmRemovePackage() {
  removePackage.mutate(packageToRemove.value)
}

function handleSelectPackage(name: string) {
  router.push({ name: 'package-detail', params: { name } })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <template v-if="isProjectLoading">
        <Skeleton class="h-8 w-36" />
        <Skeleton class="mt-2 h-4 w-56" />
      </template>
      <template v-else>
        <h1 class="text-3xl font-bold tracking-tight">{{ project?.name ?? 'Dashboard' }}</h1>
        <p class="text-sm text-muted-foreground mt-1 break-all">
          {{ project?.path }}
          <template v-if="project?.packageManager"> · {{ project.packageManager }}</template>
          <template v-if="project?.version"> · v{{ project.version }}</template>
        </p>
      </template>
    </div>
    <hr>
    <!-- Stats Bar -->
    <StatsBar
      :packages="packageList"
      :audit-report="auditResults.data.value"
      :audit-logs="auditLogs.data.value ?? []"
      :install-size="installSize.data.value"
      :is-loading="isLoading"
    />

    <!-- Main content grid -->
    <div class="grid gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2 space-y-4">
        <PackageList
          :packages="packageList"
          :is-loading="isLoading"
          :limit="7"
          @update="handleUpdatePackage"
          @remove="handleRemovePackage"
          @select="handleSelectPackage"
          @view-all="router.push({ name: 'dependencies' })"
        />
      </div>

      <div class="space-y-6">
        <ActivityCard />
      </div>
    </div>

    <!-- Dialogs -->
    <ConfirmDialog
      :open="isRemoveDialogOpen"
      @update:open="isRemoveDialogOpen = $event"
      title="Remove Package"
      :description="`Are you sure you want to remove ${packageToRemove}? This action cannot be undone.`"
      confirm-text="Remove"
      @confirm="confirmRemovePackage"
    />

    <OperationToast />
  </div>
</template>
