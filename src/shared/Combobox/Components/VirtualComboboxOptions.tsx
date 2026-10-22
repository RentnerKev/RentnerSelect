/* oxlint-disable react/refs -- TanStack Virtual measureElement is a commit-phase ref callback, not a render-time ref read. */
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- APG listbox contains custom options while focus remains on the combobox input. */
import useVirtualComboboxOptionsLogic from '../Hooks/useVirtualComboboxOptionsLogic.ts'
import type { VirtualComboboxOptionsProps } from '../Types/combobox.types.ts'
import ComboboxOption from './ComboboxOption.tsx'

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
                    <ComboboxOption
                        key={entry.key}
                        entry={entry}
                        state={props.state}
                        handler={props.handler}
                        renderOption={props.renderOption}
                        index={item.index}
                        setSize={props.state.entries.length}
                        measureElement={virtualizer.measureElement}
                        style={{ transform: `translateY(${item.start}px)` }}
                    />
                ))}
            </div>
        </div>
    )
}
