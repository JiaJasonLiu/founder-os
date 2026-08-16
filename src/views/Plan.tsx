import { useState } from "react";
import type { AppState, Quest, Track } from "@/types";
import {
  addQuest,
  addStep,
  cycleEstimate,
  deleteQuest,
  deleteStep,
  deleteTrack,
  moveQuest,
  moveTrack,
  questCount,
  renameQuest,
  renameTrack,
  setQuestDone,
  setStepDone,
  setTrackIntent,
  toggleStar,
} from "@/lib/domain";
import { fmtMin } from "@/lib/dates";
import { EST_PRESETS, T, TRACK_PALETTE } from "@/styles/theme";
import { Button, Check, EstChip, Label, SynthesisLoop, TextField } from "@/components/ui";

type Apply = (fn: (s: AppState) => AppState) => void;

/**
 * Where work gets structured.
 *
 * Quests collapse to a single line by default so a track reads as a
 * high-level list; expanding one reveals its steps and the add-step form.
 */
export default function Plan({ state, apply }: { state: AppState; apply: Apply }) {
  const [openTrack, setOpenTrack] = useState<string | null>(state.tracks[0]?.id ?? null);
  const [newTrack, setNewTrack] = useState("");
  const [editMode, setEditMode] = useState(false);

  const createTrack = () => {
    const name = newTrack.trim();
    if (!name) return;
    apply((s) => ({
      ...s,
      tracks: [
        ...s.tracks,
        {
          id: `t${Math.random().toString(36).slice(2, 8)}`,
          name,
          tag: "new track",
          color: TRACK_PALETTE[s.tracks.length % TRACK_PALETTE.length],
          intent: "Describe why this lane of work matters to your goal.",
          quests: [],
        },
      ],
    }));
    setNewTrack("");
  };

  const promote = (itemId: string) =>
    apply((s) => {
      const item = s.backlog.find((b) => b.id === itemId);
      const target = s.tracks[0];
      if (!item || !target) return s;

      const quest: Quest = {
        id: `q${Math.random().toString(36).slice(2, 8)}`,
        text: item.text,
        est: 30,
        done: false,
        steps: [],
      };

      const tracks = s.tracks.map((t) =>
        t.id === target.id ? { ...t, quests: [...t.quests, quest] } : t,
      );

      return { ...s, tracks, backlog: s.backlog.filter((b) => b.id !== itemId) };
    });

  return (
    <div className="fos-fade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <Label style={{ marginBottom: 12 }}>BREAK IT DOWN</Label>
          <h1 className="fos-serif" style={{ fontSize: 34, margin: "0 0 6px", fontWeight: 400 }}>
            Plan
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 2, padding: 3, background: T.borderSoft, borderRadius: 20, flexShrink: 0 }}>
          <button
            onClick={() => setEditMode(false)}
            className="fos-btn fos-mono"
            style={{
              border: "none",
              borderRadius: 20,
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
              background: editMode ? "transparent" : T.text,
              color: editMode ? T.muted : T.bg,
            }}
          >
            READ
          </button>
          <button
            onClick={() => setEditMode(true)}
            className="fos-btn fos-mono"
            style={{
              border: "none",
              borderRadius: 20,
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
              background: editMode ? T.text : "transparent",
              color: editMode ? T.bg : T.muted,
            }}
          >
            EDIT
          </button>
        </div>
      </div>
      <p style={{ color: T.muted, fontSize: 14, margin: "0 0 26px", maxWidth: 580 }}>
        {editMode
          ? "Edit titles and notes in place, reorder with ▲▼, or remove a track. Switch back to READ when you're done."
          : "A high-level list per track. Tap a task to open it, then add hour-sized steps inside. Use ▲▼ to reorder, the time chip to size things, and ★ to flag one for Focus."}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {state.tracks.map((track, trackIndex) => {
          const { total, done } = questCount(track);
          const isOpen = openTrack === track.id;
          return (
            <div
              key={track.id}
              className="fos-card fos-hover"
              style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, borderRadius: 14, overflow: "hidden" }}
            >
              <div
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "18px 20px",
                  color: T.text,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div
                    onClick={() => !editMode && setOpenTrack(isOpen ? null : track.id)}
                    style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1, cursor: editMode ? "default" : "pointer" }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: track.color, flexShrink: 0 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      {editMode ? (
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => {
                            const text = e.currentTarget.textContent?.trim() || track.name;
                            apply((s) => renameTrack(s, track.id, text));
                          }}
                          style={{
                            fontSize: 17,
                            fontWeight: 600,
                            padding: "1px 6px",
                            margin: "-1px -6px",
                            borderRadius: 6,
                            background: T.borderSoft,
                            outline: "none",
                          }}
                        >
                          {track.name}
                        </div>
                      ) : (
                        <div style={{ fontSize: 17, fontWeight: 600 }}>{track.name}</div>
                      )}
                      <div className="fos-mono" style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                        {track.tag}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                    {editMode ? (
                      <>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <button
                            onClick={() => apply((s) => moveTrack(s, track.id, -1))}
                            disabled={trackIndex === 0}
                            aria-label="Move track up"
                            style={{
                              background: "none",
                              border: "none",
                              padding: "0 3px",
                              lineHeight: 0.9,
                              fontSize: 9,
                              color: trackIndex === 0 ? T.borderSoft : T.faint,
                              cursor: trackIndex === 0 ? "default" : "pointer",
                            }}
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => apply((s) => moveTrack(s, track.id, 1))}
                            disabled={trackIndex === state.tracks.length - 1}
                            aria-label="Move track down"
                            style={{
                              background: "none",
                              border: "none",
                              padding: "0 3px",
                              lineHeight: 0.9,
                              fontSize: 9,
                              color: trackIndex === state.tracks.length - 1 ? T.borderSoft : T.faint,
                              cursor: trackIndex === state.tracks.length - 1 ? "default" : "pointer",
                            }}
                          >
                            ▼
                          </button>
                        </div>
                        <button
                          onClick={() => apply((s) => deleteTrack(s, track.id))}
                          className="fos-del fos-mono"
                          title="Delete track"
                          style={{ background: "none", border: "none", color: T.faint, fontSize: 16 }}
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <span className="fos-mono" style={{ fontSize: 12, color: T.muted }}>
                        {done}/{total}
                      </span>
                    )}
                    <button
                      onClick={() => setOpenTrack(isOpen ? null : track.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: T.faint,
                        transform: isOpen ? "rotate(90deg)" : "none",
                        transition: "transform .2s",
                        fontSize: 12,
                        padding: 0,
                      }}
                    >
                      ▶
                    </button>
                  </div>
                </div>
              </div>

              {isOpen && (
                <div style={{ padding: "0 20px 20px" }}>
                  {editMode ? (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const text = e.currentTarget.textContent?.trim() || "";
                        apply((s) => setTrackIntent(s, track.id, text));
                      }}
                      style={{
                        color: T.muted,
                        fontSize: 13.5,
                        lineHeight: 1.5,
                        margin: "0 0 16px",
                        marginLeft: 22,
                        padding: "3px 7px",
                        borderRadius: 6,
                        background: T.borderSoft,
                        outline: "none",
                      }}
                    >
                      {track.intent}
                    </div>
                  ) : (
                    track.intent && (
                      <p style={{ color: T.muted, fontSize: 13.5, lineHeight: 1.5, margin: "0 0 16px", paddingLeft: 22 }}>
                        {track.intent}
                      </p>
                    )
                  )}
                  {track.id === "t4" && (
                    <div style={{ paddingLeft: 22, marginBottom: 18 }}>
                      <SynthesisLoop />
                    </div>
                  )}

                  <QuestList state={state} apply={apply} track={track} quests={track.quests} editMode={editMode} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* add a track */}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <TextField
          value={newTrack}
          onChange={(e) => setNewTrack(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createTrack()}
          placeholder="Add a new track…"
          style={{ flex: 1 }}
        />
        <Button onClick={createTrack} style={{ padding: "0 18px" }}>
          ADD TRACK
        </Button>
      </div>

      {state.backlog.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <Label style={{ marginBottom: 4 }}>PARKED · BACKLOG</Label>
          <p style={{ color: T.muted, fontSize: 13, margin: "0 0 14px" }}>
            Things worth doing later. Promote one into a track when the moment's right.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {state.backlog.map((b) => (
              <div
                key={b.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  background: T.panel,
                  border: `1px solid ${T.borderSoft}`,
                  borderRadius: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 500 }}>{b.text}</div>
                  <div className="fos-mono" style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                    {b.note}
                  </div>
                </div>
                <Button onClick={() => promote(b.id)} style={{ border: `1px solid ${T.clay}`, color: T.clay, flexShrink: 0 }}>
                  PROMOTE →
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuestList({
  state,
  apply,
  track,
  quests,
  editMode,
}: {
  state: AppState;
  apply: Apply;
  track: Track;
  quests: Quest[];
  editMode: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [draftEst, setDraftEst] = useState(30);
  const add = () => {
    if (!draft.trim()) return;
    apply((s) => addQuest(s, track.id, draft, draftEst));
    setDraft("");
  };

  return (
    <div>
      {quests.map((q, i) => (
        <QuestRow
          key={q.id}
          state={state}
          apply={apply}
          track={track}
          quest={q}
          index={i}
          count={quests.length}
          editMode={editMode}
        />
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
        <TextField
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a task…"
          style={{ flex: 1, fontSize: 13.5, padding: "8px 11px" }}
        />
        <button
          onClick={() => setDraftEst(EST_PRESETS[(EST_PRESETS.indexOf(draftEst) + 1) % EST_PRESETS.length])}
          className="fos-btn fos-mono"
          title="Estimate"
          style={{
            background: "transparent",
            border: `1px solid ${T.border}`,
            borderRadius: 20,
            padding: "6px 11px",
            fontSize: 11,
            color: T.muted,
          }}
        >
          {draftEst}m
        </button>
        <Button onClick={add} style={{ padding: "8px 12px" }}>
          ADD
        </Button>
      </div>
    </div>
  );
}

function QuestRow({
  state,
  apply,
  track,
  quest,
  index,
  count,
  editMode,
}: {
  state: AppState;
  apply: Apply;
  track: Track;
  quest: Quest;
  index: number;
  count: number;
  editMode: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [stepText, setStepText] = useState("");
  const [stepEst, setStepEst] = useState(30);

  const hasSteps = quest.steps.length > 0;
  const starred = state.starters.includes(quest.id);
  const totalEst = hasSteps ? quest.steps.reduce((s, x) => s + x.est, 0) : quest.est;
  const doneSteps = quest.steps.filter((s) => s.done).length;

  const submitStep = () => {
    if (!stepText.trim()) return;
    apply((s) => addStep(s, track.id, quest.id, stepText, stepEst));
    setStepText("");
  };

  const arrowStyle = (disabled: boolean) => ({
    background: "none",
    border: "none",
    padding: "0 3px",
    lineHeight: 0.9,
    fontSize: 9,
    color: disabled ? T.borderSoft : T.faint,
    cursor: disabled ? ("default" as const) : ("pointer" as const),
  });

  return (
    <div style={{ borderTop: `1px solid ${T.borderSoft}`, padding: "7px 0" }}>
      <div className="fos-row" style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <button
            onClick={() => apply((s) => moveQuest(s, track.id, quest.id, -1))}
            disabled={index === 0}
            aria-label="Move up"
            style={arrowStyle(index === 0)}
          >
            ▲
          </button>
          <button
            onClick={() => apply((s) => moveQuest(s, track.id, quest.id, 1))}
            disabled={index === count - 1}
            aria-label="Move down"
            style={arrowStyle(index === count - 1)}
          >
            ▼
          </button>
        </div>

        <Check
          done={quest.done}
          color={track.color}
          onClick={() => apply((s) => setQuestDone(s, track.id, quest.id, !quest.done))}
        />

        <div onClick={() => !editMode && setOpen(!open)} style={{ flex: 1, minWidth: 0, cursor: editMode ? "default" : "pointer" }}>
          {editMode ? (
            <div
              contentEditable
              suppressContentEditableWarning
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) => {
                const text = e.currentTarget.textContent?.trim() || quest.text;
                apply((s) => renameQuest(s, track.id, quest.id, text));
              }}
              style={{
                fontSize: 14.5,
                lineHeight: 1.4,
                textDecoration: quest.done ? "line-through" : "none",
                color: quest.done ? T.muted : T.text,
                padding: "2px 6px",
                margin: "-2px -6px",
                borderRadius: 5,
                background: T.borderSoft,
                outline: "none",
              }}
            >
              {quest.text}
            </div>
          ) : (
            <div
              style={{
                fontSize: 14.5,
                lineHeight: 1.4,
                textDecoration: quest.done ? "line-through" : "none",
                color: quest.done ? T.muted : T.text,
              }}
            >
              {quest.text}
            </div>
          )}
          <div className="fos-mono" style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>
            {hasSteps ? `${doneSteps}/${quest.steps.length} steps · ${fmtMin(totalEst)}` : fmtMin(quest.est)}
            {starred ? " · ★" : ""}
          </div>
        </div>

        <button
          onClick={() => apply((s) => toggleStar(s, quest.id))}
          title="Flag for Focus"
          className="fos-btn"
          style={{ background: "none", border: "none", fontSize: 14, color: starred ? T.brass : T.faint, padding: 0 }}
        >
          {starred ? "★" : "☆"}
        </button>
        <button
          onClick={() => setOpen(!open)}
          className="fos-btn"
          title={open ? "Collapse" : "Expand"}
          style={{
            background: "none",
            border: "none",
            color: T.faint,
            fontSize: 12,
            padding: "0 2px",
            transform: open ? "rotate(90deg)" : "none",
            transition: "transform .2s",
          }}
        >
          ▶
        </button>
        <button
          onClick={() => apply((s) => deleteQuest(s, track.id, quest.id))}
          className="fos-del fos-mono"
          title="Delete task"
          style={{ background: "none", border: "none", color: T.faint, fontSize: 16 }}
        >
          ×
        </button>
      </div>

      {open && (
        <div style={{ marginLeft: 46, marginTop: 10 }}>
          {!hasSteps && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Label style={{ fontSize: 10, letterSpacing: ".06em" }}>ESTIMATE</Label>
              <EstChip
                min={quest.est}
                color={track.color}
                onCycle={() => apply((s) => cycleEstimate(s, track.id, quest.id, null, EST_PRESETS))}
              />
            </div>
          )}

          {hasSteps && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
              {quest.steps.map((step) => (
                <div key={step.id} className="fos-row" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Check
                    done={step.done}
                    color={track.color}
                    size={16}
                    onClick={() => apply((s) => setStepDone(s, track.id, quest.id, step.id, !step.done))}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13.5,
                      textDecoration: step.done ? "line-through" : "none",
                      color: step.done ? T.muted : T.text,
                    }}
                  >
                    {step.text}
                  </span>
                  <EstChip
                    min={step.est}
                    color={track.color}
                    onCycle={() => apply((s) => cycleEstimate(s, track.id, quest.id, step.id, EST_PRESETS))}
                  />
                  <button
                    onClick={() => apply((s) => deleteStep(s, track.id, quest.id, step.id))}
                    className="fos-del fos-mono"
                    title="Delete step"
                    style={{ background: "none", border: "none", color: T.faint, fontSize: 14 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <Label color={track.color} style={{ fontSize: 10, letterSpacing: ".08em", marginBottom: 7 }}>
              + ADD STEP
            </Label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <TextField
                value={stepText}
                onChange={(e) => setStepText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitStep()}
                placeholder="A step you can finish in one sitting…"
                style={{ flex: 1, fontSize: 13.5, padding: "8px 11px" }}
              />
              <button
                onClick={() => setStepEst(EST_PRESETS[(EST_PRESETS.indexOf(stepEst) + 1) % EST_PRESETS.length])}
                className="fos-btn fos-mono"
                title="Estimate"
                style={{
                  background: "transparent",
                  border: `1px solid ${T.border}`,
                  borderRadius: 20,
                  padding: "6px 11px",
                  fontSize: 11,
                  color: T.muted,
                }}
              >
                {stepEst}m
              </button>
              <Button onClick={submitStep} style={{ padding: "8px 12px" }}>
                ADD
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
