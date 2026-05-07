import { existsSync } from 'fs'
import { join } from 'path'
import type { PackageManager } from '@shared/types'

/**
 * Detects which package manager is used in the project
 * Priority: pnpm > yarn > npm
 */
export function detectPackageManager(projectPath: string): PackageManager {
  if (existsSync(join(projectPath, 'pnpm-lock.yaml'))) {
    return 'pnpm'
  }
  if (existsSync(join(projectPath, 'yarn.lock'))) {
    return 'yarn'
  }
  // Default to npm (package-lock.json or no lock file)
  return 'npm'
}

/**
 * Returns the install command for the given package manager
 */
export function getInstallCommand(
  pm: PackageManager,
  packageName: string,
  version?: string,
  isDev = false
): string {
  const pkg = version ? `${packageName}@${version}` : packageName

  switch (pm) {
    case 'pnpm':
      return `pnpm add ${isDev ? '-D ' : ''}${pkg}`
    case 'yarn':
      return `yarn add ${isDev ? '-D ' : ''}${pkg}`
    case 'npm':
    default:
      return `npm install ${isDev ? '--save-dev ' : ''}${pkg}`
  }
}

/**
 * Returns the uninstall command for the given package manager
 */
export function getUninstallCommand(
  pm: PackageManager,
  packageName: string
): string {
  switch (pm) {
    case 'pnpm':
      return `pnpm remove ${packageName}`
    case 'yarn':
      return `yarn remove ${packageName}`
    case 'npm':
    default:
      return `npm uninstall ${packageName}`
  }
}

/**
 * Returns the update command for the given package manager
 */
export function getUpdateCommand(
  pm: PackageManager,
  packageName: string,
  version?: string
): string {
  const pkg = version ? `${packageName}@${version}` : `${packageName}@latest`

  switch (pm) {
    case 'pnpm':
      return `pnpm add ${pkg}`
    case 'yarn':
      return `yarn add ${pkg}`
    case 'npm':
    default:
      return `npm install ${pkg}`
  }
}

