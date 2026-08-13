import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_NAME, PRODUCTION_SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `Privacy policy for ${SITE_NAME} Music website and mobile apps.`,
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-foreground">
      <p className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="underline underline-offset-2">
          ← {SITE_NAME}
        </Link>
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: August 13, 2026 · Applies to {PRODUCTION_SITE_URL} and the
        TABasco mobile apps (Android / iOS).
      </p>

      <div className="prose prose-neutral dark:prose-invert mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold">What we collect</h2>
          <ul className="mt-2 list-disc space-y-1 ps-5">
            <li>Account data you provide (email, display name) via Supabase Auth.</li>
            <li>Songs, folders, and preferences you save in your library.</li>
            <li>Basic product analytics (e.g. Vercel Analytics) to improve the app.</li>
            <li>Optional third-party embeds (e.g. YouTube) when you open Practice / Audio.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold">How we use data</h2>
          <p className="mt-2">
            We use your data to provide chords/tabs, sync your library, personalize
            practice features, and keep the service secure. We do not sell your
            personal information.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Third parties</h2>
          <ul className="mt-2 list-disc space-y-1 ps-5">
            <li>Supabase — authentication and database hosting.</li>
            <li>Vercel — website hosting and analytics.</li>
            <li>YouTube — when you play tutorial / original / audio videos in-app.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold">Your account</h2>
          <p className="mt-2">
            You can sign out anytime. To delete your account and associated library
            data, contact us from the in-app profile/support channel or email the
            address listed on the store listing. We will process deletion requests
            within a reasonable period.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Mobile apps</h2>
          <p className="mt-2">
            The Android and iOS apps are a native shell around the same website. They
            load {PRODUCTION_SITE_URL} and do not introduce a separate data store
            beyond device-level preferences (e.g. theme) already used on the web.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">Contact</h2>
          <p className="mt-2">
            Questions about privacy: use the support contact on{' '}
            <a
              className="underline underline-offset-2"
              href={PRODUCTION_SITE_URL}
            >
              {SITE_NAME} Music
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  )
}
