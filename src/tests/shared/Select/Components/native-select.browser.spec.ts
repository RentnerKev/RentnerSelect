import { expect, test } from '@playwright/test'

test('reveals distant selected options in a static popup without scrolling the page', async ({
    page,
}) => {
    await page.goto(
        '/?virtual-list=select&full-list&count=249&no-search&initial=200',
    )
    const trigger = page.getByRole('combobox', { name: 'Virtual choices' })
    const scroll = await page.evaluate(() => window.scrollY)
    await trigger.press('Enter')
    const option = page.getByRole('option', {
        name: 'Option 00200',
        exact: true,
    })
    await expect(option).toBeFocused()
    await expect(option).toBeInViewport()
    const viewport = page.locator('.rentnerselect-scrollbar')
    expect(
        await viewport.evaluate((element) => element.scrollTop),
    ).toBeGreaterThan(1000)
    expect(await page.evaluate(() => window.scrollY)).toBe(scroll)
    await page.keyboard.press('End')
    await expect(
        page.getByRole('option', { name: 'Option 00248', exact: true }),
    ).toBeInViewport()
    await page.keyboard.press('Home')
    await expect(
        page.getByRole('option', { name: /^Option 00000/ }),
    ).toBeInViewport()
    expect(await page.evaluate(() => window.scrollY)).toBe(scroll)
})

test('Tab, Shift+Tab and outside pointer dismissal leave a nonmodal popup in the surrounding tab order', async ({
    page,
}) => {
    await page.goto('/?virtual-list=select&full-list&count=10')
    await page.getByRole('button', { name: 'Submit' }).evaluate((button) => {
        const element = button as HTMLElement
        element.style.position = 'fixed'
        element.style.right = '8px'
        element.style.top = '8px'
        element.addEventListener('click', () =>
            element.setAttribute('data-activated', 'true'),
        )
        const before = document.createElement('button')
        before.textContent = 'Before'
        document.body.prepend(before)
    })
    const trigger = page.getByRole('combobox', { name: 'Virtual choices' })
    await trigger.press('Enter')
    await expect(page.getByRole('textbox')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Submit' })).toBeFocused()
    await expect(page.getByRole('option')).toHaveCount(0)
    await trigger.press('Enter')
    await page.getByRole('button', { name: 'Submit' }).click()
    await expect(page.getByRole('button', { name: 'Submit' })).toHaveAttribute(
        'data-activated',
        'true',
    )
    await expect(trigger).not.toBeFocused()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await trigger.press('Enter')
    await page.keyboard.press('Shift+Tab')
    await expect(page.getByRole('option')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Before' })).toBeFocused()
})

test('positions a custom ShadowRoot portal in a transformed containing block', async ({
    page,
}) => {
    await page.goto('/?virtual-list=select&full-list&count=10&no-search&shadow')
    await page.evaluate(() => {
        document.body.style.transformOrigin = 'top left'
        document.body.style.transform = 'translate(55px, 35px) scale(0.8)'
    })
    const trigger = page.getByRole('combobox', { name: 'Virtual choices' })
    await trigger.press('Enter')
    await expect(
        page.getByRole('option', { name: /^Option 00000/ }),
    ).toBeFocused()
    const popup = page.getByRole('listbox')
    await expect
        .poll(async () => {
            const anchor = (await trigger.boundingBox())!
            const menu = (await popup.boundingBox())!
            return (
                Math.abs(menu.x - anchor.x) +
                Math.abs(menu.y - anchor.y - anchor.height - 4) +
                Math.abs(menu.width - anchor.width)
            )
        })
        .toBeLessThan(2)
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
    await expect(trigger).toBeFocused()
    await expect(
        page.getByRole('status', { name: 'Selected values' }),
    ).toHaveText('9')
})

for (const property of [
    'translate',
    'scale',
    'rotate',
    'willChange',
] as const) {
    test(`positions a custom portal with the individual CSS ${property} containing block`, async ({
        page,
    }) => {
        await page.goto(
            '/?virtual-list=select&full-list&count=10&no-search&shadow',
        )
        await page.locator('main > div').evaluate((element, propertyName) => {
            // An offset parent makes even identity transforms expose an
            // incorrect viewport-based origin. Never set the transform shorthand.
            const host = element as HTMLElement
            host.style.position = 'absolute'
            host.style.left = '50px'
            host.style.top = '30px'
            host.style.width = '800px'
            host.style.height = '500px'
            host.style.transformOrigin = 'top left'
            host.style[propertyName] =
                propertyName === 'translate'
                    ? '48px 32px'
                    : propertyName === 'scale'
                      ? '0.8'
                      : propertyName === 'rotate'
                        ? '0deg'
                        : 'translate'
        }, property)
        const trigger = page.getByRole('combobox', { name: 'Virtual choices' })
        await trigger.press('Enter')
        const popup = page.getByRole('listbox')
        await expect
            .poll(async () => {
                const anchor = (await trigger.boundingBox())!
                const menu = (await popup.boundingBox())!
                return (
                    Math.abs(menu.x - anchor.x) +
                    Math.abs(menu.y - anchor.y - anchor.height - 4) +
                    Math.abs(menu.width - anchor.width)
                )
            })
            .toBeLessThan(2)
    })
}

test('follows anchor layout shifts without a resize and coalesces external updates while ignoring popup scroll', async ({
    page,
}) => {
    await page.goto('/?virtual-list=select&full-list&count=10&no-search')
    const trigger = page.getByRole('combobox', { name: 'Virtual choices' })
    await trigger.press('Enter')
    const popup = page.getByRole('listbox')
    const before = (await trigger.boundingBox())!
    await trigger.evaluate((element) => {
        const spacer = document.createElement('div')
        spacer.style.height = '80px'
        element.before(spacer)
    })
    await expect
        .poll(async () => {
            const anchor = (await trigger.boundingBox())!
            const menu = (await popup.boundingBox())!
            return Math.abs(menu.y - anchor.y - anchor.height - 4)
        })
        .toBeLessThan(2)
    const after = (await trigger.boundingBox())!
    expect(after.y - before.y).toBe(80)
    expect(after.width).toBe(before.width)
    expect(after.height).toBe(before.height)
    const counts = await trigger.evaluate(async (element) => {
        let reads = 0
        const original = element.getBoundingClientRect.bind(element)
        element.getBoundingClientRect = () => {
            reads++
            return original()
        }
        const view = element.ownerDocument.defaultView!
        const settle = () =>
            new Promise<void>((resolve) =>
                view.requestAnimationFrame(() =>
                    view.requestAnimationFrame(() =>
                        view.requestAnimationFrame(() => resolve()),
                    ),
                ),
            )
        await settle()
        reads = 0
        const viewport = document.querySelector('.rentnerselect-scrollbar')!
        for (let index = 0; index < 20; index++)
            viewport.dispatchEvent(new Event('scroll'))
        await settle()
        const popupScroll = reads
        reads = 0
        for (let index = 0; index < 20; index++)
            window.dispatchEvent(new Event('resize'))
        await settle()
        const resizeBurst = reads
        reads = 0
        await settle()
        const idle = reads
        element.getBoundingClientRect = original
        return { popupScroll, resizeBurst, idle }
    })
    expect(counts).toEqual({ popupScroll: 0, resizeBurst: 1, idle: 0 })
    await page.keyboard.press('Escape')
    const afterClose = await trigger.evaluate(async (element) => {
        let reads = 0
        const original = element.getBoundingClientRect.bind(element)
        element.getBoundingClientRect = () => {
            reads++
            return original()
        }
        for (let index = 0; index < 20; index++)
            window.dispatchEvent(new Event('resize'))
        await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        )
        element.getBoundingClientRect = original
        return reads
    })
    expect(afterClose).toBe(0)
})

test('flips and constrains the popup at viewport edges and recomputes after resize', async ({
    page,
}) => {
    await page.setViewportSize({ width: 400, height: 450 })
    await page.goto('/?virtual-list=select&full-list&count=10&no-search')
    await page.getByRole('form').evaluate((form) => {
        const element = form as HTMLElement
        element.style.position = 'fixed'
        element.style.bottom = '8px'
        element.style.right = '0'
    })
    const trigger = page.getByRole('combobox', { name: 'Virtual choices' })
    await trigger.press('Enter')
    const popup = page.getByRole('listbox')
    await expect
        .poll(async () => {
            const anchor = (await trigger.boundingBox())!
            const menu = (await popup.boundingBox())!
            return (
                menu.y >= 3 &&
                menu.y + menu.height <= anchor.y &&
                menu.x >= 3 &&
                menu.x + menu.width <= 397
            )
        })
        .toBe(true)
    await page.setViewportSize({ width: 280, height: 350 })
    await expect
        .poll(async () => {
            const menu = (await popup.boundingBox())!
            return (
                menu.x >= 3 &&
                menu.x + menu.width <= 277 &&
                menu.y >= 3 &&
                menu.y + menu.height <= 347
            )
        })
        .toBe(true)
})

test.describe('touch selection', () => {
    test.use({ hasTouch: true })
    test('opens with a touch tap and selects an option once without form submission', async ({
        page,
    }) => {
        await page.goto('/?virtual-list=select&full-list&count=10&no-search')
        const trigger = page.getByRole('combobox', { name: 'Virtual choices' })
        await trigger.tap()
        await page
            .getByRole('option', { name: 'Option 00001', exact: true })
            .tap()
        await expect(
            page.getByRole('status', { name: 'Selected values' }),
        ).toHaveText('1')
        await expect(page.getByRole('option')).toHaveCount(0)
        await expect(trigger).toBeFocused()
    })
})
