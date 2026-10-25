export const DEVICE = {
  WIDTH: 440,
  HEIGHT: 956,
  STATUS_BAR: 59,
  TAB_BAR: 52,
  HOME_INDICATOR: 20,
  // 56px capsule + raised center label + 20px home inset: measured 82.5px, rounded up.
  BOTTOM_CHROME: 84,
  CONTENT_AREA: 813, // HEIGHT - STATUS_BAR - BOTTOM_CHROME
  DYNAMIC_ISLAND: { width: 126, height: 37, top: 11, radius: 22 },
  HOME_BAR: { width: 134, height: 5, radius: 3, bottomPad: 8 },
} as const;
