import { afterEach, expect, mock, test } from 'bun:test'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
    StrictMode,
    Suspense,
    startTransition,
    useLayoutEffect,
    useRef,
    useState,
} from 'react'
import type { SelectOptionsProps } from '../../../../shared/Select/Types/select.types.ts'
import { CustomSelect } from '../../../../shared/Select/Components/CustomSelect.tsx'

afterEach(cleanup)

const options = Array.from({ length: 249 }, (_, index) => ({
    value: String(index),
    label: `Option ${String(index).padStart(3, '0')}`,
}))

function RowRenderHarness({
    renderOption,
}: Pick<SelectOptionsProps<string>, 'renderOption'>) {
    const [value, setValue] = useState<string[]>([])
    return (
        <CustomSelect
            label="Choices"
            value={value}
            onValueChange={setValue}
            multiple
            searchable={false}
            virtualized={false}
            options={options}
            renderOption={renderOption}
        />
    )
}

test('a stable custom renderer only recomputes the changed selection row', async () => {
    const user = userEvent.setup()
    const renderOption = mock((option: (typeof options)[number]) => (
        <span>{option.label}</span>
    ))
    render(<RowRenderHarness renderOption={renderOption} />)
    await user.click(screen.getByRole('combobox'))
    expect(renderOption).toHaveBeenCalledTimes(249)
    renderOption.mockClear()
    await user.click(screen.getByRole('option', { name: 'Option 000' }))
    expect(
        screen
            .getByRole('option', { name: 'Option 000' })
            .getAttribute('aria-selected'),
    ).toBe('true')
    expect(renderOption).toHaveBeenCalledTimes(1)
})

test('memoized contents retain current event callbacks and invalidate changed renderer closures', async () => {
    const user = userEvent.setup()
    const previous = mock()
    const current = mock()
    const renderer = mock((option: (typeof options)[number]) => (
        <span>{option.label}</span>
    ))
    const view = render(
        <StrictMode>
            <CustomSelect
                label="Choices"
                value={[]}
                onValueChange={previous}
                multiple
                searchable={false}
                options={options}
                renderOption={renderer}
            />
        </StrictMode>,
    )
    await user.click(screen.getByRole('combobox'))
    renderer.mockClear()
    view.rerender(
        <StrictMode>
            <CustomSelect
                label="Choices"
                value={[]}
                onValueChange={current}
                multiple
                searchable={false}
                options={options}
                renderOption={renderer}
            />
        </StrictMode>,
    )
    expect(renderer).not.toHaveBeenCalled()
    await user.click(screen.getByRole('option', { name: 'Option 001' }))
    expect(previous).not.toHaveBeenCalled()
    expect(current).toHaveBeenLastCalledWith(['1'])
    view.rerender(
        <CustomSelect
            label="Choices"
            value={[]}
            onValueChange={current}
            multiple
            searchable={false}
            options={options}
            renderOption={(option) => <span>Changed {option.label}</span>}
        />,
    )
    await user.click(screen.getByRole('combobox'))
    expect(
        screen.getByRole('option', { name: 'Changed Option 001' }),
    ).toBeTruthy()
})

function LayoutSelection() {
    const ref = useRef<HTMLSpanElement>(null)
    useLayoutEffect(() => {
        const row = ref.current?.closest<HTMLElement>('[role="option"]')
        row?.focus()
        row?.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
        )
    }, [])
    return <span ref={ref}>Layout selection</span>
}

test('descendant layout focus and selection use the current commit before parent layout effects', async () => {
    const user = userEvent.setup()
    const previous = mock()
    const current = mock()
    const view = render(
        <CustomSelect
            label="Choices"
            value={[]}
            onValueChange={previous}
            multiple
            searchable={false}
            options={options}
        />,
    )
    await user.click(screen.getByRole('combobox'))
    view.rerender(
        <CustomSelect
            label="Choices"
            value={[]}
            onValueChange={current}
            multiple
            searchable={false}
            options={options}
            renderOption={(option) =>
                option.value === '0' ? <LayoutSelection /> : option.label
            }
        />,
    )
    expect(previous).not.toHaveBeenCalled()
    expect(current).toHaveBeenLastCalledWith(['0'])
    expect(document.activeElement).toBe(
        screen.getByRole('option', { name: 'Layout selection' }),
    )
})

const suspended = new Promise<void>(() => undefined)
function PendingRender() {
    throw suspended
}
function ConcurrentHarness({
    previous,
    pending,
}: {
    previous: (value: string[]) => void
    pending: (value: string[]) => void
}) {
    const [version, setVersion] = useState(0)
    return (
        <>
            <button
                type="button"
                onClick={() => startTransition(() => setVersion(1))}
            >
                Start pending render
            </button>
            <button type="button" onClick={() => setVersion(0)}>
                Discard pending render
            </button>
            <Suspense fallback={<output>Suspended</output>}>
                <CustomSelect
                    label="Choices"
                    value={[]}
                    onValueChange={version ? pending : previous}
                    multiple
                    searchable={false}
                    options={options}
                />
                {version === 1 && <PendingRender />}
            </Suspense>
        </>
    )
}

test('a suspended then discarded render never publishes its callbacks to committed rows', async () => {
    const user = userEvent.setup()
    const previous = mock()
    const pending = mock()
    render(
        <StrictMode>
            <ConcurrentHarness previous={previous} pending={pending} />
        </StrictMode>,
    )
    await user.click(screen.getByRole('combobox'))
    await act(async () => {
        fireEvent.click(
            screen.getByRole('button', { name: 'Start pending render' }),
        )
    })
    expect(screen.queryByText('Suspended')).toBeNull()
    await user.click(screen.getByRole('option', { name: 'Option 002' }))
    expect(previous).toHaveBeenLastCalledWith(['2'])
    expect(pending).not.toHaveBeenCalled()
    fireEvent.click(
        screen.getByRole('button', { name: 'Discard pending render' }),
    )
    await user.click(screen.getByRole('option', { name: 'Option 003' }))
    expect(previous).toHaveBeenLastCalledWith(['3'])
    expect(pending).not.toHaveBeenCalled()
})

test('maxSelection, changed options and visual slots invalidate the affected contents', async () => {
    const user = userEvent.setup()
    const renderer = mock(
        (option: (typeof options)[number], state: { disabled: boolean }) => (
            <span>
                {option.label}
                {state.disabled ? ' blocked' : ''}
            </span>
        ),
    )
    const view = render(
        <CustomSelect
            label="Choices"
            value={['0']}
            onValueChange={() => undefined}
            multiple
            searchable={false}
            maxSelection={1}
            options={options}
            renderOption={renderer}
        />,
    )
    await user.click(screen.getByRole('combobox'))
    expect(
        screen.getByRole('option', { name: 'Option 001 blocked' }),
    ).toBeTruthy()
    renderer.mockClear()
    view.rerender(
        <CustomSelect
            label="Choices"
            value={[]}
            onValueChange={() => undefined}
            multiple
            searchable={false}
            maxSelection={1}
            options={options}
            renderOption={renderer}
        />,
    )
    expect(renderer).toHaveBeenCalledTimes(249)
    expect(
        screen
            .getByRole('option', { name: 'Option 001' })
            .getAttribute('aria-disabled'),
    ).toBeNull()
    const changed = options.slice()
    const replacement = {
        ...options[1]!,
        label: 'Updated label',
        subOption: 'Updated detail',
    }
    changed[1] = replacement
    view.rerender(
        <CustomSelect
            label="Choices"
            value={[]}
            onValueChange={() => undefined}
            multiple
            searchable={false}
            options={changed}
            textOverflow="wrap"
            classNames={{
                optionLabel: 'current-label',
                optionDescription: 'current-description',
            }}
        />,
    )
    const row = screen.getByRole('option', {
        name: 'Updated label Updated detail',
    })
    expect(row.querySelector('.current-label')?.className).toContain(
        'whitespace-normal',
    )
    expect(row.querySelector('.current-description')?.textContent).toBe(
        'Updated detail',
    )
})

test('memoization observes typed option field changes even when a parent reuses option objects', async () => {
    const user = userEvent.setup()
    const mutableOptions = [
        {
            value: 0 as number | string,
            label: 'Before',
            subOption: 'Before detail',
        },
    ]
    const renderer = mock((option: (typeof mutableOptions)[number]) => (
        <span>{`${option.label} ${option.subOption} ${typeof option.value}`}</span>
    ))
    const view = render(
        <CustomSelect
            label="Choices"
            value={[]}
            onValueChange={() => undefined}
            multiple
            searchable={false}
            options={mutableOptions}
            renderOption={renderer}
        />,
    )
    await user.click(screen.getByRole('combobox'))
    mutableOptions[0]!.label = 'After'
    mutableOptions[0]!.subOption = 'After detail'
    mutableOptions[0]!.value = '0'
    renderer.mockClear()
    view.rerender(
        <CustomSelect
            label="Choices"
            value={[]}
            onValueChange={() => undefined}
            multiple
            searchable={false}
            options={mutableOptions}
            renderOption={renderer}
        />,
    )
    expect(renderer).toHaveBeenCalledTimes(1)
    expect(
        screen.getByRole('option', { name: 'After After detail string' }),
    ).toBeTruthy()
})
