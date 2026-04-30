/** Shared typography and colors for prototype UI consistency. */
export const UiTheme = {
  fontFamily: "Arial",
  colors: {
    bg: "#020617",
    panel: "#0f172a",
    panelStroke: "#334155",
    title: "#e2e8f0",
    body: "#cbd5e1",
    muted: "#94a3b8",
    accent: "#93c5fd",
    stress: "#fca5a5",
    success: "#86efac",
    warn: "#fb923c",
    danger: "#f87171",
    /** Faded expected-reply hint inside the input panel */
    replyHint: "#64748b",
    /** Typed characters that match expected (case-insensitive) */
    typedCorrect: "#f1f5f9",
    /** Typed characters that do not match at the same index */
    typedWrong: "#f87171",
    /** Empty-input cursor */
    typedCursor: "#64748b"
  },
  sizes: {
    titleLg: "26px",
    titleMd: "20px",
    body: "15px",
    small: "13px",
    hint: "12px",
    phoneHeader: "18px",
    phoneBody: "14px",
    phoneMono: "16px"
  }
} as const;
