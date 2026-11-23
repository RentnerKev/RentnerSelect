export function mergeAriaIds(...values: Array<string | undefined>) {
    let out = ''
    for (const value of values) {
        if (!value) continue
        for (const id of /\s/.test(value) ? value.split(/\s+/) : [value]) {
            if (id && out !== id && !` ${out} `.includes(` ${id} `))
                out = out ? `${out} ${id}` : id
        }
    }
    return out || undefined
}
