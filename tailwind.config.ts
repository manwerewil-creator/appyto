import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1280px" } },
    extend: {
      fontFamily: {
        sans:  ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono:  ["var(--font-mono)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--sb-border))",
        input: "hsl(var(--sb-input))",
        ring: "hsl(var(--sb-ring))",
        background: "hsl(var(--sb-background))",
        foreground: "hsl(var(--sb-foreground))",
        primary: { DEFAULT: "hsl(var(--sb-primary))", foreground: "hsl(var(--sb-primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--sb-secondary))", foreground: "hsl(var(--sb-secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--sb-destructive))", foreground: "hsl(var(--sb-destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--sb-muted))", foreground: "hsl(var(--sb-muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--sb-accent))", foreground: "hsl(var(--sb-accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--sb-popover))", foreground: "hsl(var(--sb-popover-foreground))" },
        card: { DEFAULT: "hsl(var(--sb-card))", foreground: "hsl(var(--sb-card-foreground))" },
        success: { DEFAULT: "hsl(var(--sb-success))", foreground: "hsl(var(--sb-success-foreground))" },

        /* VisionBridge (internships) palette — additive, namespaced names so it
           never collides with the shadcn tokens above. VB's original `accent`
           and `muted` were renamed to `grass`/`dim` to avoid the clash. */
        ink: "#0B0D10",
        paper: "#F7F8FA",
        surface: "#FFFFFF",
        dim: "#5B6573",
        faint: "#8A93A1",
        line: "#E7E9EE",
        danger: "#D64545",
        brand: { DEFAULT: "#0B5CAB", 600: "#094C8E", 700: "#073A6E", 50: "#EAF2FB" },
        grass: { DEFAULT: "#0E9F6E", 600: "#0B8459", 50: "#E7F7F0" },
      },
      letterSpacing: { tightest: "-0.03em" },
      boxShadow: {
        soft: "0 1px 2px rgba(11,13,16,.04), 0 6px 16px -8px rgba(11,13,16,.10)",
        lift: "0 12px 36px -12px rgba(11,13,16,.16)",
        inset: "inset 0 1px 0 rgba(255,255,255,.6)",
      },
      transitionTimingFunction: { spring: "cubic-bezier(0.22,1,0.36,1)" },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "none" } },
        rise: { "0%": { opacity: "0", transform: "translateY(14px)" }, "100%": { opacity: "1", transform: "none" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        rise: "rise .6s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
