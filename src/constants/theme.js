// ─── Stella's Kitchen Mobile — Design Token Registry ─────────────────────────
import { Platform } from 'react-native';

export const COLORS = {
  // Brand core
  red: "#EF4444",
  redDark: "#DC2626",
  redLight: "#FEE2E2",
  dark: "#1C1917",
  stone: "#292524",
  warm: "#44403C",
  muted: "#78716C",
  border: "#3F3A37",
  cream: "#FDFBF7",
  offWhite: "#F5F1EB",
  white: "#FFFFFF",

  // Light mode surfaces
  lightBg: "#FFFFFF",
  lightCard: "#F5F1EB",
  lightBorder: "#E5E0D8",
  lightText: "#1C1917",
  lightTextMuted: "#78716C",
  lightInputBg: "#FDFBF7",

  // Status
  pending: "#F59E0B",
  pendingBg: "#FEF3C7",
  preparing: "#3B82F6",
  preparingBg: "#DBEAFE",
  ready: "#8B5CF6",
  readyBg: "#EDE9FE",
  delivery: "#F97316",
  deliveryBg: "#FFEDD5",
  delivered: "#22C55E",
  deliveredBg: "#DCFCE7",
  cancelled: "#EF4444",
  cancelledBg: "#FEE2E2",
};

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 19,
  xl: 22,
  "2xl": 26,
  "3xl": 32,
  "4xl": 40,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 56,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  full: 9999,
};

export const Fonts = {
  mono: Platform.select({
    ios: 'Courier New',
    android: 'monospace',
    default: 'Courier New',
  }),
};

export const BRAND = {
  name: "Stella's Kitchen",
  tagline: "Eat Good, Feel Good",
  location: "Shai Hills, Ghana",
};

export const ORDER_STATUS = {
  PENDING: "Pending",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready for Dispatch",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: "Pending",
  [ORDER_STATUS.PREPARING]: "Preparing",
  [ORDER_STATUS.READY_FOR_PICKUP]: "Ready for Dispatch",
  [ORDER_STATUS.OUT_FOR_DELIVERY]: "Out for Delivery",
  [ORDER_STATUS.DELIVERED]: "Delivered",
};

export const ROLES = {
  STAFF: "Staff",
  RIDER: "Rider",
};

export const VEHICLE_TYPES = [
  { value: "motorbike", label: "Motorbike" },
  { value: "bicycle", label: "Bicycle" },
  { value: "van", label: "Van" },
  { value: "on_foot", label: "On Foot" },
];

// ─── Theme Token Sets ─────────────────────────────────────────────────────────
export const DARK_THEME = {
  bg:           COLORS.dark,
  card:         COLORS.stone,
  border:       COLORS.border,
  text:         COLORS.white,
  textMuted:    "#9CA3AF",
  textFaint:    "#6B7280",
  tabBar:       COLORS.stone,
  tabBorder:    COLORS.border,
  inputBg:      COLORS.warm,
  pillActive:   "#1E3A5F",
  statusBar:    "light-content",
};

export const LIGHT_THEME = {
  bg:           COLORS.offWhite,
  card:         COLORS.white,
  border:       COLORS.lightBorder,
  text:         COLORS.lightText,
  textMuted:    COLORS.lightTextMuted,
  textFaint:    "#9CA3AF",
  tabBar:       COLORS.white,
  tabBorder:    COLORS.lightBorder,
  inputBg:      COLORS.lightInputBg,
  pillActive:   COLORS.redLight,
  statusBar:    "dark-content",
};