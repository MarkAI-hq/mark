'use server'

export type RatesMap = Record<string, number>

export async function getUsdRates(): Promise<RatesMap> {
  try {
    const res = await fetch(
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
      { next: { revalidate: 3600 } },
    )
    if (!res.ok) throw new Error('rate fetch failed')
    const data = await res.json()
    return (data.usd ?? {}) as RatesMap
  } catch {
    return { usd: 1 }
  }
}
