import { CustomSelect } from '@rentnerkev/select'

import { useConsumerAppLogic } from './Hooks/useConsumerAppLogic.ts'

import type { AppLogicResult } from './Types/app.types.ts'

export function App() {
    const {
        state: { regions, showRefSelect, refEventsText, objectRefStatus },
        setter: { setRegions, setRefMode, setShowRefSelect },
        refs: { triggerRef },
    }: AppLogicResult = useConsumerAppLogic()
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
                <output aria-label="Selected regions">
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
