<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useScripts } from '@/composables/useScripts'
import { useScriptsStore } from '@/stores/scripts'
import { useOperations } from '@/composables/useOperations'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Square, Trash2, Terminal } from 'lucide-vue-next'
import type { ScriptDefinition } from '@shared/types'

const { scripts, runScript, stopScript } = useScripts()
const store = useScriptsStore()
useOperations()

const selectedScript = ref<string | null>(null)
const selectedRunId = ref<string | null>(null)
const outputEl = ref<HTMLElement | null>(null)

const scriptList = computed<ScriptDefinition[]>(() => scripts.data.value ?? [])
const isLoading = computed(() => scripts.isLoading.value)

// Select first script on load
watch(scriptList, (list) => {
  if (!selectedScript.value && list.length > 0) {
    selectedScript.value = list[0].name
  }
}, { immediate: true })

// Auto-select the latest run when script changes
watch(selectedScript, (name) => {
  if (!name) return
  const runs = store.getRunsForScript(name)
  selectedRunId.value = runs.length > 0 ? runs[runs.length - 1].operationId : null
})

const currentRuns = computed(() => {
  if (!selectedScript.value) return []
  return store.getRunsForScript(selectedScript.value)
})

const currentLogs = computed(() => {
  if (!selectedRunId.value) return []
  return store.getLogsForRun(selectedRunId.value)
})

const currentRun = computed(() => {
  if (!selectedRunId.value) return null
  return store.runs.get(selectedRunId.value) ?? null
})

// Scroll terminal to bottom when new logs arrive
watch(currentLogs, () => {
  nextTick(() => {
    if (outputEl.value) {
      outputEl.value.scrollTop = outputEl.value.scrollHeight
    }
  })
}, { deep: true })

function selectScript(name: string) {
  selectedScript.value = name
}

function selectRun(operationId: string) {
  selectedRunId.value = operationId
}

async function handleRun(name: string) {
  const result = await runScript.mutateAsync(name)
  selectedScript.value = name
  selectedRunId.value = result.operationId
}

function handleStop(name: string) {
  const opId = store.activeRun.get(name)
  if (!opId) return
  stopScript.mutate({ name, operationId: opId })
}

function handleClear(operationId: string) {
  store.clearRun(operationId)
  if (selectedRunId.value === operationId) {
    const runs = selectedScript.value ? store.getRunsForScript(selectedScript.value) : []
    selectedRunId.value = runs.length > 0 ? runs[runs.length - 1].operationId : null
  }
}

function stripAnsi(text: string): string {
   
  return text.replace(/\x1B\[[0-9;]*[mGKHF]/g, '')
}

function formatRunLabel(operationId: string, idx: number): string {
  const run = store.runs.get(operationId)
  if (!run) return `Run ${idx + 1}`
  const time = run.startedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return `Run ${idx + 1} · ${time}`
}

function runStatusClass(operationId: string): string {
  const run = store.runs.get(operationId)
  if (!run) return ''
  if (run.status === 'running') return 'text-blue-600'
  if (run.status === 'completed') return 'text-green-600'
  if (run.status === 'failed') return 'text-red-600'
  return ''
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-2">
      <Terminal class="h-5 w-5 text-muted-foreground" />
      <h1 class="text-xl font-semibold">
        Scripts
      </h1>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 min-h-[500px]">
      <!-- Script list -->
      <Card class="flex flex-col max-h-[90vh]">
        <CardHeader class="pb-3 flex-shrink-0">
          <CardTitle class="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            package.json scripts
          </CardTitle>
        </CardHeader>
        <CardContent class="p-0 overflow-y-auto">
          <div
            v-if="isLoading"
            class="space-y-2 px-4 pb-4"
          >
            <Skeleton
              v-for="i in 4"
              :key="i"
              class="h-10 w-full"
            />
          </div>

          <div
            v-else-if="scriptList.length === 0"
            class="px-4 pb-4 text-sm text-muted-foreground"
          >
            No scripts found in package.json
          </div>

          <ul
            v-else
            class="divide-y"
          >
            <li
              v-for="script in scriptList"
              :key="script.name"
              class="cursor-pointer"
              @click="selectScript(script.name)"
            >
              <div
                class="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                :class="selectedScript === script.name ? 'bg-muted' : ''"
              >
                <div class="min-w-0 flex-1">
                  <p
                    class="text-sm font-medium truncate"
                    :title="script.name"
                  >
                    {{ script.name }}
                  </p>
                  <p
                    class="text-xs text-muted-foreground mt-0.5 break-all"
                  >
                    {{ script.command }}
                  </p>
                </div>
                <div class="ml-2 flex-shrink-0">
                  <div
                    v-if="store.isRunning(script.name)"
                    class="h-2 w-2 rounded-full bg-blue-500 animate-pulse"
                  />
                </div>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      <!-- Terminal pane -->
      <Card class="flex flex-col max-h-[90vh]">
        <CardHeader class="pb-0 flex-shrink-0">
          <div class="flex items-center justify-between">
            <CardTitle class="text-sm">
              <span
                v-if="selectedScript"
                class="font-mono"
              >{{ selectedScript }}</span>
              <span
                v-else
                class="text-muted-foreground"
              >Select a script</span>
            </CardTitle>
            <div class="flex items-center gap-2">
              <Button
                v-if="selectedScript && store.isRunning(selectedScript)"
                size="sm"
                variant="outline"
                class="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                :disabled="stopScript.isPending.value"
                @click="handleStop(selectedScript)"
              >
                <Square class="h-3 w-3 mr-1" />
                Stop
              </Button>
              <Button
                v-else-if="selectedScript"
                size="sm"
                class="h-7 text-xs"
                :disabled="runScript.isPending.value"
                @click="handleRun(selectedScript)"
              >
                <Play class="h-3 w-3 mr-1" />
                Run
              </Button>
            </div>
          </div>

          <!-- Run tabs -->
          <div
            v-if="currentRuns.length > 0"
            class="flex items-center gap-1 mt-3 flex-wrap"
          >
            <button
              v-for="(run, idx) in currentRuns"
              :key="run.operationId"
              class="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-colors"
              :class="
                selectedRunId === run.operationId
                  ? 'bg-muted border-border font-medium'
                  : 'border-transparent hover:bg-muted/50 text-muted-foreground'
              "
              @click="selectRun(run.operationId)"
            >
              <span :class="runStatusClass(run.operationId)">●</span>
              {{ formatRunLabel(run.operationId, idx) }}
              <button
                class="ml-1 hover:text-destructive"
                @click.stop="handleClear(run.operationId)"
              >
                <Trash2 class="h-3 w-3" />
              </button>
            </button>
          </div>
        </CardHeader>

        <CardContent class="flex-1 p-0 mt-3 overflow-hidden">
          <!-- Empty state -->
          <div
            v-if="!selectedScript"
            class="h-full flex items-center justify-center text-sm text-muted-foreground"
          >
            Select a script from the left to get started
          </div>

          <div
            v-else-if="currentRuns.length === 0"
            class="h-full flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground"
          >
            <Terminal class="h-8 w-8 opacity-30" />
            <p>Click <strong>Run</strong> to execute this script</p>
          </div>

          <!-- Log output -->
          <div
            v-else
            ref="outputEl"
            class="h-full overflow-y-auto font-mono text-xs bg-zinc-950 text-zinc-100 p-4 rounded-b-lg"
          >
            <div
              v-if="currentRun?.status === 'running'"
              class="text-blue-400 mb-2"
            >
              ▶ Running…
            </div>
            <div
              v-else-if="currentRun?.status === 'completed'"
              class="text-green-400 mb-2"
            >
              ✔ Exited with code {{ currentRun.exitCode }}
            </div>
            <div
              v-else-if="currentRun?.status === 'failed'"
              class="text-red-400 mb-2"
            >
              ✖ Exited with code {{ currentRun.exitCode }}
            </div>

            <div
              v-for="(log, i) in currentLogs"
              :key="i"
              :class="log.stream === 'stderr' ? 'text-red-400' : 'text-zinc-100'"
              class="whitespace-pre-wrap break-all leading-5"
            >
              {{ stripAnsi(log.data) }}
            </div>

            <div
              v-if="currentLogs.length === 0 && currentRun?.status === 'running'"
              class="text-zinc-500"
            >
              Waiting for output…
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
