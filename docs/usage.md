# @rentnerkev/select

An accessible, searchable React select for typed single and multiple selection, native form integration, validation, localization, and Tailwind CSS styling.

## Requirements

Use React 19 with React DOM 19, an ESM-capable build, and Tailwind CSS 4 for
the documented styling. Import this package's `tailwind.css` entry into your
Tailwind stylesheet. It uses `@source` for published classes and `@theme` for
global tokens such as `--color-primary`. Check for token name collisions with
your app and override them in a later `@theme` block if needed.

In a React Server Components app, import and render the select from a module
beginning with `'use client'`; define its state and callbacks there. See the
[Tailwind directives](https://tailwindcss.com/docs/functions-and-directives)
and [React client boundary](https://react.dev/reference/rsc/use-client) guides.

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

When a controlled value has no matching option, RentnerSelect treats it as
unselected. The trigger shows its placeholder, stale values are omitted from
form submission, and required validation treats the field as empty. In multiple
mode, available values remain selected while unavailable values are ignored.
The component does not rewrite the controlled value; if a matching option is
added later, that value becomes visible again. The next user change reports only
values that still have matching options.

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

When `maxSelection` is reached, unselected options are visibly and accessibly
disabled. Selected options stay enabled so users can remove them. The
`minSelection` and `maxSelection` props are available only when `multiple` is
enabled; TypeScript users who previously passed these props to a single select
must remove them or use multiple mode.

Multiple selection uses a typed array value and submits one native form entry per selected option. Values containing commas remain unambiguous.

In the searchable multiple menu, `Enter` or `Space` toggles the focused option.
Typing a printable non-space character while an option is focused returns focus
to search and filters the options; spaces can be entered in the search field.

When options refresh while the menu is open, focus follows the same value as
options reorder or are recreated, using `isOptionEqualToValue` when provided.
If the focused option is removed, focus returns to search or moves to the first
enabled option; a non-searchable menu closes when no enabled options remain.

An option with `disabled: true` is pinned: users cannot add or remove it in the
menu. If it is already selected, it remains in the value and form submission
until the controlled value removes it or the option is enabled again.

For compatibility, an empty multiple selection submits one empty entry by
default. Set `omitEmptyFormValue` to submit no entry instead; then
`FormData.getAll('regions')` returns `[]`. Native `required` validation still
works when the empty entry is omitted.

## Clearing a selection

Use `clearable` to expose a keyboard-accessible clear button when a value is selected. Without `onClear`, clearing reports the empty value through `onValueChange`: `null` for a single select and an empty array for a multiple select. For a string field, set `emptyValue=""` so its state setter can receive the empty string directly. Passing `onClear` keeps the legacy clearing callback semantics and lets that callback update the controlled value. The clear button is hidden for disabled and read-only selects.

```tsx
const [status, setStatus] = useState<string | null>(null)

;<CustomSelect
    value={status}
    onValueChange={setStatus}
    clearable
    options={statusOptions}
    placeholder="All statuses"
/>
```

For a form field backed by a string, its state setter needs no clear wrapper:

```tsx
<CustomSelect
    value={department}
    onValueChange={setDepartment}
    clearable
    emptyValue=""
    options={departmentOptions}
/>
```

## Forms and accessibility

The visible trigger supports labels, descriptions, external errors, native validation, and forwarded `aria-*` attributes. Set `required` to participate in form validation. `onBlur` fires when focus leaves the whole field, including its clear button and portaled search/options; opening the menu does not mark the field as touched. `disabled` removes the field from interaction and validation; `readOnly` prevents changes while retaining the submitted value.

From v4.0.0, `onBlur` receives a field-level `FocusEvent<HTMLDivElement>` instead of a trigger-level `FocusEvent<HTMLButtonElement>`. Explicitly typed handlers should use the new event type; `triggerRef` still points to the button when direct trigger access is needed.

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
                clearable
                emptyValue=""
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

German messages remain the default for backward compatibility. Set `locale` to `de`, `en`, `es`, or `fr`, or override individual messages with a typed `Partial<SelectMessages>`. The catalog and resolver are available as `selectMessageCatalog` and `resolveSelectMessages`.

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

## Project-wide defaults

Use `SelectProvider` once near the root of your app to set locale, messages, search behavior, styling slots, and a CSP nonce. Any prop passed to an individual select overrides the corresponding provider default; `messages` and `classNames` are merged by key.

```tsx
import { CustomSelect, SelectProvider } from '@rentnerkev/select'

export function App({ cspNonce }: { cspNonce?: string }) {
    return (
        <SelectProvider
            locale="en"
            searchable={false}
            nonce={cspNonce}
            classNames={{ trigger: 'w-full', content: 'shadow-xl' }}
        >
            <CustomSelect
                value=""
                onValueChange={() => undefined}
                options={[{ value: 'one', label: 'One' }]}
                placeholder="Choose"
            />
        </SelectProvider>
    )
}
```

The nonce is forwarded to Radix's viewport style tag. The package CSS also contains the viewport scrollbar rules, so the scrollbar remains styled under strict CSP. Search is enabled by default for compatibility; set `searchable={false}` globally or per select for short menus.

## Custom option content

`renderOption` and `renderValue` allow icons, flags, or project-specific layouts without replacing the select's interaction logic. Keep decorative content `aria-hidden`; the plain `label` remains the searchable, accessible text. Individual options can be disabled and pinned as described above.

```tsx
<CustomSelect
    value={language}
    onValueChange={setLanguage}
    options={[
        { value: 'de', label: 'Deutsch' },
        { value: 'en', label: 'English', disabled: true },
    ]}
    renderOption={(option) => <span>{option.label}</span>}
    renderValue={(selected) => <span>{selected[0]?.label}</span>}
    onBlur={handleBlur}
/>
```

## API

### `CustomSelect` props

| Prop                   | Type                                                                                         | Description                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `string`                                                                                     | ID for the visible trigger and associated labels.                                                                         |
| `name`                 | `string`                                                                                     | Native form field name.                                                                                                   |
| `value`                | `TValue \| null \| undefined` or `ReadonlyArray<TValue>`                                     | Controlled single or multiple value.                                                                                      |
| `onValueChange`        | `(value: TValue) => void` or `(value: TValue \| null) => void` / `(value: TValue[]) => void` | Typed callback for the selected mode; single clearing reports `emptyValue` or `null`, and multiple clearing reports `[]`. |
| `options`              | `ReadonlyArray<Option<TValue>>`                                                              | Available options.                                                                                                        |
| `required`             | `boolean`                                                                                    | Enables required-field validation. Defaults to `false`.                                                                   |
| `label`                | `ReactNode`                                                                                  | Visible label linked to the trigger.                                                                                      |
| `description`          | `ReactNode`                                                                                  | Supporting text linked through `aria-describedby`.                                                                        |
| `error`                | `string \| null`                                                                             | External validation message; `null` clears external and native errors.                                                    |
| `disabled`             | `boolean`                                                                                    | Disables interaction and validation.                                                                                      |
| `readOnly`             | `boolean`                                                                                    | Prevents changes while retaining the form value.                                                                          |
| `className`            | `string`                                                                                     | Additional Tailwind classes for the visible trigger.                                                                      |
| `classNames`           | `SelectClassNames`                                                                           | Classes for root, trigger, clear button, content, search, viewport, option, empty state, label, and description.          |
| `clearable`            | `true`                                                                                       | Shows a clear button when selected and reports the empty value through `onValueChange`.                                   |
| `onClear`              | `() => void`                                                                                 | Optional legacy clearing callback; when provided, it handles clearing instead of `onValueChange`.                         |
| `emptyValue`           | `TValue`                                                                                     | Single clearable mode only: value reported when cleared. Defaults to `null` when omitted.                                 |
| `searchable`           | `boolean`                                                                                    | Show the search field. Defaults to `true`.                                                                                |
| `nonce`                | `string`                                                                                     | CSP nonce for Radix's generated viewport style.                                                                           |
| `onBlur`               | `FocusEventHandler<HTMLDivElement>`                                                          | Fires when focus leaves the entire field, including portaled content.                                                     |
| `renderOption`         | `(option, state) => ReactNode`                                                               | Custom content for each menu item; `state` includes selected/disabled.                                                    |
| `renderValue`          | `(selectedOptions) => ReactNode`                                                             | Custom content for the closed trigger.                                                                                    |
| `placeholder`          | `string`                                                                                     | Text shown while no value is selected.                                                                                    |
| `icon`                 | `ReactNode`                                                                                  | Icon rendered at the start of the trigger.                                                                                |
| `fallbackOption`       | `string`                                                                                     | Message shown when no options are available.                                                                              |
| `multiple`             | `true`                                                                                       | Enables array-based multiple selection.                                                                                   |
| `omitEmptyFormValue`   | `boolean`                                                                                    | Multiple mode only: omits the form entry for an empty selection. Defaults to `false`.                                     |
| `minSelection`         | `number`                                                                                     | Multiple mode only: minimum number of selected options.                                                                   |
| `maxSelection`         | `number`                                                                                     | Multiple mode only: maximum number of selected options.                                                                   |
| `isOptionEqualToValue` | `(optionValue, value) => boolean`                                                            | Compares option and selected values.                                                                                      |
| `getFormValue`         | `(value: TValue) => string`                                                                  | Serializes a value for native form submission.                                                                            |
| `locale`               | `'de' \| 'en' \| 'es' \| 'fr'`                                                               | Selects the default message catalog. Defaults to `'de'`.                                                                  |
| `messages`             | `Partial<SelectMessages>`                                                                    | Overrides individual messages and ARIA text.                                                                              |
| `aria-label`           | `string`                                                                                     | Accessible name for the visible trigger.                                                                                  |
| `aria-labelledby`      | `string`                                                                                     | External accessible-label IDs.                                                                                            |
| `aria-describedby`     | `string`                                                                                     | External description IDs combined with internal text.                                                                     |
| `triggerRef`           | `Ref<HTMLButtonElement>`                                                                     | Ref for the visible, focusable trigger.                                                                                   |

Additional React `aria-*` attributes are forwarded to the visible trigger.

### `Option<TValue>`

```ts
interface Option<TValue = string> {
    value: TValue
    label: string
    subOption?: string
    disabled?: boolean
}
```

`subOption` adds secondary information below the label in both the open list and the closed trigger.

## Tailwind CSS

Import the package entry after Tailwind CSS in your application stylesheet:

```css
@import 'tailwindcss';
@import '@rentnerkev/select/tailwind.css';
```

The package entry scans only the published JavaScript under `dist`. Select styling uses `--color-select-control`, `--color-select-surface`, `--color-select-hover`, `--color-select-border`, `--color-select-border-strong`, `--color-select-foreground`, `--color-select-muted`, and `--color-select-accent`. The default tokens form a dark palette; use a matching surrounding surface or override the foreground and surface tokens together for a light theme. Override these tokens with a later `@theme inline` block to map them to your app's light/dark tokens. The older shared theme tokens remain available for compatibility.

```css
@theme inline {
    --color-select-control: var(--app-input);
    --color-select-surface: var(--app-panel);
    --color-select-hover: var(--app-hover);
    --color-select-border: var(--app-border);
    --color-select-border-strong: var(--app-border-strong);
    --color-select-foreground: var(--app-text);
    --color-select-muted: var(--app-muted);
    --color-select-accent: var(--app-accent);
}
```

## Public entry points

| Entry point                       | Purpose                                      |
| --------------------------------- | -------------------------------------------- |
| `@rentnerkev/select`              | Component, messages, and public types.       |
| `@rentnerkev/select/select`       | `CustomSelect` component module.             |
| `@rentnerkev/select/value`        | Value comparison and toggle helpers.         |
| `@rentnerkev/select/messages`     | Locale catalog, resolver, and message types. |
| `@rentnerkev/select/types`        | Component and option types.                  |
| `@rentnerkev/select/tailwind.css` | Tailwind source and shared theme tokens.     |
| `@rentnerkev/select/package.json` | Package metadata.                            |

## Development

```bash
bun install
bun run verify
bun run playground:dev
```

`bun run verify` checks types, lint, formatting, tests, the package build, and the published package contents.

## License

MIT

## Architecture

Reusable select UI lives in `src/shared/Select/Components`, with its focused hooks in `src/shared/Select/Hooks` and typed contracts in `src/shared/Select/Types`. Package subpaths resolve directly to the defining modules. UI-free color, selection, field, and message logic lives in `src/lib` under its domain. Tests are centralized in `src/tests`, mirroring the source domains; browser and compile-time contracts run separately.

Public npm root, subpath, and type entry points retain their existing import paths; package exports resolve directly to their defining modules. Internal code imports defining modules directly. No application routes, server stack, or additional dependencies are needed for these libraries.

Closed options retain Radix Collection, ItemText, typeahead, and native BubbleSelect registration, including custom rendered native text. A memoized presentation list avoids repeating unchanged option renderers; it does not remove this required DOM. The default Object.is index preserves duplicate FIFO identities, NaN, object references, and signed zero. Custom comparators retain the compatibility scan path.

## AI and read-only MCP access

The separate `@rentnerkev/select/ai` entry is for Node.js and Bun tooling. It reads
only this installed package's manifest, README, usage guide, and built TypeScript
declarations. It does not import React, mount UI, run examples, perform network
requests, or require an MCP runtime. Keep it in server/tooling code.

```ts
import {
    getPackageInfo,
    getPackageApi,
    getPackageDocumentation,
    searchPackageDocumentation,
    getPackageExamples,
} from '@rentnerkev/select/ai'

const info = getPackageInfo()
const api = getPackageApi() // All public typed subpaths and dependent declarations
const usage = getPackageDocumentation('usage') // Full guide, including CSS and providers
const readme = getPackageDocumentation('readme')
const matches = searchPackageDocumentation('messages') // Literal, case-insensitive lines
const examples = getPackageExamples() // Fenced examples from the usage guide
```

`getPackageApi({ subpath: '.', symbol: 'CustomSelect' })` validates the symbol
against the selected public entry and returns its complete declaration context.
Unknown subpaths or symbols throw an error. File paths are not accepted. The
`./ai` entry itself is excluded from this UI API context. The manifest's `exports`
map remains available through `getPackageInfo()`.

Public website discovery is planned at
[llms.txt](https://packages.rentner.dev/llms.txt) and
[the MCP endpoint](https://packages.rentner.dev/mcp). These addresses become
available after the website deployment; this documentation does not claim the
endpoint is already online. The website's read-only tools expose public package
information, API declarations, usage guides, examples, and search, without
accounts, write operations, or access to private project files. The installed
`/ai` entry works locally without that service. Always use the documentation and
declarations for the version installed in your project.
