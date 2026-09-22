import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomSelect, SelectProvider } from '../index.js'

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
