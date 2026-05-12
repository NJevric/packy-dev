import { createRequire } from 'module'
import type { DepcheckResult } from '@shared/types'

const require = createRequire(import.meta.url)

interface DepcheckUnused {
  dependencies: string[]
  devDependencies: string[]
  missing: Record<string, string[]>
}

type DepcheckFn = (path: string, options: Record<string, unknown>) => Promise<DepcheckUnused>

export async function runDepcheck(projectPath: string): Promise<DepcheckResult> {
  const depcheck = require('depcheck') as DepcheckFn

  const result = await depcheck(projectPath, {
    ignorePatterns: ['dist', 'build', '.packy-logs', 'coverage'],
    ignoreMatches: ['@types/*', '@tailwindcss/postcss', 'autoprefixer', '@vue/test-utils', '@shared/*'],
  })

  return {
    dependencies: result.dependencies,
    devDependencies: result.devDependencies,
    missing: result.missing,
  }
}
