import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { Package } from '@shared/types'

interface PackageJson {
  name: string
  version: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>
  [key: string]: unknown
}

/**
 * Reads and parses package.json from the project path
 */
export function readPackageJson(projectPath: string): PackageJson {
  const packageJsonPath = join(projectPath, 'package.json')
  const content = readFileSync(packageJsonPath, 'utf-8')
  return JSON.parse(content) as PackageJson
}

/**
 * Writes package.json to the project path
 */
export function writePackageJson(projectPath: string, packageJson: PackageJson): void {
  const packageJsonPath = join(projectPath, 'package.json')
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8')
}

/**
 * Gets all dependencies from package.json as Package objects
 */
export function getPackages(projectPath: string): Package[] {
  const packageJson = readPackageJson(projectPath)
  const packages: Package[] = []

  // Process dependencies
  if (packageJson.dependencies) {
    for (const [name, version] of Object.entries(packageJson.dependencies)) {
      packages.push({
        name,
        current: cleanVersion(version),
        latest: '', // Will be filled by registry lookup
        wanted: '', // Will be filled by registry lookup
        type: 'dependency',
        hasUpdate: false,
      })
    }
  }

  // Process devDependencies
  if (packageJson.devDependencies) {
    for (const [name, version] of Object.entries(packageJson.devDependencies)) {
      packages.push({
        name,
        current: cleanVersion(version),
        latest: '',
        wanted: '',
        type: 'devDependency',
        hasUpdate: false,
      })
    }
  }

  return packages.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Gets project info from package.json
 */
export function getProjectInfo(projectPath: string): { name: string; version: string } {
  const packageJson = readPackageJson(projectPath)
  return {
    name: packageJson.name || 'Unknown',
    version: packageJson.version || '0.0.0',
  }
}

/**
 * Removes version prefixes like ^, ~, >=, etc.
 */
function cleanVersion(version: string): string {
  return version.replace(/^[\^~>=<]+/, '')
}
