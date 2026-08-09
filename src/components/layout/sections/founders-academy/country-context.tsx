"use client";

import { createContext, useContext, useMemo, useState } from "react";
import {
  FOUNDERS_ACADEMY_COUNTRIES,
  FOUNDERS_ACADEMY_GUARANTEE_USD,
  type FoundersAcademyCountryKey,
} from "@/config/founders-academy";

interface CountryContextValue {
  countryKey: FoundersAcademyCountryKey;
  setCountryKey: (key: FoundersAcademyCountryKey) => void;
  country: (typeof FOUNDERS_ACADEMY_COUNTRIES)[FoundersAcademyCountryKey];
  guaranteeUsd: number;
  localAmountDisplay: string;
}

const CountryContext = createContext<CountryContextValue | null>(null);

export function FoundersAcademyCountryProvider({ children }: { children: React.ReactNode }) {
  const [countryKey, setCountryKey] = useState<FoundersAcademyCountryKey>("kenya");

  const value = useMemo<CountryContextValue>(() => {
    const country = FOUNDERS_ACADEMY_COUNTRIES[countryKey];
    const local = Math.round(FOUNDERS_ACADEMY_GUARANTEE_USD * country.rate);
    return {
      countryKey,
      setCountryKey,
      country,
      guaranteeUsd: FOUNDERS_ACADEMY_GUARANTEE_USD,
      localAmountDisplay: `$${FOUNDERS_ACADEMY_GUARANTEE_USD.toLocaleString()} (\u2248 ${country.symbol} ${local.toLocaleString()})`,
    };
  }, [countryKey]);

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}

export function useFoundersAcademyCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx) {
    throw new Error("useFoundersAcademyCountry must be used within FoundersAcademyCountryProvider");
  }
  return ctx;
}
