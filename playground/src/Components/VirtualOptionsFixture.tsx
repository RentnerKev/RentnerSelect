import { CustomSelect } from '../../../src/shared/Select/Components/CustomSelect.tsx'
import { SelectProvider } from '../../../src/shared/Select/Components/SelectProvider.tsx'
import { Combobox } from '../../../src/shared/Combobox/Components/Combobox.tsx'
import { useVirtualOptionsFixtureLogic } from '../Hooks/useVirtualOptionsFixtureLogic.ts'
export function VirtualOptionsFixture() {
    const { state, handler, refs } = useVirtualOptionsFixtureLogic()
    const { portalHost } = refs
    return (
        <main className="min-h-screen bg-select-surface p-8 text-select-foreground">
            <h1 className="mb-6 text-xl font-semibold">Virtual options</h1>
            {state.shadow && <div ref={portalHost} />}
            <SelectProvider
                virtualized={state.virtualized}
                contentWidth={state.contentWidth}
                textOverflow="wrap"
                locale="en"
            >
                <form
                    aria-label="Virtual form"
                    className="w-80"
                    onSubmit={handler.handleSubmit}
                >
                    {state.kind === 'combobox' ? (
                        <Combobox
                            name="choice"
                            label="Virtual choices"
                            options={state.options}
                            getOptionKey={(option) => option.value}
                            getOptionLabel={(option) => option.label}
                            getOptionDescription={(option) => option.subOption}
                            isOptionDisabled={(option) =>
                                Boolean(option.disabled)
                            }
                            value={state.selectedOption}
                            onValueChange={handler.handleComboboxChange}
                            searchValue={state.searchValue}
                            onSearchValueChange={handler.handleSearchChange}
                            portalContainer={state.portalContainer}
                        />
                    ) : state.multiple ? (
                        <CustomSelect
                            multiple
                            name="choice"
                            label="Virtual choices"
                            options={state.options}
                            value={state.selectedValues}
                            onValueChange={handler.handleMultipleChange}
                            searchable={state.searchable}
                            portalContainer={state.portalContainer}
                        />
                    ) : (
                        <CustomSelect
                            name="choice"
                            label="Virtual choices"
                            options={state.options}
                            value={state.selectedValues[0] ?? ''}
                            onValueChange={handler.handleSingleChange}
                            searchable={state.searchable}
                            portalContainer={state.portalContainer}
                        />
                    )}
                    <button
                        type="submit"
                        className="mt-4 rounded border px-3 py-2"
                    >
                        Submit
                    </button>
                </form>
            </SelectProvider>
            <output aria-label="Selected values">
                {state.selectedValues.join(',')}
            </output>
        </main>
    )
}
