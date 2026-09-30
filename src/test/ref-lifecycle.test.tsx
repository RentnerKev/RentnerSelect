import { afterEach, describe, expect, mock, test } from 'bun:test'
import { createRef, type Ref } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { CustomSelect } from '../index.js'
import { composeRefs } from '../Hooks/useComposedRefs.js'

afterEach(() => {
    cleanup()
})

function SelectHarness({
    value = 'north',
    triggerRef,
}: {
    value?: string
    triggerRef?: Ref<HTMLButtonElement>
}) {
    return (
        <CustomSelect
            aria-label="Region"
            value={value}
            onValueChange={() => undefined}
            options={[
                { value: 'north', label: 'North' },
                { value: 'south', label: 'South' },
            ]}
            searchable={false}
            triggerRef={triggerRef}
        />
    )
}

describe('select trigger refs', () => {
    test('runs cleanup-returning refs once and keeps the adapter stable', () => {
        const cleanupRef = mock(() => undefined)
        const triggerRef = mock((node: HTMLButtonElement | null) => {
            if (node) {
                return () => cleanupRef()
            }
        })
        const view = render(<SelectHarness triggerRef={triggerRef} />)
        const trigger = screen.getByRole('combobox', { name: 'Region' })

        expect(triggerRef).toHaveBeenCalledTimes(1)
        expect(triggerRef).toHaveBeenCalledWith(trigger)

        view.rerender(<SelectHarness value="south" triggerRef={triggerRef} />)

        expect(triggerRef).toHaveBeenCalledTimes(1)

        view.unmount()

        expect(cleanupRef).toHaveBeenCalledTimes(1)
        expect(triggerRef).toHaveBeenCalledTimes(1)
    })

    test('cleans up a replaced callback and nulls a legacy callback on detach', () => {
        const firstCleanup = mock(() => undefined)
        const firstRef = mock((node: HTMLButtonElement | null) => {
            if (node) {
                return () => firstCleanup()
            }
        })
        const legacyRef = mock((_node: HTMLButtonElement | null) => undefined)
        const view = render(<SelectHarness triggerRef={firstRef} />)
        const trigger = screen.getByRole('combobox', { name: 'Region' })

        view.rerender(<SelectHarness triggerRef={legacyRef} />)

        expect(firstCleanup).toHaveBeenCalledTimes(1)
        expect(firstRef).toHaveBeenCalledTimes(1)
        expect(legacyRef).toHaveBeenCalledWith(trigger)

        view.unmount()

        expect(legacyRef).toHaveBeenCalledTimes(2)
        expect(legacyRef).toHaveBeenLastCalledWith(null)
    })

    test('moves object refs when their identity changes and clears them on detach', () => {
        const firstRef = createRef<HTMLButtonElement>()
        const secondRef = createRef<HTMLButtonElement>()
        const view = render(<SelectHarness triggerRef={firstRef} />)
        const trigger = screen.getByRole('combobox', { name: 'Region' })

        expect(firstRef.current).toBe(trigger)

        view.rerender(<SelectHarness triggerRef={secondRef} />)

        expect(firstRef.current).toBeNull()
        expect(secondRef.current).toBe(trigger)

        view.unmount()

        expect(secondRef.current).toBeNull()
    })

    test('invokes a duplicate callback ref only once per attachment', () => {
        const cleanupRef = mock(() => undefined)
        const callbackRef = mock((node: HTMLButtonElement | null) => {
            if (node) {
                return () => cleanupRef()
            }
        })
        const composedRef = composeRefs([callbackRef, callbackRef])
        const trigger = document.createElement('button')
        const detach = composedRef(trigger)

        expect(callbackRef).toHaveBeenCalledTimes(1)
        expect(callbackRef).toHaveBeenCalledWith(trigger)

        detach?.()

        expect(cleanupRef).toHaveBeenCalledTimes(1)
    })

    test('clears object and legacy refs even when a callback cleanup throws', () => {
        const objectRef = createRef<HTMLButtonElement>()
        const legacyRef = mock((_node: HTMLButtonElement | null) => undefined)
        const throwingRef = mock((node: HTMLButtonElement | null) => {
            if (node) {
                return () => {
                    throw new Error('cleanup failed')
                }
            }
        })
        const composedRef = composeRefs([throwingRef, objectRef, legacyRef])
        const trigger = document.createElement('button')
        const detach = composedRef(trigger)

        expect(objectRef.current).toBe(trigger)
        expect(legacyRef).toHaveBeenCalledWith(trigger)
        expect(typeof detach).toBe('function')

        expect(() => detach?.()).toThrow('cleanup failed')

        expect(objectRef.current).toBeNull()
        expect(legacyRef).toHaveBeenLastCalledWith(null)
    })
})
