import Link from "next/link";

export const metadata = { title: "Privacy Policy — Momentum" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <Link href="/" className="text-[12px] text-dim hover:text-mute">← Momentum</Link>
      <h1 className="mt-4 text-[28px] font-bold tracking-tight text-ink">Privacy Policy</h1>
      <p className="mt-1 text-[12px] text-dim">Last updated: July 2026</p>

      <div className="mt-8 space-y-6 text-[14px] leading-relaxed text-mute">
        <p>
          Momentum is a personal life-planning app. This page explains, in plain language,
          what we collect and how we handle it.
        </p>
        <p>
          <strong className="text-ink">What we collect.</strong> When you create an account we store your
          name, email address, and a securely hashed version of your password (we never store the
          password itself). As you use the app, we store the content you create: tasks, goals, habits,
          calendar events, focus sessions, journal entries, and your Momentum Score history. If you use
          guest mode, everything stays in your own browser and nothing is sent to our servers.
        </p>
        <p>
          <strong className="text-ink">How we use it.</strong> Your data is used for exactly one purpose:
          showing you your own dashboard and powering features like the AI Coach, which reads your tasks
          and habits to generate suggestions for you. We do not sell your data, show you ads, or share
          your content with third parties for marketing.
        </p>
        <p>
          <strong className="text-ink">AI features.</strong> If the AI Coach is configured with an external
          language-model provider, relevant parts of your data (such as your open tasks and habits) may be
          sent to that provider to generate a reply. Reply quality aside, treat the coach as a planning aid —
          not medical, legal, or financial advice.
        </p>
        <p>
          <strong className="text-ink">Emails.</strong> We send transactional emails only — for example,
          password-reset links. No marketing emails without your explicit consent.
        </p>
        <p>
          <strong className="text-ink">Security.</strong> Traffic is encrypted with HTTPS, passwords are
          hashed with bcrypt, and sessions use short-lived tokens with rotation.
        </p>
        <p>
          <strong className="text-ink">Your rights.</strong> You can delete your account from the app, which
          removes your data from active use. You may request a copy of your data or its permanent deletion
          at any time by contacting us.
        </p>
        <p>
          <strong className="text-ink">Changes.</strong> If this policy changes materially, we'll note the
          new date at the top of this page.
        </p>
      </div>
    </main>
  );
}
