import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  // Dialog states
  const isOperationLogOpen = ref(false)

  // Selected package for detail view
  const selectedPackage = ref<string | null>(null)

  // Actions
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
    isOperationLogOpen,
    selectedPackage,
    // Actions
    openOperationLog,
    closeOperationLog,
    toggleOperationLog,
    selectPackage,
  }
})
