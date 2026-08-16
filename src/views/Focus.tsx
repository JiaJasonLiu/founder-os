import { useEffect, useMemo, useState } from "react";
import type { Action, AppState, Quest, Track } from "@/types";
import { buildPlan, completeAction, focusScope, trackQuests } from "@/lib/domain";
import { dayStr, fmtMin, todayStr } from "@/lib/dates";
import { BUDGET_PRESETS, T } from "@/styles/theme";
import { Button, Check, EmptyState, Label, ProgressBar, TextField } from "@/components/ui";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The daily driver.
 *
 * Two jobs: hold the commitment that narrows the work (month track, week task),
 * and turn whatever time you have into a concrete short list.
 */
export default function Focus({
  state,
  apply,
}: {
  state: AppState;
  apply: (fn: (s: AppState) => AppState) => void;
}) {
  const [editingGoal, setEditingGoal] = useState(false);
  const [draftGoal, setDraftGoal] = useState(state.goal);
  const [budget, setBudget] = useState(60);
  const [sessionKeys, setSessionKeys] = useState<string[] | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [picking, setPicking] = useState<"month" | "week" | null>(null);

  const { monthTrackId, weekQuestId, weekSetAt } = state.spotlight;
  const monthTrack = state.tracks.find((t) => t.id === monthTrackId) ?? null;

  const weekPair = useMemo(() => {
    for (const t of state.tracks) {
      const q = trackQuests(t).find((x) => x.id === weekQuestId);
      if (q) return { quest: q, track: t };
    }
    return null;
  }, [state.tracks, weekQuestId]);

  const scope = useMemo(() => focusScope(state), [state]);
  const actions = scope.actions;

  // Re-plan when the budget or the commitment changes.
  useEffect(() => {
    setSessionKeys(buildPlan(actions, budget).map((a) => a.key));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budget, monthTrackId, weekQuestId]);

  const keys = sessionKeys ?? [];
  const inSession = actions.filter((a) => keys.includes(a.key));
  const rest = actions.filter((a) => !keys.includes(a.key));
  const planned = inSession.reduce((sum, a) => sum + a.est, 0);

  const saveGoal = () => {
    const value = draftGoal.trim();
    apply((s) => ({ ...s, goal: value || s.goal }));
    setEditingGoal(false);
  };

  const setMonth = (trackId: string) => {
    apply((s) => {
      const keepWeek = weekPair && weekPair.track.id === trackId ? s.spotlight.weekQuestId : null;
      return {
        ...s,
        spotlight: {
          monthTrackId: trackId,
          monthSetAt: Date.now(),
          weekQuestId: keepWeek,
          weekSetAt: keepWeek ? s.spotlight.weekSetAt : null,
        },
      };
    });
    setPicking(null);
  };

  const setWeek = (questId: string) => {
    apply((s) => ({ ...s, spotlight: { ...s.spotlight, weekQuestId: questId, weekSetAt: Date.now() } }));
    setPicking(null);
  };

  const clearFocus = () => {
    apply((s) => ({
      ...s,
      spotlight: { monthTrackId: null, weekQuestId: null, monthSetAt: null, weekSetAt: null },
    }));
    setPicking(null);
  };

  const complete = (a: Action) => apply((s) => completeAction(s, a));

  const weekStale = weekSetAt !== null && Date.now() - weekSetAt > WEEK_MS;
  const phase = state.phases.find((p) => p.n === state.phase);
  const hasFocus = Boolean(monthTrack || weekPair);

  const questOptions: { quest: Quest; track: Track }[] = (monthTrack ? [monthTrack] : state.tracks).flatMap((t) =>
    trackQuests(t)
      .filter((q) => !q.done)
      .map((q) => ({ quest: q, track: t })),
  );

  return (
    <div className="fos-fade">
      {/* goal */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <Label>
          THE GOAL{phase ? ` · PHASE ${state.phase} · ${phase.note.toUpperCase()}` : ""}
        </Label>
        {!editingGoal && (
          <Button
            onClick={() => {
              setDraftGoal(state.goal);
              setEditingGoal(true);
            }}
            style={{ padding: "4px 10px", fontSize: 10 }}
          >
            ✎ EDIT
          </Button>
        )}
      </div>

      {editingGoal ? (
        <TextField
          autoFocus
          value={draftGoal}
          onChange={(e) => setDraftGoal(e.target.value)}
          onBlur={saveGoal}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveGoal();
            if (e.key === "Escape") {
              setDraftGoal(state.goal);
              setEditingGoal(false);
            }
          }}
          style={{
            fontSize: 30,
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${T.brass}`,
            borderRadius: 0,
            padding: "0 0 8px",
            fontFamily: "'Instrument Serif', Georgia, serif",
          }}
        />
      ) : (
        <h1 className="fos-serif" style={{ fontSize: 34, lineHeight: 1.06, margin: 0, fontWeight: 400 }}>
          {state.goal}
        </h1>
      )}

      {/* the one focus */}
      <div
        style={{
          marginTop: 24,
          background: T.panel,
          border: `1px solid ${hasFocus ? T.borderSoft : T.brass}`,
          borderRadius: 16,
          padding: "20px 22px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Label color={T.brass} style={{ fontSize: 10 }}>
            YOUR ONE FOCUS
          </Label>
          {hasFocus && (
            <button
              onClick={clearFocus}
              className="fos-btn fos-mono"
              style={{ background: "none", border: "none", color: T.faint, fontSize: 10 }}
            >
              clear
            </button>
          )}
        </div>

        {!hasFocus && (
          <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.55, margin: "0 0 16px" }}>
            Too much on the list is the paralysis. Commit to <span style={{ color: T.text }}>one track this month</span>{" "}
            and <span style={{ color: T.text }}>one task this week</span> — the rest waits, and every session just hands
            you the next step.
          </p>
        )}

        <FocusRow
          tier="THIS MONTH"
          value={monthTrack?.name ?? null}
          dot={monthTrack?.color ?? null}
          placeholder="Choose a track to spotlight"
          onPick={() => setPicking(picking === "month" ? null : "month")}
        />
        {picking === "month" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "10px 0 4px" }}>
            {state.tracks.map((t) => (
              <button
                key={t.id}
                onClick={() => setMonth(t.id)}
                className="fos-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: monthTrackId === t.id ? T.panelHi : "transparent",
                  border: `1px solid ${monthTrackId === t.id ? t.color : T.border}`,
                  borderRadius: 9,
                  padding: "9px 13px",
                  color: T.text,
                  fontSize: 13.5,
                }}
              >
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: t.color }} />
                {t.name}
              </button>
            ))}
          </div>
        )}

        <div style={{ height: 1, background: T.borderSoft, margin: "14px 0" }} />

        <FocusRow
          tier="THIS WEEK"
          value={weekPair?.quest.text ?? null}
          dot={weekPair?.track.color ?? null}
          note={weekStale ? "set over a week ago — refresh?" : null}
          placeholder="Pick this week's one thing"
          onPick={() => setPicking(picking === "week" ? null : "week")}
        />
        {picking === "week" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "10px 0 4px" }}>
            {questOptions.length === 0 && (
              <div style={{ color: T.faint, fontSize: 13 }}>Nothing open here — add tasks in Plan.</div>
            )}
            {questOptions.map(({ quest, track }) => (
              <button
                key={quest.id}
                onClick={() => setWeek(quest.id)}
                className="fos-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: weekQuestId === quest.id ? T.panelHi : "transparent",
                  border: `1px solid ${weekQuestId === quest.id ? track.color : T.borderSoft}`,
                  borderRadius: 9,
                  padding: "9px 12px",
                  color: T.text,
                  fontSize: 13.5,
                  textAlign: "left",
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: track.color, flexShrink: 0 }} />
                {quest.text}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* session */}
      <div style={{ marginTop: 22, background: T.panel, border: `1px solid ${T.borderSoft}`, borderRadius: 16, padding: "22px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="fos-serif" style={{ fontSize: 22 }}>
              Do the next bit
            </div>
            <div style={{ color: T.muted, fontSize: 13, marginTop: 2 }}>
              {scope.level === "week"
                ? "From your weekly focus."
                : scope.level === "month" && monthTrack
                  ? `From ${monthTrack.name}.`
                  : "From everything — set a focus above to narrow this."}{" "}
              How long have you got?
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {BUDGET_PRESETS.map((b) => (
              <button
                key={b}
                onClick={() => setBudget(b)}
                className="fos-btn fos-mono"
                style={{
                  padding: "8px 12px",
                  borderRadius: 9,
                  fontSize: 12,
                  border: `1px solid ${budget === b ? T.brass : T.border}`,
                  background: budget === b ? T.panelHi : "transparent",
                  color: budget === b ? T.text : T.muted,
                }}
              >
                {fmtMin(b)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ margin: "18px 0 6px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span className="fos-mono" style={{ fontSize: 11, color: planned > budget ? T.clay : T.muted }}>
            {fmtMin(planned)} planned
          </span>
          <span className="fos-mono" style={{ fontSize: 11, color: T.faint }}>
            budget {fmtMin(budget)}
          </span>
        </div>
        <ProgressBar pct={budget ? (planned / budget) * 100 : 0} color={planned > budget ? T.clay : T.brass} />

        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          {inSession.length === 0 && (
            <EmptyState>
              {actions.length
                ? "Pick a longer budget, or add more below."
                : scope.level === "week"
                  ? "This week's focus is done — pick a new one above."
                  : "Nothing open. Add tasks or steps in Plan."}
            </EmptyState>
          )}
          {inSession.map((a) => (
            <div
              key={a.key}
              className="fos-row"
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                padding: "12px 14px",
                background: T.bg,
                border: `1px solid ${T.borderSoft}`,
                borderRadius: 11,
              }}
            >
              <Check done={false} color={a.color} onClick={() => complete(a)} label={`Complete: ${a.label}`} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, lineHeight: 1.4 }}>{a.label}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: a.color }} />
                  <span className="fos-mono" style={{ fontSize: 10, color: T.muted }}>
                    {fmtMin(a.est)}
                    {a.parent ? ` · ${a.parent}` : ""}
                    {a.star ? " · ★" : ""}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSessionKeys(keys.filter((k) => k !== a.key))}
                className="fos-del fos-mono"
                title="Not now"
                style={{ background: "none", border: "none", color: T.faint, fontSize: 16 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <Button onClick={() => setSessionKeys(buildPlan(actions, budget).map((a) => a.key))}>↻ RE-PLAN</Button>
          {rest.length > 0 && <Button onClick={() => setShowAll(!showAll)}>{showAll ? "HIDE" : "+ ADD MORE"}</Button>}
        </div>

        {showAll && rest.length > 0 && (
          <div style={{ marginTop: 14, borderTop: `1px solid ${T.borderSoft}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
            {rest.map((a) => (
              <button
                key={a.key}
                onClick={() => setSessionKeys([...keys, a.key])}
                className="fos-btn"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  background: "transparent",
                  border: `1px solid ${T.borderSoft}`,
                  borderRadius: 9,
                  padding: "9px 12px",
                  textAlign: "left",
                  color: T.text,
                }}
              >
                <span style={{ fontSize: 13.5 }}>
                  <span style={{ color: a.color, marginRight: 8 }}>+</span>
                  {a.label}
                </span>
                <span className="fos-mono" style={{ fontSize: 10, color: T.muted, flexShrink: 0 }}>
                  {fmtMin(a.est)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <TodayDone state={state} />
    </div>
  );
}

function FocusRow({
  tier,
  value,
  dot,
  note,
  onPick,
  placeholder,
}: {
  tier: string;
  value: string | null;
  dot: string | null;
  note?: string | null;
  onPick: () => void;
  placeholder: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <Label style={{ fontSize: 10, letterSpacing: ".12em", marginBottom: 6 }}>{tier}</Label>
        {value ? (
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            {dot && <span style={{ width: 9, height: 9, borderRadius: "50%", background: dot, flexShrink: 0 }} />}
            <span className="fos-serif" style={{ fontSize: 20, lineHeight: 1.2, color: T.text }}>
              {value}
            </span>
          </div>
        ) : (
          <span style={{ color: T.muted, fontSize: 14 }}>{placeholder}</span>
        )}
        {note && (
          <div className="fos-mono" style={{ fontSize: 10, color: T.clay, marginTop: 6 }}>
            {note}
          </div>
        )}
      </div>
      <Button
        onClick={onPick}
        style={{
          padding: "7px 13px",
          fontSize: 11,
          flexShrink: 0,
          border: `1px solid ${value ? T.border : T.brass}`,
          color: value ? T.muted : T.brass,
        }}
      >
        {value ? "CHANGE" : "SET"}
      </Button>
    </div>
  );
}

function TodayDone({ state }: { state: AppState }) {
  const today = todayStr();
  const done = state.history.filter((h) => dayStr(h.ts) === today).sort((a, b) => b.ts - a.ts);
  const mins = done.reduce((s, h) => s + h.min, 0);

  return (
    <div style={{ marginTop: 26 }}>
      <Label style={{ marginBottom: 12 }}>DONE TODAY · {fmtMin(mins)}</Label>
      {done.length === 0 ? (
        <div style={{ color: T.muted, fontSize: 13.5 }}>
          Nothing logged yet today. Check something off above and it lands here.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {done.map((h) => (
            <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: T.muted }}>
              <svg width="13" height="13" viewBox="0 0 12 12" aria-hidden>
                <path d="M2 6.2L4.6 9L10 3" stroke={T.green} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ textDecoration: "line-through" }}>{h.label}</span>
              <span className="fos-mono" style={{ fontSize: 10, color: T.faint }}>
                {fmtMin(h.min)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
