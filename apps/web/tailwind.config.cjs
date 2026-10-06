/** @type {import('tailwindcss').Config} */

// Minimalist B&W redesign: every chromatic Tailwind hue resolves to the same
// grayscale ramp so legacy color classes (amber-200, cyan-300, ...) render
// as shades of gray without touching each component.
const grayscale = {
  50: "#f7f7f7",
  100: "#f2f2f2",
  200: "#c9c9c9",
  300: "#c9c9c9",
  400: "#9a9a9a",
  500: "#9a9a9a",
  600: "#6a6a6a",
  700: "#3a3a3a",
  800: "#1a1a1a",
  900: "#121212",
  950: "#0a0a0a",
};

const chromaticHues = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];

const grayscaleHues = Object.fromEntries(chromaticHues.map((hue) => [hue, grayscale]));

module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        ...grayscaleHues,
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
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "0",
        md: "0",
        sm: "0",
      },
    },
  },
  plugins: [],
};
