<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
import { Package, ShieldAlert, Layers } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="border-b">
      <div class="container flex h-14 items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-xl font-bold">Packy</span>
          <span class="text-sm text-muted-foreground">Package Manager UI</span>
        </div>
        <nav class="flex items-center gap-6">
          <RouterLink
            to="/"
            class="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
            active-class="text-primary"
          >
            <Package class="h-4 w-4" />
            Dashboard
          </RouterLink>
          <RouterLink
            to="/dependencies"
            class="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
            active-class="text-primary"
          >
            <Layers class="h-4 w-4" />
            Dependencies
          </RouterLink>
          <RouterLink
            to="/security"
            class="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
            active-class="text-primary"
          >
            <ShieldAlert class="h-4 w-4" />
            Security
          </RouterLink>
        </nav>
      </div>
    </header>
    <main class="container py-6">
      <RouterView />
    </main>
  </div>
</template>
