import { CustomSelect } from '../../../src/shared/Select/Components/CustomSelect.tsx'
import { useSelectOptimizationFixtureLogic } from '../Hooks/useSelectOptimizationFixtureLogic.ts'
import type { SelectOptimizationFixtureProps } from '../Types/selectOptimizationFixture.types.ts'

export function SelectOptimizationFixture(
    props: SelectOptimizationFixtureProps,
) {
    const { state, handler } = useSelectOptimizationFixtureLogic(props)
    return (
        <main className="min-h-screen bg-select-surface p-8 text-select-foreground">
            <h1>Select optimization fixture</h1>
            <form aria-label="Optimization form" className="w-80">
                {props.multiple === false ? (
                    <CustomSelect
                        label="Optimization choices"
                        name="choice"
                        value={state.values[0] ?? ''}
                        onValueChange={handler.handleSingleValue}
                        options={state.options}
                        searchable={false}
                        virtualized={props.virtualized ?? false}
                        renderOption={handler.renderOption}
                    />
                ) : (
                    <CustomSelect
                        label="Optimization choices"
                        name="choice"
                        multiple
                        value={state.values}
                        onValueChange={handler.handleMultipleValue}
                        options={state.options}
                        searchable={false}
                        virtualized={props.virtualized ?? false}
                        renderOption={handler.renderOption}
                        maxSelection={props.maxSelection}
                    />
                )}
            </form>
            <output aria-label="Selected values">
                {state.values.join(',')}
            </output>
        </main>
    )
}
