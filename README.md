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
bun add @rentnerkev/select
# npm alternative
npm install @rentnerkev/select
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

[Full API & usage](https://github.com/RentnerKev/RentnerSelect/blob/main/docs/usage.md) · [Local playground](./playground) · [MIT license](./LICENSE)

Run the playground from the repository root:

```bash
bun install --cwd playground
bun run playground:dev
```
