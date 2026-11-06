import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const key of ['Enter', 'Space']) {
    test(`removes only the targeted closed item with ${key} and keeps field focus`, async ({
        page,
    }) => {
        await page.goto('/?removable-items')
        const trigger = page.getByRole('combobox', { name: 'Selected choices' })
        const remove = page.getByRole('button', { name: 'Remove Alpha, West' })
        await remove.focus()
        await page.keyboard.press(key)
        await expect(page.getByLabel('Selected keys')).toHaveText('["beta"]')
        await expect(page.getByLabel('Change count')).toHaveText('1')
        await expect(page.getByLabel('Focused during change')).toHaveText(
            'true',
        )
        await expect(page.getByLabel('Blur count')).toHaveText('0')
        await expect(trigger).toBeFocused()
        await expect(trigger).toHaveAttribute('aria-expanded', 'false')
        await expect(page.getByRole('listbox')).toHaveCount(0)
        await expect(page.locator('button button')).toHaveCount(0)
        await page.getByRole('button', { name: 'Submit', exact: true }).click()
        await expect(page.getByLabel('Submitted keys')).toHaveText('["beta"]')
    })
}

test('keeps the button and its focus stable while its first tooltip module loads', async ({
    page,
}) => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
        release = resolve
    })
    let requests = 0
    await page.route(/tooltips/, async (route) => {
        requests += 1
        await gate
        await route.continue()
    })
    await page.goto('/?removable-items')
    const remove = page.getByRole('button', { name: 'Remove Alpha, West' })
    const original = await remove.elementHandle()
    await remove.focus()
    await expect.poll(() => requests).toBeGreaterThan(0)
    await expect(remove).toBeFocused()
    release()
    await expect(page.getByRole('tooltip')).toHaveText('Click to remove')
    expect(
        await original!.evaluate(
            (element) =>
                element.isConnected && element === document.activeElement,
        ),
    ).toBe(true)
    await expect(remove).toBeFocused()
    const results = await new AxeBuilder({ page })
        .include('main')
        .include('[role="tooltip"]')
        .analyze()
    expect(results.violations).toEqual([])
    await page.keyboard.press('Escape')
    await expect(page.getByRole('tooltip')).toHaveCount(0)
    await expect(remove).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByLabel('Selected keys')).toHaveText('["beta"]')
})

test('keeps a first mouse click intact when tooltip loading resolves between press and release', async ({
    page,
}) => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
        release = resolve
    })
    let requests = 0
    await page.route(/tooltips/, async (route) => {
        requests += 1
        await gate
        await route.continue()
    })
    await page.goto('/?removable-items')
    const remove = page.getByRole('button', { name: 'Remove Alpha, West' })
    await remove.hover()
    await expect.poll(() => requests).toBeGreaterThan(0)
    await page.mouse.down()
    release()
    await expect(page.getByRole('tooltip')).toHaveText('Click to remove')
    await page.mouse.up()
    await expect(page.getByLabel('Selected keys')).toHaveText('["beta"]')
    await expect(page.getByLabel('Change count')).toHaveText('1')
})

test('hover describes removal and styles only the hovered item, with reduced-motion support', async ({
    page,
}) => {
    await page.goto('/?removable-items')
    const remove = page.getByRole('button', { name: 'Remove Alpha, West' })
    const other = page.getByRole('button', { name: 'Remove Beta' })
    await remove.hover()
    await expect(page.getByRole('tooltip')).toHaveText('Click to remove')
    await expect
        .poll(() =>
            remove.evaluate(
                (element) =>
                    getComputedStyle(
                        element.querySelector('span:not(.sr-only)')!,
                    ).textDecorationLine,
            ),
        )
        .toContain('line-through')
    await expect
        .poll(() =>
            other.evaluate(
                (element) =>
                    getComputedStyle(
                        element.querySelector('span:not(.sr-only)')!,
                    ).textDecorationLine,
            ),
        )
        .not.toContain('line-through')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect
        .poll(() =>
            remove.evaluate(
                (element) => getComputedStyle(element).transitionDuration,
            ),
        )
        .toBe('0s')
    await remove.click()
    await expect(page.getByLabel('Change count')).toHaveText('1')
    await expect(page.getByLabel('Selected keys')).toHaveText('["beta"]')
})

for (const flag of ['default-off', 'disabled', 'readonly', 'custom']) {
    test(`does not expose item removal for ${flag}`, async ({ page }) => {
        await page.goto(`/?removable-items&${flag}`)
        await expect(
            page.getByRole('button', { name: /^Remove / }),
        ).toHaveCount(0)
        await expect(page.getByLabel('Selected keys')).toHaveText(
            '["alpha,west","beta"]',
        )
        await expect(page.getByLabel('Change count')).toHaveText('0')
    })
}

test('pins disabled selections and restores closed controls after popup dismissal', async ({
    page,
}) => {
    await page.goto('/?removable-items&pinned')
    await expect(
        page.getByRole('button', { name: 'Remove Locked' }),
    ).toHaveCount(0)
    const trigger = page.getByRole('combobox', { name: 'Selected choices' })
    await trigger.press('Enter')
    await expect(page.getByRole('button', { name: /^Remove / })).toHaveCount(0)
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Remove Alpha, West' }).click()
    await expect(page.getByLabel('Selected keys')).toHaveText('["locked"]')
})

test('clear-all remains separate and the last removal updates required form validity', async ({
    page,
}) => {
    await page.goto('/?removable-items')
    await page
        .getByRole('button', { name: 'Clear selection', exact: true })
        .click()
    await expect(page.getByLabel('Selected keys')).toHaveText('[]')
    await expect(page.getByLabel('Change count')).toHaveText('1')
    await page.goto('/?removable-items&one&required')
    await page.getByRole('button', { name: 'Remove Alpha, West' }).click()
    await expect(page.getByRole('button', { name: /^Remove / })).toHaveCount(0)
    await page.getByRole('button', { name: 'Submit', exact: true }).click()
    const trigger = page.getByRole('combobox', { name: 'Selected choices' })
    await expect(trigger).toBeFocused()
    await expect(trigger).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByLabel('Submitted keys')).toHaveText('[]')
})

test('keeps wrapped per-item controls inside a narrow viewport and supports message overrides', async ({
    page,
}) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/?removable-items&long&override')
    const remove = page.getByRole('button', { name: /^Delete Alpha,/ })
    await remove.hover()
    await expect(page.getByRole('tooltip')).toHaveText('Remove this entry')
    const bounds = await remove.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320)
    const triggerBounds = await page
        .getByRole('combobox', { name: 'Selected choices' })
        .boundingBox()
    expect(triggerBounds).not.toBeNull()
    expect(bounds!.height).toBeGreaterThan(20)
    expect(bounds!.y).toBeGreaterThanOrEqual(triggerBounds!.y)
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(
        triggerBounds!.y + triggerBounds!.height,
    )
    await remove.click()
    await expect(page.getByLabel('Selected keys')).toHaveText('["beta"]')
})
