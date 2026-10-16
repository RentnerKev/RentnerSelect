import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomSelect } from '../../../../shared/Select/Components/CustomSelect.tsx'
import { SelectProvider } from '../../../../shared/Select/Components/SelectProvider.tsx'

afterEach(cleanup)

describe('project customization', () => {
    test('uses provider defaults while allowing per-select overrides', async () => {
        const user = userEvent.setup()
        const onValueChange = mock(() => undefined)

        render(
            <SelectProvider
                locale="fr"
                searchable={false}
                nonce="project-nonce"
                classNames={{
                    trigger: 'project-trigger',
                    option: 'project-option',
                }}
            >
                <CustomSelect
                    value=""
                    onValueChange={onValueChange}
                    options={[{ value: 'one', label: 'One' }]}
                    placeholder="Choose"
                />
            </SelectProvider>,
        )

        const trigger = screen.getByRole('combobox')
        expect(trigger.className).toContain('project-trigger')
        await user.click(trigger)
        expect(
            screen.queryByRole('textbox', { name: 'Rechercher des options' }),
        ).toBeNull()
        expect(screen.getByRole('option', { name: 'One' }).className).toContain(
            'project-option',
        )
        const viewportStyle = [...document.querySelectorAll('style')].find(
            (style) =>
                style.textContent?.includes('[data-radix-select-viewport]'),
        )
        expect(viewportStyle?.getAttribute('nonce')).toBe('project-nonce')

        await user.click(screen.getByRole('option', { name: 'One' }))
        expect(onValueChange).toHaveBeenCalledWith('one')
    })

    test('inherits outer provider defaults in nested providers', async () => {
        const user = userEvent.setup()

        render(
            <SelectProvider
                locale="fr"
                searchable={false}
                classNames={{
                    trigger: 'outer-trigger',
                    option: 'outer-option',
                }}
            >
                <SelectProvider classNames={{ trigger: 'inner-trigger' }}>
                    <CustomSelect
                        value=""
                        onValueChange={() => undefined}
                        options={[{ value: 'one', label: 'One' }]}
                    />
                </SelectProvider>
            </SelectProvider>,
        )

        const trigger = screen.getByRole('combobox')
        expect(trigger.className).toContain('inner-trigger')
        await user.click(trigger)
        expect(screen.queryByRole('textbox')).toBeNull()
        expect(screen.getByRole('option', { name: 'One' }).className).toContain(
            'outer-option',
        )
    })

    test('renders option content, respects disabled items, and forwards blur', async () => {
        const user = userEvent.setup()
        const onBlur = mock(() => undefined)
        const onValueChange = mock(() => undefined)

        render(
            <SelectProvider searchable={false}>
                <CustomSelect
                    value="de"
                    onValueChange={onValueChange}
                    options={[
                        { value: 'de', label: 'Deutsch' },
                        { value: 'en', label: 'English', disabled: true },
                    ]}
                    onBlur={onBlur}
                    renderOption={(option) => (
                        <span>
                            <span aria-hidden="true">
                                {option.value.toUpperCase()}
                            </span>
                            {option.label}
                        </span>
                    )}
                    renderValue={(options) => (
                        <span data-testid="custom-value">
                            {options[0]?.label}
                        </span>
                    )}
                    searchable
                    classNames={{ option: 'local-option' }}
                />
            </SelectProvider>,
        )

        const trigger = screen.getByRole('combobox')
        expect(screen.getByTestId('custom-value').textContent).toBe('Deutsch')
        fireEvent.blur(trigger)
        expect(onBlur).toHaveBeenCalledTimes(1)
        await user.click(trigger)
        expect(
            screen.getByRole('textbox', { name: 'Optionen suchen' }),
        ).toBeTruthy()
        expect(
            screen.getByRole('option', { name: 'Deutsch' }).className,
        ).toContain('local-option')
        const disabled = screen.getByRole('option', { name: 'English' })
        expect(disabled.getAttribute('data-disabled')).toBe('')
        expect(disabled.textContent).toContain('EN')
        await user.click(disabled)
        expect(onValueChange).not.toHaveBeenCalled()
    })
})

describe('required field semantics', () => {
    test.each([undefined, null, '', 'Choose a department'])(
        'announces a required field with external error %s',
        (error) => {
            const { container } = render(
                <CustomSelect
                    name="department"
                    label="Department"
                    value=""
                    onValueChange={() => undefined}
                    options={[]}
                    required
                    error={error}
                />,
            )

            expect(
                screen.getByRole('combobox').getAttribute('aria-required'),
            ).toBe('true')
            const input = container.querySelector<HTMLInputElement>(
                'input[name="department"]',
            )!
            expect(input.required).toBe(error === undefined)
            expect(input.validationMessage).toBe(
                error ??
                    (error === undefined ? 'Dieses Feld ist erforderlich' : ''),
            )
        },
    )

    test.each([null, 'External error'])(
        'does not mark optional or disabled fields required with error %s',
        (error) => {
            const { rerender } = render(
                <CustomSelect
                    label="Department"
                    value=""
                    onValueChange={() => undefined}
                    options={[]}
                    error={error}
                />,
            )
            expect(
                screen.getByRole('combobox').hasAttribute('aria-required'),
            ).toBe(false)

            rerender(
                <CustomSelect
                    label="Department"
                    value=""
                    onValueChange={() => undefined}
                    options={[]}
                    error={error}
                    required
                    disabled
                />,
            )
            const trigger = screen.getByRole('combobox')
            expect(trigger.hasAttribute('aria-required')).toBe(false)
            expect(trigger.hasAttribute('disabled')).toBe(true)
        },
    )
    test.each([true, false, 'true', 'false'] as const)(
        "preserves an optional field's explicit aria-required=%s",
        (ariaRequired) => {
            render(
                <CustomSelect
                    value=""
                    onValueChange={() => undefined}
                    options={[]}
                    error={null}
                    aria-required={ariaRequired}
                />,
            )

            expect(
                screen.getByRole('combobox').getAttribute('aria-required'),
            ).toBe(String(ariaRequired))
        },
    )

    test('does not let an explicit false hide a required field', () => {
        render(
            <CustomSelect
                value=""
                onValueChange={() => undefined}
                options={[]}
                required
                error={null}
                aria-required={false}
            />,
        )

        expect(screen.getByRole('combobox').getAttribute('aria-required')).toBe(
            'true',
        )
    })
})
