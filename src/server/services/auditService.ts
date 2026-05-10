import type {
  AuditReport,
  AuditMetadata,
  Vulnerability,
  VulnerabilityDetail,
  VulnerabilitySeverity,
  FixInfo,
  CVSSInfo,
  PackageManager,
} from '@shared/types'

interface NpmAuditRawVuln {
  severity: VulnerabilitySeverity
  isDirect: boolean
  via: Array<string | VulnerabilityDetail>
  effects: string[]
  range: string
  nodes: string[]
  fixAvailable: boolean | FixInfo
}

interface NpmAuditRawData {
  metadata?: {
    vulnerabilities?: Partial<AuditMetadata['vulnerabilities']>
    dependencies?: number
    devDependencies?: number
    optionalDependencies?: number
    totalDependencies?: number
  }
  vulnerabilities?: Record<string, NpmAuditRawVuln>
}

// In-memory cache for audit results
let cachedReport: AuditReport | null = null
let cacheTimestamp: number | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Parses audit output JSON and transforms it into AuditReport
 */
export function parseAuditOutput(stdout: string, packageManager: PackageManager): AuditReport {
  try {
    const data = JSON.parse(stdout)
    return transformNpmAuditV2(data, packageManager)
  } catch (error) {
    console.error('Failed to parse audit output:', error)
    // Return empty report on parse error
    return createEmptyReport(packageManager)
  }
}

/**
 * Transforms npm audit v2 JSON format
 */
function transformNpmAuditV2(data: NpmAuditRawData, packageManager: PackageManager): AuditReport {
  // Extract metadata
  const metadata: AuditMetadata = {
    vulnerabilities: {
      info: data.metadata?.vulnerabilities?.info ?? 0,
      low: data.metadata?.vulnerabilities?.low ?? 0,
      moderate: data.metadata?.vulnerabilities?.moderate ?? 0,
      high: data.metadata?.vulnerabilities?.high ?? 0,
      critical: data.metadata?.vulnerabilities?.critical ?? 0,
      total: data.metadata?.vulnerabilities?.total ?? 0,
    },
    dependencies: data.metadata?.dependencies ?? 0,
    devDependencies: data.metadata?.devDependencies ?? 0,
    optionalDependencies: data.metadata?.optionalDependencies ?? 0,
    totalDependencies: data.metadata?.totalDependencies ?? 0,
  }

  // Transform vulnerabilities
  const vulnerabilities: Vulnerability[] = []

  if (data.vulnerabilities) {
    for (const [packageName, vuln] of Object.entries(data.vulnerabilities)) {
      // Extract advisory details from via array
      let title: string | undefined
      let url: string | undefined
      let cwe: string[] | undefined
      let cvss: CVSSInfo | undefined

      if (Array.isArray(vuln.via)) {
        for (const viaItem of vuln.via) {
          if (typeof viaItem === 'object' && viaItem.title) {
            title = viaItem.title
            url = viaItem.url
            cwe = viaItem.cwe
            cvss = viaItem.cvss
            break
          }
        }
      }

      vulnerabilities.push({
        id: `${packageName}-${vuln.severity}`,
        name: packageName,
        severity: vuln.severity ?? 'low',
        isDirect: vuln.isDirect ?? false,
        via: vuln.via ?? [],
        effects: vuln.effects ?? [],
        range: vuln.range ?? '*',
        nodes: vuln.nodes ?? [],
        fixAvailable: parseFixAvailable(vuln.fixAvailable),
        title,
        url,
        cwe,
        cvss: cvss
          ? {
              score: cvss.score ?? 0,
              vectorString: cvss.vectorString ?? '',
            }
          : undefined,
      })
    }
  }

  return {
    metadata,
    vulnerabilities,
    lastRun: new Date(),
    packageManager,
  }
}

/**
 * Parses fixAvailable field which can be boolean or object
 */
function parseFixAvailable(fixAvailable: boolean | FixInfo): boolean | FixInfo {
  if (typeof fixAvailable === 'boolean') {
    return fixAvailable
  }

  if (typeof fixAvailable === 'object' && fixAvailable !== null) {
    return {
      name: fixAvailable.name,
      version: fixAvailable.version,
      isSemVerMajor: fixAvailable.isSemVerMajor ?? false,
    }
  }

  return false
}

/**
 * Creates an empty audit report
 */
function createEmptyReport(packageManager: PackageManager): AuditReport {
  return {
    metadata: {
      vulnerabilities: {
        info: 0,
        low: 0,
        moderate: 0,
        high: 0,
        critical: 0,
        total: 0,
      },
      dependencies: 0,
      devDependencies: 0,
      optionalDependencies: 0,
      totalDependencies: 0,
    },
    vulnerabilities: [],
    lastRun: new Date(),
    packageManager,
  }
}

/**
 * Gets cached audit results if still valid
 */
export function getCachedAuditResults(): AuditReport | null {
  if (!cachedReport || !cacheTimestamp) {
    return null
  }

  const now = Date.now()
  if (now - cacheTimestamp > CACHE_TTL) {
    // Cache expired
    cachedReport = null
    cacheTimestamp = null
    return null
  }

  return cachedReport
}

/**
 * Caches audit results
 */
export function setCachedAuditResults(report: AuditReport): void {
  cachedReport = report
  cacheTimestamp = Date.now()
}

/**
 * Clears the cache
 */
export function clearCache(): void {
  cachedReport = null
  cacheTimestamp = null
}

/**
 * Gets the audit command for a package manager
 */
export function getAuditCommand(packageManager: PackageManager): string {
  switch (packageManager) {
    case 'npm':
      return 'npm audit --json'
    case 'yarn':
      return 'yarn audit --json'
    case 'pnpm':
      return 'pnpm audit --json'
    default:
      return 'npm audit --json'
  }
}

/**
 * Gets the audit fix command for a package manager
 */
export function getAuditFixCommand(
  packageManager: PackageManager,
  force: boolean = false,
  packageName?: string
): string {
  if (packageName) {
    // Fix specific package by updating it
    switch (packageManager) {
      case 'npm':
        return `npm update ${packageName}`
      case 'yarn':
        return `yarn upgrade ${packageName}`
      case 'pnpm':
        return `pnpm update ${packageName}`
    }
  }

  // Fix all vulnerabilities
  switch (packageManager) {
    case 'npm':
      return force ? 'npm audit fix --force' : 'npm audit fix'
    case 'yarn':
      // yarn audit fix doesn't exist; npx yarn-audit-fix is the community equivalent
      return 'npx yarn-audit-fix@10.1.1'
    case 'pnpm':
      return 'pnpm audit fix'
    default:
      return force ? 'npm audit fix --force' : 'npm audit fix'
  }
}
