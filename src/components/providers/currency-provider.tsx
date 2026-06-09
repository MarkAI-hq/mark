'use client'

import { createContext, useContext, useState, useTransition } from 'react'
import { updateOrgCurrency } from '@/lib/actions/school-revenue'
import type { RatesMap } from '@/lib/actions/exchange-rates'

interface CurrencyContextValue {
  currency: string
  rates: RatesMap
  saving: boolean
  setCurrency: (val: string) => void
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider')
  return ctx
}

interface CurrencyProviderProps {
  initialCurrency: string
  rates: RatesMap
  children: React.ReactNode
}

export function CurrencyProvider({ initialCurrency, rates, children }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState(initialCurrency)
  const [saving, startSave] = useTransition()

  function setCurrency(val: string) {
    const prev = currency
    setCurrencyState(val)
    startSave(async () => {
      const { error } = await updateOrgCurrency(val)
      if (error) setCurrencyState(prev)
    })
  }

  return (
    <CurrencyContext.Provider value={{ currency, rates, saving, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}
