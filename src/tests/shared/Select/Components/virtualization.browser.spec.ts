import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

test('virtual select reaches distant selected rows, skips disabled options and submits values', async ({
    page,
}) => {
    await page.goto('/?virtual-list=select&no-search&initial=9000')
    const trigger = page.getByRole('combobox', { name: 'Virtual choices' })
    await trigger.press('Enter')
    await expect(
        page.getByRole('option', { name: 'Option 09000', exact: false }),
    ).toBeFocused()
    await expect.poll(() => page.getByRole('option').count()).toBeLessThan(40)
    await page.keyboard.press('End')
    const end = page.getByRole('option', { name: 'Option 09998', exact: true })
    await expect(end).toBeFocused()
    await expect(end).toHaveAttribute('aria-posinset', '9999')
    await expect(end).toHaveAttribute('aria-setsize', '10000')
    await page.keyboard.press('Home')
    await expect(
        page.getByRole('option', { name: /^Option 00000/ }),
    ).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await expect(
        page.getByRole('option', { name: /^Option 00003/ }),
    ).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(trigger).toBeFocused()
    await expect(page.getByRole('option')).toHaveCount(0)
    expect(
        await page
            .getByRole('form', { name: 'Virtual form' })
            .evaluate((node) =>
                new FormData(node as HTMLFormElement).get('choice'),
            ),
    ).toBe('3')
})

test('virtual select keeps multiple selection, search navigation and Escape intact', async ({
    page,
}) => {
    await page.addInitScript(() => {
        const monitoredWindow = window as Window & { peakOptionCount: number }
        monitoredWindow.peakOptionCount = 0
        const observer = new MutationObserver(() => {
            monitoredWindow.peakOptionCount = Math.max(
                monitoredWindow.peakOptionCount,
                document.querySelectorAll('[role="option"]').length,
            )
        })
        observer.observe(document, { subtree: true, childList: true })
    })
    await page.goto('/?virtual-list=select&multiple')
    const trigger = page.getByRole('combobox', { name: 'Virtual choices' })
    await trigger.press('Enter')
    const search = page.getByRole('textbox')
    await expect(search).toBeFocused()
    await search.press('ArrowUp')
    const last = page.getByRole('option', { name: 'Option 09998', exact: true })
    await expect(last).toBeFocused()
    await page.keyboard.press('Space')
    await expect(last).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
    await expect(page.getByRole('option')).toHaveCount(0)
    expect(
        await page
            .getByRole('form', { name: 'Virtual form' })
            .evaluate((node) =>
                new FormData(node as HTMLFormElement).getAll('choice'),
            ),
    ).toEqual(['9998'])
    await trigger.press('Enter')
    await search.fill('Option 004')
    await search.press('ArrowUp')
    await expect(
        page.getByRole('option', { name: 'Option 00499', exact: true }),
    ).toBeFocused()
    expect(
        await page.evaluate(
            () =>
                (window as Window & { peakOptionCount: number })
                    .peakOptionCount,
        ),
    ).toBeLessThan(40)
})

test('closed virtual select typeahead uses labels from the complete list', async ({
    page,
}) => {
    await page.goto('/?virtual-list=select&no-search')
    const trigger = page.getByRole('combobox', { name: 'Virtual choices' })
    await trigger.pressSequentially('Option 09000')
    await expect(
        page.getByRole('status', { name: 'Selected values' }),
    ).toHaveText('9000')
    await expect(page.getByRole('option')).toHaveCount(0)
    await trigger.press('Enter')
    await expect(
        page.getByRole('option', { name: /^Option 09000/ }),
    ).toBeFocused()
})

test('virtual select retains a key after reorder and recovers focus after removal', async ({
    page,
}) => {
    await page.goto(
        '/?virtual-list=select&multiple&no-search&initial=1&mutation=reorder',
    )
    await page.getByRole('combobox', { name: 'Virtual choices' }).press('Enter')
    const row = page.getByRole('option', { name: 'Option 00001', exact: true })
    await expect(row).toBeFocused()
    await row.press('Space')
    await expect(row).toBeFocused()
    await expect(row).toHaveAttribute('aria-posinset', '9999')
    await page.keyboard.press('Escape')
    await page.goto('/?virtual-list=select&multiple&mutation=remove')
    await page.getByRole('combobox', { name: 'Virtual choices' }).press('Enter')
    const search = page.getByRole('textbox')
    await search.press('ArrowDown')
    await expect(
        page.getByRole('option', { name: /^Option 00000/ }),
    ).toBeFocused()
    await page.keyboard.press('Space')
    await expect(search).toBeFocused()
    await expect(
        page.getByRole('option', { name: /^Option 00000/ }),
    ).toHaveCount(0)
    await page.keyboard.press('Escape')
    await page.goto('/?virtual-list=select&multiple&no-search&mutation=empty')
    const trigger = page.getByRole('combobox', { name: 'Virtual choices' })
    await trigger.press('Enter')
    await expect(
        page.getByRole('option', { name: /^Option 00000/ }),
    ).toBeFocused()
    await page.keyboard.press('Space')
    await expect(trigger).toBeFocused()
    await expect(page.getByRole('option')).toHaveCount(0)
})

for (const kind of ['select', 'combobox']) {
    test(
        'virtual ' +
            kind +
            ' scrolls through variable-height rows and selects by pointer',
        async ({ page }) => {
            await page.goto('/?virtual-list=' + kind)
            const input = page.getByRole('combobox', {
                name: 'Virtual choices',
            })
            await input.click()
            const list = page.getByRole('listbox')
            await expect
                .poll(() => page.getByRole('option').count())
                .toBeGreaterThan(1)
            await expect
                .poll(() => page.getByRole('option').count())
                .toBeLessThan(40)
            const heights = await page
                .getByRole('option')
                .evaluateAll((nodes) =>
                    nodes.map((node) => node.getBoundingClientRect().height),
                )
            expect(new Set(heights).size).toBeGreaterThan(1)
            const scroller =
                kind === 'select'
                    ? page.locator('.rentnerselect-scrollbar')
                    : list
            await expect
                .poll(() => scroller.evaluate((node) => node.scrollHeight))
                .toBeGreaterThan(10000)
            await scroller.evaluate((node) => {
                node.scrollTop = node.scrollHeight / 2
            })
            await expect
                .poll(async () => {
                    const values = await page
                        .getByRole('option')
                        .evaluateAll((nodes) =>
                            nodes.map((node) =>
                                Number(node.getAttribute('aria-posinset')),
                            ),
                        )
                    return values.some((value) => value > 1000)
                })
                .toBe(true)
            const option = page
                .getByRole('option')
                .filter({ hasText: 'Option 0' })
                .last()
            const label = (await option.innerText()).split('\n')[0]!
            await page
                .getByRole('option', {
                    name: new RegExp('^' + label + '(?:$| )'),
                })
                .click()
            await expect(page.getByRole('option')).toHaveCount(0)
            await expect(
                page.getByRole('status', { name: 'Selected values' }),
            ).toHaveText(String(Number(label.replace('Option ', ''))))
        },
    )
    test(
        'virtual ' +
            kind +
            ' preserves focus and active options in a ShadowRoot portal',
        async ({ page }) => {
            const errors: string[] = []
            page.on('pageerror', (error) => errors.push(String(error)))
            await page.goto(
                '/?virtual-list=' + kind + '&no-search&initial=9000&shadow',
            )
            const input = page.getByRole('combobox', {
                name: 'Virtual choices',
            })
            await input.press(kind === 'select' ? 'Enter' : 'ArrowDown')
            if (kind === 'select')
                await expect(
                    page.getByRole('option', { name: /^Option 09000/ }),
                ).toBeFocused()
            await page.keyboard.press('End')
            const end = page.getByRole('option', {
                name: 'Option 09998',
                exact: true,
            })
            if (kind === 'select') await expect(end).toBeFocused()
            else
                await expect(input).toHaveAttribute(
                    'aria-activedescendant',
                    (await end.getAttribute('id'))!,
                )
            await page.keyboard.press('Enter')
            await expect(page.getByRole('option')).toHaveCount(0)
            await expect(
                page.getByRole('status', { name: 'Selected values' }),
            ).toHaveText('9998')
            expect(errors).toEqual([])
        },
    )
    test(
        'virtual ' + kind + ' has accessible option semantics',
        async ({ page }) => {
            await page.goto('/?virtual-list=' + kind)
            await page
                .getByRole('combobox', { name: 'Virtual choices' })
                .click()
            await expect
                .poll(() => page.getByRole('option').count())
                .toBeGreaterThan(1)
            const results = await new AxeBuilder({ page })
                .exclude('#root')
                .analyze()
            expect(results.violations).toEqual([])
        },
    )
}

for (const kind of ['select', 'combobox']) {
    test(
        'virtual ' +
            kind +
            ' scrolls back on repeated Home after manual scrolling',
        async ({ page }) => {
            await page.goto('/?virtual-list=' + kind + '&no-search')
            const input = page.getByRole('combobox', {
                name: 'Virtual choices',
            })
            await input.press(kind === 'select' ? 'Enter' : 'ArrowDown')
            await expect
                .poll(() => page.getByRole('option').count())
                .toBeGreaterThan(0)
            await page.keyboard.press('Home')
            const list = page.getByRole('listbox')
            const scroller =
                kind === 'select'
                    ? page.locator('.rentnerselect-scrollbar')
                    : list
            await expect
                .poll(() => scroller.evaluate((node) => node.scrollHeight))
                .toBeGreaterThan(10000)
            await scroller.evaluate((node) => {
                node.scrollTop = node.scrollHeight / 2
            })
            await expect
                .poll(() => scroller.evaluate((node) => node.scrollTop))
                .toBeGreaterThan(1000)
            await page.keyboard.press('Home')
            await expect
                .poll(() => scroller.evaluate((node) => node.scrollTop))
                .toBeLessThan(1)
        },
    )
    test(
        'virtual ' + kind + ' can grow to the width of mounted content',
        async ({ page }) => {
            await page.goto('/?virtual-list=' + kind + '&content-width=content')
            const input = page.getByRole('combobox', {
                name: 'Virtual choices',
            })
            const triggerWidth = (await input.boundingBox())!.width
            await input.click()
            await expect
                .poll(() => page.getByRole('option').count())
                .toBeGreaterThan(0)
            await expect
                .poll(
                    async () =>
                        (await page.getByRole('listbox').boundingBox())!.width,
                )
                .toBeGreaterThan(triggerWidth + 40)
        },
    )
}

test('buffers complete-list typeahead while the first virtual chunk is loading', async ({
    page,
}) => {
    const { promise: loaded, resolve: release } = Promise.withResolvers<void>()
    await page.route(/\/VirtualSelectOptions\.tsx/, async (route) => {
        await loaded
        await route.continue()
    })
    await page.goto('/?virtual-list=select&no-search')
    try {
        await page
            .getByRole('combobox', { name: 'Virtual choices' })
            .press('Enter')
        await expect(page.getByRole('listbox')).toBeFocused()
        await page.keyboard.type('Option 09000')
    } finally {
        release()
    }
    await expect(
        page.getByRole('option', { name: /^Option 09000/ }),
    ).toBeFocused()
    await expect.poll(() => page.getByRole('option').count()).toBeLessThan(40)
})
