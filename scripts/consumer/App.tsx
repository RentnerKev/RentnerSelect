import { useCallback, useEffect, useRef, useState } from 'react'
import { CustomSelect } from '@rentnerkev/select'

export function App() {
    const [regions, setRegions] = useState<Array<string>>([])
    const [refMode, setRefMode] = useState<'cleanup' | 'legacy' | 'object'>(
        'cleanup',
    )
    const [showRefSelect, setShowRefSelect] = useState(true)
    const [refEventsText, setRefEventsText] = useState('')
    const [objectRefStatus, setObjectRefStatus] = useState('detached')
    const refEvents = useRef<string[]>([])
    const objectTriggerRef = useRef<HTMLButtonElement>(null)
    const cleanupTriggerRef = useCallback((node: HTMLButtonElement | null) => {
        if (node) {
            refEvents.current.push('cleanup:attached')
            return () => {
                refEvents.current.push('cleanup:cleanup')
            }
        }

        refEvents.current.push('cleanup:null')
    }, [])
    const legacyTriggerRef = useCallback((node: HTMLButtonElement | null) => {
        refEvents.current.push(node ? 'legacy:attached' : 'legacy:null')
    }, [])

    useEffect(() => {
        setRefEventsText(refEvents.current.join(','))
        setObjectRefStatus(
            refMode === 'object' && showRefSelect && objectTriggerRef.current
                ? 'attached'
                : 'detached',
        )
    }, [refMode, showRefSelect])

    const triggerRef =
        refMode === 'cleanup'
            ? cleanupTriggerRef
            : refMode === 'legacy'
              ? legacyTriggerRef
              : objectTriggerRef

    return (
        <>
            <form
                aria-label="Region form"
                className="rounded-xl bg-select-surface p-6 text-select-foreground"
            >
                <CustomSelect
                    name="regions"
                    label="Region"
                    placeholder="Choose regions"
                    locale="en"
                    multiple
                    searchable
                    value={regions}
                    onValueChange={setRegions}
                    options={[
                        { value: 'north', label: 'North' },
                        { value: 'south', label: 'South' },
                    ]}
                />
                <output role="status" aria-label="Selected regions">
                    {regions.join(', ') || 'None'}
                </output>
            </form>
            <section aria-label="Trigger ref lifecycle">
                <div>
                    <button type="button" onClick={() => setRefMode('legacy')}>
                        Use legacy trigger ref
                    </button>
                    <button type="button" onClick={() => setRefMode('object')}>
                        Use object trigger ref
                    </button>
                    <button type="button" onClick={() => setRefMode('cleanup')}>
                        Use cleanup trigger ref
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowRefSelect(false)}
                    >
                        Remove ref target
                    </button>
                </div>
                {showRefSelect && (
                    <CustomSelect
                        aria-label="Reference region"
                        value="north"
                        onValueChange={() => undefined}
                        options={[{ value: 'north', label: 'North' }]}
                        searchable={false}
                        triggerRef={triggerRef}
                    />
                )}
                <output data-testid="trigger-ref-events">
                    {refEventsText}
                </output>
                <output data-testid="trigger-object-ref-status">
                    {objectRefStatus}
                </output>
            </section>
        </>
    )
}
