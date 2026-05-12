import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const isOperationLogOpen = ref(false)
  const selectedPackage = ref<string | null>(null)

  function openOperationLog() { isOperationLogOpen.value = true }
  function closeOperationLog() { isOperationLogOpen.value = false }
  function toggleOperationLog() { isOperationLogOpen.value = !isOperationLogOpen.value }
  function selectPackage(name: string | null) { selectedPackage.value = name }

  return {
    isOperationLogOpen,
    selectedPackage,
    openOperationLog,
    closeOperationLog,
    toggleOperationLog,
    selectPackage,
  }
})
