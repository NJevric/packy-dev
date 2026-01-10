<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PackageList from '@/components/packages/PackageList.vue'
import AddPackageDialog from '@/components/packages/AddPackageDialog.vue'
import OperationToast from '@/components/operations/OperationToast.vue'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { usePackages } from '@/composables/usePackages'
import { useOperations } from '@/composables/useOperations'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const uiStore = useUiStore()

const { packages, addPackage, removePackage, updatePackage } = usePackages()

// Initialize SSE connection
useOperations()

const packageList = computed(() => packages.data.value || [])
const isLoading = computed(() => packages.isLoading.value)

// Confirm dialog state
const isRemoveDialogOpen = ref(false)
const packageToRemove = ref<string>('')

function handleAddPackage(payload: { name: string; version?: string; isDev: boolean }) {
  addPackage.mutate(payload)
}

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
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Dependencies</h1>
      <p class="text-muted-foreground">
        View and manage all project packages
      </p>
    </div>

    <PackageList
      :packages="packageList"
      :is-loading="isLoading"
      @add="uiStore.openAddPackageDialog()"
      @update="handleUpdatePackage"
      @remove="handleRemovePackage"
      @select="handleSelectPackage"
    />

    <AddPackageDialog
      :open="uiStore.isAddPackageDialogOpen"
      @update:open="uiStore.isAddPackageDialogOpen = $event"
      @add="handleAddPackage"
    />

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
