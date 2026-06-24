/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind v4: content must include all app source files
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // ── Stella's Kitchen Mobile Palette ───────────────────────────────
        // Matches web app exactly for brand cohesion
        brand: {
          red:    "#EF4444",  // Primary CTA / active status
          dark:   "#1C1917",  // Premium near-black wrapper / headers
          stone:  "#292524",  // Card surfaces on dark backgrounds
          warm:   "#44403C",  // Muted text, borders on dark
          cream:  "#FDFBF7",  // Off-white page backgrounds
          white:  "#FFFFFF",
        },
        // Status colours — mapped to order lifecycle
        status: {
          pending:    "#F59E0B",  // Amber  — waiting
          preparing:  "#3B82F6",  // Blue   — kitchen active
          ready:      "#8B5CF6",  // Purple — ready for pickup
          delivery:   "#F97316",  // Orange — out for delivery
          delivered:  "#22C55E",  // Green  — completed
          cancelled:  "#EF4444",  // Red    — cancelled
        },
      },
      fontFamily: {
        sans:    ["System"],
        display: ["System"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
    },
  },
  plugins: [],
};
