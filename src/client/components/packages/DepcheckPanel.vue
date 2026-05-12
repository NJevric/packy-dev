<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDepcheck } from '@/composables/useDepcheck'

const emit = defineEmits<{
  remove: [name: string]
}>()

const { result, isLoading, error, run, refresh } = useDepcheck()

const unusedCount = computed(() => {
  if (!result.value) return 0
  return result.value.dependencies.length + result.value.devDependencies.length
})

const missingCount = computed(() => {
  if (!result.value) return 0
  return Object.keys(result.value.missing).length
})

const missingEntries = computed(() => {
  if (!result.value) return []
  return Object.entries(result.value.missing).map(([name, files]) => ({ name, files }))
})
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <CardTitle class="text-base">
          Unused Dependencies
        </CardTitle>
        <Button
          v-if="result"
          size="sm"
          variant="ghost"
          :disabled="isLoading"
          class="h-7 px-2 text-xs"
          @click="refresh"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="isLoading ? 'animate-spin' : ''"
          ><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
          Refresh
        </Button>
      </div>
    </CardHeader>

    <CardContent class="space-y-4">
      <!-- Initial state -->
      <template v-if="!result && !isLoading && !error">
        <p class="text-sm text-muted-foreground">
          Scan your project to detect packages that are declared in package.json but not used in your code.
        </p>
        <Button
          class="w-full"
          size="sm"
          @click="run"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="mr-1.5"
          ><circle
            cx="11"
            cy="11"
            r="8"
          /><path d="m21 21-4.3-4.3" /></svg>
          Run Analysis
        </Button>
      </template>

      <!-- Loading -->
      <template v-else-if="isLoading">
        <div class="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="animate-spin"
          ><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          Scanning project files...
        </div>
      </template>

      <!-- Error -->
      <template v-else-if="error">
        <p class="text-sm text-destructive">
          {{ error }}
        </p>
        <Button
          size="sm"
          variant="outline"
          class="w-full"
          @click="run"
        >
          Try Again
        </Button>
      </template>

      <!-- Results -->
      <template v-else-if="result">
        <!-- All clean -->
        <div
          v-if="unusedCount === 0 && missingCount === 0"
          class="text-center py-3"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="mx-auto mb-2 text-green-500"
          ><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          <p class="text-sm text-muted-foreground">
            No unused dependencies found.
          </p>
        </div>

        <template v-else>
          <!-- Unused production deps -->
          <div
            v-if="result.dependencies.length > 0"
            class="space-y-1.5"
          >
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Unused ({{ result.dependencies.length }})
            </p>
            <div
              v-for="name in result.dependencies"
              :key="name"
              class="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/50 group"
            >
              <span class="text-sm font-mono">{{ name }}</span>
              <Button
                size="sm"
                variant="ghost"
                class="h-6 px-2 text-xs text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                @click="emit('remove', name)"
              >
                Remove
              </Button>
            </div>
          </div>

          <!-- Unused dev deps -->
          <div
            v-if="result.devDependencies.length > 0"
            class="space-y-1.5"
          >
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Unused Dev ({{ result.devDependencies.length }})
            </p>
            <div
              v-for="name in result.devDependencies"
              :key="name"
              class="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/50 group"
            >
              <span class="text-sm font-mono">{{ name }}</span>
              <Button
                size="sm"
                variant="ghost"
                class="h-6 px-2 text-xs text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                @click="emit('remove', name)"
              >
                Remove
              </Button>
            </div>
          </div>

          <!-- Missing deps -->
          <div
            v-if="missingEntries.length > 0"
            class="space-y-1.5"
          >
            <p class="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
              Missing ({{ missingEntries.length }})
            </p>
            <div
              v-for="entry in missingEntries"
              :key="entry.name"
              class="py-1.5 px-2 rounded-md bg-amber-50 dark:bg-amber-950/20"
            >
              <span class="text-sm font-mono">{{ entry.name }}</span>
              <p class="text-xs text-muted-foreground mt-0.5 truncate">
                {{ entry.files[0] }}
                <span v-if="entry.files.length > 1">+{{ entry.files.length - 1 }} more</span>
              </p>
            </div>
          </div>
        </template>
      </template>
    </CardContent>
  </Card>
</template>
