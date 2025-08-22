// /** @type {import('tailwindcss').Config} */
// export default {
//   content: ["./index.html", "./src/**/*.{ts,tsx}"],
//   theme: {
//     extend: {
//       colors: {
//         brand: {
//           50: "#eef2ff",
//           100: "#e0e7ff",
//           500: "#6366f1",
//           600: "#4f46e5",
//           700: "#4338ca",
//         },
//         accent: {
//           50: "#fff7ed",
//           100: "#ffedd5",
//           500: "#f97316",
//           600: "#ea580c",
//           700: "#c2410c",
//         },
//         slate: { 25: "#f9fafb", 50: "#f8fafc", 100: "#f1f5f9" },
//       },
//       boxShadow: {
//         card: "0 4px 16px rgba(0,0,0,0.06)",
//       },
//       borderRadius: {
//         xl2: "1rem",
//       },
//     },
//   },
//   plugins: [],
// };

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 600: "#2563eb", 700: "#1d4ed8" }, // single accent (blue)
      },
      boxShadow: { card: "0 2px 10px rgba(0,0,0,0.06)" },
      borderRadius: { xl2: "1rem" },
    },
  },
  plugins: [],
};
