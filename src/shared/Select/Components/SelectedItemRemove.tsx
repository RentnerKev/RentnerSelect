import { lazy, Suspense } from 'react'
import { useSelectedItemRemoveLogic } from '../Hooks/useSelectedItemRemoveLogic.ts'
import type {
    SelectedItemRemoveProps,
    SelectedItemTooltipFallbackProps,
} from '../Types/selectedItemRemove.types.ts'

function TooltipFallback({ children }: SelectedItemTooltipFallbackProps) {
    return children
}

const LazyTooltip = /* @__PURE__ */ lazy(() =>
    import('@rentnerkev/tooltips')
        .then(({ CustomTooltip }) => ({ default: CustomTooltip }))
        .catch(() => ({ default: TooltipFallback })),
)

export function getSelectedItemClassName(className?: string, disabled = false) {
    return `inline-block max-w-full bg-transparent p-0 text-inherit align-baseline ${disabled ? 'pointer-events-none' : 'group/selected-item pointer-events-auto cursor-pointer'} ${className ?? (disabled ? '' : 'rounded-sm hover:opacity-80 focus-visible:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rentner-accent/50 motion-safe:transition-[opacity,transform] motion-safe:hover:scale-[0.98] motion-safe:focus-visible:scale-[0.98]')}`
}

export function SelectedItemRemove({
    optionKey,
    label,
    removeLabel,
    tooltipText,
    className,
    onRemove,
}: SelectedItemRemoveProps) {
    const { state, handler, refs } = useSelectedItemRemoveLogic({
        optionKey,
        onRemove,
    })
    const { button } = refs
    const labelElement = (
        <span
            className={
                'pointer-events-none ' +
                (className === undefined
                    ? 'decoration-rentner-danger decoration-2 group-hover/selected-item:line-through group-focus-visible/selected-item:line-through'
                    : '')
            }
        >
            {label}
        </span>
    )

    return (
        <button
            type="button"
            ref={button}
            aria-label={removeLabel}
            aria-describedby={state.descriptionId}
            onMouseEnter={handler.handleMouseEnter}
            onMouseLeave={handler.handleMouseLeave}
            onFocus={handler.handleFocus}
            onBlur={handler.handleBlur}
            onClick={handler.handleClick}
            className={getSelectedItemClassName(className)}
        >
            <span
                id={state.descriptionId}
                className="pointer-events-none sr-only"
            >
                {tooltipText}
            </span>
            {state.open ? (
                <Suspense fallback={labelElement}>
                    <LazyTooltip
                        open={state.open}
                        content={tooltipText}
                        side="bottom"
                    >
                        {labelElement}
                    </LazyTooltip>
                </Suspense>
            ) : (
                labelElement
            )}
        </button>
    )
}
