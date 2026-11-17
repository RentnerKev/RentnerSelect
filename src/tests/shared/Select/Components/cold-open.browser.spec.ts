import { expect, test } from '@playwright/test'

for (const kind of ['select', 'combobox']) {
    for (const virtual of [false, true]) {
        test(`${kind} cold open is positioned on every visible frame, lazy=${virtual}`, async ({
            page,
        }) => {
            await page.goto(
                `/?virtual-list=${kind}&count=20&content-width=content${virtual ? '' : '&full-list'}`,
            )
            await page.getByRole('form').evaluate((form) => {
                Object.assign((form as HTMLElement).style, {
                    position: 'fixed',
                    right: '24px',
                    top: '70px',
                })
            })
            const frames = await page
                .getByRole('combobox')
                .evaluate(async (element) => {
                    const input = element as HTMLElement
                    const observed: Array<{
                        left: number
                        expected: number
                        position: string
                    }> = []
                    let running = true
                    function sample() {
                        const list = document.querySelector('[role="listbox"]')
                        const popup = list
                            ? ([
                                  list,
                                  ...Array.from(
                                      document.querySelectorAll<HTMLElement>(
                                          '[style]',
                                      ),
                                  ),
                              ].find(
                                  (node) =>
                                      node instanceof HTMLElement &&
                                      node.style.position === 'fixed' &&
                                      node.contains(list),
                              ) as HTMLElement | undefined)
                            : undefined
                        if (
                            popup &&
                            getComputedStyle(popup).visibility !== 'hidden'
                        ) {
                            observed.push({
                                left: popup.getBoundingClientRect().left,
                                expected: Math.max(
                                    4,
                                    Math.min(
                                        input.getBoundingClientRect().left,
                                        innerWidth -
                                            popup.getBoundingClientRect()
                                                .width -
                                            4,
                                    ),
                                ),
                                position: popup.style.position,
                            })
                        }
                        if (running) requestAnimationFrame(sample)
                    }
                    // Read synchronously at every DOM/style mutation, as well as every
                    // paint opportunity: an eventual-position assertion misses the flash.
                    const observer = new MutationObserver(() => {
                        // The observer checks mutation results; only the frame loop schedules itself.
                        const wasRunning = running
                        running = false
                        sample()
                        running = wasRunning
                    })
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        attributeFilter: ['style'],
                    })
                    requestAnimationFrame(sample)
                    if (input instanceof HTMLInputElement) input.focus()
                    input.click()
                    await new Promise<void>((resolve) => {
                        const check = () => {
                            const list =
                                document.querySelector('[role="listbox"]')
                            if (
                                list?.querySelector('[role="option"]') &&
                                observed.length >= 3
                            )
                                resolve()
                            else requestAnimationFrame(check)
                        }
                        check()
                    })
                    running = false
                    observer.disconnect()
                    return observed
                })
            expect(frames.length).toBeGreaterThanOrEqual(3)
            for (const frame of frames) {
                expect(frame.position).toBe('fixed')
                expect(Math.abs(frame.left - frame.expected)).toBeLessThan(2)
            }
            if (kind === 'select')
                await expect(page.getByRole('textbox')).toBeFocused()
            else await expect(page.getByRole('combobox')).toBeFocused()
        })
    }
}

for (const kind of ['select', 'combobox']) {
    test(`${kind} follows scroll inside the trigger ShadowRoot`, async ({
        page,
    }) => {
        await page.goto(
            `/?virtual-list=${kind}&full-list&count=20&shadow&no-search`,
        )
        // Keep React's DOM nodes and event delegation together while moving its
        // existing container into a scrolling shadow tree.
        await page.locator('#root').evaluate((container) => {
            const host = document.createElement('div')
            document.body.append(host)
            const shadow = host.attachShadow({ mode: 'open' })
            for (const style of document.head.querySelectorAll(
                'style,link[rel="stylesheet"]',
            ))
                shadow.append(style.cloneNode(true))
            const scroller = document.createElement('div')
            scroller.id = 'shadow-scroller'
            Object.assign(scroller.style, { height: '500px', overflow: 'auto' })
            shadow.append(scroller)
            scroller.append(container)
            const spacer = document.createElement('div')
            spacer.style.height = '1200px'
            scroller.append(spacer)
        })
        const trigger = page.getByRole('combobox')
        if (kind === 'select') await trigger.press('Enter')
        else await trigger.click()
        const popup =
            kind === 'select'
                ? page.getByRole('listbox')
                : page.getByRole('region').locator(':scope > div')
        const before = (await trigger.boundingBox())!
        await page.locator('#shadow-scroller').evaluate((element) => {
            element.scrollTop = 25
        })
        await expect
            .poll(async () => {
                const anchor = (await trigger.boundingBox())!
                const menu = (await popup.boundingBox())!
                return Math.abs(menu.y - anchor.y - anchor.height - 4)
            })
            .toBeLessThan(2)
        expect(before.y - (await trigger.boundingBox())!.y).toBe(25)
    })
}
