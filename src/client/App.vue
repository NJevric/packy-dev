<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="border-b">
      <div class="container flex h-14 items-center">
        <div class="flex items-center gap-2">
          <span class="text-xl font-bold">Packy</span>
          <span class="text-sm text-muted-foreground">Package Manager UI</span>
        </div>
      </div>
    </header>
    <main class="container py-6">
      <RouterView />
    </main>
  </div>
</template>
