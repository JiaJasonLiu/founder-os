import type { CSSProperties, ReactNode } from "react";
import { T } from "@/styles/theme";

/* ------------------------------------------------------------------ *
 * Small building blocks shared across views.
 * ------------------------------------------------------------------ */

export function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 6, background: T.borderSoft, borderRadius: 4, overflow: "hidden" }}>
      <div
        className="fos-bar"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: "100%", background: color, borderRadius: 4 }}
      />
    </div>
  );
}

export function Check({
  done,
  color,
  onClick,
  size = 20,
  label,
}: {
  done: boolean;
  color: string;
  onClick: () => void;
  size?: number;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={done}
      aria-label={label ?? (done ? "Mark as not done" : "Mark as done")}
      className="fos-btn"
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: 6,
        marginTop: 1,
        padding: 0,
        border: `1.5px solid ${done ? color : T.border}`,
        background: done ? color : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {done && (
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M2 6.2L4.6 9L10 3" stroke={T.bg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export function Flame({ color, size = 15 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ verticalAlign: "-2px" }} aria-hidden>
      <path d="M12 23c3.87 0 7-3.13 7-7 0-4-3-6-4-9-.5 1.5-1.5 2.5-2.5 3C11 8 12 5 10 2 9 6 5 8 5 13c0 4.5 3.36 10 7 10z" />
    </svg>
  );
}

/** Tap to cycle to the next estimate preset. */
export function EstChip({
  min,
  onCycle,
  color,
}: {
  min: number;
  onCycle: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onCycle}
      className="fos-btn fos-mono"
      title="Tap to change the estimate"
      style={{
        background: "transparent",
        border: `1px solid ${T.border}`,
        borderRadius: 20,
        padding: "2px 9px",
        fontSize: 10.5,
        color: color ?? T.muted,
        flexShrink: 0,
      }}
    >
      {min}m
    </button>
  );
}

export function Label({ children, color = T.faint, style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <div className="fos-mono" style={{ fontSize: 11, color, letterSpacing: ".16em", ...style }}>
      {children}
    </div>
  );
}

export function Panel({ children, style, accent }: { children: ReactNode; style?: CSSProperties; accent?: string }) {
  return (
    <div
      style={{
        background: T.panel,
        border: `1px solid ${T.borderSoft}`,
        borderRadius: 14,
        padding: 20,
        ...(accent ? { borderLeft: `3px solid ${accent}` } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: "24px 20px",
        textAlign: "center",
        color: T.faint,
        border: `1px dashed ${T.border}`,
        borderRadius: 12,
        fontSize: 13.5,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}

export const fieldStyle: CSSProperties = {
  width: "100%",
  background: T.bg,
  border: `1px solid ${T.borderSoft}`,
  borderRadius: 9,
  padding: "10px 12px",
  color: T.text,
  fontSize: 14,
  lineHeight: 1.5,
};

export function TextField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { style, ...rest } = props;
  return <input {...rest} className="fos-field" style={{ ...fieldStyle, ...style }} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { style, ...rest } = props;
  return <textarea {...rest} className="fos-field" style={{ ...fieldStyle, ...style }} />;
}

export function Button({
  children,
  onClick,
  variant = "ghost",
  disabled,
  style,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "ghost" | "primary";
  disabled?: boolean;
  style?: CSSProperties;
  title?: string;
}) {
  const primary = variant === "primary";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="fos-btn fos-mono"
      style={{
        background: primary ? (disabled ? T.panelHi : T.brass) : "transparent",
        color: primary ? (disabled ? T.faint : T.bg) : T.muted,
        border: primary ? "none" : `1px solid ${T.border}`,
        borderRadius: 9,
        padding: "9px 16px",
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: ".04em",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** The four stages of the decision loop, optionally highlighting one. */
export function SynthesisLoop({ active = -1 }: { active?: number }) {
  const stages = ["Form", "Feed", "Attack", "Stress-test"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      {stages.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              opacity: active === -1 || active === i ? 1 : 0.5,
            }}
          >
            <div
              style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: active === i ? T.gold : "transparent",
                border: `1.5px solid ${active === i ? T.gold : T.faint}`,
              }}
            />
            <span className="fos-mono" style={{ fontSize: 10, color: active === i ? T.gold : T.muted }}>
              {s}
            </span>
          </div>
          {i < stages.length - 1 && <div style={{ width: 22, height: 1, background: T.border }} />}
        </div>
      ))}
    </div>
  );
}
