"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/Shell";
import { AREA_TINT, Card, Chip } from "@/components/ui";
import { useMomentum } from "@/lib/store";

// Universal Search (GET /search) — searches tasks, goals, habits, journal,
// calendar events, and life areas. Runs over local state offline-first;
// with a backend configured, results can be federated via remote.search().

export default function SearchPage() {
  const { state } = useMomentum();
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return null;
    const match = (t: string) => t.toLowerCase().includes(s);
    return {
      tasks: state.tasks.filter(t => match(t.title)),
      goals: state.goals.filter(g => match(g.title)),
      habits: state.habits.filter(h => match(h.title)),
      journal: state.journal.filter(j => match(j.text)),
      calendar: state.events.filter(e => match(e.title)),
      areas: state.areas.filter(a => match(a.name))
    };
  }, [q, state]);

  const total = results
    ? Object.values(results).reduce((n, arr) => n + arr.length, 0)
    : 0;

  return (
    <div className="animate-rise">
      <TopBar title="Search" subtitle="Everything in your life, searchable from one place." />

      <Card className="p-4">
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search tasks, goals, habits, journal, calendar…"
          className="w-full rounded-xl border border-line bg-raise px-4 py-3 text-[14px] text-ink placeholder:text-dim focus:border-indigo focus:outline-none"
        />
      </Card>

      {!results && (
        <p className="mt-6 text-center text-[12px] text-dim">Type at least two characters to search.</p>
      )}

      {results && total === 0 && (
        <Card className="mt-4 p-8 text-center text-[13px] text-mute">
          No results for "{q}". Try a different term, or capture it as a new task from the Planner.
        </Card>
      )}

      {results && total > 0 && (
        <div className="mt-4 space-y-4">
          <Section title="Tasks" count={results.tasks.length}>
            {results.tasks.map(t => (
              <Row key={t.id} href="/planner" title={t.title}
                right={<Chip label={cap(t.area)} tint={AREA_TINT[t.area]} />}
                sub={t.status === "completed" ? "Completed" : "Open"} />
            ))}
          </Section>
          <Section title="Goals" count={results.goals.length}>
            {results.goals.map(g => (
              <Row key={g.id} href={`/life/${g.area}`} title={g.title} sub={`${g.progress}% · ${cap(g.area)}`} />
            ))}
          </Section>
          <Section title="Habits" count={results.habits.length}>
            {results.habits.map(h => (
              <Row key={h.id} href={`/life/${h.area}`} title={`${h.icon} ${h.title}`} sub={`🔥 ${h.streak}-day streak`} />
            ))}
          </Section>
          <Section title="Journal" count={results.journal.length}>
            {results.journal.map(j => (
              <Row key={j.id} href="/insights" title={j.text.slice(0, 80) + (j.text.length > 80 ? "…" : "")} sub={`${j.date} · ${j.type}`} />
            ))}
          </Section>
          <Section title="Calendar" count={results.calendar.length}>
            {results.calendar.map(e => (
              <Row key={e.id} href="/planner" title={e.title} sub={`${e.start}–${e.end} today`} />
            ))}
          </Section>
          <Section title="Life Areas" count={results.areas.length}>
            {results.areas.map(a => (
              <Row key={a.id} href={`/life/${a.id}`} title={`${a.icon} ${a.name}`} sub={`${a.progress}% progress`} />
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  if (count === 0) return null;
  return (
    <Card>
      <p className="px-5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-dim">{title} · {count}</p>
      <div className="px-3 pb-3 pt-1">{children}</div>
    </Card>
  );
}

function Row({ href, title, sub, right }: { href: string; title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-raise/60">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-ink">{title}</span>
        {sub && <span className="block text-[11px] text-mute">{sub}</span>}
      </span>
      {right}
    </Link>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
