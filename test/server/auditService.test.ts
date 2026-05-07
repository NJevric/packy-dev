import { describe, it, expect, beforeEach } from 'vitest'
import {
  parseAuditOutput,
  getAuditCommand,
  getAuditFixCommand,
  getCachedAuditResults,
  setCachedAuditResults,
  clearCache,
} from '../../src/server/services/auditService.js'

const npmAuditFixture = {
  auditReportVersion: 2,
  vulnerabilities: {
    lodash: {
      name: 'lodash',
      severity: 'high',
      isDirect: true,
      via: [
        {
          source: 1234,
          name: 'lodash',
          dependency: 'lodash',
          title: 'Prototype Pollution',
          url: 'https://npmjs.com/advisories/1234',
          severity: 'high',
          cwe: ['CWE-1321'],
          cvss: { score: 7.4, vectorString: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N' },
          range: '<4.17.21',
        },
      ],
      effects: [],
      range: '<4.17.21',
      nodes: ['node_modules/lodash'],
      fixAvailable: { name: 'lodash', version: '4.17.21', isSemVerMajor: false },
    },
  },
  metadata: {
    vulnerabilities: { info: 0, low: 0, moderate: 0, high: 1, critical: 0, total: 1 },
    dependencies: 100,
    devDependencies: 50,
    optionalDependencies: 0,
    totalDependencies: 150,
  },
}

describe('parseAuditOutput', () => {
  it('parses a valid npm audit v2 JSON', () => {
    const report = parseAuditOutput(JSON.stringify(npmAuditFixture), 'npm')
    expect(report.packageManager).toBe('npm')
    expect(report.metadata.vulnerabilities.high).toBe(1)
    expect(report.metadata.vulnerabilities.total).toBe(1)
    expect(report.metadata.dependencies).toBe(100)
    expect(report.vulnerabilities).toHaveLength(1)
    expect(report.vulnerabilities[0].name).toBe('lodash')
    expect(report.vulnerabilities[0].severity).toBe('high')
    expect(report.vulnerabilities[0].title).toBe('Prototype Pollution')
  })

  it('returns empty report on invalid JSON', () => {
    const report = parseAuditOutput('not json', 'npm')
    expect(report.vulnerabilities).toHaveLength(0)
    expect(report.metadata.vulnerabilities.total).toBe(0)
  })

  it('parses fixAvailable as object', () => {
    const report = parseAuditOutput(JSON.stringify(npmAuditFixture), 'npm')
    const fix = report.vulnerabilities[0].fixAvailable
    expect(typeof fix).toBe('object')
    expect((fix as any).isSemVerMajor).toBe(false)
  })
})

describe('getAuditCommand', () => {
  it('npm', () => expect(getAuditCommand('npm')).toBe('npm audit --json'))
  it('yarn', () => expect(getAuditCommand('yarn')).toBe('yarn audit --json'))
  it('pnpm', () => expect(getAuditCommand('pnpm')).toBe('pnpm audit --json'))
})

describe('getAuditFixCommand', () => {
  it('npm fix all', () => expect(getAuditFixCommand('npm')).toBe('npm audit fix'))
  it('npm fix force', () => expect(getAuditFixCommand('npm', true)).toBe('npm audit fix --force'))
  it('npm fix specific package', () => expect(getAuditFixCommand('npm', false, 'lodash')).toBe('npm update lodash'))
  it('yarn fix all uses npx yarn-audit-fix', () => expect(getAuditFixCommand('yarn')).toBe('npx yarn-audit-fix'))
  it('yarn fix specific package', () => expect(getAuditFixCommand('yarn', false, 'lodash')).toBe('yarn upgrade lodash'))
  it('pnpm fix all', () => expect(getAuditFixCommand('pnpm')).toBe('pnpm audit fix'))
  it('pnpm fix specific package', () => expect(getAuditFixCommand('pnpm', false, 'lodash')).toBe('pnpm update lodash'))
})

describe('cache', () => {
  beforeEach(() => clearCache())

  it('returns null when empty', () => {
    expect(getCachedAuditResults()).toBeNull()
  })

  it('returns cached report after set', () => {
    const report = parseAuditOutput(JSON.stringify(npmAuditFixture), 'npm')
    setCachedAuditResults(report)
    expect(getCachedAuditResults()).not.toBeNull()
    expect(getCachedAuditResults()?.metadata.vulnerabilities.high).toBe(1)
  })

  it('returns null after clear', () => {
    const report = parseAuditOutput(JSON.stringify(npmAuditFixture), 'npm')
    setCachedAuditResults(report)
    clearCache()
    expect(getCachedAuditResults()).toBeNull()
  })
})
