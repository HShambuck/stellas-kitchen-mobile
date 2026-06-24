// ─── Stella's Kitchen Mobile — Design Token Registry ─────────────────────────
// Strict RGB mappings that mirror the web app's Tailwind palette.
// Use these in StyleSheet.create() anywhere you cannot use NativeWind classes.

export const COLORS = {
  // Brand core
  red:         "#EF4444",
  redDark:     "#DC2626",
  redLight:    "#FEE2E2",
  dark:        "#1C1917",
  stone:       "#292524",
  warm:        "#44403C",
  muted:       "#78716C",
  border:      "#3F3A37",
  cream:       "#FDFBF7",
  offWhite:    "#F5F1EB",
  white:       "#FFFFFF",

  // Status
  pending:     "#F59E0B",
  pendingBg:   "#FEF3C7",
  preparing:   "#3B82F6",
  preparingBg: "#DBEAFE",
  ready:       "#8B5CF6",
  readyBg:     "#EDE9FE",
  delivery:    "#F97316",
  deliveryBg:  "#FFEDD5",
  delivered:   "#22C55E",
  deliveredBg: "#DCFCE7",
  cancelled:   "#EF4444",
  cancelledBg: "#FEE2E2",
};

export const FONT_SIZES = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   19,
  xl:   22,
  "2xl": 26,
  "3xl": 32,
  "4xl": 40,
};

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 56,
};

export const RADIUS = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  "2xl": 24,
  "3xl": 28,
  full: 9999,
};

// ─── Brand Copy ───────────────────────────────────────────────────────────────
export const BRAND = {
  name:     "Stella's Kitchen",
  tagline:  "Eat Good, Feel Good",
  location: "Shai Hills, Ghana",
};

// ─── Order Status Enum ────────────────────────────────────────────────────────
export const ORDER_STATUS = {
  PENDING:           "PENDING",
  PREPARING:         "PREPARING",
  READY_FOR_PICKUP:  "READY_FOR_PICKUP",
  OUT_FOR_DELIVERY:  "OUT_FOR_DELIVERY",
  DELIVERED:         "DELIVERED",
  CANCELLED:         "CANCELLED",
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]:          "Pending",
  [ORDER_STATUS.PREPARING]:        "Preparing",
  [ORDER_STATUS.READY_FOR_PICKUP]: "Ready for Pickup",
  [ORDER_STATUS.OUT_FOR_DELIVERY]: "Out for Delivery",
  [ORDER_STATUS.DELIVERED]:        "Delivered",
  [ORDER_STATUS.CANCELLED]:        "Cancelled",
};

// ─── User Roles ───────────────────────────────────────────────────────────────
export const ROLES = {
  STAFF: "staff",
  RIDER: "rider",
};

// ─── Vehicle types for rider onboarding ──────────────────────────────────────
export const VEHICLE_TYPES = [
  { value: "motorbike", label: "Motorbike" },
  { value: "bicycle",   label: "Bicycle"   },
  { value: "van",       label: "Van"        },
  { value: "on_foot",   label: "On Foot"    },
];
