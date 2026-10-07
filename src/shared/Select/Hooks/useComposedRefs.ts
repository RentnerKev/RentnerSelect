import { useMemo } from 'react'
import type { Ref, RefCallback } from 'react'

function assignRef<Element>(
    ref: Ref<Element> | undefined,
    value: Element | null,
) {
    if (typeof ref === 'function') {
        return ref(value)
    }

    if (ref) {
        ref.current = value
    }
}

export function composeRefs<Element>(
    refs: readonly (Ref<Element> | undefined)[],
): RefCallback<Element> {
    const uniqueRefs = [...new Set(refs)]

    return (node) => {
        if (node === null) {
            uniqueRefs.forEach((ref) => assignRef(ref, null))
            return
        }

        const cleanups = uniqueRefs.map((ref) => assignRef(ref, node))

        if (!cleanups.some((cleanup) => typeof cleanup === 'function')) {
            return
        }

        return () => {
            let firstError: unknown
            let hasError = false

            uniqueRefs.forEach((ref, index) => {
                const cleanup = cleanups[index]

                try {
                    if (typeof cleanup === 'function') {
                        cleanup()
                    } else {
                        assignRef(ref, null)
                    }
                } catch (error) {
                    if (!hasError) {
                        firstError = error
                        hasError = true
                    }
                }
            })

            if (hasError) {
                throw firstError
            }
        }
    }
}

export default function useComposedRefs<Element>(
    firstRef: Ref<Element> | undefined,
    secondRef: Ref<Element> | undefined,
) {
    return useMemo(
        () => composeRefs([firstRef, secondRef]),
        [firstRef, secondRef],
    )
}
