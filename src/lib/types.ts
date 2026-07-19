// Momentum — shared domain types
// Mirrors the entities described in the Technical Architecture doc
// (/api/auth /tasks /goals /projects /habits /journal /calendar /analytics)

export type LifeAreaId =
  | "career" | "learning" | "health" | "finance"
  | "relationships" | "home" | "mind" | "purpose" | "hobbies";

export interface LifeArea {
  id: LifeAreaId;
  name: string;
  icon: string;        // emoji glyph for Phase 1; swap for icon set later
  color: string;       // hex accent
  progress: number;    // 0–100 satisfaction / progress
}

export type TaskStatus = "todo" | "in_progress" | "completed" | "skipped";

export interface Task {
  id: string;
  title: string;
  area: LifeAreaId;
  status: TaskStatus;
  priority: 1 | 2 | 3;
  estimateMin?: number;
  points: number;        // Momentum Score contribution
  due?: string;          // ISO date
  goalId?: string;
}

export interface Habit {
  id: string;
  title: string;
  icon: string;
  area: LifeAreaId;
  color: string;
  target: number;        // e.g. 1 (binary), 5 (units), 480 (minutes)
  progress: number;      // today's progress toward target
  unit?: string;         // "pages", "min", …
  streak: number;
  bestStreak: number;
  points: number;
}

export interface Goal {
  id: string;
  title: string;
  area: LifeAreaId;
  progress: number;      // 0–100
  deadline?: string;
  milestones: { title: string; done: boolean }[];
  todaysTaskId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;         // "HH:MM"
  end: string;
  color: string;
  kind: "meeting" | "deepwork" | "habit" | "reflection" | "event";
}

export interface Achievement {
  id: string;
  title: string;
  detail: string;
  icon: string;
  tint: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  type: "morning" | "reflection" | "gratitude" | "free";
  text: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "coach";
  text: string;
  actions?: string[];
}

export interface DailyBrief {
  headline: string;
  summary: string;
  priorities: { taskId: string; hours: number }[];
  footer: string;
}

export interface MomentumState {
  user: { name: string; handle: string };
  score: number;
  scoreDelta: number;
  dailyGoal: number;
  scoreHistory: { day: string; value: number }[];
  areas: LifeArea[];
  tasks: Task[];
  habits: Habit[];
  goals: Goal[];
  events: CalendarEvent[];
  achievements: Achievement[];
  journal: JournalEntry[];
  brief: DailyBrief;
  onboarded: boolean;
}
