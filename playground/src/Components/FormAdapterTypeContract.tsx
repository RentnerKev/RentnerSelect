import { CustomSelect } from '../../../src/shared/Select/Components/CustomSelect.tsx'
import { getSelectFieldProps } from '../../../src/lib/Form/selectForm.ts'
import { usePlaygroundLogic } from '../Hooks/usePlaygroundLogic.ts'
/** Compiles against the actual installed TanStack Form FieldApi. */
export function FormAdapterTypeContract() {
    const { form } = usePlaygroundLogic()
    return (
        <form.Field name="department">
            {(field) => (
                <CustomSelect
                    {...getSelectFieldProps(field)}
                    multiple
                    clearable
                    options={[]}
                />
            )}
        </form.Field>
    )
}
