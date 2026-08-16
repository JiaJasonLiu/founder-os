/**
 * Core domain model for Founder OS.
 *
 * The mental model, top to bottom:
 *   Goal      — the one long-horizon thing you're aiming at
 *   Phase     — broad eras on the way there (read-only journey markers)
 *   Track     — a lane of work that feeds the goal
 *   Quest     — a task inside a track
 *   Step      — an hour-sized piece of a quest (what you actually do)
 *   Thread    — a slow-compounding rhythm; kept, never finished
 *   Spotlight — the commitment that defeats decision paralysis
 */

/** Minutes. Kept as a plain number so estimates stay easy to sum. */
export type Minutes = number;

/** ISO date string, `YYYY-MM-DD`. */
export type DayKey = string;

/** Either `YYYY-MM-DD` (week, keyed to its Monday) or `YYYY-MM` (month). */
export type PeriodKey = string;

export type ThreadPeriod = "week" | "month";

/** The smallest unit of work — sized to finish in one sitting. */
export interface Step {
  id: string;
  text: string;
  est: Minutes;
  done: boolean;
}

/** A task within a track. Break it into steps when it's too big to sit down and finish. */
export interface Quest {
  id: string;
  text: string;
  /** Used when the quest has no steps; otherwise steps carry the estimates. */
  est: Minutes;
  done: boolean;
  steps: Step[];
}

/** A lane of work — a flat list of quests. */
export interface Track {
  id: string;
  name: string;
  /** Short subtitle shown under the name. */
  tag: string;
  /** Hex colour used for dots, checkboxes and accents. */
  color: string;
  /** Why this track exists — shown when the track is expanded. */
  intent: string;
  quests: Quest[];
}

/** A broad era on the way to the goal. Display-only. */
export interface Phase {
  n: number;
  label: string;
  /** Short timeframe note, e.g. "~18 months". */
  note: string;
}

/** A slow-compounding rhythm — the win is the streak, not completion. */
export interface Thread {
  id: string;
  name: string;
  tag: string;
  color: string;
  period: ThreadPeriod;
  /** Why it matters and when the payoff lands. */
  why: string;
  /** Short horizon label, e.g. "Pays off ~3 years out". */
  horizon: string;
  /** The repeatable action, e.g. "Read something in Portuguese". */
  cadence: string;
  /** Period keys you kept the rhythm. */
  log: PeriodKey[];
}

/** A parked item to promote into a track later. */
export interface BacklogItem {
  id: string;
  text: string;
  note: string;
}

/** One completed step or quest. The record of what you actually did. */
export interface HistoryEntry {
  id: string;
  /** Epoch milliseconds. */
  ts: number;
  label: string;
  min: Minutes;
  trackId: string;
  /** The step or quest id this came from, so un-checking can remove it. */
  refId: string;
}

/** An entry in the decision journal: form it, feed it, attack it, stress-test it. */
export interface JournalEntry {
  id: string;
  /** ISO datetime. */
  date: string;
  title: string;
  tech: string;
  biz: string;
  human: string;
  feed: string;
  attack: string;
  stress: string;
}

/** A weekly course-correction review. */
export interface Reflection {
  id: string;
  date: string;
  wins: string;
  misses: string;
  adjust: string;
  /** Snapshot of that week's totals. */
  min: Minutes;
  actions: number;
}

/**
 * The commitment that narrows the work: one track this month,
 * one quest this week. Focus draws only from this scope.
 */
export interface Spotlight {
  monthTrackId: string | null;
  weekQuestId: string | null;
  monthSetAt: number | null;
  weekSetAt: number | null;
}

/** The complete persisted application state. */
export interface AppState {
  /** Schema version, for migrations. */
  version: number;
  /** Set false until onboarding completes. */
  onboarded: boolean;
  goal: string;
  horizon: string;
  /** The one-sentence bet underpinning the goal. */
  thesis: string;
  /** Which phase you're currently in. */
  phase: number;
  phases: Phase[];
  /** Quest ids flagged for Focus. */
  starters: string[];
  tracks: Track[];
  backlog: BacklogItem[];
  threads: Thread[];
  journal: JournalEntry[];
  reflections: Reflection[];
  history: HistoryEntry[];
  spotlight: Spotlight;
}

/** A leaf unit of work surfaced to the Focus session planner. */
export interface Action {
  /** Unique key — the step id, or the quest id when it has no steps. */
  key: string;
  label: string;
  est: Minutes;
  trackId: string;
  color: string;
  /** Whether the parent quest is starred. */
  star: boolean;
  questId: string;
  stepId: string | null;
  /** Parent quest text, when this action is a step. */
  parent: string | null;
}

export type FocusLevel = "week" | "month" | "none";

export interface FocusScope {
  actions: Action[];
  level: FocusLevel;
}

/** A milestone unlocked by real work, not points. */
export interface Milestone {
  id: string;
  label: string;
  hint: string;
  test: (state: AppState) => boolean;
}

/** A starting template a new user can adopt during onboarding. */
export interface Template {
  id: string;
  name: string;
  /** Who this template suits. */
  blurb: string;
  goal: string;
  horizon: string;
  thesis: string;
  phases: Phase[];
  tracks: Track[];
  threads: Thread[];
  backlog: BacklogItem[];
  starters: string[];
}
