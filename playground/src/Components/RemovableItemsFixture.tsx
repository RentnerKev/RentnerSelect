import { CustomSelect } from '../../../src/shared/Select/Components/CustomSelect.tsx'
import { useRemovableItemsFixtureLogic } from '../Hooks/useRemovableItemsFixtureLogic.ts'

export function RemovableItemsFixture() {
    const { state, handler } = useRemovableItemsFixtureLogic()
    return (
        <main className="min-h-screen bg-select-surface p-4 text-select-foreground">
            <h1 className="mb-6 text-xl">Remove selected items</h1>
            <form
                aria-label="Removal form"
                className="w-full max-w-80"
                onSubmit={handler.handleSubmit}
            >
                <CustomSelect
                    multiple
                    id="removal-choices"
                    name="choice"
                    label="Selected choices"
                    value={state.value}
                    onValueChange={handler.handleValueChange}
                    options={state.options}
                    removableSelectedItems={state.enabled}
                    clearable
                    required={state.required}
                    disabled={state.disabled}
                    readOnly={state.readOnly}
                    searchable={false}
                    textOverflow="wrap"
                    renderValue={
                        state.custom
                            ? () => <span>Custom selection</span>
                            : undefined
                    }
                    onBlur={handler.handleBlur}
                    locale={state.locale}
                    messages={
                        state.override
                            ? {
                                  clickToRemove: 'Remove this entry',
                                  removeSelectedItem: (label) =>
                                      `Delete ${label}`,
                              }
                            : undefined
                    }
                />
                <button type="submit" className="mt-4 rounded border px-3 py-2">
                    Submit
                </button>
                <button type="button" className="m-2 rounded border px-3 py-2">
                    Outside
                </button>
            </form>
            <output aria-label="Selected keys">
                {JSON.stringify(state.value)}
            </output>
            <output aria-label="Change count">{state.changes}</output>
            <output aria-label="Blur count">{state.blurCount}</output>
            <output aria-label="Focused during change">
                {String(state.focusedDuringChange)}
            </output>
            <output aria-label="Submitted keys">
                {JSON.stringify(state.submitted)}
            </output>
        </main>
    )
}
