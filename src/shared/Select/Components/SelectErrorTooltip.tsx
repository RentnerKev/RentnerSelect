import { lazy, Suspense } from 'react'
import type { SelectErrorTooltipProps } from '../Types/selectErrorTooltip.types.ts'

function TooltipFallback({
    children,
}: Pick<SelectErrorTooltipProps, 'children'>) {
    return children
}

const LazyTooltip = /* @__PURE__ */ lazy(() =>
    import('@rentnerkev/tooltips')
        .then(({ CustomTooltip }) => ({ default: CustomTooltip }))
        .catch(() => ({ default: TooltipFallback })),
)

export function SelectErrorTooltip({
    children,
    content,
}: SelectErrorTooltipProps) {
    return (
        <Suspense fallback={children}>
            <LazyTooltip content={content} side="bottom">
                {children}
            </LazyTooltip>
        </Suspense>
    )
}
