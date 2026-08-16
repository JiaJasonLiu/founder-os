import { useState } from "react";
import type { AppState } from "@/types";
import { useAppState, type Toast } from "@/lib/useAppState";
import { dayStreak, momentum } from "@/lib/domain";
import { T } from "@/styles/theme";
import { Flame } from "@/components/ui";
import Onboarding from "@/views/Onboarding";
import Focus from "@/views/Focus";
import Plan from "@/views/Plan";
import Threads from "@/views/Threads";
import Reflect from "@/views/Reflect";
import Journal from "@/views/Journal";
import Settings from "@/views/Settings";

type ViewId = "focus" | "plan" | "threads" | "reflect" | "journal" | "settings";

const NAV: { id: ViewId; label: string }[] = [
  { id: "focus", label: "Focus" },
  { id: "plan", label: "Plan" },
  { id: "threads", label: "Threads" },
  { id: "reflect", label: "Reflect" },
  { id: "journal", label: "Journal" },
  { id: "settings", label: "Settings" },
];

export default function App() {
  const { state, update, apply, toasts } = useAppState();
  const [view, setView] = useState<ViewId>("focus");

  if (!state) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted }}>
        <span className="fos-mono" style={{ fontSize: 13 }}>
          loading your system…
        </span>
      </div>
    );
  }

  if (!state.onboarded) {
    return <Onboarding onComplete={update} />;
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <div className="fos-shell" style={{ display: "flex", minHeight: "100vh" }}>
        <nav
          className="fos-rail"
          style={{
            width: 208,
            borderRight: `1px solid ${T.borderSoft}`,
            padding: "22px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 3,
            flexShrink: 0,
          }}
        >
          <div className="fos-rail-brand" style={{ padding: "0 8px 20px" }}>
            <div className="fos-serif" style={{ fontSize: 25, lineHeight: 1 }}>
              Founder OS
            </div>
            <div className="fos-mono" style={{ fontSize: 10, color: T.faint, letterSpacing: ".12em", marginTop: 6 }}>
              PLAN · DO · REFLECT
            </div>
          </div>

          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className="fos-nav fos-hover"
              style={{
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                background: view === n.id ? T.panelHi : "transparent",
                color: view === n.id ? T.text : T.muted,
              }}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <main style={{ flex: 1, minWidth: 0 }}>
          <TopBar state={state} />
          <div className="fos-content" style={{ padding: "28px 44px 52px" }}>
            {view === "focus" && <Focus state={state} apply={apply} />}
            {view === "plan" && <Plan state={state} apply={apply} />}
            {view === "threads" && <Threads state={state} apply={apply} />}
            {view === "reflect" && <Reflect state={state} apply={apply} />}
            {view === "journal" && <Journal state={state} apply={apply} />}
            {view === "settings" && <Settings state={state} apply={apply} update={update} />}
          </div>
        </main>
      </div>

      <Toasts toasts={toasts} />
    </div>
  );
}

function TopBar({ state }: { state: AppState }) {
  const m = momentum(state);
  const streak = dayStreak(state);

  return (
    <div
      className="fos-topbar"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: T.bg,
        borderBottom: `1px solid ${T.borderSoft}`,
        padding: "14px 44px",
        display: "flex",
        gap: 28,
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
        <span className="fos-serif" style={{ fontSize: 24, color: T.brass, lineHeight: 1 }}>
          {m}
        </span>
        <span className="fos-mono" style={{ fontSize: 10, color: T.muted, letterSpacing: ".08em" }}>
          MOMENTUM
        </span>
      </div>
      <div style={{ width: 1, height: 20, background: T.borderSoft }} />
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {streak > 0 && <Flame color={T.brass} size={17} />}
        <span className="fos-serif" style={{ fontSize: 24, color: streak > 0 ? T.brass : T.faint, lineHeight: 1 }}>
          {streak}
        </span>
        <span className="fos-mono" style={{ fontSize: 10, color: T.muted, letterSpacing: ".08em" }}>
          DAY STREAK
        </span>
      </div>
    </div>
  );
}

function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div style={{ position: "fixed", right: 20, bottom: 20, display: "flex", flexDirection: "column", gap: 10, zIndex: 60 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="fos-toast"
          style={{
            background: T.panelHi,
            border: `1px solid ${T.brass}`,
            borderLeft: `3px solid ${T.brass}`,
            borderRadius: 11,
            padding: "12px 16px",
            minWidth: 210,
            boxShadow: "0 10px 34px rgba(0,0,0,.45)",
          }}
        >
          <div className="fos-mono" style={{ fontSize: 10, color: T.brass, letterSpacing: ".16em" }}>
            {t.kind}
          </div>
          <div className="fos-serif" style={{ fontSize: 18, color: T.text, marginTop: 2 }}>
            {t.message}
          </div>
        </div>
      ))}
    </div>
  );
}
