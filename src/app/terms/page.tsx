import Link from "next/link";

export const metadata = { title: "Terms of Service — Momentum" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <Link href="/" className="text-[12px] text-dim hover:text-mute">← Momentum</Link>
      <h1 className="mt-4 text-[28px] font-bold tracking-tight text-ink">Terms of Service</h1>
      <p className="mt-1 text-[12px] text-dim">Last updated: July 2026</p>

      <div className="mt-8 space-y-6 text-[14px] leading-relaxed text-mute">
        <p>
          Welcome to Momentum. By creating an account or using the app you agree to these terms.
          They're intentionally short and readable.
        </p>
        <p>
          <strong className="text-ink">The service.</strong> Momentum helps you plan your life: goals,
          tasks, habits, journaling, and AI-assisted coaching. It's currently in early access, which means
          features may change, break, or be removed as the product evolves.
        </p>
        <p>
          <strong className="text-ink">Your account.</strong> You're responsible for keeping your password
          safe and for what happens under your account. You must be at least 13 years old to use Momentum.
        </p>
        <p>
          <strong className="text-ink">Your content.</strong> Everything you create in Momentum — tasks,
          journals, goals — belongs to you. We only store and process it to run the service for you.
        </p>
        <p>
          <strong className="text-ink">Acceptable use.</strong> Don't attempt to break, overload, or reverse
          the service, probe other people's data, or use the platform for anything unlawful.
        </p>
        <p>
          <strong className="text-ink">AI Coach.</strong> The coach offers planning suggestions generated
          from your own data. It is not a professional advisor; decisions you make remain yours.
        </p>
        <p>
          <strong className="text-ink">No warranty.</strong> The service is provided "as is" during early
          access, without warranties of any kind. We may suspend or discontinue the service; where
          practical, we'll give notice so you can export your data.
        </p>
        <p>
          <strong className="text-ink">Termination.</strong> You can delete your account at any time. We may
          suspend accounts that violate these terms.
        </p>
        <p>
          See also our <Link href="/privacy" className="text-indigo underline">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}
