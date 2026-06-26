import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./design-system/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        md: "2rem",
        xl: "3rem",
      },
      screens: {
        xl: "1280px",
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        /* ---- Shadcn compatibility (HSL vars) ---- */
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        /* ---- Design System Semantic Tokens ---- */
        surface: "var(--surface)",
        "surface-muted": "var(--surface-muted)",
        "surface-subtle": "var(--surface-subtle)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "text-inverse": "var(--text-inverse)",
        "border-default": "var(--border-default)",
        "border-strong": "var(--border-strong)",
        "border-focus": "var(--border-focus)",
        brand: "var(--brand)",
        "brand-hover": "var(--brand-hover)",
        "brand-active": "var(--brand-active)",
        "brand-soft": "var(--brand-soft)",
        success: "var(--success)",
        "success-bg": "var(--success-bg)",
        warning: "var(--warning)",
        "warning-bg": "var(--warning-bg)",
        danger: "var(--danger)",
        "danger-bg": "var(--danger-bg)",
        info: "var(--info)",
        "info-bg": "var(--info-bg)",

        /* ---- Primitive stone scale (design-system internal use only) ---- */
        stone: {
          50: "var(--color-stone50)",
          100: "var(--color-stone100)",
          200: "var(--color-stone200)",
          300: "var(--color-stone300)",
          400: "var(--color-stone400)",
          500: "var(--color-stone500)",
          600: "var(--color-stone600)",
          700: "var(--color-stone700)",
          800: "var(--color-stone800)",
          900: "var(--color-stone900)",
        },
        oak: {
          50: "var(--color-oak50)",
          100: "var(--color-oak100)",
          200: "var(--color-oak200)",
          300: "var(--color-oak300)",
          400: "var(--color-oak400)",
          500: "var(--color-oak500)",
          600: "var(--color-oak600)",
          700: "var(--color-oak700)",
        },
      },

      fontFamily: {
        display: ["var(--font-display)", '"Playfair Display"', '"Noto Serif SC"', "Georgia", "serif"],
        sans: ["var(--font-sans)", "Manrope", '"Noto Sans SC"', "system-ui", "sans-serif"],
      },

      fontSize: {
        xs: ["12px", { lineHeight: "1.5" }],
        sm: ["14px", { lineHeight: "1.5" }],
        base: ["16px", { lineHeight: "1.5" }],
        lg: ["18px", { lineHeight: "1.4" }],
        xl: ["20px", { lineHeight: "1.4" }],
        "2xl": ["24px", { lineHeight: "1.3" }],
        "3xl": ["32px", { lineHeight: "1.2" }],
        "4xl": ["40px", { lineHeight: "1.15" }],
        "5xl": ["56px", { lineHeight: "1.1" }],
      },

      borderRadius: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        full: "9999px",
        DEFAULT: "var(--radius)",
      },

      boxShadow: {
        none: "none",
        xs: "0 1px 2px rgba(36, 32, 29, 0.04)",
        sm: "0 4px 12px rgba(36, 32, 29, 0.06)",
        md: "0 12px 30px rgba(36, 32, 29, 0.10)",
      },

      spacing: {
        "header-desktop": "var(--header-height-desktop)",
        "header-mobile": "var(--header-height-mobile)",
        "cart-drawer": "var(--cart-drawer-width)",
      },

      maxWidth: {
        container: "var(--container-max-width)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
