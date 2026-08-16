import { useMemo, useState } from "react";
import type { AppState, Template, Track } from "@/types";
import { TEMPLATES, getTemplate } from "@/data/templates";
import { stateFromTemplate } from "@/lib/storage";
import { trackQuests } from "@/lib/domain";
import { T } from "@/styles/theme";
import { Button, Label, TextArea, TextField } from "@/components/ui";

type StepId = "welcome" | "goal" | "template" | "tracks" | "commit";

const STEPS: { id: StepId; label: string }[] = [
  { id: "welcome", label: "Start" },
  { id: "goal", label: "Goal" },
  { id: "template", label: "Template" },
  { id: "tracks", label: "Tracks" },
  { id: "commit", label: "Commit" },
];

/**
 * First-run setup.
 *
 * The order matters: the goal is named before any template is shown, so the
 * template is chosen to serve the goal rather than the goal being back-filled
 * to fit a template.
 */
export default function Onboarding({ onComplete }: { onComplete: (state: AppState) => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [goal, setGoal] = useState("");
  const [horizon, setHorizon] = useState("5-year horizon");
  const [thesis, setThesis] = useState("");
  const [templateId, setTemplateId] = useState<string>(TEMPLATES[0].id);
  const [trackIds, setTrackIds] = useState<string[]>([]);
  const [monthTrackId, setMonthTrackId] = useState<string | null>(null);

  const template: Template = useMemo(() => getTemplate(templateId), [templateId]);
  const step = STEPS[stepIndex].id;

  const chooseTemplate = (id: string) => {
    setTemplateId(id);
    setTrackIds(getTemplate(id).tracks.map((t) => t.id));
    setMonthTrackId(null);
  };

  const toggleTrack = (id: string) =>
    setTrackIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const chosenTracks: Track[] = template.tracks.filter((t) => trackIds.includes(t.id));

  const finish = () => {
    const next = stateFromTemplate(template, { goal, horizon, thesis, trackIds });
    if (monthTrackId) {
      next.spotlight = { ...next.spotlight, monthTrackId, monthSetAt: Date.now() };
    }
    onComplete(next);
  };

  const canAdvance = (): boolean => {
    if (step === "goal") return goal.trim().length > 0;
    if (step === "tracks") return trackIds.length > 0;
    return true;
  };

  const next = () => (stepIndex === STEPS.length - 1 ? finish() : setStepIndex(stepIndex + 1));
  const back = () => setStepIndex(Math.max(0, stepIndex - 1));

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", padding: "48px 24px" }}>
      <div className="fos-fade" style={{ width: "100%", maxWidth: 640 }}>
        {/* progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 34 }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ flex: 1 }}>
              <div
                style={{
                  height: 3,
                  borderRadius: 2,
                  background: i <= stepIndex ? T.brass : T.borderSoft,
                  transition: "background .3s",
                }}
              />
              <div
                className="fos-mono"
                style={{ fontSize: 9.5, color: i === stepIndex ? T.brass : T.faint, marginTop: 7, letterSpacing: ".1em" }}
              >
                {s.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        {step === "welcome" && (
          <section className="fos-fade">
            <Label>FOUNDER OS</Label>
            <h1 className="fos-serif" style={{ fontSize: 42, lineHeight: 1.08, margin: "12px 0 18px", fontWeight: 400 }}>
              A system for the goals that take years.
            </h1>
            <p style={{ color: T.muted, fontSize: 15.5, lineHeight: 1.65, margin: 0 }}>
              Most tools track tasks. This one is built around a loop:{" "}
              <span style={{ color: T.text }}>plan</span> the work into hour-sized pieces,{" "}
              <span style={{ color: T.text }}>do</span> a session that fits the time you actually have, and{" "}
              <span style={{ color: T.text }}>reflect</span> weekly so you can course-correct.
            </p>
            <p style={{ color: T.muted, fontSize: 15.5, lineHeight: 1.65, marginTop: 16 }}>
              The one rule worth knowing up front: you commit to a single track each month and a single task each week.
              A long list is what causes paralysis, so the app narrows it for you.
            </p>
          </section>
        )}

        {step === "goal" && (
          <section className="fos-fade">
            <Label>STEP 1</Label>
            <h1 className="fos-serif" style={{ fontSize: 34, margin: "12px 0 8px", fontWeight: 400 }}>
              What's the one thing you're aiming at?
            </h1>
            <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              One goal, not five. Everything else in the app hangs off this, and you can edit it any time.
            </p>

            <Label style={{ fontSize: 10, marginBottom: 8 }}>THE GOAL</Label>
            <TextField
              autoFocus
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Found a company, change career, ship a product"
              style={{ fontSize: 16, marginBottom: 18 }}
            />

            <Label style={{ fontSize: 10, marginBottom: 8 }}>TIMEFRAME</Label>
            <TextField
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              placeholder="e.g. 5-year horizon"
              style={{ marginBottom: 18 }}
            />

            <Label style={{ fontSize: 10, marginBottom: 8 }}>YOUR BET (OPTIONAL)</Label>
            <p style={{ color: T.faint, fontSize: 12.5, marginBottom: 8 }}>
              One sentence on why this is the right thing to chase. You'll see it every time you open the app.
            </p>
            <TextArea
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              rows={2}
              placeholder="e.g. The technical layer commoditizes. The judgment layer compounds."
            />
          </section>
        )}

        {step === "template" && (
          <section className="fos-fade">
            <Label>STEP 2</Label>
            <h1 className="fos-serif" style={{ fontSize: 34, margin: "12px 0 8px", fontWeight: 400 }}>
              Pick a starting shape
            </h1>
            <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              A template is just seed data — every track, task and estimate is editable afterwards.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {TEMPLATES.map((tpl) => {
                const active = tpl.id === templateId;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => chooseTemplate(tpl.id)}
                    className="fos-btn"
                    style={{
                      textAlign: "left",
                      background: active ? T.panelHi : T.panel,
                      border: `1px solid ${active ? T.brass : T.borderSoft}`,
                      borderRadius: 13,
                      padding: "18px 20px",
                      color: T.text,
                    }}
                  >
                    <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{tpl.name}</div>
                    <div style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.5 }}>{tpl.blurb}</div>
                    <div className="fos-mono" style={{ fontSize: 10, color: T.faint, marginTop: 10 }}>
                      {tpl.tracks.length} TRACKS · {tpl.threads.length} THREADS
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === "tracks" && (
          <section className="fos-fade">
            <Label>STEP 3</Label>
            <h1 className="fos-serif" style={{ fontSize: 34, margin: "12px 0 8px", fontWeight: 400 }}>
              Which tracks are yours?
            </h1>
            <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Uncheck anything that doesn't fit. Fewer tracks means less to choose between later — you can always add
              more.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {template.tracks.map((t) => {
                const on = trackIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleTrack(t.id)}
                    className="fos-btn"
                    style={{
                      display: "flex",
                      gap: 13,
                      alignItems: "flex-start",
                      textAlign: "left",
                      background: on ? T.panelHi : T.panel,
                      border: `1px solid ${on ? t.color : T.borderSoft}`,
                      borderRadius: 12,
                      padding: "15px 17px",
                      color: T.text,
                      opacity: on ? 1 : 0.6,
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        flexShrink: 0,
                        marginTop: 2,
                        border: `1.5px solid ${on ? t.color : T.border}`,
                        background: on ? t.color : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {on && (
                        <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden>
                          <path
                            d="M2 6.2L4.6 9L10 3"
                            stroke={T.bg}
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 15.5, fontWeight: 600 }}>{t.name}</span>
                      <span style={{ display: "block", fontSize: 13, color: T.muted, marginTop: 4, lineHeight: 1.5 }}>
                        {t.intent}
                      </span>
                      <span className="fos-mono" style={{ display: "block", fontSize: 10, color: T.faint, marginTop: 7 }}>
                        {trackQuests(t).length} TASKS
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === "commit" && (
          <section className="fos-fade">
            <Label>STEP 4</Label>
            <h1 className="fos-serif" style={{ fontSize: 34, margin: "12px 0 8px", fontWeight: 400 }}>
              Choose this month's one track
            </h1>
            <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              This is the commitment that does the work. For a month, Focus shows you only this track — everything else
              waits. Skip it if you'd rather decide later.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
              {chosenTracks.map((t) => {
                const on = monthTrackId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setMonthTrackId(on ? null : t.id)}
                    className="fos-btn"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      background: on ? T.panelHi : "transparent",
                      border: `1px solid ${on ? t.color : T.border}`,
                      borderRadius: 10,
                      padding: "11px 15px",
                      color: T.text,
                      fontSize: 14,
                    }}
                  >
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: t.color }} />
                    {t.name}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 30, padding: "16px 18px", background: T.panel, borderRadius: 12, borderLeft: `3px solid ${T.brass}` }}>
              <Label color={T.brass} style={{ fontSize: 10, marginBottom: 8 }}>
                WHAT HAPPENS NEXT
              </Label>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: T.muted }}>
                You'll land on <span style={{ color: T.text }}>Focus</span>. Set this week's one task, tell it how long
                you've got, and it hands you the next steps. Everything you complete feeds{" "}
                <span style={{ color: T.text }}>Reflect</span>, where you course-correct each week.
              </p>
            </div>
          </section>
        )}

        {/* nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 36 }}>
          <Button onClick={back} style={{ visibility: stepIndex === 0 ? "hidden" : "visible" }}>
            ← BACK
          </Button>
          <Button variant="primary" onClick={next} disabled={!canAdvance()} style={{ padding: "11px 22px", fontSize: 13 }}>
            {stepIndex === STEPS.length - 1 ? "START" : "CONTINUE →"}
          </Button>
        </div>
      </div>
    </div>
  );
}
