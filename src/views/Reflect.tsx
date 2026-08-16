import { useState } from "react";
import type { AppState, Reflection } from "@/types";
import { MILESTONES, dayStreak, unlockedMilestones, weekHistory } from "@/lib/domain";
import { dayStr, fmtDate, fmtMin, mondayOf } from "@/lib/dates";
import { T } from "@/styles/theme";
import { Button, Flame, Label, TextArea } from "@/components/ui";

type Apply = (fn: (s: AppState) => AppState) => void;

/**
 * The course-correction half of the loop.
 *
 * Shows what actually happened — not what was planned — then asks three
 * questions designed to produce one concrete change for next week.
 */
export default function Reflect({ state, apply }: { state: AppState; apply: Apply }) {
  const [wins, setWins] = useState("");
  const [misses, setMisses] = useState("");
  const [adjust, setAdjust] = useState("");

  const week = weekHistory(state);
  const weekMin = week.reduce((s, h) => s + h.min, 0);
  const streak = dayStreak(state);
  const canSave = Boolean(wins.trim() || misses.trim() || adjust.trim());

  const save = () => {
    if (!canSave) return;
    const entry: Reflection = {
      id: `r${Date.now()}`,
      date: new Date().toISOString(),
      wins,
      misses,
      adjust,
      min: weekMin,
      actions: week.length,
    };
    apply((s) => ({ ...s, reflections: [entry, ...s.reflections] }));
    setWins("");
    setMisses("");
    setAdjust("");
  };

  return (
    <div className="fos-fade">
      <Label style={{ marginBottom: 12 }}>STEP BACK</Label>
      <h1 className="fos-serif" style={{ fontSize: 34, margin: "0 0 22px", fontWeight: 400 }}>
        Reflect
      </h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <Stat value={String(week.length)} label="ACTIONS THIS WEEK" />
        <Stat value={fmtMin(weekMin)} label="TIME INVESTED" />
        <Stat value={String(streak)} label="DAY STREAK" flame={streak > 0} />
      </div>

      <Heatmap state={state} />

      <div style={{ marginTop: 30, background: T.panel, border: `1px solid ${T.borderSoft}`, borderRadius: 14, padding: 22 }}>
        <div className="fos-serif" style={{ fontSize: 22, marginBottom: 4 }}>
          This week's review
        </div>
        <p style={{ color: T.muted, fontSize: 13, margin: "0 0 18px" }}>
          Course-correct before next week. Honesty here is the whole point.
        </p>

        <Field
          label="WHAT ACTUALLY MOVED?"
          hint="The reps that mattered — not just what you were busy with."
          value={wins}
          onChange={setWins}
        />
        <Field
          label="WHAT SLIPPED — AND WHY?"
          hint="What did you plan but skip? Name the real reason."
          value={misses}
          onChange={setMisses}
        />
        <Field
          label="ONE THING TO CHANGE NEXT WEEK"
          hint="A single adjustment. Small and concrete."
          value={adjust}
          onChange={setAdjust}
        />

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="primary" onClick={save} disabled={!canSave} style={{ padding: "11px 22px", fontSize: 13 }}>
            SAVE REVIEW
          </Button>
        </div>
      </div>

      {state.reflections.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <Label style={{ marginBottom: 14 }}>PAST REVIEWS · {state.reflections.length}</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {state.reflections.map((r) => (
              <ReflectionEntry
                key={r.id}
                reflection={r}
                onDelete={() => apply((s) => ({ ...s, reflections: s.reflections.filter((x) => x.id !== r.id) }))}
              />
            ))}
          </div>
        </div>
      )}

      <Milestones state={state} />
    </div>
  );
}

function Stat({ value, label, flame }: { value: string; label: string; flame?: boolean }) {
  return (
    <div style={{ flex: "1 1 140px", background: T.panel, border: `1px solid ${T.borderSoft}`, borderRadius: 12, padding: "16px 18px" }}>
      <div className="fos-serif" style={{ fontSize: 30, color: T.brass, lineHeight: 1, display: "flex", alignItems: "center", gap: 5 }}>
        {flame && <Flame color={T.brass} size={20} />}
        {value}
      </div>
      <Label style={{ fontSize: 10, marginTop: 6, letterSpacing: ".06em" }} color={T.muted}>
        {label}
      </Label>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <Label color={T.brass} style={{ fontSize: 10, letterSpacing: ".12em", marginBottom: 4 }}>
        {label}
      </Label>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>{hint}</div>
      <TextArea value={value} onChange={(e) => onChange(e.target.value)} rows={2} />
    </div>
  );
}

function ReflectionEntry({ reflection, onDelete }: { reflection: Reflection; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const rows: [string, string][] = [
    ["What moved", reflection.wins],
    ["What slipped", reflection.misses],
    ["Change", reflection.adjust],
  ];

  return (
    <div className="fos-row" style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, borderRadius: 12, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "14px 16px", cursor: "pointer", color: T.text }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14.5 }}>{reflection.adjust || "Weekly review"}</span>
          <span className="fos-mono" style={{ fontSize: 11, color: T.muted, flexShrink: 0 }}>
            {fmtDate(reflection.date)}
          </span>
        </div>
      </button>
      {open && (
        <div style={{ padding: "0 16px 16px" }}>
          {rows
            .filter(([, v]) => v)
            .map(([label, v]) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <Label color={T.brass} style={{ fontSize: 10, letterSpacing: ".1em", marginBottom: 3 }}>
                  {label.toUpperCase()}
                </Label>
                <div style={{ fontSize: 14, color: T.text, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{v}</div>
              </div>
            ))}
          <div className="fos-mono" style={{ fontSize: 10, color: T.faint, marginTop: 4 }}>
            {reflection.actions} actions · {fmtMin(reflection.min)} that week
          </div>
          <Button onClick={onDelete} style={{ padding: "6px 12px", fontSize: 11, marginTop: 10 }}>
            DELETE
          </Button>
        </div>
      )}
    </div>
  );
}

/** Thirteen weeks of daily activity, GitHub-style. */
function Heatmap({ state }: { state: AppState }) {
  const perDay = new Map<string, number>();
  for (const h of state.history) {
    const key = dayStr(h.ts);
    perDay.set(key, (perDay.get(key) ?? 0) + h.min);
  }

  const weeks = 13;
  const today = new Date();
  const start = mondayOf(today);
  start.setDate(start.getDate() - (weeks - 1) * 7);

  const columns: { key: string; mins: number; future: boolean }[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: { key: string; mins: number; future: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      const key = day.toISOString().slice(0, 10);
      col.push({ key, mins: perDay.get(key) ?? 0, future: day > today });
    }
    columns.push(col);
  }

  const shades = [T.borderSoft, "#4a5a3f", "#6b8256", "#9bb56f", T.brass];
  const shade = (m: number) => (m === 0 ? shades[0] : m < 20 ? shades[1] : m < 45 ? shades[2] : m < 90 ? shades[3] : shades[4]);

  return (
    <div>
      <Label style={{ marginBottom: 12 }}>CONSISTENCY · LAST 13 WEEKS</Label>
      <div style={{ display: "flex", gap: 3, overflowX: "auto", paddingBottom: 4 }}>
        {columns.map((col, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {col.map((c) => (
              <div
                key={c.key}
                title={`${c.key}: ${fmtMin(c.mins)}`}
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: 3,
                  background: c.future ? "transparent" : shade(c.mins),
                  border: c.future ? `1px solid ${T.borderSoft}` : "none",
                  opacity: c.future ? 0.3 : 1,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
        <span className="fos-mono" style={{ fontSize: 9, color: T.faint }}>
          less
        </span>
        {shades.map((c) => (
          <div key={c} style={{ width: 11, height: 11, borderRadius: 3, background: c }} />
        ))}
        <span className="fos-mono" style={{ fontSize: 9, color: T.faint }}>
          more
        </span>
      </div>
    </div>
  );
}

function Milestones({ state }: { state: AppState }) {
  const unlocked = unlockedMilestones(state);
  return (
    <div style={{ marginTop: 30 }}>
      <Label style={{ marginBottom: 14 }}>
        MILESTONES · {unlocked.size}/{MILESTONES.length}
      </Label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
        {MILESTONES.map((m) => {
          const on = unlocked.has(m.id);
          return (
            <div
              key={m.id}
              style={{
                background: on ? T.panelHi : T.panel,
                border: `1px solid ${on ? T.brass : T.borderSoft}`,
                borderRadius: 12,
                padding: "13px 15px",
                opacity: on ? 1 : 0.55,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: `1.5px solid ${on ? T.brass : T.faint}`,
                    background: on ? T.brass : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {on && (
                    <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden>
                      <path d="M2 6.2L4.6 9L10 3" stroke={T.bg} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: on ? T.text : T.muted }}>{m.label}</span>
              </div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 7 }}>{m.hint}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
