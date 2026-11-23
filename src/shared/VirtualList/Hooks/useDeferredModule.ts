import { useEffect, useState } from 'react'
import type { DeferredModuleProps } from '../Types/virtualList.types.ts'

const resolvedModules = /* @__PURE__ */ new WeakMap<
    () => Promise<unknown>,
    object
>()

export default function useDeferredModule<TModule extends object>({
    enabled,
    load,
}: DeferredModuleProps<TModule>) {
    const [loadedModule, setLoadedModule] = useState<TModule | null>(null)
    const [failure, setFailure] = useState<{ error: unknown } | null>(null)
    const module =
        loadedModule ??
        (enabled
            ? ((resolvedModules.get(load) as TModule | undefined) ?? null)
            : null)

    useEffect(() => {
        if (!enabled || module) return
        let active = true
        void load().then(
            (resolved) => {
                resolvedModules.set(load, resolved)
                if (active) setLoadedModule(() => resolved)
                return resolved
            },
            (error: unknown) => {
                if (active) setFailure({ error })
                return undefined
            },
        )
        return () => {
            active = false
        }
    }, [enabled, load, module])

    if (failure) throw failure.error
    return { state: { module } }
}
