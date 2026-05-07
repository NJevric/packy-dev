<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PackageList from '@/components/packages/PackageList.vue'
import OutdatedCard from '@/components/dashboard/OutdatedCard.vue'
import OperationToast from '@/components/operations/OperationToast.vue'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { usePackages } from '@/composables/usePackages'
import { useOperations } from '@/composables/useOperations'
const router = useRouter()

const { packages, removePackage, updatePackage } = usePackages()

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
    
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Dependencies</h1>
      <p class="text-muted-foreground">
        View and manage all project packages
      </p>
    </div>

    <hr>
    
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
      <PackageList
        :packages="packageList"
        :is-loading="isLoading"
        @update="handleUpdatePackage"
        @remove="handleRemovePackage"
        @select="handleSelectPackage"
      />

      <OutdatedCard
        :packages="packageList"
        :is-loading="isLoading"
        @update="handleUpdatePackage"
      />
    </div>

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
