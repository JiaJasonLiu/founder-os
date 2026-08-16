import type { AppState, Quest, Template } from "@/types";

const STORAGE_KEY = "founder-os:state";
export const SCHEMA_VERSION = 1;

/** Empty state shown before onboarding completes. */
export function emptyState(): AppState {
  return {
    version: SCHEMA_VERSION,
    onboarded: false,
    goal: "",
    horizon: "",
    thesis: "",
    phase: 1,
    phases: [],
    starters: [],
    tracks: [],
    backlog: [],
    threads: [],
    journal: [],
    reflections: [],
    history: [],
    spotlight: { monthTrackId: null, weekQuestId: null, monthSetAt: null, weekSetAt: null },
  };
}

/** Build a ready-to-use state from a template plus the user's own goal wording. */
export function stateFromTemplate(
  template: Template,
  overrides: { goal?: string; horizon?: string; thesis?: string; trackIds?: string[] } = {},
): AppState {
  const chosen = overrides.trackIds?.length
    ? template.tracks.filter((t) => overrides.trackIds!.includes(t.id))
    : template.tracks;

  // Drop starred quests that belong to tracks the user didn't pick.
  const keptQuestIds = new Set(chosen.flatMap((t) => t.quests).map((q) => q.id));

  return {
    ...emptyState(),
    onboarded: true,
    goal: overrides.goal?.trim() || template.goal,
    horizon: overrides.horizon?.trim() || template.horizon,
    thesis: overrides.thesis?.trim() || template.thesis,
    phases: structuredClone(template.phases),
    tracks: structuredClone(chosen),
    threads: structuredClone(template.threads),
    backlog: structuredClone(template.backlog),
    starters: template.starters.filter((id) => keptQuestIds.has(id)),
  };
}

/**
 * Fill in anything missing from an older save.
 *
 * Runs on every load, so adding a field to AppState only needs a default here.
 */
function migrate(raw: Partial<AppState>): AppState {
  const base = emptyState();
  const state: AppState = {
    ...base,
    ...raw,
    spotlight: { ...base.spotlight, ...(raw.spotlight ?? {}) },
    tracks: raw.tracks ?? [],
    threads: raw.threads ?? [],
    journal: raw.journal ?? [],
    reflections: raw.reflections ?? [],
    history: raw.history ?? [],
    backlog: raw.backlog ?? [],
    phases: raw.phases ?? [],
    starters: raw.starters ?? [],
  };

  // Older saves may have quests nested under `groups`; flatten each group into
  // a parent quest whose steps are the group's old quests.
  for (const track of state.tracks) {
    const groups = (track as { groups?: { id: string; label: string; quests: Quest[] }[] }).groups;
    if (groups) {
      track.quests = groups.map((g) => ({
        id: g.id,
        text: g.label,
        est: g.quests.reduce((sum, q) => sum + (q.est ?? 30), 0),
        done: g.quests.every((q) => q.done),
        steps: g.quests.map((q) => ({ id: q.id, text: q.text, est: q.est ?? 30, done: q.done })),
      }));
      delete (track as { groups?: unknown }).groups;
    }
  }

  // Older saves may lack estimates or step arrays.
  for (const track of state.tracks) {
    track.quests ??= [];
    for (const q of track.quests) {
      if (q.est == null) q.est = 30;
      if (!q.steps) q.steps = [];
      for (const s of q.steps) if (s.est == null) s.est = 15;
    }
  }

  state.version = SCHEMA_VERSION;
  return state;
}

export function loadState(): AppState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    return migrate(JSON.parse(raw) as Partial<AppState>);
  } catch (err) {
    console.error("Founder OS: failed to load state", err);
    return emptyState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Founder OS: failed to save state", err);
  }
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Download the full state as JSON — your data, portable. */
export function exportState(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `founder-os-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Parse a previously exported file. Throws if the shape is unusable. */
export function importState(json: string): AppState {
  const parsed = JSON.parse(json) as Partial<AppState>;
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.tracks)) {
    throw new Error("That doesn't look like a Founder OS export.");
  }
  return migrate(parsed);
}
