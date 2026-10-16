import { expect, mock, test } from 'bun:test'
import { getSelectFieldProps } from '../../../lib/Form/selectForm.ts'
test('connects direct values, blur and readable touched errors without form dependencies', () => {
    const handleChange = mock((value: number | null) => value)
    const handleBlur = mock(() => undefined)
    const field = {
        name: 'customer',
        state: {
            value: 12 as number | null,
            meta: {
                errors: ['Missing', { message: 'Unavailable' }, {}, 123],
                isTouched: true,
            },
        },
        handleChange,
        handleBlur,
    }
    const props = getSelectFieldProps(field)
    expect(props.value).toBe(12)
    expect(props.error).toBe('Missing, Unavailable')
    props.onValueChange(null)
    props.onBlur()
    expect(handleChange).toHaveBeenCalledWith(null)
    expect(handleBlur).toHaveBeenCalledTimes(1)
    expect(
        getSelectFieldProps({
            ...field,
            state: {
                ...field.state,
                meta: { ...field.state.meta, isTouched: false },
            },
        }).error,
    ).toBeNull()
    expect(
        getSelectFieldProps(field, { errorVisibility: 'never' }).error,
    ).toBeNull()
    expect(
        getSelectFieldProps(field, {
            mapError: (error) =>
                typeof error === 'number' ? String(error) : undefined,
        }).error,
    ).toBe('123')
})
