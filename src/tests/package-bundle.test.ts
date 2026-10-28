import { expect, test } from 'bun:test'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'

async function inspectBrowserBundle(symbol: 'CustomSelect' | 'Combobox') {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'rentner-select-bundle-'))
    if (
        !resolve(temporaryRoot).startsWith(resolve(tmpdir()) + sep) ||
        !basename(temporaryRoot).startsWith('rentner-select-bundle-')
    )
        throw new Error('Invalid temporary bundle directory')
    try {
        const entry = join(temporaryRoot, 'entry.ts')
        const packageEntry = resolve(import.meta.dir, '../index.ts').replaceAll(
            '\\',
            '/',
        )
        writeFileSync(
            entry,
            'export { ' + symbol + ' } from ' + JSON.stringify(packageEntry),
        )
        const result = await Bun.build({
            entrypoints: [entry],
            target: 'browser',
            format: 'esm',
            splitting: true,
            minify: true,
            external: ['react', 'react/*', 'react-dom', 'react-dom/*'],
            sourcemap: 'external',
            define: { 'process.env.NODE_ENV': JSON.stringify('production') },
        })
        expect(result.success).toBe(true)
        const javascript = new Map(
            result.outputs
                .filter(
                    (output) =>
                        output.kind === 'entry-point' ||
                        output.kind === 'chunk',
                )
                .map((output) => [resolve(output.path), output]),
        )
        const maps = new Map(
            await Promise.all(
                result.outputs
                    .filter((output) => output.kind === 'sourcemap')
                    .map(async (sourceMapOutput) => {
                        const sourceMap = JSON.parse(
                            await sourceMapOutput.text(),
                        ) as { sources: string[] }
                        return [
                            resolve(sourceMapOutput.path.slice(0, -4)),
                            sourceMap.sources,
                        ] as const
                    }),
            ),
        )
        const visited = new Set<string>()
        const transpiler = new Bun.Transpiler({ loader: 'js' })
        async function visit(path: string) {
            if (visited.has(path)) return
            visited.add(path)
            const moduleOutput = javascript.get(path)!
            await Promise.all(
                transpiler
                    .scanImports(await moduleOutput.text())
                    .filter(
                        (dependency) =>
                            dependency.kind === 'import-statement' &&
                            dependency.path.startsWith('.'),
                    )
                    .map((dependency) =>
                        visit(resolve(dirname(path), dependency.path)),
                    ),
            )
        }
        const entryOutput = result.outputs.find(
            (output) => output.kind === 'entry-point',
        )!
        await visit(resolve(entryOutput.path))
        return {
            initialSources: Array.from(visited).flatMap(
                (path) => maps.get(path) ?? [],
            ),
            allSources: Array.from(maps.values()).flat(),
            initialGzipBytes: (
                await Promise.all(
                    Array.from(visited).map(
                        async (path) =>
                            gzipSync(
                                Buffer.from(
                                    await javascript.get(path)!.arrayBuffer(),
                                ),
                                { level: 9 },
                            ).length,
                    ),
                )
            ).reduce((sum, bytes) => sum + bytes, 0),
        }
    } finally {
        rmSync(temporaryRoot, { recursive: true, force: true })
    }
}

const isTooltip = (source: string) =>
    /(@rentnerkev[+/]tooltips|react-tooltip)/.test(source)
const isVirtualizer = (source: string) =>
    /@tanstack[+/](react-virtual|virtual-core)/.test(source)

test('select keeps tooltip and virtualizer code outside its initial browser graph', async () => {
    const bundle = await inspectBrowserBundle('CustomSelect')
    expect(bundle.initialSources.some(isTooltip)).toBe(false)
    expect(bundle.initialSources.some(isVirtualizer)).toBe(false)
    expect(
        bundle.initialSources.some((source) => /@radix-ui[+/]/.test(source)),
    ).toBe(false)
    expect(
        bundle.allSources.some((source) =>
            /@radix-ui[+/]react-select/.test(source),
        ),
    ).toBe(false)
    expect(bundle.allSources.some(isTooltip)).toBe(true)
    expect(bundle.allSources.some(isVirtualizer)).toBe(true)
    expect(bundle.initialGzipBytes).toBeLessThan(16000)
})

test('combobox root import stays independent of Radix and lazy virtualizer code', async () => {
    const bundle = await inspectBrowserBundle('Combobox')
    expect(
        bundle.initialSources.some((source) =>
            /react-select|react-tooltip|virtual-core/.test(source),
        ),
    ).toBe(false)
    expect(bundle.initialGzipBytes).toBeLessThan(6500)
})
