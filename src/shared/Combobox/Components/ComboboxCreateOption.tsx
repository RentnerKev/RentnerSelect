/* oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/click-events-have-key-events -- The owning combobox input handles keyboard selection through aria-activedescendant. */
import type { ComboboxCreateOptionProps } from '../Types/combobox.types.ts'

export default function ComboboxCreateOption({
    state,
    handler,
}: ComboboxCreateOptionProps) {
    return (
        <div
            id={state.createId}
            role="option"
            tabIndex={-1}
            aria-selected={false}
            aria-posinset={state.entries.length + 1}
            aria-setsize={state.entries.length + 1}
            data-active={state.createActive || undefined}
            onMouseDown={handler.handleKeepFocus}
            onMouseMove={handler.handleCreateActivate}
            onClick={handler.handleCreateOption}
            className={
                state.classNames.createOption ??
                'cursor-pointer rounded-lg px-3 py-2 text-sm text-select-foreground data-active:bg-select-hover'
            }
        >
            {state.createLabel}
        </div>
    )
}
