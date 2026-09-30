import { useState } from 'react'
import { CustomSelect } from '@rentnerkev/select'

export function App() {
    const [regions, setRegions] = useState<Array<string>>([])

    return (
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
    )
}
