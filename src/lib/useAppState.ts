import { useCallback, useEffect, useRef, useState } from "react";
import type { AppState } from "@/types";
import { MILESTONES, unlockedMilestones } from "@/lib/domain";
import { loadState, saveState } from "@/lib/storage";

export interface Toast {
  id: string;
  kind: string;
  message: string;
}

/**
 * Single source of truth for app state.
 *
 * Every update persists immediately and is diffed for newly unlocked
 * milestones, so celebration is a side effect of state rather than something
 * each view has to remember to fire.
 */
export function useAppState() {
  const [state, setState] = useState<AppState | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seen = useRef<{ ready: boolean; badges: Set<string> }>({
    ready: false,
    badges: new Set(),
  });

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    if (!state) return;
    const badges = unlockedMilestones(state);

    if (seen.current.ready) {
      const fresh = [...badges]
        .filter((id) => !seen.current.badges.has(id))
        .map((id) => ({
          id: `toast-${id}-${Date.now()}`,
          kind: "MILESTONE",
          message: MILESTONES.find((m) => m.id === id)?.label ?? "Unlocked",
        }));

      if (fresh.length) {
        setToasts((t) => [...t, ...fresh]);
        fresh.forEach((f) =>
          setTimeout(() => setToasts((t) => t.filter((x) => x.id !== f.id)), 4000),
        );
      }
    }
    seen.current = { ready: true, badges };
  }, [state]);

  const update = useCallback((next: AppState) => {
    setState(next);
    saveState(next);
  }, []);

  /** Convenience for the many `(state) => state` mutations in lib/domain. */
  const apply = useCallback(
    (fn: (current: AppState) => AppState) => {
      setState((current) => {
        if (!current) return current;
        const next = fn(current);
        saveState(next);
        return next;
      });
    },
    [],
  );

  return { state, update, apply, toasts };
}
