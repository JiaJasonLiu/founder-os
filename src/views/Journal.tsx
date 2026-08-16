import { useState } from "react";
import type { AppState, JournalEntry } from "@/types";
import { fmtDate } from "@/lib/dates";
import { T } from "@/styles/theme";
import { Button, EmptyState, Label, SynthesisLoop, TextArea, TextField } from "@/components/ui";

type Apply = (fn: (s: AppState) => AppState) => void;

const BLANK = { title: "", tech: "", biz: "", human: "", feed: "", attack: "", stress: "" };

/**
 * The decision journal — the deepest part of the app.
 *
 * Form a view across three angles, feed it with real inputs, attack it with the
 * strongest counter-case, then stress-test the worst outcome. Over time these
 * entries are a record of how your judgment actually developed.
 */
export default function Journal({ state, apply }: { state: AppState; apply: Apply }) {
  const [form, setForm] = useState(BLANK);
  const [stage, setStage] = useState(-1);

  const set = (k: keyof typeof BLANK, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const canSave = Boolean(form.title.trim() && (form.tech || form.biz || form.human));

  const save = () => {
    if (!canSave) return;
    const entry: JournalEntry = { ...form, id: `j${Date.now()}`, date: new Date().toISOString() };
    apply((s) => ({ ...s, journal: [entry, ...s.journal] }));
    setForm(BLANK);
    setStage(-1);
  };

  const angles: { key: "tech" | "biz" | "human"; label: string; hint: string; color: string }[] = [
    { key: "tech", label: "Technical angle", hint: "What does the systems view say?", color: T.slate },
    { key: "biz", label: "Business angle", hint: "What does the money/customer view say?", color: T.moss },
    { key: "human", label: "Human angle", hint: "What does the people view say?", color: T.clay },
  ];

  const loopFields: { key: "feed" | "attack" | "stress"; label: string; stage: number; hint: string }[] = [
    { key: "feed", label: "② FEED IT", stage: 1, hint: "What inputs informed this? What did you read or who did you ask?" },
    { key: "attack", label: "③ ATTACK IT", stage: 2, hint: "Strongest case against. Where could you be wrong?" },
    { key: "stress", label: "④ STRESS-TEST", stage: 3, hint: "Play out the worst case — and how you'd handle it." },
  ];

  return (
    <div className="fos-fade">
      <Label style={{ marginBottom: 12 }}>SYNTHESIS · IN PRACTICE</Label>
      <h1 className="fos-serif" style={{ fontSize: 34, margin: "0 0 8px", fontWeight: 400 }}>
        Decision Journal
      </h1>
      <p style={{ color: T.muted, fontSize: 14, margin: "0 0 22px", maxWidth: 580 }}>
        Run a real call through the loop. Form the view across three angles, feed it, attack it, then stress-test the
        worst case.
      </p>

      <div style={{ marginBottom: 22 }}>
        <SynthesisLoop active={stage} />
      </div>

      <div style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, borderRadius: 14, padding: 22 }}>
        <TextField
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          onFocus={() => setStage(-1)}
          placeholder="The decision or view…"
          style={{
            background: "transparent",
            border: "none",
            borderBottom: `1px solid ${T.border}`,
            borderRadius: 0,
            padding: "6px 0 12px",
            fontSize: 24,
            marginBottom: 20,
            fontFamily: "'Instrument Serif', Georgia, serif",
          }}
        />

        <Label color={T.gold} style={{ fontSize: 10, letterSpacing: ".14em", marginBottom: 12 }}>
          ① FORM IT — TRANSLATE ACROSS THREE ANGLES
        </Label>
        <div className="fos-angles" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 22 }}>
          {angles.map((a) => (
            <div key={a.key}>
              <div style={{ fontSize: 12, color: a.color, marginBottom: 6, fontWeight: 500 }}>{a.label}</div>
              <TextArea
                value={form[a.key]}
                onChange={(e) => set(a.key, e.target.value)}
                onFocus={() => setStage(0)}
                placeholder={a.hint}
                rows={3}
              />
            </div>
          ))}
        </div>

        {loopFields.map((f) => (
          <div key={f.key} style={{ marginBottom: 20 }}>
            <Label color={T.gold} style={{ fontSize: 10, letterSpacing: ".14em", marginBottom: 4 }}>
              {f.label}
            </Label>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>{f.hint}</div>
            <TextArea value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} onFocus={() => setStage(f.stage)} rows={2} />
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="primary" onClick={save} disabled={!canSave} style={{ padding: "11px 22px", fontSize: 13 }}>
            LOG DECISION
          </Button>
        </div>
      </div>

      <div style={{ marginTop: 30 }}>
        <Label style={{ marginBottom: 14 }}>LOGGED · {state.journal.length}</Label>
        {state.journal.length === 0 ? (
          <EmptyState>No entries yet. The first real call you run through the loop lands here.</EmptyState>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {state.journal.map((e) => (
              <Entry
                key={e.id}
                entry={e}
                onDelete={() => apply((s) => ({ ...s, journal: s.journal.filter((x) => x.id !== e.id) }))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Entry({ entry, onDelete }: { entry: JournalEntry; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const angles: [string, string, string][] = [
    ["Technical", entry.tech, T.slate],
    ["Business", entry.biz, T.moss],
    ["Human", entry.human, T.clay],
  ];
  const loop: [string, string][] = [
    ["Fed by", entry.feed],
    ["Attacked", entry.attack],
    ["Worst case", entry.stress],
  ];

  return (
    <div className="fos-row" style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, borderRadius: 12, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "16px 18px", cursor: "pointer", color: T.text }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span className="fos-serif" style={{ fontSize: 18 }}>{entry.title}</span>
          <span className="fos-mono" style={{ fontSize: 11, color: T.muted, flexShrink: 0 }}>{fmtDate(entry.date)}</span>
        </div>
      </button>
      {open && (
        <div style={{ padding: "0 18px 18px" }}>
          {angles.filter(([, v]) => v).map(([label, v, color]) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color, marginBottom: 3, fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: 14, color: T.text, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{v}</div>
            </div>
          ))}
          {loop.filter(([, v]) => v).map(([label, v]) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <Label color={T.gold} style={{ fontSize: 10, letterSpacing: ".1em", marginBottom: 3 }}>
                {label.toUpperCase()}
              </Label>
              <div style={{ fontSize: 14, color: T.text, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{v}</div>
            </div>
          ))}
          <Button onClick={onDelete} style={{ padding: "6px 12px", fontSize: 11, marginTop: 4 }}>
            DELETE
          </Button>
        </div>
      )}
    </div>
  );
}
