export type FoundersAcademyCountryKey = 'kenya' | 'uganda' | 'rwanda'

export interface FoundersAcademyCountry {
  key: FoundersAcademyCountryKey
  label: string
  short: string
  certificate: string
  certShort: string
  currency: string
  symbol: string
  rate: number
}

export const FOUNDERS_ACADEMY_COUNTRIES: Record<FoundersAcademyCountryKey, FoundersAcademyCountry> = {
  kenya: {
    key: 'kenya',
    label: 'Kenya',
    short: 'KE',
    certificate: 'Kenya Certificate of Secondary Education',
    certShort: 'KCSE Certificate',
    currency: 'KES',
    symbol: 'KSh',
    rate: 129,
  },
  uganda: {
    key: 'uganda',
    label: 'Uganda',
    short: 'UG',
    certificate: 'Uganda Certificate of Education',
    certShort: 'UCE Certificate',
    currency: 'UGX',
    symbol: 'USh',
    rate: 3700,
  },
  rwanda: {
    key: 'rwanda',
    label: 'Rwanda',
    short: 'RW',
    certificate: 'Rwanda Advanced Level Certificate',
    certShort: 'A2 Certificate',
    currency: 'RWF',
    symbol: 'RWF',
    rate: 1300,
  },
}

export const FOUNDERS_ACADEMY_GUARANTEE_USD = 3500
