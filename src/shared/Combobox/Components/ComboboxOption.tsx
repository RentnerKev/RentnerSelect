/* oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/click-events-have-key-events -- APG option uses the combobox input for keyboard navigation. */
import type { ComboboxOptionProps } from '../Types/combobox.types.ts'

export default function ComboboxOption<T>({
    entry,
    state,
    handler,
    renderOption,
    index,
    setSize,
    measureElement,
    style,
}: ComboboxOptionProps<T>) {
    return (
        <div
            ref={measureElement}
            data-index={index}
            style={style}
            id={entry.id}
            role="option"
            tabIndex={-1}
            aria-posinset={index === undefined ? undefined : index + 1}
            aria-setsize={setSize}
            aria-selected={entry.selected}
            aria-disabled={entry.disabled || undefined}
            data-active={entry.id === state.activeId || undefined}
            data-disabled={entry.disabled || undefined}
            onMouseDown={handler.handleKeepFocus}
            onMouseMove={() => {
                if (!entry.disabled) handler.handleOptionActivate(entry.key)
            }}
            onClick={() => handler.handleOptionSelect(entry)}
            className={
                (style
                    ? 'relative col-start-1 row-start-1 w-full self-start '
                    : 'relative ') +
                'min-w-0 cursor-pointer outline-none data-disabled:cursor-not-allowed data-disabled:opacity-40 ' +
                (state.classNames.option ??
                    'rounded-lg px-3 py-2 text-sm data-active:bg-select-hover aria-selected:bg-select-hover')
            }
        >
            {renderOption ? (
                renderOption(entry.option, {
                    selected: entry.selected,
                    active: entry.id === state.activeId,
                    disabled: entry.disabled,
                })
            ) : (
                <div className="min-w-0">
                    <div
                        className={
                            (state.textOverflow === 'wrap'
                                ? 'whitespace-normal break-words '
                                : 'truncate ') +
                            (state.classNames.optionLabel ?? 'leading-5')
                        }
                    >
                        {entry.label}
                    </div>
                    {entry.description !== undefined &&
                        entry.description !== null && (
                            <div
                                className={
                                    (state.textOverflow === 'wrap'
                                        ? 'whitespace-normal break-words '
                                        : 'truncate ') +
                                    (state.classNames.optionDescription ??
                                        'text-xs text-select-muted')
                                }
                            >
                                {entry.description}
                            </div>
                        )}
                </div>
            )}
        </div>
    )
}
