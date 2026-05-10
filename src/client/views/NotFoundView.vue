<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'

const router = useRouter()

const lines = [
  '$ packy resolve --path ' + window.location.pathname,
  'Resolving package path...',
  'Checking registry...',
  'ERROR: Route not found in dependency tree',
  'Exit code: 404',
]

const visibleLines = ref<string[]>([])
const cursor = ref(true)

let lineIndex = 0
let charIndex = 0
let timeout: ReturnType<typeof setTimeout>
let cursorInterval: ReturnType<typeof setInterval>

function typeNext() {
  if (lineIndex >= lines.length) return

  const line = lines[lineIndex]

  if (charIndex <= line.length) {
    visibleLines.value[lineIndex] = line.slice(0, charIndex)
    charIndex++
    timeout = setTimeout(typeNext, charIndex === 1 ? 300 : 18)
  } else {
    lineIndex++
    charIndex = 0
    visibleLines.value.push('')
    timeout = setTimeout(typeNext, lineIndex === lines.length - 1 ? 120 : 60)
  }
}

onMounted(() => {
  visibleLines.value = ['']
  timeout = setTimeout(typeNext, 400)
  cursorInterval = setInterval(() => { cursor.value = !cursor.value }, 530)
})

onUnmounted(() => {
  clearTimeout(timeout)
  clearInterval(cursorInterval)
})
</script>

<template>
  <div class="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 py-16">
    <div class="w-full max-w-xl space-y-8">
      <!-- Error code -->
      <div class="space-y-1">
        <p class="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          exit status
        </p>
        <h1 class="text-8xl font-mono font-bold tracking-tight text-foreground leading-none">
          404
        </h1>
        <p class="text-sm font-mono text-muted-foreground">
          package_not_found
        </p>
      </div>

      <!-- Terminal block -->
      <div class="rounded-lg border bg-muted/50 p-4 font-mono text-sm space-y-0.5 overflow-hidden">
        <template
          v-for="(line, i) in visibleLines"
          :key="i"
        >
          <div
            :class="[
              'leading-relaxed whitespace-pre',
              line.startsWith('ERROR') ? 'text-red-600 dark:text-red-400' :
              line.startsWith('$') ? 'text-foreground' :
              line.startsWith('Exit') ? 'text-muted-foreground' :
              'text-muted-foreground'
            ]"
          >
            {{ line }}<span
              v-if="i === visibleLines.length - 1"
              :class="['inline-block w-[7px] h-[1em] align-middle ml-0.5 bg-current', cursor ? 'opacity-100' : 'opacity-0']"
            />
          </div>
        </template>
      </div>

      <!-- Message -->
      <div class="space-y-1">
        <p class="text-sm text-foreground font-medium">
          This route doesn't exist in the registry.
        </p>
        <p class="text-sm text-muted-foreground">
          The path you requested could not be resolved. It may have been moved or never existed.
        </p>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3">
        <Button
          class="font-mono text-sm w-full"
          @click="router.push('/')"
        >
          $ cd ~
        </Button>
      </div>
    </div>
  </div>
</template>
