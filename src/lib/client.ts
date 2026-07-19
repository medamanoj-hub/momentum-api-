// Momentum API Client — implements the v1 REST contract (API Specification doc)
// ---------------------------------------------------------------------------
// Base URL:      https://api.momentum.app/v1   (prod)
//                http://localhost:3000/api/v1  (dev)
// Auth:          Authorization: Bearer <jwt>, refresh-token rotation
// Envelope:      { success: true,  data: {...}, message: "Success" }
//                { success: false, error: { code, message } }
// Rate limits:   100 req/min default · 20 req/min AI · 10 req/min auth
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public code: string,          // e.g. TASK_NOT_FOUND, RATE_LIMIT_EXCEEDED
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code: string; message: string };
}

type TokenPair = { token: string; refreshToken?: string };

const TOKEN_KEY = "momentum.auth.v1";

export class MomentumClient {
  constructor(private baseUrl: string) {}

  // ── token storage ────────────────────────────────────────────────
  private get tokens(): TokenPair | null {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(window.localStorage.getItem(TOKEN_KEY) ?? "null"); }
    catch { return null; }
  }
  setTokens(t: TokenPair | null) {
    if (typeof window === "undefined") return;
    if (t) window.localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
    else window.localStorage.removeItem(TOKEN_KEY);
  }
  get authenticated() { return Boolean(this.tokens?.token); }

  // ── core request with envelope + refresh-on-401 ─────────────────
  private async request<T>(method: string, path: string, body?: unknown, retried = false): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(this.tokens?.token ? { Authorization: `Bearer ${this.tokens.token}` } : {})
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    if (res.status === 401 && !retried && this.tokens?.refreshToken && path !== "/auth/refresh") {
      try {
        await this.auth.refresh();
      } catch {
        this.setTokens(null); // refresh token expired — force re-auth
        throw new ApiError("UNAUTHORIZED", "Session expired. Please sign in again.", 401);
      }
      return this.request<T>(method, path, body, true);
    }
    if (res.status === 204) return undefined as T;

    let env: Envelope<T>;
    try { env = await res.json(); }
    catch { throw new ApiError("INVALID_RESPONSE", "Server returned a non-JSON response.", res.status); }

    if (!res.ok || env.success === false) {
      throw new ApiError(env.error?.code ?? "UNKNOWN_ERROR", env.error?.message ?? res.statusText, res.status);
    }
    return env.data as T;
  }

  private get = <T,>(p: string) => this.request<T>("GET", p);
  private post = <T,>(p: string, b?: unknown) => this.request<T>("POST", p, b);
  private patch = <T,>(p: string, b?: unknown) => this.request<T>("PATCH", p, b);
  private del = <T,>(p: string) => this.request<T>("DELETE", p);

  // ── /auth (10 req/min) ───────────────────────────────────────────
  auth = {
    register: (b: { name: string; email: string; password: string }) =>
      this.post<{ user: UserDto; token: string; refreshToken?: string }>("/auth/register", b).then(this.captureToken),
    login: (b: { email: string; password: string }) =>
      this.post<{ user: UserDto; token: string; refreshToken?: string }>("/auth/login", b).then(this.captureToken),
    apple: (b: { identityToken: string }) =>
      this.post<{ user: unknown; token: string }>("/auth/apple", b).then(this.captureToken),
    google: (b: { idToken: string }) =>
      this.post<{ user: unknown; token: string }>("/auth/google", b).then(this.captureToken),
    refresh: async () => {
      const r = await this.post<TokenPair>("/auth/refresh", { refreshToken: this.tokens?.refreshToken });
      this.setTokens(r);
      return r;
    },
    logout: async () => {
      try { await this.post("/auth/logout", { refreshToken: this.tokens?.refreshToken }); }
      finally { this.setTokens(null); }
    },
    forgotPassword: (email: string) =>
      this.post<{ message: string }>("/auth/forgot-password", { email }),
    resetPassword: (token: string, password: string) =>
      this.post<{ message: string }>("/auth/reset-password", { token, password })
  };
  private captureToken = <T extends { token: string; refreshToken?: string }>(r: T) => {
    this.setTokens({ token: r.token, refreshToken: r.refreshToken });
    return r;
  };

  // ── /users ───────────────────────────────────────────────────────
  users = {
    me: () => this.get<UserDto>("/users/me"),
    update: (b: Partial<UserDto>) => this.patch<UserDto>("/users/me", b),
    deleteAccount: () => this.del("/users/me")
  };

  // ── /life-areas ──────────────────────────────────────────────────
  lifeAreas = {
    list: () => this.get<LifeAreaDto[]>("/life-areas"),
    update: (id: string, b: Partial<LifeAreaDto>) => this.patch<LifeAreaDto>(`/life-areas/${id}`, b)
  };

  // ── /goals (filters: status, lifeArea, priority) ────────────────
  goals = {
    list: (q?: { status?: string; lifeArea?: string; priority?: number }) =>
      this.get<GoalDto[]>(`/goals${qs(q)}`),
    create: (b: { title: string; lifeArea: string; targetDate?: string; description?: string }) =>
      this.post<GoalDto>("/goals", b),
    getById: (id: string) => this.get<GoalDto>(`/goals/${id}`),
    update: (id: string, b: Partial<GoalDto>) => this.patch<GoalDto>(`/goals/${id}`, b),
    remove: (id: string) => this.del(`/goals/${id}`)
  };

  // ── /projects ────────────────────────────────────────────────────
  projects = {
    list: () => this.get<ProjectDto[]>("/projects"),
    create: (b: { goalId: string; title: string; deadline?: string }) => this.post<ProjectDto>("/projects", b),
    getById: (id: string) => this.get<ProjectDto>(`/projects/${id}`),
    update: (id: string, b: Partial<ProjectDto>) => this.patch<ProjectDto>(`/projects/${id}`, b),
    remove: (id: string) => this.del(`/projects/${id}`)
  };

  // ── /tasks ───────────────────────────────────────────────────────
  tasks = {
    list: (q?: { completed?: boolean; priority?: number; today?: boolean; goal?: string; project?: string }) =>
      this.get<TaskDto[]>(`/tasks${qs(q)}`),
    create: (b: { title: string; duration?: number; priority?: number; dueDate?: string; projectId?: string }) =>
      this.post<TaskDto>("/tasks", b),
    update: (id: string, b: Partial<TaskDto>) => this.patch<TaskDto>(`/tasks/${id}`, b),
    complete: (id: string) => this.post<{ momentumPoints: number }>(`/tasks/${id}/complete`),
    remove: (id: string) => this.del(`/tasks/${id}`)
  };

  // ── /habits ──────────────────────────────────────────────────────
  habits = {
    list: () => this.get<HabitDto[]>("/habits"),
    create: (b: { title: string; frequency: "daily" | "weekly" | "monthly"; reminderTime?: string }) =>
      this.post<HabitDto>("/habits", b),
    update: (id: string, b: Partial<HabitDto>) => this.patch<HabitDto>(`/habits/${id}`, b),
    remove: (id: string) => this.del(`/habits/${id}`),
    complete: (id: string) => this.post<{ streak: number; points: number }>(`/habits/${id}/complete`),
    logs: (id: string) => this.get<HabitLogDto[]>(`/habits/${id}/logs`)
  };

  // ── /journal ─────────────────────────────────────────────────────
  journal = {
    list: () => this.get<JournalDto[]>("/journal"),
    create: (b: { title?: string; content: string; mood?: number }) => this.post<JournalDto>("/journal", b),
    update: (id: string, b: Partial<JournalDto>) => this.patch<JournalDto>(`/journal/${id}`, b),
    remove: (id: string) => this.del(`/journal/${id}`),
    reflect: (id: string) => this.post<{ summary: string }>(`/journal/${id}/reflect`)
  };

  // ── /calendar ────────────────────────────────────────────────────
  calendar = {
    list: () => this.get<CalendarEventDto[]>("/calendar"),
    create: (b: { title: string; startTime: string; endTime: string }) => this.post<CalendarEventDto>("/calendar", b),
    update: (id: string, b: Partial<CalendarEventDto>) => this.patch<CalendarEventDto>(`/calendar/${id}`, b),
    remove: (id: string) => this.del(`/calendar/${id}`),
    sync: () => this.post("/calendar/sync")
  };

  // ── /planner ─────────────────────────────────────────────────────
  planner = {
    daily: () => this.post<{ tasks: TaskDto[] }>("/planner/daily"),
    weekly: () => this.post<{ tasks: TaskDto[] }>("/planner/weekly"),
    monthly: () => this.post<{ tasks: TaskDto[] }>("/planner/monthly")
  };

  // ── /focus ───────────────────────────────────────────────────────
  focus = {
    list: () => this.get<FocusSessionDto[]>("/focus"),
    start: (b?: { taskId?: string; duration?: number }) => this.post<FocusSessionDto>("/focus/start", b),
    end: (b?: { sessionId?: string; interrupted?: boolean }) => this.post<FocusSessionDto>("/focus/end", b)
  };

  // ── /momentum-score ──────────────────────────────────────────────
  momentumScore = {
    current: () => this.get<{ today: number; weekly: number; monthly: number }>("/momentum-score"),
    history: () => this.get<MomentumScoreEntryDto[]>("/momentum-score/history")
  };

  // ── /insights ────────────────────────────────────────────────────
  insights = () => this.get<InsightsDto>("/insights");

  // ── /ai (20 req/min) ─────────────────────────────────────────────
  ai = {
    chat: (message: string) => this.post<{ reply: string }>("/ai/chat", { message }),
    dailyBrief: () => this.get<DailyBriefDto>("/ai/daily-brief"),
    weeklyReview: () => this.get<{ review: string }>("/ai/weekly-review"),
    monthlyReview: () => this.get<{ review: string }>("/ai/monthly-review"),
    goalRoadmap: (goalId: string) => this.post<{ roadmap: unknown }>("/ai/goal-roadmap", { goalId }),
    habitSuggestions: () => this.get<{ suggestions: string[] }>("/ai/habits"),
    reflection: (b: { content: string }) => this.post<{ reflection: string }>("/ai/reflection", b)
  };

  // ── /notifications ───────────────────────────────────────────────
  notifications = {
    list: () => this.get<NotificationDto[]>("/notifications"),
    markRead: () => this.patch("/notifications/read"),
    remove: (id: string) => this.del(`/notifications/${id}`)
  };

  // ── /search (universal) ──────────────────────────────────────────
  search = (query: string) => this.get<SearchResultsDto>(`/search${qs({ q: query })}`);

  // ── /settings ────────────────────────────────────────────────────
  settings = {
    get: () => this.get<SettingsDto>("/settings"),
    update: (b: Partial<SettingsDto>) => this.patch<SettingsDto>("/settings", b)
  };

  // ── /widgets ─────────────────────────────────────────────────────
  widgets = { dashboard: () => this.get<unknown>("/widgets/dashboard") };
}

function qs(q?: Record<string, unknown>) {
  if (!q) return "";
  const entries = Object.entries(q).filter(([, v]) => v !== undefined && v !== null);
  if (!entries.length) return "";
  return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
}

// ── DTOs mirroring the Database Schema doc (camelCase over the wire) ──
export interface UserDto { id: string; name: string; email: string; avatarUrl?: string; timezone?: string; locale?: string; onboardingCompleted?: boolean; }
export interface LifeAreaDto { id: string; name: string; icon: string; color: string; displayOrder: number; }
export interface GoalDto { id: string; lifeAreaId?: string; title: string; description?: string; targetDate?: string; priority?: number; status: string; progress: number; lifeArea?: { name: string; color?: string }; milestones?: { title: string; completed: boolean }[]; }
export interface ProjectDto { id: string; goalId: string; title: string; description?: string; status: string; deadline?: string; }
export interface TaskDto { id: string; projectId?: string; title: string; notes?: string; priority?: number; durationMinutes?: number; dueDate?: string; completed: boolean; recurring?: boolean; momentumPoints: number; }
export interface HabitDto { id: string; lifeAreaId?: string; title: string; frequency: "daily" | "weekly" | "monthly" | string; reminderTime?: string; streak: number; bestStreak: number; active: boolean; logs?: { id: string }[]; }
export interface HabitLogDto { id: string; habitId: string; completedAt: string; notes?: string; momentumPoints: number; }
export interface JournalDto { id: string; title?: string; content: string; mood?: number; aiSummary?: string; createdAt: string; }
export interface CalendarEventDto { id: string; title: string; source: "momentum" | "apple_calendar" | "google_calendar" | "outlook"; startTime: string; endTime: string; location?: string; }
export interface FocusSessionDto { id: string; taskId?: string; duration: number; startedAt: string; endedAt?: string; interrupted?: boolean; }
export interface MomentumScoreEntryDto { id: string; points: number; reason: string; sourceType?: string; sourceId?: string; createdAt: string; }
export interface DailyBriefDto { headline: string; summary: string; priorities: { taskId: string; hours: number }[]; footer?: string; }
export interface InsightsDto { goals: unknown; habits: unknown; productivity: unknown; timeAllocation: unknown; trends: unknown; }
export interface NotificationDto { id: string; title: string; body: string; delivered: boolean; scheduledAt: string; }
export interface SettingsDto { theme: string; aiPersonality: string; notificationsEnabled: boolean; dailyBriefTime: string; }
export interface SearchResultsDto { tasks: TaskDto[]; goals: GoalDto[]; projects: ProjectDto[]; journal: JournalDto[]; calendar: CalendarEventDto[]; habits: HabitDto[]; }
