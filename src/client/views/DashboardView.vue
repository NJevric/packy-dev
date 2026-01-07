<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import OverviewCard from '@/components/dashboard/OverviewCard.vue'
import OutdatedCard from '@/components/dashboard/OutdatedCard.vue'
import ProjectInfoCard from '@/components/dashboard/ProjectInfoCard.vue'
import PackageList from '@/components/packages/PackageList.vue'
import AddPackageDialog from '@/components/packages/AddPackageDialog.vue'
import OperationLog from '@/components/operations/OperationLog.vue'
import OperationToast from '@/components/operations/OperationToast.vue'
import { usePackages } from '@/composables/usePackages'
import { useProject } from '@/composables/useProject'
import { useOperations } from '@/composables/useOperations'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const uiStore = useUiStore()

const { packages, addPackage, removePackage, updatePackage, updateAllPackages } = usePackages()
const { data: project, isLoading: isProjectLoading } = useProject()

// Initialize SSE connection for operations
useOperations()

const packageList = computed(() => packages.data.value || [])
const isLoading = computed(() => packages.isLoading.value)

const stats = computed(() => {
  const list = packageList.value
  return {
    total: list.length,
    outdated: list.filter(p => p.hasUpdate).length,
    dependencies: list.filter(p => p.type === 'dependency').length,
    devDependencies: list.filter(p => p.type === 'devDependency').length,
  }
})

function handleAddPackage(payload: { name: string; version?: string; isDev: boolean }) {
  addPackage.mutate(payload)
}

function handleUpdatePackage(name: string) {
  updatePackage.mutate({ name })
}

function handleRemovePackage(name: string) {
  if (confirm(`Are you sure you want to remove ${name}?`)) {
    removePackage.mutate(name)
  }
}

function handleUpdateAll() {
  if (confirm(`Update all ${stats.value.outdated} outdated packages?`)) {
    updateAllPackages.mutate()
  }
}

function handleSelectPackage(name: string) {
  router.push({ name: 'package-detail', params: { name } })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p class="text-muted-foreground">
        Manage your project dependencies
      </p>
    </div>

    <!-- Overview Stats -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <ProjectInfoCard
        :project="project"
        :is-loading="isProjectLoading"
      />
      <OverviewCard
        title="Total Packages"
        :value="stats.total"
        :is-loading="isLoading"
      />
      <OverviewCard
        title="Outdated"
        :value="stats.outdated"
        :description="stats.outdated > 0 ? 'Updates available' : 'All up to date'"
        :is-loading="isLoading"
      />
      <OverviewCard
        title="Dependencies"
        :value="stats.dependencies"
        :is-loading="isLoading"
      />
      <OverviewCard
        title="Dev Dependencies"
        :value="stats.devDependencies"
        :is-loading="isLoading"
      />
    </div>

    <!-- Main content grid -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Package List - takes 2 columns -->
      <div class="lg:col-span-2 space-y-4">
        <PackageList
          :packages="packageList"
          :is-loading="isLoading"
          @add="uiStore.openAddPackageDialog()"
          @update="handleUpdatePackage"
          @remove="handleRemovePackage"
          @select="handleSelectPackage"
        />
      </div>

      <!-- Sidebar - takes 1 column -->
      <div class="space-y-6">
        <OutdatedCard
          :packages="packageList"
          :is-loading="isLoading"
          @update="handleUpdatePackage"
          @update-all="handleUpdateAll"
        />
        <OperationLog class="min-h-[300px]" />
      </div>
    </div>

    <!-- Dialogs -->
    <AddPackageDialog
      :open="uiStore.isAddPackageDialogOpen"
      @update:open="uiStore.isAddPackageDialogOpen = $event"
      @add="handleAddPackage"
    />

    <!-- Operation toast -->
    <OperationToast />
  </div>
</template>
