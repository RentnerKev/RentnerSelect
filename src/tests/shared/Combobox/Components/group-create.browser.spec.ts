import type { Locator } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

async function expectMeasuredGroupHeader(option: Locator) {
    await expect
        .poll(() =>
            option.evaluate((element) => {
                const row = element.parentElement!
                const header = row.querySelector<HTMLElement>(
                    '[aria-hidden="true"]',
                )!
                const next = row.nextElementSibling!
                const bounds = row.getBoundingClientRect()
                return (
                    header.getBoundingClientRect().height > 0 &&
                    bounds.height >=
                        element.getBoundingClientRect().height +
                            header.getBoundingClientRect().height -
                            1 &&
                    next.getBoundingClientRect().top >= bounds.bottom - 1
                )
            }),
        )
        .toBe(true)
}

for (const virtual of [false, true]) {
    test(`grouped select navigation ignores headers and disabled options (${virtual ? 'virtual' : 'plain'})`, async ({
        page,
    }) => {
        await page.goto(`/?grouped-options=select${virtual ? '&virtual' : ''}`)
        const input = page.getByRole('combobox', { name: 'Grouped choices' })
        await input.press('Enter')
        const first = page.getByRole('option', {
            name: 'Choice 000',
            exact: true,
        })
        await expect(first).toBeFocused()
        if (virtual) await expectMeasuredGroupHeader(first)
        await page.keyboard.press('ArrowDown')
        await expect(
            page.getByRole('option', {
                name: virtual ? 'Choice 004' : 'Choice 001',
                exact: true,
            }),
        ).toBeFocused()
        await page.keyboard.press('End')
        const last = page.getByRole('option', {
            name: virtual ? 'Choice 197' : 'Choice 003',
            exact: true,
        })
        await expect(last).toBeFocused()
        if (virtual) {
            await expect(last).toHaveAttribute('aria-setsize', '200')
            await expect(last).toHaveAttribute('aria-posinset', '199')
            await expect
                .poll(() => page.getByRole('option').count())
                .toBeLessThan(40)
        } else {
            await expect(
                page.getByRole('group', { name: 'North', exact: true }),
            ).toBeVisible()
            await expect(
                page.getByRole('group', { name: 'South', exact: true }),
            ).toBeVisible()
        }
        await page.keyboard.press('Enter')
        await expect(input).toBeFocused()
        await page.getByRole('button', { name: 'Submit', exact: true }).click()
        await expect(page.getByLabel('Submitted key')).toHaveText(
            virtual ? '197' : '3',
        )
    })

    test(`grouped combobox navigates creation and keeps typed text out of form values (${virtual ? 'virtual' : 'plain'})`, async ({
        page,
    }) => {
        await page.goto(
            `/?grouped-options=combobox${virtual ? '&virtual' : ''}`,
        )
        const input = page.getByRole('combobox', { name: 'Grouped choices' })
        await input.fill('  New customer  ')
        const create = page.getByRole('option', {
            name: 'Create New customer',
            exact: true,
        })
        await expect(create).toBeVisible()
        await input.press('Home')
        const first = page.getByRole('option', {
            name: 'Choice 000',
            exact: true,
        })
        await expect(input).toHaveAttribute(
            'aria-activedescendant',
            (await first.getAttribute('id')) ?? '',
        )
        if (virtual) await expectMeasuredGroupHeader(first)
        await input.press('ArrowDown')
        const second = page.getByRole('option', {
            name: virtual ? 'Choice 004' : 'Choice 001',
            exact: true,
        })
        await expect(input).toHaveAttribute(
            'aria-activedescendant',
            (await second.getAttribute('id')) ?? '',
        )
        await input.press('End')
        await expect(input).toHaveAttribute(
            'aria-activedescendant',
            'grouped-create-option',
        )
        await expect(create).toBeInViewport()
        await expect(create).toHaveAttribute(
            'aria-setsize',
            virtual ? '201' : '5',
        )
        await expect(create).toHaveAttribute(
            'aria-posinset',
            virtual ? '201' : '5',
        )
        await input.press('ArrowUp')
        const last = page.getByRole('option', {
            name: virtual ? 'Choice 197' : 'Choice 003',
            exact: true,
        })
        await expect(input).toHaveAttribute(
            'aria-activedescendant',
            (await last.getAttribute('id')) ?? '',
        )
        await expect(last).toHaveAttribute(
            'aria-setsize',
            virtual ? '201' : '5',
        )
        await input.press('ArrowDown')
        await input.press('Enter')
        await expect(page.getByLabel('Created query')).toHaveText(
            'New customer',
        )
        await expect(page.getByLabel('Selected key')).toHaveText('0')
        await expect(page.getByLabel('Submitted key')).toHaveText('')
        await page.getByRole('button', { name: 'Submit', exact: true }).click()
        await expect(page.getByLabel('Submitted key')).toHaveText('0')
        await page
            .getByRole('button', { name: 'Accept creation', exact: true })
            .click()
        await expect(page.getByLabel('Selected key')).toHaveText('created-1')
        await page.getByRole('button', { name: 'Submit', exact: true }).click()
        await expect(page.getByLabel('Submitted key')).toHaveText('created-1')
    })
}

test('virtual creation works with zero options and has no accessibility violations', async ({
    page,
}) => {
    await page.goto('/?grouped-options=combobox&virtual&empty')
    const input = page.getByRole('combobox', { name: 'Grouped choices' })
    await input.fill('  First customer  ')
    const create = page.getByRole('option', { name: 'Create First customer' })
    await expect(create).toBeVisible()
    await expect(create).toHaveAttribute('aria-posinset', '1')
    await expect(create).toHaveAttribute('aria-setsize', '1')
    await input.press('ArrowDown')
    await expect(input).toHaveAttribute(
        'aria-activedescendant',
        'grouped-create-option',
    )
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
    await input.press('Enter')
    await expect(page.getByLabel('Created query')).toHaveText('First customer')
    await expect(page.getByLabel('Selected key')).toHaveText('')
})

test('suppresses exact existing labels and filters by group label', async ({
    page,
}) => {
    await page.goto('/?grouped-options=combobox&local')
    const input = page.getByRole('combobox', { name: 'Grouped choices' })
    await input.fill('  cHoIcE 000  ')
    await expect(page.getByRole('option', { name: /^Create / })).toHaveCount(0)
    await input.fill('South')
    await expect(
        page.getByRole('group', { name: 'South', exact: true }),
    ).toBeVisible()
    await expect(
        page.getByRole('option', { name: 'Choice 001', exact: true }),
    ).toBeVisible()
    await expect(
        page.getByRole('option', { name: 'Choice 003', exact: true }),
    ).toBeVisible()
    await expect(
        page.getByRole('option', { name: 'Choice 000', exact: true }),
    ).toHaveCount(0)
})

for (const flag of ['loading', 'disabled', 'readonly']) {
    test(`suppresses creation while ${flag}`, async ({ page }) => {
        await page.goto(`/?grouped-options=combobox&${flag}`)
        const input = page.getByRole('combobox', { name: 'Grouped choices' })
        if (flag === 'loading') {
            await input.fill('New customer')
            await input.press('End')
            await input.press('Enter')
        } else {
            await input.evaluate((element) => element.focus())
        }
        await expect(
            page.getByRole('option', { name: /^Create / }),
        ).toHaveCount(0)
        await expect(page.getByLabel('Created query')).toHaveText('')
        await expect(page.getByLabel('Selected key')).toHaveText('0')
    })
}
