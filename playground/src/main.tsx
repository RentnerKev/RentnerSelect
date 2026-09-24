import { useForm } from '@tanstack/react-form'
import {
    BriefcaseBusiness,
    Mail,
    MessageSquareText,
    UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CustomSelect } from '../../src'
import './styles.css'

type PlaygroundInputProps = {
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

function CustomInput({
    type = 'text',
    rows,
    icon: _icon,
    showLength: _showLength,
    customDesign: _customDesign,
    showPasswordStrength: _showPasswordStrength,
    minValue: _minValue,
    maxValue: _maxValue,
    minuteStep: _minuteStep,
    onChange,
    ...props
}: PlaygroundInputProps) {
    if (type === 'textarea') {
        return <textarea {...props} rows={rows} onChange={onChange} />
    }

    return <input {...props} type={type} onChange={onChange} />
}

const roleOptions = [
    {
        value: 'max-mustermann',
        label: 'Max - Mustermann',
        subOption: 'Musterstraße 12, 10115 Berlin',
    },
    {
        value: 'erika-musterfrau',
        label: 'Erika - Musterfrau',
        subOption: 'Hafenweg 4, 20457 Hamburg',
    },
    {
        value: 'tim-schneider',
        label: 'Tim - Schneider',
        subOption: 'Königsallee 22, 40212 Düsseldorf',
    },
    {
        value: 'sara-fischer',
        label: 'Sara - Fischer',
        subOption: 'Leopoldstraße 9, 80802 München',
    },
]

type PlaygroundFormValues = {
    firstName: string
    email: string
    department: string
    message: string
}

const requiredValidator =
    (label: string) =>
    ({ value }: { value: string }) =>
        value.trim().length === 0 ? `${label} ist erforderlich.` : undefined

function FieldError({ errors }: { errors: Array<unknown> }) {
    if (errors.length === 0) {
        return null
    }

    return (
        <p className="text-sm font-medium text-red-300">{String(errors[0])}</p>
    )
}

function App() {
    const [submittedValues, setSubmittedValues] =
        useState<PlaygroundFormValues | null>(null)

    const form = useForm({
        defaultValues: {
            firstName: '',
            email: '',
            department: '',
            message: '',
        } as PlaygroundFormValues,
        onSubmit: ({ value }) => {
            setSubmittedValues(value)
        },
    })

    return (
        <main className="min-h-screen bg-[#101419] px-6 py-10 text-gray-200">
            <div className="mx-auto flex max-w-5xl flex-col gap-8">
                <header className="flex flex-col gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                        TanStack Form + RentnerSelect
                    </p>
                    <h1 className="text-3xl font-bold tracking-normal text-white">
                        Playground Formular
                    </h1>
                    <p className="max-w-2xl text-sm text-secondary-text">
                        Öfters brauche ich ein kleines Beispiel, das Eingaben,
                        Auswahl und Textfläche sauber zusammenführt.
                    </p>
                </header>

                <form
                    className="grid gap-6 md:grid-cols-[minmax(0,1fr)_20rem]"
                    onSubmit={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        void form.handleSubmit()
                    }}
                >
                    <section className="grid gap-5 rounded-lg border border-border-dark bg-surface-dark p-5">
                        <div className="grid gap-5 md:grid-cols-2">
                            <form.Field
                                name="firstName"
                                validators={{
                                    onSubmit: requiredValidator('Name'),
                                }}
                            >
                                {(field) => (
                                    <div className="flex flex-col gap-2">
                                        <label
                                            className="text-[11px] font-bold uppercase tracking-wider text-gray-400"
                                            htmlFor={field.name}
                                        >
                                            Name
                                        </label>
                                        <CustomInput
                                            id={field.name}
                                            value={field.state.value}
                                            onChange={(event) =>
                                                field.handleChange(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Dein Name"
                                            required
                                            icon={
                                                <UserRound className="h-4 w-4" />
                                            }
                                        />
                                        <FieldError
                                            errors={field.state.meta.errors}
                                        />
                                    </div>
                                )}
                            </form.Field>

                            <form.Field
                                name="email"
                                validators={{
                                    onSubmit: requiredValidator('E-Mail'),
                                }}
                            >
                                {(field) => (
                                    <div className="flex flex-col gap-2">
                                        <label
                                            className="text-[11px] font-bold uppercase tracking-wider text-gray-400"
                                            htmlFor={field.name}
                                        >
                                            E-Mail
                                        </label>
                                        <CustomInput
                                            id={field.name}
                                            value={field.state.value}
                                            onChange={(event) =>
                                                field.handleChange(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="mail@beispiel.de"
                                            type="email"
                                            required
                                            icon={<Mail className="h-4 w-4" />}
                                        />
                                        <FieldError
                                            errors={field.state.meta.errors}
                                        />
                                    </div>
                                )}
                            </form.Field>
                        </div>

                        <form.Field name="department">
                            {(field) => (
                                <div className="flex flex-col gap-2">
                                    <label
                                        className="text-[11px] font-bold uppercase tracking-wider text-gray-400"
                                        htmlFor={field.name}
                                    >
                                        Kontakt
                                    </label>
                                    <CustomSelect
                                        id={field.name}
                                        name={field.name}
                                        value={field.state.value}
                                        onValueChange={(value) =>
                                            field.handleChange(value)
                                        }
                                        clearable
                                        onClear={() => field.handleChange('')}
                                        options={roleOptions}
                                        placeholder="Kontakt auswählen"
                                        required
                                        className="w-full h-12"
                                        icon={
                                            <BriefcaseBusiness className="h-4 w-4" />
                                        }
                                        minSelection={2}
                                        maxSelection={3}
                                    />
                                </div>
                            )}
                        </form.Field>

                        <form.Field
                            name="message"
                            validators={{
                                onSubmit: requiredValidator('Nachricht'),
                            }}
                        >
                            {(field) => (
                                <div className="flex flex-col gap-2">
                                    <label
                                        className="text-[11px] font-bold uppercase tracking-wider text-gray-400"
                                        htmlFor={field.name}
                                    >
                                        Nachricht
                                    </label>
                                    <CustomInput
                                        id={field.name}
                                        value={field.state.value}
                                        onChange={(event) =>
                                            field.handleChange(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Schreibe eine kurze Nachricht"
                                        type="textarea"
                                        rows={5}
                                        required
                                        showLength
                                        maxLength={280}
                                        icon={
                                            <MessageSquareText className="h-4 w-4" />
                                        }
                                    />
                                    <FieldError
                                        errors={field.state.meta.errors}
                                    />
                                </div>
                            )}
                        </form.Field>

                        <form.Subscribe
                            selector={(state) => [
                                state.canSubmit,
                                state.isSubmitting,
                            ]}
                        >
                            {([canSubmit, isSubmitting]) => (
                                <button
                                    className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-[#101419] transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 md:w-fit"
                                    disabled={!canSubmit || isSubmitting}
                                    type="submit"
                                >
                                    {isSubmitting
                                        ? 'Wird gesendet…'
                                        : 'Absenden'}
                                </button>
                            )}
                        </form.Subscribe>
                    </section>

                    <aside className="rounded-lg border border-border-dark bg-surface-dark p-5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Submit-Werte
                        </p>
                        <pre className="mt-3 min-h-52 overflow-auto rounded-md border border-border-dark bg-background-dark p-3 text-xs leading-6 text-gray-300">
                            {submittedValues
                                ? JSON.stringify(submittedValues, null, 2)
                                : 'Noch keine Daten abgesendet.'}
                        </pre>
                    </aside>
                </form>
            </div>
        </main>
    )
}

createRoot(document.getElementById('root')!).render(<App />)
