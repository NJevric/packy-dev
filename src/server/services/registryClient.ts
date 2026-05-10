import semver from 'semver'
import type { RegistryInfo } from '@shared/types'

const NPM_REGISTRY = 'https://registry.npmjs.org'

// Simple in-memory cache
const cache = new Map<string, { data: RegistryInfo; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface NpmPackageResponse {
  name: string
  description?: string
  'dist-tags': {
    latest: string
    [tag: string]: string
  }
  versions: Record<string, {
    version: string
    [key: string]: unknown
  }>
  homepage?: string
  repository?: {
    type: string
    url: string
  }
  license?: string
  keywords?: string[]
  author?: string | { name: string; email?: string }
  time?: Record<string, string>
}

/**
 * Fetches package info from npm registry using the /latest endpoint.
 * Much lighter than fetching the full package document (avoids all-versions payload).
 */
export async function getPackageInfo(packageName: string): Promise<RegistryInfo | null> {
  const cached = cache.get(packageName)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  try {
    const encodedName = packageName.startsWith('@')
      ? `@${encodeURIComponent(packageName.slice(1))}`
      : encodeURIComponent(packageName)

    const response = await fetch(`${NPM_REGISTRY}/${encodedName}/latest`, {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`Registry returned ${response.status}`)
    }

    const data = (await response.json()) as NpmPackageResponse

    const registryInfo: RegistryInfo = {
      name: data.name,
      description: data.description || '',
      version: data['dist-tags']?.latest ?? (data as unknown as { version: string }).version,
      homepage: data.homepage,
      repository: data.repository,
      license: data.license,
      keywords: data.keywords,
      author: data.author,
    }

    cache.set(packageName, { data: registryInfo, timestamp: Date.now() })
    return registryInfo
  } catch (error) {
    console.error(`Failed to fetch package info for ${packageName}:`, error)
    return null
  }
}

// Lightweight cache for version-only lookups (separate from full metadata cache)
const versionCache = new Map<string, { version: string; timestamp: number }>()

/**
 * Fetches the latest version of a package using the /latest endpoint.
 * Much lighter than fetching the full package metadata document.
 */
export async function getLatestVersion(packageName: string): Promise<string | null> {
  const cached = versionCache.get(packageName)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.version
  }

  try {
    const encodedName = packageName.startsWith('@')
      ? `@${encodeURIComponent(packageName.slice(1))}`
      : encodeURIComponent(packageName)

    const response = await fetch(`${NPM_REGISTRY}/${encodedName}/latest`, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null

    const data = (await response.json()) as { version: string }
    versionCache.set(packageName, { version: data.version, timestamp: Date.now() })
    return data.version
  } catch (error) {
    console.error(`Failed to fetch latest version for ${packageName}:`, error)
    return null
  }
}

/**
 * Fetches download counts for a package
 * Uses the npm downloads API
 */
export async function getDownloadCounts(packageName: string): Promise<{ weekly: number; monthly: number } | null> {
  try {
    const encodedName = encodeURIComponent(packageName)

    // Fetch last week downloads
    const weeklyResponse = await fetch(
      `https://api.npmjs.org/downloads/point/last-week/${encodedName}`
    )

    // Fetch last month downloads
    const monthlyResponse = await fetch(
      `https://api.npmjs.org/downloads/point/last-month/${encodedName}`
    )

    if (!weeklyResponse.ok || !monthlyResponse.ok) {
      return null
    }

    const weeklyData = await weeklyResponse.json() as { downloads: number }
    const monthlyData = await monthlyResponse.json() as { downloads: number }

    return {
      weekly: weeklyData.downloads,
      monthly: monthlyData.downloads,
    }
  } catch (error) {
    console.error(`Failed to fetch download counts for ${packageName}:`, error)
    return null
  }
}

// Cache for all-versions lookups
const versionsCache = new Map<string, { versions: string[]; timestamp: number }>()

/**
 * Fetches all published versions of a package from the npm registry, sorted descending.
 */
export async function getPackageVersions(packageName: string): Promise<string[]> {
  const cached = versionsCache.get(packageName)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.versions
  }

  try {
    const encodedName = packageName.startsWith('@')
      ? `@${encodeURIComponent(packageName.slice(1))}`
      : encodeURIComponent(packageName)

    const response = await fetch(`${NPM_REGISTRY}/${encodedName}`, {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      if (response.status === 404) return []
      throw new Error(`Registry returned ${response.status}`)
    }

    const data = (await response.json()) as { versions: Record<string, unknown> }
    const versions = Object.keys(data.versions)
      .filter(v => semver.valid(v))
      .sort((a, b) => semver.rcompare(a, b))

    versionsCache.set(packageName, { versions, timestamp: Date.now() })
    return versions
  } catch (error) {
    console.error(`Failed to fetch versions for ${packageName}:`, error)
    return []
  }
}

/**
 * Clears the cache for a specific package or all packages
 */
export function clearCache(packageName?: string): void {
  if (packageName) {
    cache.delete(packageName)
  } else {
    cache.clear()
  }
}
