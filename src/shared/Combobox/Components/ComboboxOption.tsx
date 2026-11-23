/* oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/click-events-have-key-events -- APG option uses the combobox input for keyboard navigation. */
import { memo } from 'react'
import type { ComboboxOptionProps } from '../Types/combobox.types.ts'

function ComboboxOptionTemplate<T>({
    entry,
    state,
    handler,
    renderOption,
    index,
    setSize,
    measureElement,
    style,
}: ComboboxOptionProps<T>) {
    const active = entry.id === state.activeId
    const overflow =
        state.textOverflow === 'wrap'
            ? 'whitespace-normal break-words '
            : 'truncate '
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
            data-active={active || undefined}
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
                    active,
                    disabled: entry.disabled,
                })
            ) : (
                <div className="min-w-0">
                    <div
                        className={
                            overflow +
                            (state.classNames.optionLabel ?? 'leading-5')
                        }
                    >
                        {entry.label}
                    </div>
                    {entry.description != null && (
                        <div
                            className={
                                overflow +
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

export default /* @__PURE__ */ memo(
    ComboboxOptionTemplate,
    (a, b) =>
        a.entry === b.entry &&
        (a.entry.id === a.state.activeId) ===
            (b.entry.id === b.state.activeId) &&
        a.state.classNames === b.state.classNames &&
        a.state.textOverflow === b.state.textOverflow &&
        a.handler.handleOptionSelect === b.handler.handleOptionSelect &&
        a.renderOption === b.renderOption &&
        a.index === b.index &&
        a.setSize === b.setSize &&
        a.measureElement === b.measureElement &&
        a.style === b.style,
) as typeof ComboboxOptionTemplate
