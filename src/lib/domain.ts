import type {
  Action,
  AppState,
  FocusScope,
  Milestone,
  Quest,
  Thread,
  Track,
} from "@/types";
import { mondayOf, periodList, prevDay, prevPeriod, streakCount, todayStr } from "@/lib/dates";

/* ------------------------------------------------------------------ *
 * Reading the model
 * ------------------------------------------------------------------ */

/** All quests in a track, whether it uses `quests` or `groups`. */
export function trackQuests(t: Track): Quest[] {
  return t.groups ? t.groups.flatMap((g) => g.quests) : (t.quests ?? []);
}

export function questCount(t: Track): { total: number; done: number } {
  const qs = trackQuests(t);
  return { total: qs.length, done: qs.filter((q) => q.done).length };
}

/** The first unfinished quest — what a track card shows as "next". */
export function nextQuest(t: Track): Quest | null {
  return trackQuests(t).find((q) => !q.done) ?? null;
}

export function findTrack(state: AppState, trackId: string): Track | undefined {
  return state.tracks.find((t) => t.id === trackId);
}

export function findQuest(state: AppState, trackId: string, questId: string): Quest | undefined {
  const t = findTrack(state, trackId);
  return t ? trackQuests(t).find((q) => q.id === questId) : undefined;
}

/** The track a quest belongs to. */
export function trackOfQuest(state: AppState, questId: string): Track | undefined {
  return state.tracks.find((t) => trackQuests(t).some((q) => q.id === questId));
}

/* ------------------------------------------------------------------ *
 * Actions — the leaf units of work Focus schedules
 * ------------------------------------------------------------------ */

/**
 * Flatten open work into schedulable actions.
 *
 * A quest with steps contributes its unfinished steps; a quest without steps
 * contributes itself. Finished work is excluded.
 */
export function leafActions(state: AppState): Action[] {
  const out: Action[] = [];
  for (const t of state.tracks) {
    for (const q of trackQuests(t)) {
      const star = state.starters.includes(q.id);
      if (q.steps.length > 0) {
        for (const s of q.steps) {
          if (s.done) continue;
          out.push({
            key: s.id,
            label: s.text,
            est: s.est,
            trackId: t.id,
            color: t.color,
            star,
            questId: q.id,
            stepId: s.id,
            parent: q.text,
          });
        }
      } else if (!q.done) {
        out.push({
          key: q.id,
          label: q.text,
          est: q.est,
          trackId: t.id,
          color: t.color,
          star,
          questId: q.id,
          stepId: null,
          parent: null,
        });
      }
    }
  }
  return out;
}

/**
 * Narrow the available work to the current commitment.
 *
 * Weekly focus wins over monthly; if a scope has no open actions left it falls
 * through to the wider one, so you're never staring at an empty screen.
 */
export function focusScope(state: AppState): FocusScope {
  const all = leafActions(state);
  const { weekQuestId, monthTrackId } = state.spotlight;

  if (weekQuestId) {
    const scoped = all.filter((a) => a.questId === weekQuestId);
    if (scoped.length) return { actions: scoped, level: "week" };
  }
  if (monthTrackId) {
    const scoped = all.filter((a) => a.trackId === monthTrackId);
    if (scoped.length) return { actions: scoped, level: "month" };
  }
  return { actions: all, level: "none" };
}

/**
 * Greedily fill a time budget, starred work first.
 *
 * Intentionally simple: it stops once the budget is met rather than solving a
 * knapsack, because a predictable list beats an optimal one you don't trust.
 */
export function buildPlan(actions: Action[], budget: number): Action[] {
  const sorted = [...actions].sort((a, b) => Number(b.star) - Number(a.star));
  const plan: Action[] = [];
  let total = 0;
  for (const a of sorted) {
    if (total >= budget) break;
    plan.push(a);
    total += a.est;
  }
  return plan;
}

/* ------------------------------------------------------------------ *
 * Mutations — all pure; each returns a new state
 * ------------------------------------------------------------------ */

const uid = (prefix: string): string =>
  prefix + Math.random().toString(36).slice(2, 9);

function clone(state: AppState): AppState {
  return typeof structuredClone === "function"
    ? structuredClone(state)
    : (JSON.parse(JSON.stringify(state)) as AppState);
}

function logHistory(
  next: AppState,
  opts: { label: string; min: number; trackId: string; refId: string },
): void {
  next.history.push({ id: uid("h"), ts: Date.now(), ...opts });
}

/** Mark a step done or undone, syncing the parent quest and history. */
export function setStepDone(
  state: AppState,
  trackId: string,
  questId: string,
  stepId: string,
  done: boolean,
): AppState {
  const next = clone(state);
  const q = findQuest(next, trackId, questId);
  if (!q) return state;
  const step = q.steps.find((s) => s.id === stepId);
  if (!step) return state;

  step.done = done;
  q.done = q.steps.length > 0 && q.steps.every((s) => s.done);

  if (done) logHistory(next, { label: step.text, min: step.est, trackId, refId: stepId });
  else next.history = next.history.filter((h) => h.refId !== stepId);

  return next;
}

/** Mark a quest done or undone. */
export function setQuestDone(
  state: AppState,
  trackId: string,
  questId: string,
  done: boolean,
): AppState {
  const next = clone(state);
  const q = findQuest(next, trackId, questId);
  if (!q) return state;

  q.done = done;
  if (done) logHistory(next, { label: q.text, min: q.est, trackId, refId: questId });
  else next.history = next.history.filter((h) => h.refId !== questId);

  return next;
}

/** Complete an action from the Focus session. */
export function completeAction(state: AppState, action: Action): AppState {
  return action.stepId
    ? setStepDone(state, action.trackId, action.questId, action.stepId, true)
    : setQuestDone(state, action.trackId, action.questId, true);
}

export function addQuest(
  state: AppState,
  trackId: string,
  groupId: string | null,
  text: string,
  est = 30,
): AppState {
  if (!text.trim()) return state;
  const next = clone(state);
  const t = findTrack(next, trackId);
  if (!t) return state;

  const quest: Quest = { id: uid("q"), text: text.trim(), est, done: false, steps: [] };
  if (groupId && t.groups) t.groups.find((g) => g.id === groupId)?.quests.push(quest);
  else if (t.quests) t.quests.push(quest);
  else return state;

  return next;
}

export function deleteQuest(state: AppState, trackId: string, questId: string): AppState {
  const next = clone(state);
  const t = findTrack(next, trackId);
  if (!t) return state;

  if (t.groups) t.groups.forEach((g) => (g.quests = g.quests.filter((q) => q.id !== questId)));
  else if (t.quests) t.quests = t.quests.filter((q) => q.id !== questId);

  next.starters = next.starters.filter((s) => s !== questId);
  if (next.spotlight.weekQuestId === questId) {
    next.spotlight = { ...next.spotlight, weekQuestId: null, weekSetAt: null };
  }
  return next;
}

export function addStep(
  state: AppState,
  trackId: string,
  questId: string,
  text: string,
  est: number,
): AppState {
  if (!text.trim()) return state;
  const next = clone(state);
  const q = findQuest(next, trackId, questId);
  if (!q) return state;

  q.steps.push({ id: uid("s"), text: text.trim(), est, done: false });
  q.done = q.steps.every((s) => s.done);
  return next;
}

export function deleteStep(
  state: AppState,
  trackId: string,
  questId: string,
  stepId: string,
): AppState {
  const next = clone(state);
  const q = findQuest(next, trackId, questId);
  if (!q) return state;

  q.steps = q.steps.filter((s) => s.id !== stepId);
  next.history = next.history.filter((h) => h.refId !== stepId);
  q.done = q.steps.length > 0 ? q.steps.every((s) => s.done) : q.done;
  return next;
}

/** Cycle an estimate to the next preset. Pass `stepId: null` for the quest itself. */
export function cycleEstimate(
  state: AppState,
  trackId: string,
  questId: string,
  stepId: string | null,
  presets: number[],
): AppState {
  const next = clone(state);
  const q = findQuest(next, trackId, questId);
  if (!q) return state;

  const target = stepId ? q.steps.find((s) => s.id === stepId) : q;
  if (!target) return state;

  const i = presets.indexOf(target.est);
  target.est = presets[(i + 1) % presets.length];
  return next;
}

/** Move a quest up (-1) or down (+1) within its list. */
export function moveQuest(
  state: AppState,
  trackId: string,
  groupId: string | null,
  questId: string,
  dir: -1 | 1,
): AppState {
  const next = clone(state);
  const t = findTrack(next, trackId);
  if (!t) return state;

  const arr = groupId ? t.groups?.find((g) => g.id === groupId)?.quests : t.quests;
  if (!arr) return state;

  const i = arr.findIndex((q) => q.id === questId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= arr.length) return state;

  [arr[i], arr[j]] = [arr[j], arr[i]];
  return next;
}

export function toggleStar(state: AppState, questId: string): AppState {
  const next = clone(state);
  next.starters = next.starters.includes(questId)
    ? next.starters.filter((s) => s !== questId)
    : [...next.starters, questId];
  return next;
}

/** Log or un-log the current period for a thread. */
export function toggleThreadPeriod(state: AppState, threadId: string): AppState {
  const next = clone(state);
  const th = next.threads.find((t) => t.id === threadId);
  if (!th) return state;

  const current = periodList(th.period, 1)[0];
  th.log = th.log.includes(current)
    ? th.log.filter((k) => k !== current)
    : [...th.log, current];
  return next;
}

/* ------------------------------------------------------------------ *
 * Stats
 * ------------------------------------------------------------------ */

export function dayStreak(state: AppState): number {
  const days = new Set(state.history.map((h) => new Date(h.ts).toISOString().slice(0, 10)));
  return streakCount(days, todayStr(), prevDay, true);
}

export function threadStreak(t: Thread): number {
  return streakCount(
    new Set(t.log),
    periodList(t.period, 1)[0],
    (k) => prevPeriod(k, t.period),
    true,
  );
}

/**
 * A single number for "work banked".
 *
 * Weighted so depth beats volume: a logged decision is worth more than a
 * checked box, because the point is judgment, not task throughput.
 */
export function momentum(state: AppState): number {
  const keeps = state.threads.reduce((a, t) => a + t.log.length, 0);
  return state.history.length * 10 + keeps * 8 + state.journal.length * 25;
}

export function weekHistory(state: AppState) {
  const start = mondayOf(new Date()).getTime();
  return state.history.filter((h) => h.ts >= start);
}

export function tracksTouched(state: AppState): Set<string> {
  return new Set(state.history.map((h) => h.trackId));
}

/* ------------------------------------------------------------------ *
 * Milestones — unlocked by real work, never by points
 * ------------------------------------------------------------------ */

export const MILESTONES: Milestone[] = [
  { id: "m_first", label: "First rep", hint: "Complete your first action", test: (s) => s.history.length >= 1 },
  { id: "m_ten", label: "Ten reps", hint: "Complete 10 actions", test: (s) => s.history.length >= 10 },
  {
    id: "m_spread",
    label: "Full spread",
    hint: "An action done in every track",
    test: (s) => s.tracks.length > 0 && s.tracks.every((t) => tracksTouched(s).has(t.id)),
  },
  { id: "m_call", label: "First call logged", hint: "Run a decision through the loop", test: (s) => s.journal.length >= 1 },
  {
    id: "m_red",
    label: "Red-teamer",
    hint: "Attack a view in the journal",
    test: (s) => s.journal.some((e) => e.attack.trim().length > 0),
  },
  { id: "m_reflect", label: "Course-corrector", hint: "Write your first weekly reflection", test: (s) => s.reflections.length >= 1 },
  {
    id: "m_thread",
    label: "Kept the thread",
    hint: "Reach a 4-period thread streak",
    test: (s) => s.threads.some((t) => threadStreak(t) >= 4),
  },
  { id: "m_deep", label: "Deep week", hint: "Complete 5 actions in one week", test: (s) => weekHistory(s).length >= 5 },
];

export function unlockedMilestones(state: AppState): Set<string> {
  return new Set(MILESTONES.filter((m) => m.test(state)).map((m) => m.id));
}
