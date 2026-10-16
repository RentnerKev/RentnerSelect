import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

test('external results, active descendants, selection, whole-field blur and clear work in a browser', async ({
    page,
}) => {
    await page.goto('/?external-combobox')
    const input = page.getByRole('combobox', { name: 'Customer' })
    await expect(input).toHaveCSS('height', '44px')
    await input.fill('query without local matches')
    await expect(page.getByRole('option')).toHaveCount(3)
    await expect(page.locator('.customer-portal')).toHaveCount(1)
    await expect(page.getByRole('listbox').locator('..')).toHaveCSS(
        'z-index',
        '1234',
    )
    await input.press('ArrowDown')
    const alpha = page.getByRole('option', { name: /Alba/ })
    await expect(input).toHaveAttribute(
        'aria-activedescendant',
        (await alpha.getAttribute('id')) as string,
    )
    await expect(input).toBeFocused()
    const description = alpha.locator('div div').last()
    expect((await description.boundingBox())!.height).toBeGreaterThan(24)
    await input.press('ArrowDown')
    await expect(input).toHaveAttribute(
        'aria-activedescendant',
        (await page
            .getByRole('option', { name: /Charlie/ })
            .getAttribute('id')) as string,
    )
    await input.press('Enter')
    await expect(input).toHaveValue('Charlie')
    await expect(input).toBeFocused()
    await expect(page.getByRole('status', { name: 'Field blurs' })).toHaveText(
        '0',
    )
    await expect(
        page.getByRole('status', { name: 'Selected customer' }),
    ).toHaveText('c')
    expect(
        await page
            .getByRole('form', { name: 'Customer form' })
            .evaluate((node) =>
                new FormData(node as HTMLFormElement).get('customer'),
            ),
    ).toBe('c')
    await page.getByRole('button', { name: 'Clear selection' }).click()
    await expect(input).toHaveValue('')
    await expect(input).toBeFocused()
    await expect(page.getByRole('status', { name: 'Field blurs' })).toHaveText(
        '0',
    )
    await input.press('ArrowUp')
    await input.press('Home')
    await expect(input).toHaveAttribute(
        'aria-activedescendant',
        (await page
            .getByRole('option', { name: /Alba/ })
            .getAttribute('id')) as string,
    )
    await input.press('Escape')
    await page.getByRole('button', { name: 'Toggle loading' }).click()
    await expect(page.getByRole('status', { name: 'Field blurs' })).toHaveText(
        '1',
    )
    await input.click()
    await expect(page.getByText('Loading…')).toBeVisible()
    await expect(page.getByRole('option')).toHaveCount(0)
    await input.press('Escape')
    await page.getByRole('button', { name: 'Toggle loading' }).click()
    await page.getByRole('button', { name: 'Toggle empty' }).click()
    await input.click()
    await expect(page.getByText('No options')).toBeVisible()
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test('wraps select text and exposes content width and replaceable option slots', async ({
    page,
}) => {
    await page.goto('/?external-combobox')
    const select = page.getByRole('combobox', { name: 'Wrapped select' })
    expect((await select.boundingBox())!.height).toBeGreaterThan(48)
    const triggerWidth = (await select.boundingBox())!.width
    await select.click()
    const option = page.getByRole('option')
    await expect(option.locator('.text-base')).toHaveCSS(
        'white-space',
        'normal',
    )
    await expect(option.locator('.text-base')).toHaveCSS('font-size', '16px')
    expect(
        (await page.getByRole('listbox').boundingBox())!.width,
    ).toBeGreaterThanOrEqual(triggerWidth)
})

test('uses shared theme variables for the input and portaled select surface', async ({
    page,
}) => {
    await page.goto('/?external-combobox')
    await page.evaluate(() => {
        const style = document.documentElement.style
        style.setProperty('--rentner-control', '#fef3c7')
        style.setProperty('--rentner-surface', '#fffbeb')
        style.setProperty('--rentner-foreground', '#111827')
        style.setProperty('--rentner-radius', '4px')
    })
    const input = page.getByRole('combobox', { name: 'Customer' })
    await expect(input).toHaveCSS('background-color', 'rgb(254, 243, 199)')
    await expect(input).toHaveCSS('color', 'rgb(17, 24, 39)')
    await expect(input).toHaveCSS('border-radius', '4px')
    await input.click()
    await expect(page.getByRole('listbox').locator('..')).toHaveCSS(
        'background-color',
        'rgb(255, 251, 235)',
    )
    await input.press('Escape')
    const select = page.getByRole('combobox', { name: 'Wrapped select' })
    await expect(select).toHaveCSS('background-color', 'rgb(254, 243, 199)')
    await expect(select).toHaveCSS('border-radius', '4px')
    await select.click()
    await expect(page.getByRole('listbox')).toHaveCSS(
        'background-color',
        'rgb(255, 251, 235)',
    )
})
