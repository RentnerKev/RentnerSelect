# @rentnerkev/select

An accessible, searchable React select for typed single and multiple selection, native form integration, validation, localization, and Tailwind CSS styling.

## Installation

Install the package with npm:

```bash
npm install @rentnerkev/select
```

Or with Bun:

```bash
bun add @rentnerkev/select
```

## Quick start

`CustomSelect<TValue>` infers its value type from `value` and `options`, so the change handler remains typed without casts.

```tsx
import { CustomSelect, type Option } from '@rentnerkev/select'
import { useState } from 'react'

const contactOptions = [
    {
        value: 'alex-morgan',
        label: 'Alex Morgan',
        subOption: 'Customer success',
    },
    {
        value: 'sam-rivera',
        label: 'Sam Rivera',
        subOption: 'Technical support',
    },
] satisfies ReadonlyArray<Option<string>>

export function ContactSelect() {
    const [contact, setContact] = useState('')

    return (
        <CustomSelect
            id="contact"
            name="contact"
            label="Contact"
            value={contact}
            onValueChange={setContact}
            options={contactOptions}
            placeholder="Choose a contact"
            required
        />
    )
}
```

## Generic values

Strings, numbers, booleans, and objects are supported. Use `isOptionEqualToValue` to define equality for object values and `getFormValue` to serialize values for native form submission. Without `getFormValue`, the component uses `String(value)`.

```tsx
import { CustomSelect, type Option } from '@rentnerkev/select'
import { useState } from 'react'

const statuses = ['todo', 'done'] as const
type Status = (typeof statuses)[number]

const statusOptions = statuses.map((status) => ({
    value: status,
    label: status === 'todo' ? 'To do' : 'Done',
})) satisfies ReadonlyArray<Option<Status>>

export function StatusSelect() {
    const [status, setStatus] = useState<Status>('todo')

    return (
        <CustomSelect
            value={status}
            onValueChange={setStatus}
            options={statusOptions}
        />
    )
}
```

## Multiple selection

The current multiple-selection API uses an array, preserving values that contain commas:

```tsx
import { CustomSelect } from '@rentnerkev/select'
import { useState } from 'react'

export function RegionSelect() {
    const [regions, setRegions] = useState<Array<string>>([])

    return (
        <CustomSelect
            name="regions"
            multiple
            value={regions}
            onValueChange={setRegions}
            options={[
                { value: 'north,west', label: 'North West' },
                { value: 'south', label: 'South' },
            ]}
            minSelection={1}
            maxSelection={2}
        />
    )
}
```

When `name` is set, each selected array item is submitted under the same field name. Read all values with `new FormData(form).getAll('regions')`.

The legacy combination of `multiple`, a comma-separated string value, and a string callback remains compatible in version 1 but is deprecated. It cannot represent values containing commas unambiguously and will be removed in version 2.

## Forms and accessibility

The visible trigger supports labels, descriptions, external errors, native validation, and forwarded `aria-*` attributes. Set `required` to participate in form validation. `disabled` removes the field from interaction and validation; `readOnly` prevents changes while retaining the submitted value.

```tsx
import { CustomSelect } from '@rentnerkev/select'
import { useState } from 'react'

export function DepartmentForm() {
    const [department, setDepartment] = useState('')

    return (
        <form>
            <CustomSelect
                id="department"
                name="department"
                label="Department"
                description="Choose the team that owns this request."
                value={department}
                onValueChange={setDepartment}
                options={[
                    { value: 'consulting', label: 'Consulting' },
                    { value: 'support', label: 'Support' },
                    { value: 'sales', label: 'Sales' },
                ]}
                placeholder="Choose a department"
                required
                locale="en"
            />

            <button type="submit">Submit</button>
        </form>
    )
}
```

## Localization

German messages remain the default for backward compatibility. Set `locale="en"` for the complete English catalog, or override individual messages with a typed `Partial<SelectMessages>`. The catalog and resolver are available as `selectMessageCatalog` and `resolveSelectMessages`.

```tsx
import { CustomSelect, type SelectMessages } from '@rentnerkev/select'
import { useState } from 'react'

const messages: Partial<SelectMessages> = {
    searchPlaceholder: 'Find an option',
    noResults: 'Nothing found',
    minSelection: (count) => `Choose at least ${count}`,
}

export function LocalizedSelect() {
    const [selectedValue, setSelectedValue] = useState('')

    return (
        <CustomSelect
            value={selectedValue}
            onValueChange={setSelectedValue}
            options={[{ value: 'priority', label: 'Priority' }]}
            locale="en"
            messages={messages}
        />
    )
}
```

## API

### `CustomSelect` props

| Prop                   | Type                                                     | Description                                                            |
| ---------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| `id`                   | `string`                                                 | ID for the visible trigger and associated labels.                      |
| `name`                 | `string`                                                 | Native form field name.                                                |
| `value`                | `TValue \| null \| undefined` or `ReadonlyArray<TValue>` | Controlled single or multiple value.                                   |
| `onValueChange`        | `(value: TValue) => void` or `(value: TValue[]) => void` | Typed callback for the selected mode.                                  |
| `options`              | `ReadonlyArray<Option<TValue>>`                          | Available options.                                                     |
| `required`             | `boolean`                                                | Enables required-field validation. Defaults to `false`.                |
| `label`                | `ReactNode`                                              | Visible label linked to the trigger.                                   |
| `description`          | `ReactNode`                                              | Supporting text linked through `aria-describedby`.                     |
| `error`                | `string \| null`                                         | External validation message; `null` clears external and native errors. |
| `disabled`             | `boolean`                                                | Disables interaction and validation.                                   |
| `readOnly`             | `boolean`                                                | Prevents changes while retaining the form value.                       |
| `className`            | `string`                                                 | Additional Tailwind classes for the visible trigger.                   |
| `placeholder`          | `string`                                                 | Text shown while no value is selected.                                 |
| `icon`                 | `ReactNode`                                              | Icon rendered at the start of the trigger.                             |
| `fallbackOption`       | `string`                                                 | Message shown when no options are available.                           |
| `multiple`             | `true`                                                   | Enables array-based multiple selection.                                |
| `minSelection`         | `number`                                                 | Minimum number of selected options.                                    |
| `maxSelection`         | `number`                                                 | Maximum number of selected options.                                    |
| `isOptionEqualToValue` | `(optionValue, value) => boolean`                        | Compares option and selected values.                                   |
| `getFormValue`         | `(value: TValue) => string`                              | Serializes a value for native form submission.                         |
| `locale`               | `'de' \| 'en'`                                           | Selects the default message catalog. Defaults to `'de'`.               |
| `messages`             | `Partial<SelectMessages>`                                | Overrides individual messages and ARIA text.                           |
| `aria-label`           | `string`                                                 | Accessible name for the visible trigger.                               |
| `aria-labelledby`      | `string`                                                 | External accessible-label IDs.                                         |
| `aria-describedby`     | `string`                                                 | External description IDs combined with internal text.                  |
| `triggerRef`           | `Ref<HTMLButtonElement>`                                 | Ref for the visible, focusable trigger.                                |

Additional React `aria-*` attributes are forwarded to the visible trigger.

### `Option<TValue>`

```ts
interface Option<TValue = string> {
    value: TValue
    label: string
    subOption?: string
}
```

`subOption` adds secondary information below the label in both the open list and the closed trigger.

## Tailwind CSS

Import the package entry after Tailwind CSS in your application stylesheet:

```css
@import 'tailwindcss';
@import '@rentnerkev/select/tailwind.css';
```

The package entry scans only the published JavaScript under `dist` and provides the shared theme tokens `primary`, `primary-hover`, `background-dark`, `surface-dark`, `input-dark`, `border-dark`, `secondary-text`, and `muted-foreground`. Override them with a later `@theme` block when needed.

## Public entry points

| Entry point                       | Purpose                                        |
| --------------------------------- | ---------------------------------------------- |
| `@rentnerkev/select`              | Component, messages, and public types.         |
| `@rentnerkev/select/select`       | `CustomSelect` component module.               |
| `@rentnerkev/select/value`        | Value parsing, comparison, and toggle helpers. |
| `@rentnerkev/select/messages`     | Locale catalog, resolver, and message types.   |
| `@rentnerkev/select/types`        | Component and option types.                    |
| `@rentnerkev/select/tailwind.css` | Tailwind source and shared theme tokens.       |
| `@rentnerkev/select/package.json` | Package metadata.                              |

## Development

```bash
bun install
bun run verify
bun run playground:dev
```

`bun run verify` checks types, lint, formatting, tests, the package build, and the published package contents.

## License

MIT
