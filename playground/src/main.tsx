import { ExternalComboboxFixture } from './Components/ExternalComboboxFixture.tsx'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { DynamicOptionsFixture } from './Components/DynamicOptionsFixture.tsx'
import { usePlaygroundRootLogic } from './Hooks/usePlaygroundRootLogic.ts'
// oxlint-disable-next-line import/no-unassigned-import -- The Vite entry deliberately loads the playground stylesheet.
import './styles.css'

function PlaygroundRoot() {
    const {
        state: { dynamicMode, externalCombobox },
    } = usePlaygroundRootLogic()
    return externalCombobox ? (
        <ExternalComboboxFixture />
    ) : dynamicMode ? (
        <DynamicOptionsFixture mode={dynamicMode} />
    ) : (
        <App />
    )
}

createRoot(document.getElementById('root')!).render(<PlaygroundRoot />)
