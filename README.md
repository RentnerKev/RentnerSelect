<p align="center">
    <img src="https://raw.githubusercontent.com/RentnerKev/RentnerSelect/main/assets/readme/banner.png" alt="RentnerSelect" width="100%">
</p>

<p align="center">
    <a href="https://github.com/RentnerKev/RentnerSelect/actions/workflows/ci.yml"><img src="https://github.com/RentnerKev/RentnerSelect/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
    <a href="https://github.com/RentnerKev/RentnerSelect/actions/workflows/codeql.yml"><img src="https://github.com/RentnerKev/RentnerSelect/actions/workflows/codeql.yml/badge.svg?branch=main" alt="CodeQL"></a>
    <a href="https://www.npmjs.com/package/@rentnerkev/select"><img src="https://img.shields.io/npm/v/@rentnerkev/select" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@rentnerkev/select"><img src="https://img.shields.io/npm/dm/@rentnerkev/select" alt="npm downloads"></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license"></a>
</p>

Accessible React select with search, typed single or multiple selection, native form support, and localization.

## Installation

Requires React 19, React DOM 19, and Tailwind CSS 4.

```bash
npm install @rentnerkev/select
# or with Bun
bun add @rentnerkev/select
```

Import the package styles after Tailwind in your app stylesheet:

```css
@import 'tailwindcss';
@import '@rentnerkev/select/tailwind.css';
```

## Quick start

```tsx
'use client'

import { useState } from 'react'
import { CustomSelect } from '@rentnerkev/select'

const options = [
    { value: 'design', label: 'Design' },
    { value: 'engineering', label: 'Engineering' },
]

export function TeamSelect() {
    const [team, setTeam] = useState('design')
    return (
        <CustomSelect
            label="Team"
            value={team}
            onValueChange={setTeam}
            options={options}
            locale="en"
        />
    )
}
```

## Screenshots

|                                                                                                                                                                                                                                                                                                                       |                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Searchable contact choices**<br>[![Searchable contact choices](https://raw.githubusercontent.com/RentnerKev/RentnerSelect/main/assets/readme/screenshots/searchable-contact-choices.png)](https://raw.githubusercontent.com/RentnerKev/RentnerSelect/main/assets/readme/screenshots/searchable-contact-choices.png) | **Multiple selection**<br>[![Multiple selection](https://raw.githubusercontent.com/RentnerKev/RentnerSelect/main/assets/readme/screenshots/multiple-selection.png)](https://raw.githubusercontent.com/RentnerKev/RentnerSelect/main/assets/readme/screenshots/multiple-selection.png)     |
| **Secondary option details**<br>[![Secondary option details](https://raw.githubusercontent.com/RentnerKev/RentnerSelect/main/assets/readme/screenshots/secondary-option-details.png)](https://raw.githubusercontent.com/RentnerKev/RentnerSelect/main/assets/readme/screenshots/secondary-option-details.png)         | **Typed object values**<br>[![Typed object values](https://raw.githubusercontent.com/RentnerKev/RentnerSelect/main/assets/readme/screenshots/typed-object-values.png)](https://raw.githubusercontent.com/RentnerKev/RentnerSelect/main/assets/readme/screenshots/typed-object-values.png) |

[Full API & usage](https://npm.rentner.dev/docs/select) · [Local playground](./playground) · [MIT license](./LICENSE)

Run the playground from the repository root:

```bash
bun install --cwd playground
bun run playground:dev
```

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
