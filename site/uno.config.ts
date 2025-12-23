import { defineConfig, presetUno, presetAttributify } from "unocss";

export default defineConfig({
    presets: [presetUno(), presetAttributify()],
    theme: {
        colors: {
            orange: {
                50: "#fff7ed",
                100: "#ffedd5",
                200: "#fed7aa",
                300: "#fdba74",
                400: "#fb923c",
                500: "#ff6b35", // 主色调
                600: "#ea580c",
                700: "#c2410c",
                800: "#9a3412",
                900: "#7c2d12",
            },
        },
    },
    shortcuts: {
        // 按钮样式
        "btn-primary":
            "bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300",
        "btn-secondary":
            "bg-white/10 border border-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300",
        "btn-ghost":
            "bg-transparent border border-white/30 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300",

        // 卡片样式
        card: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg",
        "card-hover": "hover:shadow-xl transition-all duration-300",

        // 文本样式
        "text-primary": "text-gray-900 dark:text-white",
        "text-secondary": "text-gray-600 dark:text-gray-300",
        "text-muted": "text-gray-500 dark:text-gray-400",

        // 布局样式
        container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
        section: "py-16 sm:py-24",

        // Hero区域
        "hero-gradient": "bg-gradient-to-br from-orange-500 to-orange-600",

        // 特性卡片
        "feature-card": "card card-hover p-8 text-center",
        "feature-icon": "text-5xl mb-6 text-orange-500",
        "feature-title": "text-2xl font-bold text-primary mb-4",
        "feature-desc": "text-secondary leading-relaxed",

        // 代码块
        "code-block": "bg-gray-900 dark:bg-black rounded-xl overflow-hidden shadow-2xl",
        "code-header":
            "bg-gray-800 dark:bg-gray-900 px-4 py-3 border-b border-gray-700 flex justify-between items-center",
        "code-content": "p-6 text-gray-100 font-mono text-sm leading-relaxed overflow-x-auto",

        // 示例卡片
        "example-card": "card p-6",
        "example-title": "text-xl font-semibold text-primary mb-2",
        "example-desc": "text-secondary mb-4",
        "example-demo":
            "border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 min-h-32 flex items-center justify-center",
    },
});
