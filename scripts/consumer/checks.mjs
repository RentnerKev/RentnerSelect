export async function check({ page, expect }) {
    const external = page.getByRole('combobox', { name: 'External customer' })
    await expect(external).toHaveCSS('height', '36px')
    await external.fill('remote query')
    await expect(page.getByRole('option')).toHaveCount(2)
    await external.press('ArrowDown')
    await expect(external).toBeFocused()
    await external.press('Enter')
    await expect(external).toHaveValue('Alpha')
    expect(
        await page
            .getByRole('form', { name: 'Customer form' })
            .evaluate((node) => new FormData(node).get('customer')),
    ).toBe('Alpha')
    await page.getByRole('button', { name: 'Clear selection' }).click()
    await expect(external).toHaveValue('')

    const refEvents = page.getByTestId('trigger-ref-events')
    const objectRefStatus = page.getByTestId('trigger-object-ref-status')
    await expect(refEvents).toHaveText('cleanup:attached')
    await page.getByRole('button', { name: 'Use legacy trigger ref' }).click()
    await expect(refEvents).toHaveText(
        'cleanup:attached,cleanup:cleanup,legacy:attached',
    )
    await page.getByRole('button', { name: 'Use object trigger ref' }).click()
    await expect(refEvents).toHaveText(
        'cleanup:attached,cleanup:cleanup,legacy:attached,legacy:null',
    )
    await expect(objectRefStatus).toHaveText('attached')
    await page.getByRole('button', { name: 'Use cleanup trigger ref' }).click()
    await expect(objectRefStatus).toHaveText('detached')
    await page.getByRole('button', { name: 'Remove ref target' }).click()
    await expect(refEvents).toHaveText(
        'cleanup:attached,cleanup:cleanup,legacy:attached,legacy:null,cleanup:attached,cleanup:cleanup',
    )
    await expect(objectRefStatus).toHaveText('detached')

    const form = page.getByRole('form', { name: 'Region form' })
    const trigger = page.getByRole('combobox', { name: 'Region' })

    expect(
        await form.evaluate((node) => new FormData(node).getAll('regions')),
    ).toEqual([''])

    await trigger.click()
    const search = page.getByRole('textbox', { name: 'Search options' })
    await search.focus()
    await page.keyboard.press('ArrowDown')

    const north = page.getByRole('option', { name: 'North' })
    await expect(north).toBeFocused()
    await expect(north).toHaveAttribute('aria-selected', 'false')
    await page.keyboard.press('Space')
    await expect(north).toHaveAttribute('aria-selected', 'true')
    await expect(north).toHaveAttribute('data-state', 'checked')

    const paddingLeft = await north.evaluate((node) =>
        Number.parseFloat(getComputedStyle(node).paddingLeft),
    )
    expect(paddingLeft).toBeGreaterThan(0)

    await page.keyboard.press('ArrowDown')
    const south = page.getByRole('option', { name: 'South' })
    await expect(south).toBeFocused()
    await expect(south).toHaveAttribute('aria-selected', 'false')
    await page.keyboard.press('Enter')
    await expect(south).toHaveAttribute('aria-selected', 'true')
    await expect(south).toHaveAttribute('data-state', 'checked')

    await page.keyboard.press('Escape')
    await expect(page.getByRole('option')).toHaveCount(0)

    await expect(
        page.getByRole('status', { name: 'Selected regions' }),
    ).toHaveText('north, south')
    expect(
        await form.evaluate((node) => new FormData(node).getAll('regions')),
    ).toEqual(['north', 'south'])
}
