import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Terms of Service — Mirror Intelligence' }

const EFFECTIVE = '3 June 2026'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← Mirror Intelligence</Link>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-10">Effective {EFFECTIVE}</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">1. About this agreement</h2>
            <p>
              These Terms of Service ("Terms") govern your use of Mirror Intelligence ("Mirror", "we", "us"), an educational assessment platform operated by Mirror Education Ltd. By accessing or using Mirror, you agree to these Terms on behalf of yourself and your institution.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">2. Who can use Mirror</h2>
            <p>
              Mirror is intended for schools, teachers, and students operating under an institutional subscription. Individual users access the platform through their school's administrator account. You must be at least 16 years old to hold a teacher or administrator account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">3. Your account</h2>
            <p>
              You are responsible for keeping your login credentials confidential. You must notify us immediately if you suspect unauthorised access to your account. We are not liable for losses caused by unauthorised use of your credentials.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">4. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Use Mirror for any unlawful purpose or in violation of any applicable regulations</li>
              <li>Upload content that infringes third-party intellectual property rights</li>
              <li>Attempt to gain unauthorised access to any part of the platform or its systems</li>
              <li>Reverse engineer, decompile, or attempt to extract the source code of Mirror</li>
              <li>Use Mirror to process data about individuals who have not consented to such processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">5. Content and data you upload</h2>
            <p>
              You retain ownership of all content you upload (assessments, curricula, student records). You grant Mirror a limited licence to store and process that content solely to provide the service. You are responsible for ensuring you have the right to upload any content, including student data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">6. AI-generated content</h2>
            <p>
              Mirror uses AI tools to assist with exam generation, assessment redesign, and learning suggestions. AI-generated output is provided as a starting point and may contain errors. You are responsible for reviewing and validating any AI-generated content before use with students.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">7. Service availability</h2>
            <p>
              We aim for high availability but do not guarantee uninterrupted service. We may perform scheduled maintenance, release updates, or temporarily restrict access to address security or technical issues. We will endeavour to give advance notice of planned downtime where possible.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">8. Suspension and termination</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms, are used for fraudulent activity, or where required by law. Institutions may request deletion of their data upon subscription termination. Certain anonymised or aggregated data may be retained for platform improvement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">9. Limitation of liability</h2>
            <p>
              To the extent permitted by applicable law, Mirror is not liable for indirect, incidental, or consequential damages arising from your use of the platform, including loss of data, revenue, or educational outcomes. Our total liability in any 12-month period shall not exceed the fees paid by your institution in that period.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">10. Changes to these Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify institutional administrators by email at least 14 days before material changes take effect. Continued use of Mirror after that date constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">11. Governing law</h2>
            <p>
              These Terms are governed by the laws of Uganda. Any disputes shall be subject to the exclusive jurisdiction of the courts of Kampala, Uganda.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">12. Contact</h2>
            <p>
              For questions about these Terms, contact us at{' '}
              <a href="mailto:legal@mirror.education" className="text-amber-600 hover:underline">legal@mirror.education</a>.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 flex gap-6 text-sm text-slate-500">
          <Link href="/privacy" className="hover:text-slate-700">Privacy Policy</Link>
          <Link href="/login" className="hover:text-slate-700">Back to login</Link>
        </div>
      </div>
    </div>
  )
}
