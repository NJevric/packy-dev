<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import OperationToast from '@/components/operations/OperationToast.vue'
import { useRegistry } from '@/composables/useRegistry'
import { usePackages } from '@/composables/usePackages'
import { useVersionCompare } from '@/composables/useVersionCompare'
import { useOperations } from '@/composables/useOperations'

const route = useRoute()
const router = useRouter()
const packageName = computed(() => decodeURIComponent(route.params.name as string))

const { data: registryInfo, isLoading: isRegistryLoading } = useRegistry(packageName)
const { packages, updatePackage, removePackage } = usePackages()

// Initialize SSE
useOperations()

const packageData = computed(() => {
  return packages.data.value?.find(p => p.name === packageName.value)
})

const { badgeVariant, badgeText } = useVersionCompare(
  () => packageData.value?.current || '',
  () => packageData.value?.latest || ''
)

// Confirm dialog state
const isRemoveDialogOpen = ref(false)

function formatDownloads(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

function handleUpdate() {
  updatePackage.mutate({ name: packageName.value })
}

function handleRemove() {
  isRemoveDialogOpen.value = true
}

function confirmRemove() {
  removePackage.mutate(packageName.value)
  router.push({ name: 'dashboard' })
}

function getRepoUrl(repo?: { type: string; url: string }): string | null {
  if (!repo?.url) return null
  // Clean up git URLs
  return repo.url
    .replace(/^git\+/, '')
    .replace(/\.git$/, '')
    .replace(/^git:\/\//, 'https://')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            @click="router.back()"
          >
            ← Back
          </Button>
        </div>
        <h1 class="text-3xl font-bold tracking-tight mt-2">
          {{ packageName }}
        </h1>
        <p
          v-if="registryInfo?.description"
          class="text-muted-foreground mt-1"
        >
          {{ registryInfo.description }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2 sm:flex-nowrap sm:shrink-0">
        <Button
          v-if="packageData?.hasUpdate"
          @click="handleUpdate"
        >
          Update to {{ packageData.latest }}
        </Button>
        <Button
          variant="destructive"
          @click="handleRemove"
        >
          Remove
        </Button>
      </div>
    </div>

    <!-- Version info -->
    <div class="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">
            Installed Version
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton
            v-if="packages.isLoading.value"
            class="h-8 w-20"
          />
          <div
            v-else
            class="text-2xl font-bold"
          >
            {{ packageData?.current || '-' }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">
            Latest Version
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton
            v-if="isRegistryLoading"
            class="h-8 w-20"
          />
          <div
            v-else
            class="flex items-center gap-2"
          >
            <span class="text-2xl font-bold">{{ registryInfo?.version || '-' }}</span>
            <Badge
              v-if="packageData?.hasUpdate"
              :variant="badgeVariant"
            >
              {{ badgeText }}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">
            Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton
            v-if="packages.isLoading.value"
            class="h-8 w-24"
          />
          <Badge
            v-else
            variant="outline"
            class="text-lg"
          >
            {{ packageData?.type === 'devDependency' ? 'Dev Dependency' : 'Dependency' }}
          </Badge>
        </CardContent>
      </Card>
    </div>

    <!-- Registry info -->
    <Card>
      <CardHeader>
        <CardTitle>Package Information</CardTitle>
        <CardDescription>Data from npm registry</CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton
          v-if="isRegistryLoading"
          class="h-32 w-full"
        />
        <div
          v-else-if="registryInfo"
          class="space-y-4"
        >
          <div class="grid gap-4 md:grid-cols-2">
            <div v-if="registryInfo.license">
              <div class="text-sm text-muted-foreground">
                License
              </div>
              <div class="font-medium">
                {{ registryInfo.license }}
              </div>
            </div>

            <div v-if="registryInfo.downloads">
              <div class="text-sm text-muted-foreground">
                Weekly Downloads
              </div>
              <div class="font-medium">
                {{ formatDownloads(registryInfo.downloads.weekly) }}
              </div>
            </div>

            <div v-if="registryInfo.homepage">
              <div class="text-sm text-muted-foreground">
                Homepage
              </div>
              <a
                :href="registryInfo.homepage"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium text-primary hover:underline"
              >
                {{ registryInfo.homepage }}
              </a>
            </div>

            <div v-if="getRepoUrl(registryInfo.repository)">
              <div class="text-sm text-muted-foreground">
                Repository
              </div>
              <a
                :href="getRepoUrl(registryInfo.repository)!"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium text-primary hover:underline"
              >
                {{ getRepoUrl(registryInfo.repository) }}
              </a>
            </div>
          </div>

          <div v-if="registryInfo.keywords?.length">
            <div class="text-sm text-muted-foreground mb-2">
              Keywords
            </div>
            <div class="flex flex-wrap gap-1">
              <Badge
                v-for="keyword in registryInfo.keywords.slice(0, 10)"
                :key="keyword"
                variant="secondary"
              >
                {{ keyword }}
              </Badge>
            </div>
          </div>
        </div>
        <div
          v-else
          class="text-muted-foreground"
        >
          Unable to load package information from registry.
        </div>
      </CardContent>
    </Card>

    <ConfirmDialog
      :open="isRemoveDialogOpen"
      title="Remove Package"
      :description="`Are you sure you want to remove ${packageName}? This action cannot be undone and you will be redirected to the dashboard.`"
      confirm-text="Remove"
      @update:open="isRemoveDialogOpen = $event"
      @confirm="confirmRemove"
    />

    <OperationToast />
  </div>
</template>
