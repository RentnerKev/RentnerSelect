import { useState } from 'react'
import type { FormEvent } from 'react'
import { useForm } from '@tanstack/react-form'
import { requiredValidator } from '../lib/Form/validation.ts'
import type {
    PlaygroundFormValues,
    PlaygroundLogicResult,
    PlaygroundFieldValidators,
} from '../Types/playground.types.ts'

const fieldValidators: PlaygroundFieldValidators = {
    firstName: { onSubmit: requiredValidator('Name') },
    email: { onSubmit: requiredValidator('E-Mail') },
    department: { onBlur: requiredValidator('Kontakt') },
    message: { onSubmit: requiredValidator('Nachricht') },
}

export function usePlaygroundLogic(): PlaygroundLogicResult {
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
    return {
        state: { submittedValues, fieldValidators },
        handler: { handleSubmit },
        form,
    }
}
