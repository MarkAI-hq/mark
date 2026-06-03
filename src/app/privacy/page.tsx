import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy Policy — Mirror Intelligence' }

const EFFECTIVE = '3 June 2026'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← Mirror Intelligence</Link>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Effective {EFFECTIVE}</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">1. Who we are</h2>
            <p>
              Mirror Intelligence is an educational assessment platform operated by Mirror Education Ltd (&quot;Mirror&quot;, &quot;we&quot;, &quot;us&quot;). We are committed to protecting the privacy of teachers, school administrators, and students who use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">2. What data we collect</h2>

            <h3 className="text-base font-medium text-slate-800 mt-4 mb-2">Account data</h3>
            <p>When you register or are invited, we collect your name, email address, phone number (optional), and your role within your institution.</p>

            <h3 className="text-base font-medium text-slate-800 mt-4 mb-2">Usage data</h3>
            <p>With your consent, we collect anonymised analytics about how the platform is used — pages visited, features accessed, and session duration — using PostHog. This helps us improve Mirror for everyone.</p>

            <h3 className="text-base font-medium text-slate-800 mt-4 mb-2">Educational content</h3>
            <p>Assessments, student submissions, class records, and curriculum materials you create or upload are stored on our servers and processed solely to provide the service.</p>

            <h3 className="text-base font-medium text-slate-800 mt-4 mb-2">Student data</h3>
            <p>Student records are created and managed by your institution. Mirror processes this data as a data processor on your institution&apos;s behalf. Your school is the data controller for student information.</p>

            <h3 className="text-base font-medium text-slate-800 mt-4 mb-2">Error reports</h3>
            <p>In production, we collect error reports using Sentry to diagnose and fix technical issues. These reports may include browser type, URL, and error stack traces, but do not include assessment content or student answers.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">3. How we use your data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide, maintain, and improve the Mirror platform</li>
              <li>To authenticate your account and keep it secure</li>
              <li>To send service-related notifications (invitations, password resets, feature updates)</li>
              <li>To analyse platform usage and improve features — only if you have consented to analytics</li>
              <li>To diagnose and fix technical errors</li>
            </ul>
            <p className="mt-3">We do not sell your data to third parties. We do not use your data to train AI models without explicit consent.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">4. Cookies and local storage</h2>
            <p>We use the following:</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 pr-4 font-medium text-slate-900">Name</th>
                    <th className="text-left py-2 pr-4 font-medium text-slate-900">Type</th>
                    <th className="text-left py-2 font-medium text-slate-900">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs">token</td>
                    <td className="py-2 pr-4">httpOnly cookie</td>
                    <td className="py-2">Authentication — keeps you logged in (15 min)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs">refreshToken</td>
                    <td className="py-2 pr-4">httpOnly cookie</td>
                    <td className="py-2">Session renewal (7 days)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs">user</td>
                    <td className="py-2 pr-4">Cookie</td>
                    <td className="py-2">Your profile for navigation and role-based access (7 days)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs">mark_analytics_consent</td>
                    <td className="py-2 pr-4">localStorage</td>
                    <td className="py-2">Records whether you accepted or declined analytics</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs">ph_*</td>
                    <td className="py-2 pr-4">localStorage</td>
                    <td className="py-2">PostHog analytics — only if you accepted analytics</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">The first three cookies are strictly necessary for the platform to function and do not require consent. PostHog is only activated after you explicitly accept analytics.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">5. Your consent choices</h2>
            <p>
              When you first visit Mirror, we ask for your consent to analytics cookies. You can change your choice at any time by clearing your browser&apos;s localStorage for this site, which will prompt the consent banner again on your next visit.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">6. Data sharing</h2>
            <p>We share data only with the following sub-processors, all bound by data processing agreements:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Cloudflare R2</strong> — file and image storage</li>
              <li><strong>PostHog</strong> — analytics (only if you have consented)</li>
              <li><strong>Sentry</strong> — error monitoring</li>
            </ul>
            <p className="mt-3">We do not share data with advertisers, data brokers, or any party not listed above.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">7. Data retention</h2>
            <p>
              Account data is retained for the duration of your institution&apos;s subscription and for up to 12 months after termination. Student records are deleted or anonymised upon your institution&apos;s written request. Analytics data retained by PostHog follows their 1-year retention policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">8. Your rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Object to or restrict certain processing</li>
              <li>Withdraw consent for analytics at any time</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at{' '}
              <a href="mailto:privacy@mirror.education" className="text-amber-600 hover:underline">privacy@mirror.education</a>.
              Institutional administrators may also manage staff data directly from the Settings panel.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">9. Security</h2>
            <p>
              All data is transmitted over HTTPS. Authentication tokens are stored in httpOnly cookies, inaccessible to JavaScript. We conduct periodic security reviews and apply security patches promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">10. Children&apos;s privacy</h2>
            <p>
              Student accounts are created by and under the supervision of their school. Schools using Mirror are responsible for obtaining any parental consents required under applicable law before adding student data to the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">11. Changes to this policy</h2>
            <p>
              We will notify institutional administrators by email of any material changes at least 14 days before they take effect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">12. Contact</h2>
            <p>
              For privacy enquiries:{' '}
              <a href="mailto:privacy@mirror.education" className="text-amber-600 hover:underline">privacy@mirror.education</a>
              <br />
              Mirror Education Ltd, Kampala, Uganda
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 flex gap-6 text-sm text-slate-500">
          <Link href="/terms" className="hover:text-slate-700">Terms of Service</Link>
          <Link href="/login" className="hover:text-slate-700">Back to login</Link>
        </div>
      </div>
    </div>
  )
}
