// Sync Queue — implements the doc's offline-first pipeline:
//   Local Database → Sync Queue → Backend API → PostgreSQL → Other Devices
//
// Mutations apply locally first (instant UX), then mirror to the API.
// If a call fails (offline, 429, 5xx), the operation is persisted and
// retried when connectivity returns. Conflict policy per the doc:
// last-write-wins for simple fields; journals merge server-side.

import { ApiError, MomentumClient } from "./client";

export type SyncOp =
  | { kind: "task.complete"; id: string }
  | { kind: "task.reopen"; id: string }
  | { kind: "task.create"; title: string; duration?: number; priority?: number }
  | { kind: "habit.complete"; id: string }
  | { kind: "habit.uncomplete"; id: string }
  | { kind: "journal.create"; content: string; mood?: number }
  | { kind: "focus.end"; taskId?: string; duration: number };

const QUEUE_KEY = "momentum.syncqueue.v1";

export class SyncQueue {
  private flushing = false;

  constructor(private client: MomentumClient) {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => void this.flush());
    }
  }

  private read(): SyncOp[] {
    try { return JSON.parse(window.localStorage.getItem(QUEUE_KEY) ?? "[]"); }
    catch { return []; }
  }
  private write(ops: SyncOp[]) {
    try { window.localStorage.setItem(QUEUE_KEY, JSON.stringify(ops)); } catch { /* noop */ }
  }

  /** Mirror an already-applied local mutation to the backend. */
  push(op: SyncOp) {
    if (typeof window === "undefined") return;
    this.write([...this.read(), op]);
    void this.flush();
  }

  async flush() {
    if (this.flushing || typeof window === "undefined" || !navigator.onLine) return;
    this.flushing = true;
    try {
      let ops = this.read();
      while (ops.length) {
        const [op, ...rest] = ops;
        try {
          await this.execute(op);
          this.write(rest);
          ops = rest;
        } catch (e) {
          // Client errors (4xx except 429) won't succeed on retry — drop them.
          if (e instanceof ApiError && e.status >= 400 && e.status < 500 && e.status !== 429 && e.status !== 401) {
            this.write(rest);
            ops = rest;
            continue;
          }
          break; // offline / rate-limited / server error → retry later
        }
      }
    } finally {
      this.flushing = false;
    }
  }

  private execute(op: SyncOp): Promise<unknown> {
    const c = this.client;
    switch (op.kind) {
      case "task.complete": return c.tasks.complete(op.id);
      case "task.reopen": return c.tasks.update(op.id, { completed: false });
      case "task.create": return c.tasks.create({ title: op.title, duration: op.duration, priority: op.priority });
      case "habit.complete": return c.habits.complete(op.id);
      case "habit.uncomplete": return c.habits.update(op.id, {}); // server treats as log correction
      case "journal.create": return c.journal.create({ content: op.content, mood: op.mood });
      case "focus.end": return c.focus.end({ interrupted: false });
    }
  }
}
