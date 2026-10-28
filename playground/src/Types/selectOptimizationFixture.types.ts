export interface SelectOptimizationFixtureProps {
    count?: number
    virtualized?: boolean
    work?: number
    initialIndex?: number
    onRenderOption?: (value: string) => void
    multiple?: boolean
    maxSelection?: number
}
