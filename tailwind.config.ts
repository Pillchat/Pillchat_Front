import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      sm: "640px",
      md: "744px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          "600": "hsl(var(--primary-600))",
          "800": "hsl(var(--primary-800))",
          "900": "hsl(var(--primary-900))",
          "980": "hsl(var(--primary-980))",
          foreground: "hsl(var(--primary-foreground))",
        },
        gray: {
          "100": "hsl(var(--gray-100))",
          "300": "hsl(var(--gray-300))",
          "500": "hsl(var(--gray-500))",
          "800": "hsl(var(--gray-800))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        brand: {
          DEFAULT: "hsl(var(--brand))",
          foreground: "hsl(var(--brand-foreground))",
        },
        brandSecondary: {
          DEFAULT: "hsl(var(--brand-secondary))",
          foreground: "hsl(var(--brand-secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        button: {
          foreground: "hsl(var(--button-foreground))",
        },
        teritary: "hsl(var(--teritary))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        sans: ["var(--font-pretendard)"],
      },
      maxWidth: {
        app: "52.125rem",
      },
      fontSize: {
        "headline-large": ["1.5rem", { lineHeight: "2rem", fontWeight: "700" }],
        "headline-medium": [
          "1.25rem",
          { lineHeight: "1.75rem", fontWeight: "700" },
        ],
        "headline-small": [
          "1.125rem",
          { lineHeight: "1.625rem", fontWeight: "600" },
        ],
        "title-large": ["1rem", { lineHeight: "1.5rem", fontWeight: "600" }],
        "title-medium": [
          "0.9375rem",
          { lineHeight: "1.375rem", fontWeight: "500" },
        ],
        "title-small": [
          "0.875rem",
          { lineHeight: "1.25rem", fontWeight: "500" },
        ],
        "body-large": ["1rem", { lineHeight: "1.5rem", fontWeight: "400" }],
        "body-medium": [
          "0.875rem",
          { lineHeight: "1.25rem", fontWeight: "400" },
        ],
        "body-small": [
          "0.75rem",
          { lineHeight: "1.125rem", fontWeight: "400" },
        ],
        "label-large": ["1rem", { lineHeight: "1.5rem", fontWeight: "600" }],
        "label-medium": ["0.75rem", { lineHeight: "1rem", fontWeight: "500" }],
        "label-small": ["0.6875rem", { lineHeight: "1rem", fontWeight: "400" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "study-celebration-ring": {
          "0%": {
            transform: "translate(-50%, -50%) scale(0.2)",
            opacity: "0.7",
          },
          "100%": {
            transform: "translate(-50%, -50%) scale(3.5)",
            opacity: "0",
          },
        },
        "study-particle-burst": {
          "0%": {
            transform: "translate(-50%, -50%) scale(0.45) rotate(0deg)",
            opacity: "0.95",
          },
          "72%": {
            opacity: "1",
          },
          "100%": {
            transform:
              "translate(calc(-50% + var(--particle-x)), calc(-50% + var(--particle-y))) scale(1) rotate(var(--particle-rotate))",
            opacity: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "study-celebration-ring":
          "study-celebration-ring 520ms ease-out forwards",
        "study-particle-burst":
          "study-particle-burst 720ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
