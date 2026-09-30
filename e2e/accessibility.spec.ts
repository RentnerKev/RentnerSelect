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
    await page.keyboard.press('Escape')
    await expect(combobox).toBeVisible()
    await expect(combobox).toContainText('Erika - Musterfrau')
    await expect(page.getByRole('listbox')).toBeHidden()

    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
})

test('keeps capped multiple selection accessible while the menu is open', async ({
    page,
}) => {
    await page.goto('/')
    const combobox = page.getByRole('combobox', { name: 'Kontakt' })
    await combobox.press('Enter')

    const max = page.getByRole('option', { name: /Max - Mustermann/ })
    const erika = page.getByRole('option', { name: /Erika - Musterfrau/ })
    const tim = page.getByRole('option', { name: /Tim - Schneider/ })
    const sara = page.getByRole('option', { name: /Sara - Fischer/ })
    await max.click()
    await erika.click()
    await tim.click()

    await expect(sara).toBeVisible()
    await expect(sara).toBeDisabled()
    await expect(sara).toHaveCSS('opacity', '0.4')
    await expect(max).toBeEnabled()

    // Radix hides the page behind its modal popup while the menu is open.
    const results = await new AxeBuilder({ page }).exclude('#root').analyze()
    expect(results.violations).toEqual([])

    await max.click()
    await expect(sara).toBeEnabled()
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

test('clears a selection by keyboard without a synthetic option', async ({
    page,
}) => {
    await page.goto('/')
    const combobox = page.getByRole('combobox')
    await combobox.click()
    await page.getByRole('option', { name: /Erika/ }).click()
    await page.keyboard.press('Escape')

    const clearButton = page.getByRole('button', { name: 'Auswahl löschen' })
    await expect(clearButton).toBeVisible()
    await clearButton.focus()
    await page.keyboard.press('Enter')

    await expect(clearButton).toHaveCount(0)
    await expect(page.locator('input[name="department"]')).toHaveValue('')
    await expect(combobox).toBeFocused()
})

test('marks the field touched only after focus leaves the select', async ({
    page,
}) => {
    await page.goto('/')
    const combobox = page.getByRole('combobox')
    const error = page.getByText('Kontakt ist erforderlich.')

    await combobox.press('Enter')
    await expect(
        page.getByRole('textbox', { name: 'Optionen suchen' }),
    ).toBeFocused()
    await expect(error).toHaveCount(0)

    await page.keyboard.press('Escape')
    await expect(combobox).toBeFocused()
    await expect(error).toHaveCount(0)

    await page.keyboard.press('Tab')
    await expect(error).toBeVisible()
})

test('keeps multiple option state accessible and toggles the focused option with Space', async ({
    page,
}) => {
    await page.goto('/')
    const combobox = page.getByRole('combobox', { name: 'Kontakt' })
    await combobox.press('Enter')

    const search = page.getByRole('textbox', { name: 'Optionen suchen' })
    await search.fill('Max')
    const max = page.getByRole('option', { name: /Max - Mustermann/ })
    await search.press('ArrowDown')
    await expect(max).toBeFocused()
    await expect(max).toHaveAttribute('aria-selected', 'false')
    await expect(max).toHaveAttribute('data-state', 'unchecked')

    await page.keyboard.press('Space')
    await expect(max).toHaveAttribute('aria-selected', 'true')
    await expect(max).toHaveAttribute('data-state', 'checked')

    await page.keyboard.press('Space')
    await expect(max).toHaveAttribute('aria-selected', 'false')
    await expect(max).toHaveAttribute('data-state', 'unchecked')
})
