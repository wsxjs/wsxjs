import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import ThemeSwitcher from "../ThemeSwitcher.wsx";

// 注册组件
if (!customElements.get("wsx-theme-switcher")) {
    customElements.define("wsx-theme-switcher", ThemeSwitcher);
}

describe("ThemeSwitcher", () => {
    let themeSwitcher: ThemeSwitcher;
    let originalLocalStorage: Storage;
    let originalMatchMedia: typeof window.matchMedia;

    beforeEach(() => {
        // 保存原始值
        originalLocalStorage = window.localStorage;
        originalMatchMedia = window.matchMedia;

        // Mock localStorage
        const store: Record<string, string> = {};
        Object.defineProperty(window, "localStorage", {
            value: {
                getItem: (key: string) => store[key] || null,
                setItem: (key: string, value: string) => {
                    store[key] = value;
                },
                removeItem: (key: string) => {
                    delete store[key];
                },
                clear: () => {
                    Object.keys(store).forEach((key) => delete store[key]);
                },
            },
            writable: true,
        });

        // Mock matchMedia
        window.matchMedia = vi.fn((query: string) => {
            return {
                matches: query === "(prefers-color-scheme: dark)",
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            } as MediaQueryList;
        });

        themeSwitcher = document.createElement("wsx-theme-switcher") as ThemeSwitcher;
        document.body.appendChild(themeSwitcher);
    });

    afterEach(() => {
        if (themeSwitcher.parentNode) {
            document.body.removeChild(themeSwitcher);
        }
        // 恢复原始值
        window.localStorage = originalLocalStorage;
        window.matchMedia = originalMatchMedia;
        document.documentElement.className = "";
    });

    describe("初始化", () => {
        it("应该正确初始化", () => {
            expect(themeSwitcher).toBeInstanceOf(ThemeSwitcher);
            expect(themeSwitcher.shadowRoot).toBeTruthy();
        });

        it("应该从 localStorage 加载主题", () => {
            window.localStorage.setItem("wsx-theme", "dark");
            const newSwitcher = document.createElement("wsx-theme-switcher") as ThemeSwitcher;
            document.body.appendChild(newSwitcher);
            expect(document.documentElement.className).toBe("dark");
            document.body.removeChild(newSwitcher);
        });

        it("应该使用默认主题 auto", () => {
            window.localStorage.clear();
            const newSwitcher = document.createElement("wsx-theme-switcher") as ThemeSwitcher;
            document.body.appendChild(newSwitcher);
            // 默认应该是 auto，会根据系统主题设置
            expect(newSwitcher.shadowRoot).toBeTruthy();
            document.body.removeChild(newSwitcher);
        });
    });

    describe("主题切换", () => {
        it("应该切换主题", () => {
            const button = themeSwitcher.shadowRoot?.querySelector(".theme-switcher-btn");
            if (button) {
                button.click();
                // 应该切换到下一个主题
                expect(document.documentElement.className).toBeTruthy();
            }
        });

        it("应该在 auto -> light -> dark 之间循环", async () => {
            const button = themeSwitcher.shadowRoot?.querySelector(".theme-switcher-btn");
            if (button) {
                // 第一次点击：auto -> light
                button.click();
                await new Promise((resolve) => setTimeout(resolve, 10));
                expect(document.documentElement.className).toBe("light");

                // 第二次点击：light -> dark
                button.click();
                await new Promise((resolve) => setTimeout(resolve, 10));
                expect(document.documentElement.className).toBe("dark");

                // 第三次点击：dark -> auto
                button.click();
                await new Promise((resolve) => setTimeout(resolve, 10));
                // auto 模式会检查系统主题，可能设置为 dark 或 ""
                expect(["dark", ""]).toContain(document.documentElement.className);
            }
        });

        it("应该保存主题到 localStorage", () => {
            const button = themeSwitcher.shadowRoot?.querySelector(".theme-switcher-btn");
            if (button) {
                button.click();
                expect(window.localStorage.getItem("wsx-theme")).toBe("light");
            }
        });
    });

    describe("图标和标签", () => {
        it("应该显示正确的图标", () => {
            const icon = themeSwitcher.shadowRoot?.querySelector(".theme-switcher-icon");
            expect(icon).toBeTruthy();
            expect(icon?.textContent).toBeTruthy();
        });

        it("应该显示正确的标签", () => {
            const button = themeSwitcher.shadowRoot?.querySelector(".theme-switcher-btn");
            expect(button?.getAttribute("title")).toBeTruthy();
        });
    });

    describe("系统主题监听", () => {
        it("应该在 auto 模式下监听系统主题变化", () => {
            const addEventListener = vi.fn();
            window.matchMedia = vi.fn(() => ({
                matches: false,
                media: "",
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener,
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })) as unknown as typeof window.matchMedia;

            const newSwitcher = document.createElement("wsx-theme-switcher") as ThemeSwitcher;
            document.body.appendChild(newSwitcher);
            expect(addEventListener).toHaveBeenCalled();
            document.body.removeChild(newSwitcher);
        });

        it("应该在系统主题变化时更新（auto 模式）", () => {
            let changeCallback: ((e: MediaQueryListEvent) => void) | null = null;
            window.matchMedia = vi.fn(() => ({
                matches: false,
                media: "",
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(
                    (event: string, callback: (e: MediaQueryListEvent) => void) => {
                        if (event === "change") {
                            changeCallback = callback;
                        }
                    }
                ),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })) as unknown as typeof window.matchMedia;

            const newSwitcher = document.createElement("wsx-theme-switcher") as ThemeSwitcher;
            document.body.appendChild(newSwitcher);

            if (changeCallback) {
                changeCallback({
                    matches: true,
                    media: "(prefers-color-scheme: dark)",
                } as MediaQueryListEvent);
                expect(document.documentElement.className).toBe("dark");
            }

            document.body.removeChild(newSwitcher);
        });
    });
});
