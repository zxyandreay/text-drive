/** Shared typography and colors for prototype UI consistency. */
export const UiTheme = {
  /** UI body / HUD / buttons (Inter). */
  fontFamily: "Inter, system-ui, sans-serif",
  /** Display / wordmark only (Teko). */
  fontDisplay: "Teko, sans-serif",
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
    /** Faded expected-reply hint inside the input panel (readable ghost, still dimmer than typed) */
    replyHint: "#94a3b8",
    /** Typed characters that match expected (case-insensitive) */
    typedCorrect: "#f1f5f9",
    /** Typed characters that do not match at the same index */
    typedWrong: "#f87171",
    /** Empty-input cursor */
    typedCursor: "#64748b",
    /** Main menu tagline (quieter than accent) */
    menuTagline: "#64748b"
  },
  sizes: {
    titleLg: "26px",
    titleMd: "20px",
    body: "15px",
    small: "13px",
    hint: "12px",
    phoneHeader: "18px",
    phoneBody: "14px",
    phoneMono: "16px",
    /** Result / aftermath score screen */
    resultHeadline: "34px",
    resultLevelTitle: "21px",
    resultScore: "26px",
    resultBest: "18px",
    resultAfterTitle: "24px",
    resultBody: "17px",
    resultReason: "16px",
    resultButton: "18px",
    resultNav: "14px",
    /** Default menu / generic buttons (not result screen). */
    buttonDefault: "20px",
    /** Main menu hero: size is computed in MainMenuScene from viewport (Teko 700 Bold). */
    menuTitle: "220px",
    /** Ending / secondary brand line */
    menuTitleSm: "72px",
    /** Level select and similar full-width screen headings (Teko 700 Bold) */
    levelSelectHeading: "56px",
    menuTagline: "13px",
    menuCta: "18px"
  },
  /** Filled / outline button presets for result screens (hex stroke for Phaser lineStyle). */
  buttons: {
    primaryFill: 0x1d4ed8,
    primaryStroke: 0x93c5fd,
    secondaryFill: 0x334155,
    secondaryStroke: 0x64748b,
    ghostFill: 0x1e293b,
    ghostStroke: 0x475569
  },
  /** Pre-level intro and result aftermath / reason text rhythm */
  narrative: {
    introLineSpacing: 8,
    resultLineSpacing: 7
  }
} as const;
