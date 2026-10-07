import type * as React from 'react'

export type PlaygroundInputProps = {
    id?: string
    value: string
    placeholder?: string
    required?: boolean
    minLength?: number
    maxLength?: number
    className?: string
    type?: React.HTMLInputTypeAttribute | 'textarea'
    rows?: number
    icon?: React.ReactNode
    showLength?: boolean
    customDesign?: unknown
    showPasswordStrength?: boolean
    minValue?: number
    maxValue?: number
    minuteStep?: number
    onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => void
}

export type PlaygroundFormValues = {
    firstName: string
    email: string
    department: Array<string>
    message: string
}

export type DynamicChoice = { id: string }
export type DynamicOptionsMode =
    | 'reorder'
    | 'remove-searchable'
    | 'remove-static'
    | 'remove-static-remaining'
