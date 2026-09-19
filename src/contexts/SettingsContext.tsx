import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Settings, SocialMedia, Currency, BankAccount } from '../lib/types'

interface SettingsContextType {
  settings: Settings | null
  social: SocialMedia[]
  currencies: Currency[]
  defaultCurrency: Currency | null
  bankAccounts: BankAccount[]
  loading: boolean
  refresh: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [social, setSocial] = useState<SocialMedia[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)

  const defaultCurrency = currencies.find(c => c.is_default) || currencies[0] || null

  const refresh = async () => {
    setLoading(true)
    const [{ data: settingsData }, { data: socialData }, { data: currenciesData }, { data: bankAccountsData }] = await Promise.all([
      supabase.from('settings').select('*').eq('id', 1).single(),
      supabase.from('social_media').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('currencies').select('*').eq('is_active', true).order('is_default', { ascending: false }),
      supabase.from('bank_accounts').select('*').eq('is_active', true).order('sort_order'),
    ])
    setSettings(settingsData)
    setSocial(socialData || [])
    setCurrencies(currenciesData || [])
    setBankAccounts(bankAccountsData || [])
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, social, currencies, defaultCurrency, bankAccounts, loading, refresh }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used within SettingsProvider')
  return context
}