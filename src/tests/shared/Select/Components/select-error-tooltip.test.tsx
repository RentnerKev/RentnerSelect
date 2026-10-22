import { afterEach, describe, expect, test } from 'bun:test'
import {
    fireEvent,
    cleanup,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import { spawnSync } from 'bun'
import { SelectErrorTooltip } from '../../../../shared/Select/Components/SelectErrorTooltip.tsx'

afterEach(cleanup)

describe('lazy select error tooltip', () => {
    test('renders the icon during SSR before the tooltip module resolves', () => {
        // A fresh process avoids React.lazy's shared cache from other select tests.
        const componentUrl = new URL(
            '../../../../shared/Select/Components/SelectErrorTooltip.tsx',
            import.meta.url,
        ).href
        const script = `
            import { createElement } from 'react'
            import { renderToString } from 'react-dom/server'
            import { SelectErrorTooltip } from ${JSON.stringify(componentUrl)}
            process.stdout.write(renderToString(
                createElement(SelectErrorTooltip, { content: 'Choose a country' },
                    createElement('svg', { className: 'h-4 w-4', 'aria-label': 'Country error' }),
                ),
            ))
        `
        const result = spawnSync([process.execPath, '-e', script])
        expect(result.exitCode).toBe(0)
        const markup = result.stdout.toString()
        expect(markup).toContain('<svg')
        expect(markup).toContain('class="h-4 w-4"')
        expect(markup).toContain('aria-label="Country error"')
        expect(markup).not.toContain('data-state=')
    })
    test('preserves the icon and associated error when the tooltip becomes available', async () => {
        const field = (
            <>
                <input
                    aria-label="Country"
                    aria-errormessage="country-error"
                    aria-invalid="true"
                />
                <SelectErrorTooltip content="Choose a country">
                    <button type="button" aria-label="Country error">
                        <svg aria-hidden="true" className="h-4 w-4">
                            <circle cx="8" cy="8" r="7" />
                        </svg>
                    </button>
                </SelectErrorTooltip>
                <span id="country-error" className="sr-only" aria-live="polite">
                    Choose a country
                </span>
            </>
        )

        render(field)
        const initialTrigger = screen.getByRole('button', {
            name: 'Country error',
        })
        expect(initialTrigger.querySelector('svg')?.getAttribute('class')).toBe(
            'h-4 w-4',
        )

        const input = screen.getByRole('textbox', { name: 'Country' })
        const errorId = input.getAttribute('aria-errormessage')
        expect(document.getElementById(errorId ?? '')?.textContent).toBe(
            'Choose a country',
        )

        await waitFor(() => {
            expect(
                screen
                    .getByRole('button', { name: 'Country error' })
                    .getAttribute('data-state'),
            ).toBe('closed')
        })
        const loadedTrigger = screen.getByRole('button', {
            name: 'Country error',
        })
        expect(loadedTrigger.querySelector('svg')?.getAttribute('class')).toBe(
            'h-4 w-4',
        )
        fireEvent.focus(loadedTrigger)
        expect((await screen.findByRole('tooltip')).textContent).toContain(
            'Choose a country',
        )
        expect(input.getAttribute('aria-errormessage')).toBe(errorId)
    })
})
