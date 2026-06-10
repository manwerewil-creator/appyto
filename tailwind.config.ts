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
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
