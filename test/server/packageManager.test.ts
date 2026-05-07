import { describe, it, expect } from 'vitest'
import {
  getInstallCommand,
  getUninstallCommand,
  getUpdateCommand,
  getUpdateAllCommand,
} from '../../src/server/services/packageManager.js'

describe('getInstallCommand', () => {
  it('npm production', () => {
    expect(getInstallCommand('npm', 'express')).toBe('npm install express')
  })
  it('npm dev', () => {
    expect(getInstallCommand('npm', 'vitest', undefined, true)).toBe('npm install --save-dev vitest')
  })
  it('npm with version', () => {
    expect(getInstallCommand('npm', 'express', '4.0.0')).toBe('npm install express@4.0.0')
  })
  it('yarn production', () => {
    expect(getInstallCommand('yarn', 'express')).toBe('yarn add express')
  })
  it('yarn dev', () => {
    expect(getInstallCommand('yarn', 'vitest', undefined, true)).toBe('yarn add -D vitest')
  })
  it('pnpm production', () => {
    expect(getInstallCommand('pnpm', 'express')).toBe('pnpm add express')
  })
  it('pnpm dev', () => {
    expect(getInstallCommand('pnpm', 'vitest', undefined, true)).toBe('pnpm add -D vitest')
  })
})

describe('getUninstallCommand', () => {
  it('npm', () => expect(getUninstallCommand('npm', 'lodash')).toBe('npm uninstall lodash'))
  it('yarn', () => expect(getUninstallCommand('yarn', 'lodash')).toBe('yarn remove lodash'))
  it('pnpm', () => expect(getUninstallCommand('pnpm', 'lodash')).toBe('pnpm remove lodash'))
})

describe('getUpdateCommand', () => {
  it('npm latest', () => expect(getUpdateCommand('npm', 'express')).toBe('npm install express@latest'))
  it('npm specific version', () => expect(getUpdateCommand('npm', 'express', '5.0.0')).toBe('npm install express@5.0.0'))
  it('yarn latest', () => expect(getUpdateCommand('yarn', 'express')).toBe('yarn add express@latest'))
  it('pnpm latest', () => expect(getUpdateCommand('pnpm', 'express')).toBe('pnpm add express@latest'))
})

describe('getUpdateAllCommand', () => {
  it('npm', () => expect(getUpdateAllCommand('npm')).toBe('npm update'))
  it('yarn', () => expect(getUpdateAllCommand('yarn')).toBe('yarn upgrade'))
  it('pnpm', () => expect(getUpdateAllCommand('pnpm')).toBe('pnpm update'))
})
