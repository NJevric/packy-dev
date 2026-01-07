import { computed, toValue, type MaybeRefOrGetter } from 'vue'

export type VersionDiff = 'major' | 'minor' | 'patch' | 'none' | 'unknown'

/**
 * Parses a semver version string into its components
 */
function parseVersion(version: string): { major: number; minor: number; patch: number } | null {
  // Remove any leading 'v' and clean the version
  const cleaned = version.replace(/^v/, '').split('-')[0].split('+')[0]
  const match = cleaned.match(/^(\d+)\.(\d+)\.(\d+)/)

  if (!match) {
    return null
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  }
}

/**
 * Compares two semver versions and returns the type of difference
 */
export function compareVersions(current: string, latest: string): VersionDiff {
  const currentParsed = parseVersion(current)
  const latestParsed = parseVersion(latest)

  if (!currentParsed || !latestParsed) {
    return 'unknown'
  }

  if (currentParsed.major < latestParsed.major) {
    return 'major'
  }

  if (currentParsed.minor < latestParsed.minor) {
    return 'minor'
  }

  if (currentParsed.patch < latestParsed.patch) {
    return 'patch'
  }

  return 'none'
}

export function useVersionCompare(
  current: MaybeRefOrGetter<string>,
  latest: MaybeRefOrGetter<string>
) {
  const diff = computed(() => {
    return compareVersions(toValue(current), toValue(latest))
  })

  const badgeVariant = computed(() => {
    switch (diff.value) {
      case 'major':
        return 'destructive'
      case 'minor':
        return 'warning'
      case 'patch':
        return 'secondary'
      default:
        return 'success'
    }
  })

  const badgeText = computed(() => {
    switch (diff.value) {
      case 'major':
        return 'Major'
      case 'minor':
        return 'Minor'
      case 'patch':
        return 'Patch'
      case 'none':
        return 'Up to date'
      default:
        return 'Unknown'
    }
  })

  return {
    diff,
    badgeVariant,
    badgeText,
  }
}
