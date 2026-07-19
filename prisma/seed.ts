// Seed — creates the demo user (Arjun) with the same state the web app
// ships offline, so connecting the frontend to the backend feels seamless.
// Run: npm run prisma:seed   (login: arjun@momentum.app / momentum123)
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const AREAS = [
  { name: "Career", icon: "💼", color: "#8b5cf6" },
  { name: "Health", icon: "❤️", color: "#22c55e" },
  { name: "Learning", icon: "📘", color: "#3b82f6" },
  { name: "Finance", icon: "💰", color: "#f59e0b" },
  { name: "Relationships", icon: "👥", color: "#ec4899" },
  { name: "Mind", icon: "🧠", color: "#06b6d4" },
  { name: "Home", icon: "🏠", color: "#f97316" },
  { name: "Purpose", icon: "⭐", color: "#a78bfa" },
  { name: "Hobbies", icon: "🎨", color: "#34d399" }
];

async function main() {
  const email = "arjun@momentum.app";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Seed user already exists — skipping.");
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: "Arjun",
      email,
      passwordHash: await bcrypt.hash("momentum123", 10),
      onboardingCompleted: true,
      settings: { create: {} },
      lifeAreas: { create: AREAS.map((a, i) => ({ ...a, displayOrder: i })) }
    },
    include: { lifeAreas: true }
  });

  const areaId = (name: string) => user.lifeAreas.find(a => a.name === name)!.id;

  // Goals with milestones and a project each
  const pmGoal = await prisma.goal.create({
    data: {
      userId: user.id, lifeAreaId: areaId("Career"),
      title: "Become Product Manager", progress: 68, priority: 1,
      milestones: { create: [
        { title: "Complete UX foundations", completed: true },
        { title: "Ship portfolio case studies" },
        { title: "Lead a cross-functional project" }
      ]},
      projects: { create: [{ title: "Portfolio case studies" }] }
    },
    include: { projects: true }
  });

  const catGoal = await prisma.goal.create({
    data: {
      userId: user.id, lifeAreaId: areaId("Learning"),
      title: "Crack CAT", progress: 42, priority: 1,
      milestones: { create: [
        { title: "Finish Quant syllabus" },
        { title: "20 mock tests" },
        { title: "95th percentile in mocks" }
      ]},
      projects: { create: [{ title: "Quant preparation" }] }
    },
    include: { projects: true }
  });

  await prisma.goal.create({
    data: {
      userId: user.id, lifeAreaId: areaId("Health"),
      title: "Run a Half Marathon", progress: 30, priority: 2,
      milestones: { create: [
        { title: "Run 5K comfortably", completed: true },
        { title: "Run 10K" },
        { title: "Race day" }
      ]}
    }
  });

  // Today's tasks (two already completed, with score history)
  const today = new Date();
  const tasks = await Promise.all([
    prisma.task.create({ data: { userId: user.id, projectId: pmGoal.projects[0].id, title: "Finish UX Case Study", priority: 1, durationMinutes: 120, momentumPoints: 20, dueDate: today, completed: true } }),
    prisma.task.create({ data: { userId: user.id, projectId: catGoal.projects[0].id, title: "CAT Quant Practice", priority: 1, durationMinutes: 90, momentumPoints: 20, dueDate: today, completed: true } }),
    prisma.task.create({ data: { userId: user.id, projectId: pmGoal.projects[0].id, title: "Review Product Roadmap", priority: 2, durationMinutes: 45, momentumPoints: 10, dueDate: today } }),
    prisma.task.create({ data: { userId: user.id, title: "Read 20 Pages", priority: 2, durationMinutes: 40, momentumPoints: 7, dueDate: today } }),
    prisma.task.create({ data: { userId: user.id, title: "Buy Groceries", priority: 3, durationMinutes: 30, momentumPoints: 5, dueDate: today } })
  ]);

  // Habits with streaks; four already logged today
  const habitDefs = [
    { title: "Workout", area: "Health", streak: 7, best: 12, doneToday: true },
    { title: "Meditate", area: "Mind", streak: 5, best: 21, doneToday: true },
    { title: "Read", area: "Learning", streak: 9, best: 15, doneToday: true },
    { title: "Journal", area: "Mind", streak: 4, best: 10, doneToday: true },
    { title: "No Sugar", area: "Health", streak: 3, best: 8, doneToday: false },
    { title: "Sleep 8h", area: "Health", streak: 2, best: 6, doneToday: false }
  ];
  for (const h of habitDefs) {
    const habit = await prisma.habit.create({
      data: { userId: user.id, lifeAreaId: areaId(h.area), title: h.title, streak: h.streak, bestStreak: h.best }
    });
    if (h.doneToday) {
      await prisma.habitLog.create({ data: { habitId: habit.id, momentumPoints: 10 } });
    }
  }

  // Today's calendar
  const at = (hh: number, mm: number) => { const d = new Date(); d.setHours(hh, mm, 0, 0); return d; };
  await prisma.calendarEvent.createMany({
    data: [
      { userId: user.id, title: "Team Standup", startTime: at(9, 0), endTime: at(9, 45) },
      { userId: user.id, title: "Product Strategy Meeting", startTime: at(11, 0), endTime: at(12, 0) },
      { userId: user.id, title: "Deep Work Block", startTime: at(14, 0), endTime: at(16, 0) },
      { userId: user.id, title: "Gym", startTime: at(18, 0), endTime: at(19, 0) },
      { userId: user.id, title: "Evening Reflection", startTime: at(20, 30), endTime: at(21, 0) }
    ]
  });

  // Score history: today's earned points + a week of prior days
  await prisma.momentumScore.createMany({
    data: [
      { userId: user.id, points: 20, reason: "Completed: Finish UX Case Study", sourceType: "Task", sourceId: tasks[0].id },
      { userId: user.id, points: 20, reason: "Completed: CAT Quant Practice", sourceType: "Task", sourceId: tasks[1].id },
      { userId: user.id, points: 10, reason: "Workout completed", sourceType: "Habit" },
      { userId: user.id, points: 10, reason: "Meditate completed", sourceType: "Habit" },
      { userId: user.id, points: 7, reason: "Read completed", sourceType: "Habit" },
      { userId: user.id, points: 5, reason: "Journal completed", sourceType: "Habit" },
      ...[6, 5, 4, 3, 2, 1].map(daysBack => {
        const d = new Date(); d.setDate(d.getDate() - daysBack); d.setHours(12, 0, 0, 0);
        return { userId: user.id, points: 60 + daysBack * 5, reason: "Daily activity", createdAt: d };
      })
    ]
  });

  // Achievements + a journal entry
  await prisma.achievement.createMany({
    data: [
      { userId: user.id, badge: "7 Days — Consistency Streak" },
      { userId: user.id, badge: "Early Bird — 5 AM for 5 days" },
      { userId: user.id, badge: "Focus Master — 10 Deep Work Sessions" },
      { userId: user.id, badge: "Goal Crusher — 68% Goal Progress" }
    ]
  });
  await prisma.journalEntry.create({
    data: { userId: user.id, content: "Strong study day. Energy dipped after lunch — schedule deep work earlier tomorrow.", mood: 4 }
  });

  console.log("Seeded: arjun@momentum.app / momentum123");
}

main().finally(() => prisma.$disconnect());
