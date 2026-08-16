import type { DayKey, PeriodKey, ThreadPeriod } from "@/types";

/** `YYYY-MM-DD` for an epoch-ms timestamp. */
export const dayStr = (ts: number): DayKey =>
  new Date(ts).toISOString().slice(0, 10);

export const todayStr = (): DayKey => new Date().toISOString().slice(0, 10);

/** Monday 00:00 of the week containing `d`. Weeks start Monday. */
export function mondayOf(d: Date | number): Date {
  const x = new Date(d);
  const offset = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - offset);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function prevDay(key: DayKey): DayKey {
  const d = new Date(key);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** The period key immediately before `key`, for the given cadence. */
export function prevPeriod(key: PeriodKey, period: ThreadPeriod): PeriodKey {
  if (period === "month") {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 2, 1).toISOString().slice(0, 7);
  }
  const d = new Date(key);
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

/** The last `n` period keys, oldest first, ending with the current period. */
export function periodList(period: ThreadPeriod, n: number): PeriodKey[] {
  const out: PeriodKey[] = [];
  const now = new Date();
  if (period === "month") {
    for (let i = n - 1; i >= 0; i--) {
      out.push(new Date(now.getFullYear(), now.getMonth() - i, 1).toISOString().slice(0, 7));
    }
  } else {
    const base = mondayOf(now);
    for (let i = n - 1; i >= 0; i--) {
      const w = new Date(base);
      w.setDate(base.getDate() - i * 7);
      out.push(w.toISOString().slice(0, 10));
    }
  }
  return out;
}

/**
 * Count a streak backwards from `current`, forgiving a single isolated gap.
 * Two consecutive misses end it.
 *
 * The tolerance is deliberate: for goals measured in years, resetting to zero
 * over one missed week is the thing that makes people quit.
 *
 * @param pending - when true, not having done the *current* period yet doesn't
 *   break the streak (the period is still in progress).
 */
export function streakCount(
  set: Set<string>,
  current: string,
  prevFn: (k: string) => string,
  pending: boolean,
): number {
  let streak = 0;
  let misses = 0;
  let guard = 0;
  let k = pending && !set.has(current) ? prevFn(current) : current;

  while (guard++ < 800) {
    if (set.has(k)) {
      streak++;
      misses = 0;
    } else {
      misses++;
      if (misses >= 2) break;
    }
    k = prevFn(k);
  }
  return streak;
}

/** Format minutes as `45m` or `1h 30m`. */
export function fmtMin(m: number): string {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}h ${rest}m` : `${h}h`;
}

/** Short human date, e.g. `14 Aug 2026`. */
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
