import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

interface PackageContract {
    version: string
    exports: Record<string, unknown>
    peerDependencies: Record<string, string>
    scripts: Record<string, string>
}

const packageJson = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as PackageContract
const readme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8')

describe('published package contract', () => {
    test('keeps the shared React and test contracts', () => {
        expect(packageJson.version).toBe('3.1.1')
        expect(packageJson.peerDependencies.react).toBe('^19.0.0')
        expect(packageJson.peerDependencies['react-dom']).toBe('^19.0.0')
        expect(packageJson.scripts.test).toBe('bun test')
    })

    test('publishes every documented entry point', () => {
        expect(Object.keys(packageJson.exports)).toEqual([
            '.',
            './tailwind.css',
            './select',
            './value',
            './messages',
            './types',
            './package.json',
        ])
        expect(packageJson.exports['./value']).toEqual({
            import: './dist/selectValue.js',
            types: './dist/selectValue.d.ts',
        })
        expect(packageJson.exports['./messages']).toEqual({
            import: './dist/i18n.js',
            types: './dist/i18n.d.ts',
        })
        expect(packageJson.exports['./package.json']).toBe('./package.json')
    })

    test('documents npm before Bun installation', () => {
        const npmInstallPosition = readme.indexOf(
            'npm install @rentnerkev/select',
        )
        const bunInstallPosition = readme.indexOf('bun add @rentnerkev/select')

        expect(npmInstallPosition).toBeGreaterThan(-1)
        expect(bunInstallPosition).toBeGreaterThan(npmInstallPosition)
    })
})
