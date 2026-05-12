<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, RouterLink } from 'vue-router'
import { Package, ShieldAlert, Layers, Activity, Terminal, Sun, Moon, Monitor, Check } from 'lucide-vue-next'
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} from 'radix-vue'
import { useTheme } from '@/composables/useTheme'
import { Button } from '@/components/ui/button'

const { theme, setTheme } = useTheme()

const ThemeIcon = computed(() =>
  theme.value === 'dark' ? Moon : theme.value === 'light' ? Sun : Monitor
)

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="border-b bg-background">
      <div class="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        <div class="flex items-center gap-2.5">
          <span class="text-xl font-bold tracking-tight">Packy</span>
        </div>
        <nav class="flex items-center gap-1">
          <RouterLink
            to="/"
            class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
            exact-active-class="!text-foreground bg-muted"
          >
            <Package class="h-4 w-4" />
            <span class="hidden sm:inline">Dashboard</span>
          </RouterLink>
          <RouterLink
            to="/dependencies"
            class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
            active-class="!text-foreground bg-muted"
          >
            <Layers class="h-4 w-4" />
            <span class="hidden sm:inline">Dependencies</span>
          </RouterLink>
          <RouterLink
            to="/scripts"
            class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
            active-class="!text-foreground bg-muted"
          >
            <Terminal class="h-4 w-4" />
            <span class="hidden sm:inline">Scripts</span>
          </RouterLink>
          <RouterLink
            to="/security"
            class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
            active-class="!text-foreground bg-muted"
          >
            <ShieldAlert class="h-4 w-4" />
            <span class="hidden sm:inline">Security</span>
          </RouterLink>
          <RouterLink
            to="/activity"
            class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
            active-class="!text-foreground bg-muted"
          >
            <Activity class="h-4 w-4" />
            <span class="hidden sm:inline">Activity</span>
          </RouterLink>

          <div class="w-px h-4 bg-border mx-1 shrink-0" />

          <DropdownMenuRoot>
            <DropdownMenuTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8 shrink-0"
              >
                <component
                  :is="ThemeIcon"
                  class="h-4 w-4"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent
                align="end"
                :side-offset="6"
                class="z-50 min-w-[140px] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 p-1"
              >
                <DropdownMenuItem
                  v-for="opt in themeOptions"
                  :key="opt.value"
                  class="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none cursor-default select-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  @click="setTheme(opt.value)"
                >
                  <component
                    :is="opt.icon"
                    class="h-4 w-4 text-muted-foreground"
                  />
                  <span class="flex-1">{{ opt.label }}</span>
                  <Check
                    v-if="theme === opt.value"
                    class="h-3.5 w-3.5"
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenuRoot>
        </nav>
      </div>
    </header>

    <main class="container mx-auto py-6 px-4 sm:px-6">
      <RouterView />
    </main>

  </div>
</template>
