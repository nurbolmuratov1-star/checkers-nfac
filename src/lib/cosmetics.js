import { getUserStorageKey } from "./userStorage.js"

const COSMETICS_NAMESPACE = "cosmetics"

export const cosmeticTypes = {
  theme: "theme",
  background: "background",
  pieceStyle: "pieceStyle",
}

export const boardThemes = [
  {
    id: "classic",
    type: cosmeticTypes.theme,
    name: "Classic Board",
    rarity: "Starter",
    price: 0,
    tagline: "Warm wood, clean contrast, timeless table play.",
    preview: {
      light: "#ead9bd",
      dark: "#8a5632",
      glow: "#d4a13a",
      pieceLight: "#fff8e7",
      pieceDark: "#12100e",
    },
    vars: {
      "--board-light": "#ead9bd",
      "--board-dark": "#8a5632",
      "--board-dark-accent": "rgba(77, 38, 18, 0.24)",
      "--board-frame": "rgba(8, 13, 23, 0.78)",
      "--piece-light-bg":
        "radial-gradient(circle at 35% 28%, rgba(255, 255, 255, 0.95), transparent 24%), linear-gradient(180deg, #fff8e7, #d9c7a7 72%, #9f8b6b)",
      "--piece-light-color": "#8f8068",
      "--piece-light-border": "rgba(80, 61, 41, 0.4)",
      "--piece-dark-bg":
        "radial-gradient(circle at 35% 28%, rgba(255, 255, 255, 0.2), transparent 23%), linear-gradient(180deg, #2d2924, #12100e 72%, #050403)",
      "--piece-dark-color": "#d7c8ab",
      "--piece-dark-border": "rgba(234, 217, 189, 0.5)",
      "--piece-extra-shadow": "0 12px 16px rgba(0, 0, 0, 0.28)",
    },
  },
  {
    id: "neon-arena",
    type: cosmeticTypes.theme,
    name: "Neon Arena",
    rarity: "Epic",
    price: 420,
    tagline: "Electric cyan lanes and luminous tournament pieces.",
    preview: {
      light: "#102a43",
      dark: "#031a2f",
      glow: "#22d3ee",
      pieceLight: "#5eead4",
      pieceDark: "#7c3aed",
    },
    vars: {
      "--board-light": "#102a43",
      "--board-dark": "#031a2f",
      "--board-dark-accent": "rgba(34, 211, 238, 0.18)",
      "--board-frame": "rgba(4, 12, 28, 0.9)",
      "--piece-light-bg":
        "radial-gradient(circle at 32% 24%, rgba(255, 255, 255, 0.9), transparent 21%), linear-gradient(180deg, #67e8f9, #2dd4bf 70%, #0f766e)",
      "--piece-light-color": "#ecfeff",
      "--piece-light-border": "rgba(94, 234, 212, 0.72)",
      "--piece-dark-bg":
        "radial-gradient(circle at 34% 24%, rgba(255, 255, 255, 0.28), transparent 21%), linear-gradient(180deg, #8b5cf6, #312e81 72%, #0f1029)",
      "--piece-dark-color": "#ddd6fe",
      "--piece-dark-border": "rgba(167, 139, 250, 0.68)",
      "--piece-extra-shadow": "0 0 0 2px rgba(34, 211, 238, 0.28), 0 0 28px rgba(34, 211, 238, 0.28)",
    },
  },
  {
    id: "frozen-ice",
    type: cosmeticTypes.theme,
    name: "Frozen Ice",
    rarity: "Rare",
    price: 360,
    tagline: "Frosted glass squares and crystalline pieces.",
    preview: {
      light: "#dff7ff",
      dark: "#2f6f8f",
      glow: "#bae6fd",
      pieceLight: "#f8fafc",
      pieceDark: "#155e75",
    },
    vars: {
      "--board-light": "#dff7ff",
      "--board-dark": "#2f6f8f",
      "--board-dark-accent": "rgba(186, 230, 253, 0.24)",
      "--board-frame": "rgba(8, 30, 48, 0.82)",
      "--piece-light-bg":
        "radial-gradient(circle at 30% 24%, #ffffff, transparent 22%), linear-gradient(180deg, #f8fafc, #bae6fd 72%, #7dd3fc)",
      "--piece-light-color": "#0e7490",
      "--piece-light-border": "rgba(186, 230, 253, 0.88)",
      "--piece-dark-bg":
        "radial-gradient(circle at 34% 24%, rgba(255, 255, 255, 0.34), transparent 22%), linear-gradient(180deg, #0e7490, #164e63 74%, #082f49)",
      "--piece-dark-color": "#cffafe",
      "--piece-dark-border": "rgba(125, 211, 252, 0.72)",
      "--piece-extra-shadow": "0 0 22px rgba(186, 230, 253, 0.24), 0 14px 18px rgba(8, 47, 73, 0.34)",
    },
  },
  {
    id: "deep-forest",
    type: cosmeticTypes.theme,
    name: "Deep Forest",
    rarity: "Rare",
    price: 300,
    tagline: "Mossed stone board with emerald-glass tension.",
    preview: {
      light: "#b9c8a3",
      dark: "#16382d",
      glow: "#5eead4",
      pieceLight: "#e9f5d0",
      pieceDark: "#0f241d",
    },
    vars: {
      "--board-light": "#b9c8a3",
      "--board-dark": "#16382d",
      "--board-dark-accent": "rgba(45, 212, 191, 0.12)",
      "--board-frame": "rgba(7, 24, 20, 0.9)",
      "--piece-light-bg":
        "radial-gradient(circle at 35% 26%, rgba(255, 255, 255, 0.76), transparent 22%), linear-gradient(180deg, #ecfccb, #a3e635 70%, #4d7c0f)",
      "--piece-light-color": "#365314",
      "--piece-light-border": "rgba(190, 242, 100, 0.58)",
      "--piece-dark-bg":
        "radial-gradient(circle at 34% 24%, rgba(255, 255, 255, 0.18), transparent 22%), linear-gradient(180deg, #1f3f33, #0f241d 74%, #06130f)",
      "--piece-dark-color": "#bbf7d0",
      "--piece-dark-border": "rgba(45, 212, 191, 0.4)",
      "--piece-extra-shadow": "0 16px 20px rgba(4, 18, 14, 0.38)",
    },
  },
  {
    id: "marble-hall",
    type: cosmeticTypes.theme,
    name: "Marble Hall",
    rarity: "Epic",
    price: 460,
    tagline: "Polished stone, quiet luxury, museum-grade moves.",
    preview: {
      light: "#eee7da",
      dark: "#6b7280",
      glow: "#d6d3d1",
      pieceLight: "#ffffff",
      pieceDark: "#1f2937",
    },
    vars: {
      "--board-light": "#eee7da",
      "--board-dark": "#6b7280",
      "--board-dark-accent": "rgba(255, 255, 255, 0.14)",
      "--board-frame": "rgba(31, 41, 55, 0.86)",
      "--piece-light-bg":
        "radial-gradient(circle at 30% 24%, #ffffff, transparent 22%), linear-gradient(145deg, #ffffff, #d6d3d1 58%, #a8a29e)",
      "--piece-light-color": "#78716c",
      "--piece-light-border": "rgba(231, 229, 228, 0.9)",
      "--piece-dark-bg":
        "radial-gradient(circle at 35% 24%, rgba(255, 255, 255, 0.28), transparent 22%), linear-gradient(145deg, #475569, #111827 76%, #020617)",
      "--piece-dark-color": "#cbd5e1",
      "--piece-dark-border": "rgba(203, 213, 225, 0.56)",
      "--piece-extra-shadow": "0 16px 22px rgba(15, 23, 42, 0.34)",
    },
  },
  {
    id: "cyber-grid",
    type: cosmeticTypes.theme,
    name: "Cyber Grid",
    rarity: "Legendary",
    price: 640,
    tagline: "Circuit-board diagonals with holographic chip pieces.",
    preview: {
      light: "#111c3a",
      dark: "#020617",
      glow: "#38bdf8",
      pieceLight: "#22d3ee",
      pieceDark: "#f472b6",
    },
    vars: {
      "--board-light": "#111c3a",
      "--board-dark": "#020617",
      "--board-dark-accent": "rgba(56, 189, 248, 0.28)",
      "--board-frame": "rgba(2, 6, 23, 0.94)",
      "--piece-light-bg":
        "radial-gradient(circle at 32% 24%, rgba(255, 255, 255, 0.9), transparent 20%), linear-gradient(180deg, #22d3ee, #2563eb 72%, #172554)",
      "--piece-light-color": "#cffafe",
      "--piece-light-border": "rgba(34, 211, 238, 0.78)",
      "--piece-dark-bg":
        "radial-gradient(circle at 34% 24%, rgba(255, 255, 255, 0.22), transparent 20%), linear-gradient(180deg, #f472b6, #7e22ce 72%, #1e1b4b)",
      "--piece-dark-color": "#fce7f3",
      "--piece-dark-border": "rgba(244, 114, 182, 0.72)",
      "--piece-extra-shadow": "0 0 0 2px rgba(56, 189, 248, 0.22), 0 0 34px rgba(244, 114, 182, 0.22)",
    },
  },
  {
    id: "royal-gold",
    type: cosmeticTypes.theme,
    name: "Royal Gold",
    rarity: "Legendary",
    price: 720,
    tagline: "Black lacquer and ceremonial gold for ruthless wins.",
    preview: {
      light: "#f7e3a1",
      dark: "#2a1a35",
      glow: "#facc15",
      pieceLight: "#facc15",
      pieceDark: "#111827",
    },
    vars: {
      "--board-light": "#f7e3a1",
      "--board-dark": "#2a1a35",
      "--board-dark-accent": "rgba(250, 204, 21, 0.2)",
      "--board-frame": "rgba(19, 12, 29, 0.9)",
      "--piece-light-bg":
        "radial-gradient(circle at 32% 24%, #fff7ad, transparent 22%), linear-gradient(180deg, #fde68a, #facc15 70%, #a16207)",
      "--piece-light-color": "#713f12",
      "--piece-light-border": "rgba(250, 204, 21, 0.76)",
      "--piece-dark-bg":
        "radial-gradient(circle at 34% 24%, rgba(250, 204, 21, 0.28), transparent 22%), linear-gradient(180deg, #374151, #111827 76%, #020617)",
      "--piece-dark-color": "#fef3c7",
      "--piece-dark-border": "rgba(250, 204, 21, 0.48)",
      "--piece-extra-shadow": "0 0 28px rgba(250, 204, 21, 0.28), 0 16px 20px rgba(0, 0, 0, 0.32)",
    },
  },
  {
    id: "crimson-night",
    type: cosmeticTypes.theme,
    name: "Crimson Night",
    rarity: "Mythic",
    price: 860,
    tagline: "Velvet dark board with red-glass pressure.",
    preview: {
      light: "#3b1d2d",
      dark: "#0b0f1c",
      glow: "#fb7185",
      pieceLight: "#fecdd3",
      pieceDark: "#7f1d1d",
    },
    vars: {
      "--board-light": "#3b1d2d",
      "--board-dark": "#0b0f1c",
      "--board-dark-accent": "rgba(251, 113, 133, 0.2)",
      "--board-frame": "rgba(10, 12, 22, 0.94)",
      "--piece-light-bg":
        "radial-gradient(circle at 32% 24%, rgba(255, 255, 255, 0.76), transparent 22%), linear-gradient(180deg, #fecdd3, #fb7185 70%, #9f1239)",
      "--piece-light-color": "#fff1f2",
      "--piece-light-border": "rgba(251, 113, 133, 0.72)",
      "--piece-dark-bg":
        "radial-gradient(circle at 34% 24%, rgba(255, 255, 255, 0.16), transparent 22%), linear-gradient(180deg, #7f1d1d, #220b13 76%, #050509)",
      "--piece-dark-color": "#fecdd3",
      "--piece-dark-border": "rgba(248, 113, 113, 0.44)",
      "--piece-extra-shadow": "0 0 30px rgba(251, 113, 133, 0.26), 0 18px 22px rgba(0, 0, 0, 0.36)",
    },
  },
]

export const gameplayBackgrounds = [
  {
    id: "dark-blue-arena",
    type: cosmeticTypes.background,
    name: "Dark Blue Arena",
    rarity: "Starter",
    price: 0,
    tagline: "The default premium navy arena.",
    preview: ["#0f172a", "#38bdf8", "#020617"],
    vars: {
      "--game-bg":
        "radial-gradient(circle at 50% 18%, rgba(95, 124, 255, 0.16), transparent 34%), radial-gradient(circle at 18% 72%, rgba(69, 214, 197, 0.1), transparent 30%), radial-gradient(circle at 88% 78%, rgba(245, 189, 91, 0.055), transparent 28%), linear-gradient(180deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.98)), #08111f",
      "--game-before-bg":
        "linear-gradient(120deg, transparent 0 40%, rgba(126, 143, 189, 0.055) 50%, transparent 60%), radial-gradient(circle at 50% 50%, transparent 0 45%, rgba(2, 6, 23, 0.64) 82%)",
      "--game-after-bg": "rgba(95, 124, 255, 0.1)",
      "--arena-accent": "#38bdf8",
      "--arena-glow": "rgba(56, 189, 248, 0.16)",
      "--arena-particles":
        "radial-gradient(circle at 18% 22%, rgba(125, 211, 252, 0.2) 0 1px, transparent 2px), radial-gradient(circle at 76% 18%, rgba(96, 165, 250, 0.16) 0 1px, transparent 2px)",
      "--arena-lines":
        "linear-gradient(120deg, transparent 0 42%, rgba(125, 211, 252, 0.1) 48%, transparent 56%)",
    },
  },
  {
    id: "cyberpunk-city",
    type: cosmeticTypes.background,
    name: "Cyberpunk City Glow",
    rarity: "Epic",
    price: 380,
    tagline: "Distant city lights under a rainy electric skyline.",
    preview: ["#020617", "#f472b6", "#22d3ee"],
    vars: {
      "--game-bg":
        "radial-gradient(circle at 16% 20%, rgba(244, 114, 182, 0.2), transparent 28%), radial-gradient(circle at 76% 22%, rgba(34, 211, 238, 0.18), transparent 30%), linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.98)), #020617",
      "--game-before-bg":
        "linear-gradient(90deg, rgba(244, 114, 182, 0.08) 0 1px, transparent 1px 100%), linear-gradient(0deg, rgba(34, 211, 238, 0.06) 0 1px, transparent 1px 100%), radial-gradient(circle at 50% 50%, transparent 0 44%, rgba(2, 6, 23, 0.68) 82%)",
      "--game-after-bg": "rgba(244, 114, 182, 0.13)",
      "--arena-accent": "#f472b6",
      "--arena-glow": "rgba(244, 114, 182, 0.2)",
      "--arena-particles":
        "radial-gradient(circle at 14% 26%, rgba(244, 114, 182, 0.24) 0 2px, transparent 3px), radial-gradient(circle at 82% 24%, rgba(34, 211, 238, 0.22) 0 1px, transparent 2px), radial-gradient(circle at 68% 82%, rgba(244, 114, 182, 0.16) 0 1px, transparent 2px)",
      "--arena-lines":
        "linear-gradient(90deg, transparent 0 12%, rgba(244, 114, 182, 0.12) 13%, transparent 14% 54%, rgba(34, 211, 238, 0.1) 55%, transparent 56%)",
    },
  },
  {
    id: "space-atmosphere",
    type: cosmeticTypes.background,
    name: "Space Atmosphere",
    rarity: "Rare",
    price: 320,
    tagline: "Quiet orbital glow and deep starfield contrast.",
    preview: ["#020617", "#818cf8", "#22d3ee"],
    vars: {
      "--game-bg":
        "radial-gradient(circle at 48% 12%, rgba(129, 140, 248, 0.22), transparent 28%), radial-gradient(circle at 82% 74%, rgba(34, 211, 238, 0.12), transparent 25%), radial-gradient(circle at 18% 68%, rgba(255, 255, 255, 0.07), transparent 2px), linear-gradient(180deg, #020617, #070b18 54%, #020617)",
      "--game-before-bg":
        "radial-gradient(circle at 22% 28%, rgba(255,255,255,0.16) 0 1px, transparent 2px), radial-gradient(circle at 72% 18%, rgba(255,255,255,0.12) 0 1px, transparent 2px), radial-gradient(circle at 50% 50%, transparent 0 45%, rgba(2, 6, 23, 0.64) 82%)",
      "--game-after-bg": "rgba(129, 140, 248, 0.12)",
      "--arena-accent": "#818cf8",
      "--arena-glow": "rgba(129, 140, 248, 0.2)",
      "--arena-particles":
        "radial-gradient(circle at 12% 20%, rgba(255, 255, 255, 0.58) 0 1px, transparent 2px), radial-gradient(circle at 28% 72%, rgba(186, 230, 253, 0.5) 0 1px, transparent 2px), radial-gradient(circle at 78% 18%, rgba(255, 255, 255, 0.46) 0 1px, transparent 2px), radial-gradient(circle at 88% 70%, rgba(129, 140, 248, 0.44) 0 2px, transparent 3px), radial-gradient(circle at 52% 8%, rgba(34, 211, 238, 0.32) 0 1px, transparent 2px)",
      "--arena-lines":
        "linear-gradient(135deg, transparent 0 38%, rgba(129, 140, 248, 0.11) 48%, transparent 58%)",
    },
  },
  {
    id: "abstract-neon",
    type: cosmeticTypes.background,
    name: "Abstract Neon Gradients",
    rarity: "Epic",
    price: 420,
    tagline: "Soft gradient ribbons with tournament readability.",
    preview: ["#111827", "#2dd4bf", "#a78bfa"],
    vars: {
      "--game-bg":
        "radial-gradient(circle at 20% 18%, rgba(45, 212, 191, 0.18), transparent 30%), radial-gradient(circle at 84% 26%, rgba(167, 139, 250, 0.18), transparent 30%), radial-gradient(circle at 54% 86%, rgba(56, 189, 248, 0.12), transparent 30%), linear-gradient(180deg, #0f172a, #020617)",
      "--game-before-bg":
        "linear-gradient(135deg, transparent 0 35%, rgba(94, 234, 212, 0.045) 48%, transparent 62%), radial-gradient(circle at 50% 50%, transparent 0 42%, rgba(2, 6, 23, 0.62) 80%)",
      "--game-after-bg": "rgba(45, 212, 191, 0.1)",
      "--arena-accent": "#2dd4bf",
      "--arena-glow": "rgba(45, 212, 191, 0.18)",
      "--arena-particles":
        "radial-gradient(circle at 20% 18%, rgba(45, 212, 191, 0.22) 0 2px, transparent 3px), radial-gradient(circle at 82% 28%, rgba(167, 139, 250, 0.2) 0 2px, transparent 3px), radial-gradient(circle at 58% 84%, rgba(56, 189, 248, 0.18) 0 1px, transparent 2px)",
      "--arena-lines":
        "linear-gradient(120deg, transparent 0 30%, rgba(45, 212, 191, 0.12) 42%, transparent 54% 70%, rgba(167, 139, 250, 0.1) 78%, transparent 88%)",
    },
  },
  {
    id: "ancient-marble",
    type: cosmeticTypes.background,
    name: "Ancient Marble Hall",
    rarity: "Rare",
    price: 340,
    tagline: "Cool stone columns and subtle golden edge light.",
    preview: ["#1f2937", "#e7e5e4", "#facc15"],
    vars: {
      "--game-bg":
        "radial-gradient(circle at 50% 8%, rgba(231, 229, 228, 0.14), transparent 30%), radial-gradient(circle at 88% 78%, rgba(250, 204, 21, 0.08), transparent 28%), linear-gradient(180deg, #1f2937, #0f172a 58%, #020617)",
      "--game-before-bg":
        "linear-gradient(90deg, transparent 0 16%, rgba(231, 229, 228, 0.05) 17% 18%, transparent 19% 81%, rgba(231, 229, 228, 0.05) 82% 83%, transparent 84%), radial-gradient(circle at 50% 50%, transparent 0 45%, rgba(2, 6, 23, 0.62) 82%)",
      "--game-after-bg": "rgba(250, 204, 21, 0.08)",
      "--arena-accent": "#e7e5e4",
      "--arena-glow": "rgba(231, 229, 228, 0.16)",
      "--arena-particles":
        "radial-gradient(circle at 16% 22%, rgba(231, 229, 228, 0.18) 0 1px, transparent 2px), radial-gradient(circle at 82% 20%, rgba(250, 204, 21, 0.14) 0 1px, transparent 2px)",
      "--arena-lines":
        "linear-gradient(90deg, transparent 0 18%, rgba(231, 229, 228, 0.08) 19%, transparent 20% 80%, rgba(231, 229, 228, 0.08) 81%, transparent 82%)",
    },
  },
  {
    id: "forest-ambiance",
    type: cosmeticTypes.background,
    name: "Forest Ambiance",
    rarity: "Rare",
    price: 300,
    tagline: "Dark canopy light behind the board, never in the way.",
    preview: ["#052e24", "#2dd4bf", "#84cc16"],
    vars: {
      "--game-bg":
        "radial-gradient(circle at 24% 18%, rgba(132, 204, 22, 0.12), transparent 28%), radial-gradient(circle at 72% 76%, rgba(45, 212, 191, 0.12), transparent 28%), linear-gradient(180deg, #052e24, #0f172a 62%, #020617)",
      "--game-before-bg":
        "linear-gradient(120deg, rgba(132, 204, 22, 0.04), transparent 38%), radial-gradient(circle at 50% 50%, transparent 0 45%, rgba(2, 6, 23, 0.64) 82%)",
      "--game-after-bg": "rgba(45, 212, 191, 0.1)",
      "--arena-accent": "#2dd4bf",
      "--arena-glow": "rgba(45, 212, 191, 0.18)",
      "--arena-particles":
        "radial-gradient(circle at 18% 28%, rgba(132, 204, 22, 0.2) 0 2px, transparent 3px), radial-gradient(circle at 80% 22%, rgba(45, 212, 191, 0.18) 0 1px, transparent 2px), radial-gradient(circle at 70% 78%, rgba(190, 242, 100, 0.14) 0 2px, transparent 3px)",
      "--arena-lines":
        "linear-gradient(125deg, rgba(132, 204, 22, 0.08), transparent 34%), linear-gradient(55deg, transparent 0 58%, rgba(45, 212, 191, 0.08) 68%, transparent 78%)",
    },
  },
]

export const pieceStyles = [
  {
    id: "classic",
    type: cosmeticTypes.pieceStyle,
    name: "Classic Pieces",
    rarity: "Starter",
    price: 0,
    tagline: "The original white versus black tournament set.",
    preview: { light: "#fff8e7", dark: "#12100e", glow: "#d4a13a" },
    vars: {},
  },
  {
    id: "neon-glass",
    type: cosmeticTypes.pieceStyle,
    name: "Neon Glass",
    rarity: "Epic",
    price: 360,
    tagline: "Transparent glow with polished cyan edges.",
    preview: { light: "#67e8f9", dark: "#7c3aed", glow: "#22d3ee" },
    vars: {
      "--piece-light-bg":
        "radial-gradient(circle at 30% 22%, rgba(255, 255, 255, 0.95), transparent 20%), linear-gradient(180deg, rgba(103, 232, 249, 0.96), rgba(45, 212, 191, 0.72))",
      "--piece-light-color": "#ecfeff",
      "--piece-light-border": "rgba(165, 243, 252, 0.88)",
      "--piece-dark-bg":
        "radial-gradient(circle at 34% 22%, rgba(255, 255, 255, 0.28), transparent 20%), linear-gradient(180deg, rgba(139, 92, 246, 0.96), rgba(49, 46, 129, 0.9))",
      "--piece-dark-color": "#ede9fe",
      "--piece-dark-border": "rgba(196, 181, 253, 0.72)",
      "--piece-extra-shadow": "0 0 0 2px rgba(34, 211, 238, 0.22), 0 0 34px rgba(34, 211, 238, 0.26)",
    },
  },
  {
    id: "brushed-metal",
    type: cosmeticTypes.pieceStyle,
    name: "Brushed Metal",
    rarity: "Rare",
    price: 280,
    tagline: "Silver and graphite pieces with clean metallic depth.",
    preview: { light: "#e5e7eb", dark: "#334155", glow: "#94a3b8" },
    vars: {
      "--piece-light-bg":
        "radial-gradient(circle at 30% 22%, #ffffff, transparent 20%), linear-gradient(145deg, #f8fafc, #cbd5e1 52%, #64748b)",
      "--piece-light-color": "#475569",
      "--piece-light-border": "rgba(226, 232, 240, 0.72)",
      "--piece-dark-bg":
        "radial-gradient(circle at 34% 22%, rgba(255, 255, 255, 0.26), transparent 20%), linear-gradient(145deg, #64748b, #1e293b 68%, #020617)",
      "--piece-dark-color": "#cbd5e1",
      "--piece-dark-border": "rgba(148, 163, 184, 0.62)",
      "--piece-extra-shadow": "0 16px 22px rgba(15, 23, 42, 0.38)",
    },
  },
  {
    id: "royal-gems",
    type: cosmeticTypes.pieceStyle,
    name: "Royal Gems",
    rarity: "Legendary",
    price: 520,
    tagline: "Gold and sapphire pieces made for highlight wins.",
    preview: { light: "#facc15", dark: "#1d4ed8", glow: "#fbbf24" },
    vars: {
      "--piece-light-bg":
        "radial-gradient(circle at 30% 22%, #fef3c7, transparent 21%), linear-gradient(180deg, #fde68a, #f59e0b 72%, #92400e)",
      "--piece-light-color": "#713f12",
      "--piece-light-border": "rgba(251, 191, 36, 0.76)",
      "--piece-dark-bg":
        "radial-gradient(circle at 34% 22%, rgba(191, 219, 254, 0.68), transparent 21%), linear-gradient(180deg, #60a5fa, #1d4ed8 72%, #172554)",
      "--piece-dark-color": "#dbeafe",
      "--piece-dark-border": "rgba(96, 165, 250, 0.76)",
      "--piece-extra-shadow": "0 0 28px rgba(251, 191, 36, 0.22), 0 0 28px rgba(96, 165, 250, 0.18)",
    },
  },
]

export function getDefaultCosmeticInventory() {
  return {
    ownedThemes: ["classic"],
    ownedBackgrounds: ["dark-blue-arena"],
    ownedPieceStyles: ["classic"],
    equippedTheme: "classic",
    equippedBackground: "dark-blue-arena",
    equippedPieceStyle: "classic",
    spentCoins: 0,
    purchasedItems: [],
  }
}

export function loadCosmeticInventory(user) {
  try {
    if (!user) {
      return getDefaultCosmeticInventory()
    }

    const saved = localStorage.getItem(getCosmeticsStorageKey(user))
    return normalizeCosmeticInventory(saved ? JSON.parse(saved) : null)
  } catch {
    return getDefaultCosmeticInventory()
  }
}

export function saveCosmeticInventory(user, inventory) {
  const normalizedInventory = normalizeCosmeticInventory(inventory)

  if (user) {
    localStorage.setItem(getCosmeticsStorageKey(user), JSON.stringify(normalizedInventory))
  }

  return normalizedInventory
}

export function getCosmeticCollections() {
  return [
    {
      type: cosmeticTypes.theme,
      title: "Board Themes",
      description: "Full board kits that change square colors, pieces, and table mood.",
      items: boardThemes,
    },
    {
      type: cosmeticTypes.background,
      title: "Gameplay Backgrounds",
      description: "Cinematic arenas behind the board. Subtle enough for ranked focus.",
      items: gameplayBackgrounds,
    },
    {
      type: cosmeticTypes.pieceStyle,
      title: "Piece Styles",
      description: "Independent checker materials for glow, metal, glass, and royal looks.",
      items: pieceStyles,
    },
  ]
}

export function getInventoryItems(inventory) {
  const normalizedInventory = normalizeCosmeticInventory(inventory)

  return getCosmeticCollections().flatMap((collection) =>
    collection.items
      .filter((item) => isCosmeticOwned(normalizedInventory, collection.type, item.id))
      .map((item) => ({
        ...item,
        collectionTitle: collection.title,
        isEquipped: isCosmeticEquipped(normalizedInventory, collection.type, item.id),
      })),
  )
}

export function purchaseCosmeticItem(inventory, type, itemId, availableCoins) {
  const normalizedInventory = normalizeCosmeticInventory(inventory)
  const item = getCosmeticItem(type, itemId)

  if (!item) {
    return { inventory: normalizedInventory, status: "missing" }
  }

  if (isCosmeticOwned(normalizedInventory, type, itemId)) {
    return { inventory: normalizedInventory, status: "owned" }
  }

  if (availableCoins < item.price) {
    return { inventory: normalizedInventory, status: "locked" }
  }

  const nextInventory = addOwnedCosmetic(
    {
      ...normalizedInventory,
      spentCoins: normalizedInventory.spentCoins + item.price,
      purchasedItems: [
        ...normalizedInventory.purchasedItems,
        {
          id: item.id,
          type,
          price: item.price,
          purchasedAt: new Date().toISOString(),
        },
      ],
    },
    type,
    item.id,
  )

  return {
    inventory: equipCosmeticItem(nextInventory, type, item.id).inventory,
    status: "purchased",
  }
}

export function equipCosmeticItem(inventory, type, itemId) {
  const normalizedInventory = normalizeCosmeticInventory(inventory)

  if (!isCosmeticOwned(normalizedInventory, type, itemId)) {
    return { inventory: normalizedInventory, status: "locked" }
  }

  const nextInventory = {
    ...normalizedInventory,
    [getEquippedKey(type)]: itemId,
  }

  return { inventory: normalizeCosmeticInventory(nextInventory), status: "equipped" }
}

export function getEquippedCosmetics(inventory) {
  const normalizedInventory = normalizeCosmeticInventory(inventory)

  return {
    theme: getCosmeticItem(cosmeticTypes.theme, normalizedInventory.equippedTheme) ?? boardThemes[0],
    background:
      getCosmeticItem(cosmeticTypes.background, normalizedInventory.equippedBackground) ??
      gameplayBackgrounds[0],
    pieceStyle:
      getCosmeticItem(cosmeticTypes.pieceStyle, normalizedInventory.equippedPieceStyle) ?? pieceStyles[0],
  }
}

export function getGameplayCosmeticStyle(inventory) {
  const { theme, background, pieceStyle } = getEquippedCosmetics(inventory)

  return {
    ...theme.vars,
    ...background.vars,
    ...pieceStyle.vars,
  }
}

export function isCosmeticOwned(inventory, type, itemId) {
  return new Set(inventory[getOwnedKey(type)] ?? []).has(itemId)
}

export function isCosmeticEquipped(inventory, type, itemId) {
  return inventory[getEquippedKey(type)] === itemId
}

function normalizeCosmeticInventory(inventory) {
  const defaults = getDefaultCosmeticInventory()
  const ownedThemes = uniqueValidIds([...(inventory?.ownedThemes ?? []), "classic"], boardThemes)
  const ownedBackgrounds = uniqueValidIds(
    [...(inventory?.ownedBackgrounds ?? []), "dark-blue-arena"],
    gameplayBackgrounds,
  )
  const ownedPieceStyles = uniqueValidIds([...(inventory?.ownedPieceStyles ?? []), "classic"], pieceStyles)
  const equippedTheme = ownedThemes.includes(inventory?.equippedTheme)
    ? inventory.equippedTheme
    : defaults.equippedTheme
  const equippedBackground = ownedBackgrounds.includes(inventory?.equippedBackground)
    ? inventory.equippedBackground
    : defaults.equippedBackground
  const equippedPieceStyle = ownedPieceStyles.includes(inventory?.equippedPieceStyle)
    ? inventory.equippedPieceStyle
    : defaults.equippedPieceStyle

  return {
    ownedThemes,
    ownedBackgrounds,
    ownedPieceStyles,
    equippedTheme,
    equippedBackground,
    equippedPieceStyle,
    spentCoins: Math.max(0, Number(inventory?.spentCoins) || 0),
    purchasedItems: Array.isArray(inventory?.purchasedItems) ? inventory.purchasedItems : [],
  }
}

function addOwnedCosmetic(inventory, type, itemId) {
  const ownedKey = getOwnedKey(type)

  return {
    ...inventory,
    [ownedKey]: [...new Set([...(inventory[ownedKey] ?? []), itemId])],
  }
}

function getCosmeticItem(type, itemId) {
  return getCatalog(type).find((item) => item.id === itemId)
}

function getCatalog(type) {
  if (type === cosmeticTypes.theme) return boardThemes
  if (type === cosmeticTypes.background) return gameplayBackgrounds
  if (type === cosmeticTypes.pieceStyle) return pieceStyles
  return []
}

function getOwnedKey(type) {
  if (type === cosmeticTypes.theme) return "ownedThemes"
  if (type === cosmeticTypes.background) return "ownedBackgrounds"
  return "ownedPieceStyles"
}

function getEquippedKey(type) {
  if (type === cosmeticTypes.theme) return "equippedTheme"
  if (type === cosmeticTypes.background) return "equippedBackground"
  return "equippedPieceStyle"
}

function uniqueValidIds(ids, catalog) {
  const validIds = new Set(catalog.map((item) => item.id))

  return [...new Set(ids)].filter((id) => validIds.has(id))
}

function getCosmeticsStorageKey(user) {
  return getUserStorageKey(user, COSMETICS_NAMESPACE)
}
