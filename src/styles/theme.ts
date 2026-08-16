/** Design tokens. Change these to restyle the whole app. */
export const T = {
  bg: "#15181C",
  panel: "#1D2127",
  panelHi: "#242A31",
  border: "#333B44",
  borderSoft: "#282F37",
  text: "#E6E3DC",
  muted: "#8B8578",
  faint: "#5E5A50",
  brass: "#D4A24C",
  green: "#7FA88A",
  slate: "#6E8CA8",
  moss: "#8CA06A",
  clay: "#C68B72",
  gold: "#D4A24C",
  teal: "#5B9AA0",
  plum: "#9B7EB0",
} as const;

/** Colour cycle used when a user creates their own tracks and threads. */
export const TRACK_PALETTE: string[] = [
  T.slate,
  T.moss,
  T.clay,
  T.gold,
  T.teal,
  T.plum,
];

export const FONT = {
  sans: "'Space Grotesk', system-ui, sans-serif",
  serif: "'Instrument Serif', Georgia, serif",
  mono: "'JetBrains Mono', monospace",
} as const;

/** Estimate options cycled by tapping a time chip. */
export const EST_PRESETS: number[] = [10, 15, 20, 30, 45, 60, 90];

/** Session length options in Focus. */
export const BUDGET_PRESETS: number[] = [15, 30, 60, 90];
