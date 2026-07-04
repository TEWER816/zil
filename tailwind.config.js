/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        // ============ 主题表面色 ============
        // 深色主题：中性深灰
        dark: {
          bg: "#1A1A1F",
          surface: "#242429",
          border: "#34343C",
          muted: "#B8B8C2",
        },
        // 浅色主题：奶油米白
        light: {
          bg: "#F7FAF7",
          surface: "#FFFFFF",
          border: "#D9E6E0",
          muted: "#6B7B75",
          text: "#4A5A52",
        },
        // ============ 品牌色板（扁平命名，确保 @apply 兼容） ============
        // 主色：薄荷青（CSS 变量驱动，支持运行时自定义 + 透明度修饰符）
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        primaryLight: 'rgb(var(--color-primary-light) / <alpha-value>)',
        primaryDark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
        // 次色：奶油黄（强调、完成态、亮点提示）
        secondary: "#FFC857",
        secondaryLight: "#FFD980",
        secondaryDark: "#E6B03E",
        // 三色：雾蓝（信息、数据、辅助标识）
        tertiary: "#7BA8C9",
        tertiaryLight: "#A0C5DD",
        // 四色：珊瑚粉（温暖点缀、心率等）
        coral: "#FF9FB2",
        coralLight: "#FFC2D0",
        // 危险色：超时、错误、删除
        danger: "#EF4444",
        dangerLight: "#F87171",
      },
      fontFamily: {
        display: ["Quicksand", "Noto Sans SC", "sans-serif"],
        sans: ["Noto Sans SC", "Quicksand", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "shimmer": "shimmer 2.5s linear infinite",
        "float-slow": "floatSlow 6s ease-in-out infinite",
        "wiggle": "wiggle 2.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        scaleIn: { "0%": { transform: "scale(0.9)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(10px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        pulseSoft: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.7" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        floatSlow: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        wiggle: { "0%, 100%": { transform: "rotate(-3deg)" }, "50%": { transform: "rotate(3deg)" } },
      },
      boxShadow: {
        glow: "0 0 20px rgba(93, 204, 197, 0.3)",
        glowSecondary: "0 0 20px rgba(255, 200, 87, 0.3)",
        "glow-lg": "0 0 40px rgba(93, 204, 197, 0.4), 0 0 80px rgba(93, 204, 197, 0.15)",
        "inner-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.5)",
        "soft": "0 8px 24px rgba(93, 204, 197, 0.12)",
      },
    },
  },
  plugins: [],
};
