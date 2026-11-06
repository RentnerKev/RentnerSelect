import { Combobox } from '../../../src/shared/Combobox/Components/Combobox.tsx'
import { CustomSelect } from '../../../src/shared/Select/Components/CustomSelect.tsx'
import { useGroupedOptionsFixtureLogic } from '../Hooks/useGroupedOptionsFixtureLogic.ts'

export function GroupedOptionsFixture() {
    const { state, handler } = useGroupedOptionsFixtureLogic()
    return (
        <main className="min-h-screen bg-select-surface p-8 text-select-foreground">
            <h1 className="mb-6 text-xl">Grouped and creatable options</h1>
            <form
                aria-label="Grouped form"
                className="w-80"
                onSubmit={handler.handleSubmit}
            >
                {state.kind === 'select' ? (
                    <CustomSelect
                        label="Grouped choices"
                        name="choice"
                        options={state.options}
                        value={state.value?.value ?? ''}
                        onValueChange={handler.handleSelectChange}
                        virtualized={state.virtualized}
                        searchable={false}
                        locale="en"
                    />
                ) : (
                    <Combobox
                        id="grouped"
                        label="Grouped choices"
                        name="choice"
                        options={state.options}
                        value={state.value}
                        onValueChange={handler.handleValueChange}
                        searchValue={state.searchValue}
                        onSearchValueChange={handler.handleSearchChange}
                        getOptionKey={(option) => option.value}
                        getOptionLabel={(option) => option.label}
                        getOptionGroup={(option) => option.group}
                        isOptionDisabled={(option) => Boolean(option.disabled)}
                        onCreateOption={handler.handleCreate}
                        createOptionLabel={(query) => `Create ${query}`}
                        virtualized={state.virtualized}
                        filterMode={state.local ? 'local' : 'external'}
                        loading={state.loading}
                        disabled={state.disabled}
                        readOnly={state.readOnly}
                        locale="en"
                    />
                )}
                <button type="submit" className="mt-4 rounded border px-3 py-2">
                    Submit
                </button>
                <button
                    type="button"
                    className="m-2 rounded border px-3 py-2"
                    onClick={handler.handleAcceptCreation}
                >
                    Accept creation
                </button>
            </form>
            <output aria-label="Created query">{state.createdQuery}</output>
            <output aria-label="Selected key">
                {state.value?.value ?? ''}
            </output>
            <output aria-label="Submitted key">{state.submittedValue}</output>
        </main>
    )
}
