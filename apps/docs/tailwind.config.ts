import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}", "./pages/*.tsx"],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
