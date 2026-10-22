import { useEffect, useState } from 'react'
import type { DeferredModuleProps } from '../Types/virtualList.types.ts'

export default function useDeferredModule<TModule extends object>({
    enabled,
    load,
}: DeferredModuleProps<TModule>) {
    const [loadedModule, setLoadedModule] = useState<TModule | null>(null)
    const [failure, setFailure] = useState<{ error: unknown } | null>(null)

    useEffect(() => {
        if (!enabled || loadedModule) return
        let active = true
        void load().then(
            (module) => {
                if (active) setLoadedModule(() => module)
                return module
            },
            (error: unknown) => {
                if (active) setFailure({ error })
                return undefined
            },
        )
        return () => {
            active = false
        }
    }, [enabled, load, loadedModule])

    if (failure) throw failure.error
    return { state: { module: loadedModule } }
}
