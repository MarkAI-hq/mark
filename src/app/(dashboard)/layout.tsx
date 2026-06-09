import { redirect } from 'next/navigation'
import Script from 'next/script'
import { getSession } from '@/lib/session'
import { getOrganizationDetails } from '@/lib/actions/organizations'
import { getSchoolStats } from '@/lib/actions/school-revenue'
import { getUsdRates } from '@/lib/actions/exchange-rates'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { CurrencyProvider } from '@/components/providers/currency-provider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  const [orgResult, statsRes, rates] = await Promise.all([
    session.organizationId
      ? getOrganizationDetails(session.organizationId)
      : Promise.resolve({ data: null }),
    getSchoolStats(),
    getUsdRates(),
  ])

  return (
    <>
      <Script
        id="cal-embed-dashboard"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", "30min", {origin:"https://app.cal.com"});
Cal.ns["30min"]("ui", {"hideEventTypeDetails":false,"layout":"month_view"});`,
        }}
      />
      <CurrencyProvider initialCurrency={statsRes.data?.currency ?? 'USD'} rates={rates}>
        <DashboardShell organizationName={orgResult.data?.name} isPublic={orgResult.data?.is_public ?? false}>
          {children}
        </DashboardShell>
      </CurrencyProvider>
    </>
  )
}
