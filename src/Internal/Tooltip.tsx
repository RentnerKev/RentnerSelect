import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { ReactElement, ReactNode } from 'react'

interface TooltipCustomDesign {
    baseClasses?: string
    animationClasses?: string
    contentClasses?: string
    arrowClasses?: string
}

const defaultTooltipDesign: Required<TooltipCustomDesign> = {
    baseClasses:
        'data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 rounded-lg border border-border-dark bg-surface-dark px-3 py-1.5 text-xs font-medium text-gray-200 shadow-xl data-[side=bottom]:slide-in-from-top-2',
    animationClasses: 'animate-in fade-in zoom-in-95',
    contentClasses: '',
    arrowClasses: 'fill-surface-dark stroke-border-dark',
}

interface TooltipProps {
    children: ReactElement
    content: ReactNode
    side?: 'top' | 'right' | 'bottom' | 'left'
    customDesign?: TooltipCustomDesign
}

export function CustomTooltip({
    children,
    content,
    side = 'top',
    customDesign,
}: TooltipProps) {
    const design = { ...defaultTooltipDesign, ...customDesign }

    return (
        <TooltipPrimitive.Provider>
            <TooltipPrimitive.Root delayDuration={200}>
                <TooltipPrimitive.Trigger asChild>
                    {children}
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                        sideOffset={8}
                        side={side}
                        className={`z-[9999] ${design.baseClasses} ${design.animationClasses} ${design.contentClasses}`}
                    >
                        {content}
                        <TooltipPrimitive.Arrow
                            width={12}
                            height={6}
                            className={design.arrowClasses}
                        />
                    </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    )
}
