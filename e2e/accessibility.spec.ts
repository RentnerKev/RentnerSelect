import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('supports keyboard navigation, search, portal rendering, and a11y', async ({
    page,
}) => {
    await page.goto('/')
    const combobox = page.getByRole('combobox')
    await combobox.press('Enter')

    const search = page.getByRole('textbox', { name: 'Optionen suchen' })
    await expect(search).toBeFocused()
    await search.fill('Erika')
    const option = page.getByRole('option', { name: /Erika/ })
    await expect(option).toBeVisible()
    await search.press('ArrowDown')
    await expect(option).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(
        page.getByText('Erika - Musterfrau', { exact: true }),
    ).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('listbox')).toBeHidden()

    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
})

test('announces required validation and honors reduced motion', async ({
    page,
}) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    await page.getByRole('button', { name: 'Absenden' }).click()
    await expect(page.getByRole('combobox')).toHaveAttribute(
        'aria-invalid',
        'true',
    )
    await expect(page.locator('[aria-live="polite"]')).toContainText(
        'Dieses Feld ist erforderlich',
    )

    await page.getByRole('combobox').press('Enter')
    await expect(page.locator('[role="listbox"]')).toHaveCSS(
        'animation-name',
        'none',
    )
})
