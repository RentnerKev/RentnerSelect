import { Combobox } from '../../../src/shared/Combobox/Components/Combobox.tsx'
import { CustomSelect } from '../../../src/shared/Select/Components/CustomSelect.tsx'
import { useExternalComboboxFixtureLogic } from '../Hooks/useExternalComboboxFixtureLogic.ts'
export function ExternalComboboxFixture() {
    const { state, handler, setter } = useExternalComboboxFixtureLogic()
    return (
        <main className="min-h-screen bg-select-surface p-8 text-select-foreground">
            <h1>External Combobox</h1>
            <form aria-label="Customer form" className="w-60">
                <Combobox
                    label="Customer"
                    name="customer"
                    description="Server-provided results"
                    value={state.value}
                    searchValue={state.searchValue}
                    onSearchValueChange={setter.setSearchValue}
                    onValueChange={handler.handleValueChange}
                    options={state.options}
                    getOptionKey={state.getOptionKey}
                    getOptionLabel={state.getOptionLabel}
                    getOptionDescription={state.getOptionDescription}
                    isOptionDisabled={state.isOptionDisabled}
                    onBlur={handler.handleBlur}
                    loading={state.loading}
                    clearable
                    controlSize="md"
                    textOverflow="wrap"
                    portalClassName="customer-portal"
                    portalZIndex={1234}
                    locale="en"
                />
                <output aria-label="Selected customer">
                    {state.value?.id ?? 'None'}
                </output>
                <output aria-label="Field blurs">{state.blurs}</output>
            </form>
            <button type="button" onClick={handler.handleLoading}>
                Toggle loading
            </button>
            <button type="button" onClick={handler.handleEmpty}>
                Toggle empty
            </button>
            <section className="mt-8 w-44">
                <CustomSelect
                    label="Wrapped select"
                    value="a"
                    onValueChange={() => undefined}
                    options={[
                        {
                            value: 'a',
                            label: 'A long option label that should wrap without descendant overrides',
                            subOption:
                                'Another long description that should stay readable',
                        },
                    ]}
                    textOverflow="wrap"
                    contentWidth="content"
                    searchable={false}
                    classNames={{
                        optionLabel: 'text-base text-rentner-accent',
                        optionDescription: 'text-xs text-rentner-muted',
                        selectedLabel: 'text-base',
                        selectedDescription: 'text-xs',
                    }}
                />
            </section>
        </main>
    )
}
