<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
import { Package, ShieldAlert, Layers, Activity } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen" style="background-color: #fafbfc">
    <header class="border-b">
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
        </nav>
      </div>
    </header>
    <main class="container mx-auto py-6 px-4 sm:px-6">
      <RouterView />
    </main>
  </div>
</template>
