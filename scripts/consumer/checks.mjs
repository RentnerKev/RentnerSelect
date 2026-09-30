export async function check({ page, expect }) {
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
