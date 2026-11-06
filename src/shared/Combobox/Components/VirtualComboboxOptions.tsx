/* oxlint-disable react/refs -- TanStack Virtual measureElement is a commit-phase ref callback, not a render-time ref read. */
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- APG listbox contains custom options while focus remains on the combobox input. */
import useVirtualComboboxOptionsLogic from '../Hooks/useVirtualComboboxOptionsLogic.ts'
import type { VirtualComboboxOptionsProps } from '../Types/combobox.types.ts'
import ComboboxOption from './ComboboxOption.tsx'
import ComboboxCreateOption from './ComboboxCreateOption.tsx'

export default function VirtualComboboxOptions<T>(
    props: VirtualComboboxOptionsProps<T>,
) {
    const { state, refs, virtualizer } = useVirtualComboboxOptionsLogic(props)
    return (
        <div
            ref={refs.viewport}
            id={props.state.listId}
            role="listbox"
            aria-label={props.ariaLabel}
            aria-labelledby={props.state.labelledBy}
            aria-busy={props.loading || undefined}
            className={
                'min-h-0 overflow-y-auto ' +
                (props.state.classNames.viewport ?? '')
            }
            style={{ height: state.height }}
        >
            <div
                role="presentation"
                className="relative grid w-full grid-rows-[0px]"
                style={{ height: state.totalSize }}
            >
                {state.rows.map(({ item, entry }) => (
                    <div
                        key={entry.key}
                        role={entry.group ? 'group' : 'presentation'}
                        aria-label={entry.group}
                        ref={virtualizer.measureElement}
                        data-index={item.index}
                        className={
                            'relative col-start-1 row-start-1 w-full self-start ' +
                            (props.state.classNames.group ?? '')
                        }
                        style={{ transform: `translateY(${item.start}px)` }}
                    >
                        {entry.group &&
                            entry.group !==
                                props.state.entries[item.index - 1]?.group && (
                                <div
                                    aria-hidden="true"
                                    className={
                                        props.state.classNames.groupLabel ??
                                        'px-3 py-2 text-xs font-semibold text-select-muted'
                                    }
                                >
                                    {entry.group}
                                </div>
                            )}
                        <ComboboxOption
                            entry={entry}
                            state={props.state}
                            handler={props.handler}
                            renderOption={props.renderOption}
                            index={item.index}
                            setSize={
                                props.state.entries.length +
                                (props.state.canCreate ? 1 : 0)
                            }
                        />
                    </div>
                ))}
            </div>
            {props.state.canCreate && (
                <ComboboxCreateOption
                    state={props.state}
                    handler={props.handler}
                />
            )}
        </div>
    )
}
