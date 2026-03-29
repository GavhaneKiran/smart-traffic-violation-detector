/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep cyber-noir palette
        night: {
          950: "#030712",
          900: "#0a0f1e",
          800: "#0f172a",
          700: "#1e293b",
        },
        amber: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
        danger: "#ef4444",
        success: "#22c55e",
        warning: "#f59e0b",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        display: ["'Bebas Neue'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
      },
      animation: {
        "pulse-amber": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in": "slideIn 0.3s ease-out",
        "fade-up": "fadeUp 0.4s ease-out",
        scan: "scan 3s linear infinite",
      },
      keyframes: {
        slideIn: {
          "0%": { transform: "translateX(-100%)", opacity: 0 },
          "100%": { transform: "translateX(0)", opacity: 1 },
        },
        fadeUp: {
          "0%": { transform: "translateY(20px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
      },
    },
  },
  plugins: [],
};
