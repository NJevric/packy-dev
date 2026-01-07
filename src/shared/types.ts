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
  type: 'install' | 'update' | 'remove'
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
