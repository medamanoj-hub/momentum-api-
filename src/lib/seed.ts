import type { MomentumState } from "./types";

// Seed state matching the Phase 1 reference design (May 20, 2024 — Arjun Raj)
export const seed: MomentumState = {
  user: { name: "Arjun", handle: "Arjun Raj" },
  score: 738,
  scoreDelta: 56,
  dailyGoal: 750,
  scoreHistory: [
    { day: "Mon", value: 480 },
    { day: "Tue", value: 545 },
    { day: "Wed", value: 610 },
    { day: "Thu", value: 560 },
    { day: "Fri", value: 660 },
    { day: "Sat", value: 700 },
    { day: "Sun", value: 738 }
  ],
  areas: [
    { id: "career", name: "Career", icon: "💼", color: "#8b5cf6", progress: 80 },
    { id: "health", name: "Health", icon: "❤️", color: "#22c55e", progress: 65 },
    { id: "learning", name: "Learning", icon: "📘", color: "#3b82f6", progress: 70 },
    { id: "finance", name: "Finance", icon: "💰", color: "#f59e0b", progress: 60 },
    { id: "relationships", name: "Relationships", icon: "👥", color: "#ec4899", progress: 76 },
    { id: "mind", name: "Mind", icon: "🧠", color: "#06b6d4", progress: 75 },
    { id: "home", name: "Home", icon: "🏠", color: "#f97316", progress: 60 },
    { id: "purpose", name: "Purpose", icon: "⭐", color: "#a78bfa", progress: 70 },
    { id: "hobbies", name: "Hobbies", icon: "🎨", color: "#34d399", progress: 55 }
  ],
  tasks: [
    { id: "t1", title: "Finish UX Case Study", area: "career", status: "completed", priority: 1, estimateMin: 120, points: 20, goalId: "g1" },
    { id: "t2", title: "CAT Quant Practice", area: "learning", status: "completed", priority: 1, estimateMin: 90, points: 20, goalId: "g2" },
    { id: "t3", title: "Review Product Roadmap", area: "career", status: "todo", priority: 2, estimateMin: 45, points: 10, goalId: "g1" },
    { id: "t4", title: "Read 20 Pages", area: "learning", status: "todo", priority: 2, estimateMin: 40, points: 7 },
    { id: "t5", title: "Buy Groceries", area: "home", status: "todo", priority: 3, estimateMin: 30, points: 5 }
  ],
  habits: [
    { id: "h1", title: "Workout", icon: "🏃", area: "health", color: "#22c55e", target: 1, progress: 1, streak: 7, bestStreak: 12, points: 10 },
    { id: "h2", title: "Meditate", icon: "🧘", area: "mind", color: "#84cc16", target: 1, progress: 1, streak: 5, bestStreak: 21, points: 8 },
    { id: "h3", title: "Read", icon: "📖", area: "learning", color: "#22c55e", target: 1, progress: 1, unit: "session", streak: 9, bestStreak: 15, points: 7 },
    { id: "h4", title: "Journal", icon: "✍️", area: "mind", color: "#a3e635", target: 1, progress: 1, streak: 4, bestStreak: 10, points: 5 },
    { id: "h5", title: "No Sugar", icon: "🚫", area: "health", color: "#8b5cf6", target: 5, progress: 3, unit: "of 5", streak: 3, bestStreak: 8, points: 6 },
    { id: "h6", title: "Sleep 8h", icon: "🌙", area: "health", color: "#3b82f6", target: 480, progress: 435, unit: "min", streak: 2, bestStreak: 6, points: 10 }
  ],
  goals: [
    {
      id: "g1", title: "Become Product Manager", area: "career", progress: 68, deadline: "2026-12-31",
      milestones: [
        { title: "Complete UX foundations", done: true },
        { title: "Ship portfolio case studies", done: false },
        { title: "Lead a cross-functional project", done: false }
      ],
      todaysTaskId: "t1"
    },
    {
      id: "g2", title: "Crack CAT", area: "learning", progress: 42, deadline: "2026-11-30",
      milestones: [
        { title: "Finish Quant syllabus", done: false },
        { title: "20 mock tests", done: false },
        { title: "95th percentile in mocks", done: false }
      ],
      todaysTaskId: "t2"
    },
    {
      id: "g3", title: "Run a Half Marathon", area: "health", progress: 30, deadline: "2026-10-15",
      milestones: [
        { title: "Run 5K comfortably", done: true },
        { title: "Run 10K", done: false },
        { title: "Race day", done: false }
      ]
    }
  ],
  events: [
    { id: "e1", title: "Team Standup", start: "09:00", end: "09:45", color: "#3b82f6", kind: "meeting" },
    { id: "e2", title: "Product Strategy Meeting", start: "11:00", end: "12:00", color: "#8b5cf6", kind: "meeting" },
    { id: "e3", title: "Deep Work Block", start: "14:00", end: "16:00", color: "#6366f1", kind: "deepwork" },
    { id: "e4", title: "Gym", start: "18:00", end: "19:00", color: "#22c55e", kind: "habit" },
    { id: "e5", title: "Evening Reflection", start: "20:30", end: "21:00", color: "#f59e0b", kind: "reflection" }
  ],
  achievements: [
    { id: "a1", title: "7 Days", detail: "Consistency Streak", icon: "🔥", tint: "#f97316" },
    { id: "a2", title: "Early Bird", detail: "5 AM for 5 days", icon: "🌅", tint: "#f59e0b" },
    { id: "a3", title: "Focus Master", detail: "10 Deep Work Sessions", icon: "🎯", tint: "#ef4444" },
    { id: "a4", title: "Goal Crusher", detail: "68% Goal Progress", icon: "🏔️", tint: "#8b5cf6" }
  ],
  journal: [
    { id: "j1", date: "2024-05-19", type: "reflection", text: "Strong study day. Energy dipped after lunch — schedule deep work earlier tomorrow." }
  ],
  brief: {
    headline: "Today is a high-impact day",
    summary: "You have 2 deep work blocks, 1 important meeting, and time for your workout.",
    priorities: [
      { taskId: "t1", hours: 2 },
      { taskId: "t2", hours: 1.5 },
      { taskId: "t3", hours: 1 }
    ],
    footer: "Don't forget your evening reflection. 💜"
  },
  onboarded: true
};
