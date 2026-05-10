<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useActivity, formatTimeAgo } from '@/composables/useActivity'

const PREVIEW_LIMIT = 8

const router = useRouter()
const { activities } = useActivity()

const preview = computed(() => activities.value.slice(0, PREVIEW_LIMIT))
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <CardTitle class="text-base font-semibold">Activity</CardTitle>
        <span class="text-sm text-muted-foreground">
          {{ activities.length }} recent
        </span>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="preview.length === 0" class="py-8 text-center text-sm text-muted-foreground">
        No recent activity
      </div>
      <div v-else class="space-y-4">
        <div
          v-for="item in preview"
          :key="item.id"
          class="flex items-start gap-3"
        >
          <div class="mt-1.5 flex-shrink-0">
            <div :class="['h-2 w-2 rounded-full', item.dotColor]" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm leading-snug">{{ item.label }}</p>
            <p class="mt-0.5 text-xs text-muted-foreground">{{ item.actor }}</p>
          </div>
          <span class="flex-shrink-0 whitespace-nowrap text-xs text-muted-foreground">
            {{ formatTimeAgo(item.timestamp) }}
          </span>
        </div>
      </div>

      <Button
        v-if="activities.length > 0"
        variant="ghost"
        size="sm"
        class="mt-4 w-full text-muted-foreground"
        @click="router.push({ name: 'activity' })"
      >
        View all activity
      </Button>
    </CardContent>
  </Card>
</template>
