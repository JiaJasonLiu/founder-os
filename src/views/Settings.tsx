import { useRef, useState } from "react";
import type { AppState } from "@/types";
import { clearState, exportState, importState } from "@/lib/storage";
import { T } from "@/styles/theme";
import { Button, Label, TextArea, TextField } from "@/components/ui";

type Apply = (fn: (s: AppState) => AppState) => void;

/**
 * Data ownership and the slower-moving settings.
 *
 * Export/import exists so the state is never trapped in one browser's
 * localStorage — it's your data, in a plain JSON file.
 */
export default function Settings({
  state,
  apply,
  update,
}: {
  state: AppState;
  apply: Apply;
  update: (s: AppState) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const onImport = async (file: File) => {
    try {
      const next = importState(await file.text());
      update(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    }
  };

  const reset = () => {
    clearState();
    window.location.reload();
  };

  return (
    <div className="fos-fade">
      <Label style={{ marginBottom: 12 }}>SETUP</Label>
      <h1 className="fos-serif" style={{ fontSize: 34, margin: "0 0 22px", fontWeight: 400 }}>
        Settings
      </h1>

      {/* goal + thesis */}
      <div style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, borderRadius: 14, padding: 22, marginBottom: 16 }}>
        <div className="fos-serif" style={{ fontSize: 20, marginBottom: 16 }}>
          Your goal
        </div>

        <Label style={{ fontSize: 10, marginBottom: 7 }}>THE GOAL</Label>
        <TextField
          value={state.goal}
          onChange={(e) => apply((s) => ({ ...s, goal: e.target.value }))}
          style={{ marginBottom: 16 }}
        />

        <Label style={{ fontSize: 10, marginBottom: 7 }}>TIMEFRAME</Label>
        <TextField
          value={state.horizon}
          onChange={(e) => apply((s) => ({ ...s, horizon: e.target.value }))}
          style={{ marginBottom: 16 }}
        />

        <Label style={{ fontSize: 10, marginBottom: 7 }}>YOUR BET</Label>
        <TextArea value={state.thesis} onChange={(e) => apply((s) => ({ ...s, thesis: e.target.value }))} rows={2} />
      </div>

      {/* phases */}
      {state.phases.length > 0 && (
        <div style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, borderRadius: 14, padding: 22, marginBottom: 16 }}>
          <div className="fos-serif" style={{ fontSize: 20, marginBottom: 6 }}>
            Phases
          </div>
          <p style={{ color: T.muted, fontSize: 13, margin: "0 0 16px" }}>
            Broad eras on the way to the goal. Tap one to mark where you are now.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {state.phases.map((p) => {
              const active = p.n === state.phase;
              return (
                <button
                  key={p.n}
                  onClick={() => apply((s) => ({ ...s, phase: p.n }))}
                  className="fos-btn"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    textAlign: "left",
                    background: active ? T.panelHi : "transparent",
                    border: `1px solid ${active ? T.brass : T.borderSoft}`,
                    borderRadius: 11,
                    padding: "13px 15px",
                    color: T.text,
                  }}
                >
                  <span
                    className="fos-mono"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: active ? T.brass : "transparent",
                      border: `1.5px solid ${active ? T.brass : T.border}`,
                      color: active ? T.bg : T.muted,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {p.n}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14.5, fontWeight: active ? 600 : 400 }}>{p.label}</span>
                    <span className="fos-mono" style={{ display: "block", fontSize: 10, color: T.faint, marginTop: 3 }}>
                      {p.note.toUpperCase()}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* data */}
      <div style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, borderRadius: 14, padding: 22 }}>
        <div className="fos-serif" style={{ fontSize: 20, marginBottom: 6 }}>
          Your data
        </div>
        <p style={{ color: T.muted, fontSize: 13, margin: "0 0 18px", lineHeight: 1.6 }}>
          Everything is stored locally in this browser — nothing is sent anywhere. Export regularly if you care about
          keeping it, since clearing site data will wipe it.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button onClick={() => exportState(state)}>↓ EXPORT JSON</Button>
          <Button onClick={() => fileRef.current?.click()}>↑ IMPORT JSON</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImport(f);
              e.target.value = "";
            }}
          />
        </div>

        {error && (
          <div style={{ marginTop: 12, color: T.clay, fontSize: 13 }}>{error}</div>
        )}

        <div style={{ height: 1, background: T.borderSoft, margin: "22px 0" }} />

        {!confirmReset ? (
          <Button onClick={() => setConfirmReset(true)} style={{ border: `1px solid ${T.clay}`, color: T.clay }}>
            RESET EVERYTHING
          </Button>
        ) : (
          <div>
            <p style={{ color: T.text, fontSize: 13.5, margin: "0 0 12px" }}>
              This deletes your goal, tracks, history and journal, and restarts onboarding. Export first if you want a
              copy.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Button onClick={reset} style={{ border: `1px solid ${T.clay}`, color: T.clay }}>
                YES, DELETE IT ALL
              </Button>
              <Button onClick={() => setConfirmReset(false)}>CANCEL</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
