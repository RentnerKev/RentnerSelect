import { useState } from 'react'
import type { FormEvent } from 'react'
import { useForm } from '@tanstack/react-form'
import type { PlaygroundFormValues } from '../Types/playground.types'

export function usePlaygroundLogic() {
    const [submittedValues, setSubmittedValues] =
        useState<PlaygroundFormValues | null>(null)

    const form = useForm({
        defaultValues: {
            firstName: '',
            email: '',
            department: [],
            message: '',
        } as PlaygroundFormValues,
        onSubmit: ({ value }) => {
            setSubmittedValues(value)
        },
    })

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
    }
    return { state: { submittedValues }, handler: { handleSubmit }, form }
}
