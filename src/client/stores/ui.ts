import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  // Dialog states
  const isAddPackageDialogOpen = ref(false)
  const isOperationLogOpen = ref(false)

  // Selected package for detail view
  const selectedPackage = ref<string | null>(null)

  // Actions
  function openAddPackageDialog() {
    isAddPackageDialogOpen.value = true
  }

  function closeAddPackageDialog() {
    isAddPackageDialogOpen.value = false
  }

  function openOperationLog() {
    isOperationLogOpen.value = true
  }

  function closeOperationLog() {
    isOperationLogOpen.value = false
  }

  function toggleOperationLog() {
    isOperationLogOpen.value = !isOperationLogOpen.value
  }

  function selectPackage(name: string | null) {
    selectedPackage.value = name
  }

  return {
    // State
    isAddPackageDialogOpen,
    isOperationLogOpen,
    selectedPackage,
    // Actions
    openAddPackageDialog,
    closeAddPackageDialog,
    openOperationLog,
    closeOperationLog,
    toggleOperationLog,
    selectPackage,
  }
})
