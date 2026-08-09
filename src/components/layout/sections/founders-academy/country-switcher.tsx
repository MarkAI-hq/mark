"use client";

import { cn } from "@/lib/utils";
import { FOUNDERS_ACADEMY_COUNTRIES } from "@/config/founders-academy";
import { useFoundersAcademyCountry } from "./country-context";

export function CountrySwitcher({ variant = "default" }: { variant?: "default" | "compact" }) {
  const { countryKey, setCountryKey } = useFoundersAcademyCountry();

  return (
    <div className="flex flex-wrap gap-2">
      {Object.values(FOUNDERS_ACADEMY_COUNTRIES).map((c) => {
        const active = c.key === countryKey;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => setCountryKey(c.key)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200",
              variant === "compact" && "px-3 py-1.5 text-xs",
              active
                ? "border-[#926C15] bg-[#926C15] text-white"
                : "border-border bg-background/60 text-muted-foreground hover:border-[#926C15]/50 hover:text-[#926C15]"
            )}
          >
            {variant === "compact" ? c.short : c.label}
          </button>
        );
      })}
    </div>
  );
}
