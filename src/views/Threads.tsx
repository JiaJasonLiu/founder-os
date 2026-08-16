import { useState } from "react";
import type { AppState, Thread, ThreadPeriod } from "@/types";
import { periodList } from "@/lib/dates";
import { threadStreak, toggleThreadPeriod } from "@/lib/domain";
import { T, TRACK_PALETTE } from "@/styles/theme";
import { Button, Label, TextArea, TextField } from "@/components/ui";

type Apply = (fn: (s: AppState) => AppState) => void;

/**
 * Slow-compounding rhythms.
 *
 * Threads are deliberately not tasks: they have no completion state, only a
 * streak. Anything whose payoff is measured in years belongs here rather than
 * in a track, where it would sit unfinished forever and feel like failure.
 */
export default function Threads({ state, apply }: { state: AppState; apply: Apply }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", why: "", period: "week" as ThreadPeriod, cadence: "" });

  const add = () => {
    if (!draft.name.trim()) return;
    apply((s) => ({
      ...s,
      threads: [
        ...s.threads,
        {
          id: `th${Math.random().toString(36).slice(2, 8)}`,
          name: draft.name.trim(),
          tag: draft.period === "week" ? "weekly rhythm" : "monthly rhythm",
          color: TRACK_PALETTE[s.threads.length % TRACK_PALETTE.length],
          period: draft.period,
          why: draft.why.trim(),
          horizon: "Long-horizon",
          cadence: draft.cadence.trim() || "Keep the rhythm",
          log: [],
        },
      ],
    }));
    setDraft({ name: "", why: "", period: "week", cadence: "" });
    setAdding(false);
  };

  return (
    <div className="fos-fade">
      <Label style={{ marginBottom: 12 }}>SLOW-COMPOUNDING</Label>
      <h1 className="fos-serif" style={{ fontSize: 34, margin: "0 0 8px", fontWeight: 400 }}>
        Threads
      </h1>
      <p style={{ color: T.muted, fontSize: 14, margin: "0 0 26px", maxWidth: 600 }}>
        Not tasks — rhythms. These take years to pay off, so the win is the streak, not the finish line. A single missed
        period is forgiven; two in a row breaks it.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {state.threads.map((th) => (
          <ThreadCard
            key={th.id}
            thread={th}
            onLog={() => apply((s) => toggleThreadPeriod(s, th.id))}
            onDelete={() => apply((s) => ({ ...s, threads: s.threads.filter((x) => x.id !== th.id) }))}
          />
        ))}
      </div>

      {adding ? (
        <div style={{ marginTop: 16, background: T.panel, border: `1px solid ${T.borderSoft}`, borderRadius: 14, padding: 20 }}>
          <TextField
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Thread name (e.g. Reading widely)"
            style={{ marginBottom: 10, fontSize: 15 }}
          />
          <TextArea
            value={draft.why}
            onChange={(e) => setDraft({ ...draft, why: e.target.value })}
            placeholder="Why it matters — and when the payoff lands"
            rows={2}
            style={{ marginBottom: 10 }}
          />
          <TextField
            value={draft.cadence}
            onChange={(e) => setDraft({ ...draft, cadence: e.target.value })}
            placeholder="The rhythm (e.g. read one paper)"
            style={{ marginBottom: 12 }}
          />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {(["week", "month"] as ThreadPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setDraft({ ...draft, period: p })}
                  className="fos-btn fos-mono"
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    fontSize: 12,
                    background: draft.period === p ? T.panelHi : "transparent",
                    border: `1px solid ${draft.period === p ? T.brass : T.border}`,
                    color: draft.period === p ? T.text : T.muted,
                  }}
                >
                  {p === "week" ? "WEEKLY" : "MONTHLY"}
                </button>
              ))}
            </div>
            <div style={{ flex: 1 }} />
            <Button onClick={() => setAdding(false)} style={{ border: "none" }}>
              CANCEL
            </Button>
            <Button variant="primary" onClick={add}>
              ADD THREAD
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="fos-add fos-btn fos-mono"
          style={{
            marginTop: 16,
            width: "100%",
            background: "transparent",
            border: `1px dashed ${T.border}`,
            borderRadius: 12,
            color: T.muted,
            padding: 14,
            fontSize: 13,
          }}
        >
          + ADD A THREAD
        </button>
      )}
    </div>
  );
}

function ThreadCard({ thread, onLog, onDelete }: { thread: Thread; onLog: () => void; onDelete: () => void }) {
  const strip = periodList(thread.period, 14);
  const logged = new Set(thread.log);
  const current = strip[strip.length - 1];
  const keptNow = logged.has(current);
  const unit = thread.period === "week" ? "week" : "month";
  const streak = threadStreak(thread);

  return (
    <div
      className="fos-row fos-card fos-hover"
      style={{
        background: T.panel,
        border: `1px solid ${T.borderSoft}`,
        borderLeft: `3px solid ${thread.color}`,
        borderRadius: 14,
        padding: 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 18, fontWeight: 600 }}>{thread.name}</span>
            <span
              className="fos-mono"
              style={{ fontSize: 10, color: thread.color, border: `1px solid ${thread.color}`, borderRadius: 20, padding: "2px 9px" }}
            >
              {thread.horizon}
            </span>
          </div>
          <div className="fos-mono" style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
            {thread.tag}
          </div>
        </div>
        <button onClick={onDelete} className="fos-del fos-mono" title="Remove thread" style={{ background: "none", border: "none", color: T.faint, fontSize: 18 }}>
          ×
        </button>
      </div>

      {thread.why && <p style={{ color: T.muted, fontSize: 13.5, lineHeight: 1.5, margin: "12px 0 0" }}>{thread.why}</p>}

      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "16px 0 6px" }}>
        <Label style={{ fontSize: 10, letterSpacing: ".1em" }}>THE RHYTHM</Label>
        <span style={{ fontSize: 13, color: T.text }}>· {thread.cadence}</span>
      </div>

      <div style={{ display: "flex", gap: 4, alignItems: "center", margin: "10px 0 16px", flexWrap: "wrap" }}>
        {strip.map((p) => {
          const on = logged.has(p);
          const isNow = p === current;
          return (
            <div
              key={p}
              title={p}
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                background: on ? thread.color : "transparent",
                border: `1.5px solid ${on ? thread.color : isNow ? T.muted : T.borderSoft}`,
              }}
            />
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 20 }}>
          <div>
            <div className="fos-serif" style={{ fontSize: 26, color: thread.color, lineHeight: 1 }}>
              {streak}
            </div>
            <Label style={{ fontSize: 10, marginTop: 3 }} color={T.muted}>
              {unit.toUpperCase()} STREAK
            </Label>
          </div>
          <div>
            <div className="fos-serif" style={{ fontSize: 26, color: T.text, lineHeight: 1 }}>
              {thread.log.length}
            </div>
            <Label style={{ fontSize: 10, marginTop: 3 }} color={T.muted}>
              {unit.toUpperCase()}S KEPT
            </Label>
          </div>
        </div>
        <button
          onClick={onLog}
          className="fos-btn fos-mono"
          style={{
            background: keptNow ? "transparent" : thread.color,
            color: keptNow ? thread.color : T.bg,
            border: `1px solid ${thread.color}`,
            borderRadius: 9,
            padding: "11px 18px",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {keptNow ? `✓ KEPT THIS ${unit.toUpperCase()}` : `KEEP IT THIS ${unit.toUpperCase()}`}
        </button>
      </div>
    </div>
  );
}
