// Package types
export interface Package {
  name: string
  current: string
  latest: string
  wanted: string
  type: 'dependency' | 'devDependency'
  hasUpdate: boolean
}

export interface PackageWithRegistry extends Package {
  registry?: RegistryInfo
}

// Registry types
export interface RegistryInfo {
  name: string
  description: string
  version: string
  homepage?: string
  repository?: {
    type: string
    url: string
  }
  license?: string
  keywords?: string[]
  author?: string | { name: string; email?: string }
  downloads?: {
    weekly: number
    monthly: number
  }
}

// Project types
export interface ProjectInfo {
  name: string
  version: string
  path: string
  packageManager: PackageManager
}

export type PackageManager = 'npm' | 'yarn' | 'pnpm'

// Operation types
export interface Operation {
  id: string
  type: 'install' | 'update' | 'remove' | 'audit' | 'audit-fix'
  packageName?: string
  command: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt: Date
  completedAt?: Date
  exitCode?: number
}

export interface OperationLogEntry {
  operationId: string
  timestamp: Date
  stream: 'stdout' | 'stderr'
  data: string
}

// SSE Event types
export type OperationEvent =
  | { type: 'start'; operationId: string; command: string }
  | { type: 'stdout'; operationId: string; data: string }
  | { type: 'stderr'; operationId: string; data: string }
  | { type: 'complete'; operationId: string; exitCode: number }
  | { type: 'error'; operationId: string; error: string }

// API request/response types
export interface AddPackageRequest {
  name: string
  version?: string
  isDev: boolean
}

export interface UpdatePackageRequest {
  version?: string // If not specified, updates to latest
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Audit types
export type VulnerabilitySeverity = 'info' | 'low' | 'moderate' | 'high' | 'critical'

export interface AuditMetadata {
  vulnerabilities: {
    info: number
    low: number
    moderate: number
    high: number
    critical: number
    total: number
  }
  dependencies: number
  devDependencies: number
  optionalDependencies: number
  totalDependencies: number
}

export interface CVSSInfo {
  score: number
  vectorString: string
}

export interface VulnerabilityDetail {
  source: number
  name: string
  dependency: string
  title: string
  url: string
  severity: VulnerabilitySeverity
  cwe: string[]
  cvss: CVSSInfo
  range: string
}

export interface FixInfo {
  name: string
  version: string
  isSemVerMajor: boolean
}

export interface Vulnerability {
  id: string
  name: string
  severity: VulnerabilitySeverity
  isDirect: boolean
  via: Array<string | VulnerabilityDetail>
  effects: string[]
  range: string
  nodes: string[]
  fixAvailable: boolean | FixInfo
  // Optional fields from advisories
  title?: string
  url?: string
  cwe?: string[]
  cvss?: CVSSInfo
}

export interface AuditReport {
  metadata: AuditMetadata
  vulnerabilities: Vulnerability[]
  lastRun: Date
  packageManager: PackageManager
}

export interface AuditFixRequest {
  force?: boolean
  packageName?: string
}

// Audit log types
export interface AuditLogEntry {
  id: string
  timestamp: Date
  metadata: AuditMetadata
  vulnerabilitiesCount: number
  packageManager: PackageManager
}

export interface FixLogEntry {
  id: string
  timestamp: Date
  packageName?: string
  force: boolean
  operationId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  exitCode?: number
  completedAt?: Date
  output?: string
  error?: string
}
