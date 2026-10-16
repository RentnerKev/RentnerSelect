import { useCallback, useEffect, useRef, useState } from 'react'

function getCustomerKey(value: string) {
    return value
}

export function useConsumerAppLogic() {
    const [customer, setCustomer] = useState<string | null>(null)
    const [customerSearch, setCustomerSearch] = useState('')
    function handleCustomerChange(value: string | null) {
        setCustomer(value)
        setCustomerSearch(value ?? '')
    }
    const [regions, setRegions] = useState<Array<string>>([])
    const [refMode, setRefMode] = useState<'cleanup' | 'legacy' | 'object'>(
        'cleanup',
    )
    const [showRefSelect, setShowRefSelect] = useState(true)
    const [refEventsText, setRefEventsText] = useState('')
    const [objectRefStatus, setObjectRefStatus] = useState('detached')
    const refEvents = useRef<string[]>([])
    const objectTriggerRef = useRef<HTMLButtonElement>(null)
    const cleanupTriggerRef = useCallback((node: HTMLButtonElement | null) => {
        if (node) {
            refEvents.current.push('cleanup:attached')

            return () => {
                refEvents.current.push('cleanup:cleanup')
            }
        }

        refEvents.current.push('cleanup:null')
    }, [])
    const legacyTriggerRef = useCallback((node: HTMLButtonElement | null) => {
        refEvents.current.push(node ? 'legacy:attached' : 'legacy:null')
    }, [])

    useEffect(() => {
        setRefEventsText(refEvents.current.join(','))
        setObjectRefStatus(
            refMode === 'object' && showRefSelect && objectTriggerRef.current
                ? 'attached'
                : 'detached',
        )
    }, [refMode, showRefSelect])

    const triggerRef =
        refMode === 'cleanup'
            ? cleanupTriggerRef
            : refMode === 'legacy'
              ? legacyTriggerRef
              : objectTriggerRef

    return {
        state: {
            customer,
            customerSearch,
            getCustomerKey,
            regions,
            showRefSelect,
            refEventsText,
            objectRefStatus,
        },
        handler: { handleCustomerChange },
        setter: { setCustomerSearch, setRegions, setRefMode, setShowRefSelect },
        refs: { triggerRef },
    }
}
