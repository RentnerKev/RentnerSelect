import { CustomSelect } from '../../../src/shared/Select/Components/CustomSelect.tsx'
import { useDynamicOptionsLogic } from '../Hooks/useDynamicOptionsLogic.ts'
import type { DynamicOptionsFixtureProps } from '../Types/playground.types.ts'

export function DynamicOptionsFixture({ mode }: DynamicOptionsFixtureProps) {
    const {
        state: { options, value, searchable, isOptionEqualToValue },
        handler: { handleValueChange },
    } = useDynamicOptionsLogic(mode)
    return (
        <main className="min-h-screen bg-[#101419] p-8 text-gray-200">
            <h1 className="mb-6 text-xl font-bold text-white">
                Dynamic option focus fixture
            </h1>
            <CustomSelect
                id="dynamic-options"
                label="Dynamic options"
                multiple
                value={value}
                onValueChange={handleValueChange}
                isOptionEqualToValue={isOptionEqualToValue}
                options={options}
                searchable={searchable}
            />
        </main>
    )
}
