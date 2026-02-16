/**
 * LanguageSwitcher 组件测试（使用 base 的 wsx-language-switcher，基于 wsx-dropdown）
 * 验证语言切换时按钮标签立即更新（RFC-0042）
 */

import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { LanguageSwitcher } from "@wsxjs/wsx-base-components";
import { i18nInstance } from "@wsxjs/wsx-i18next";

if (!customElements.get("wsx-language-switcher")) {
    customElements.define("wsx-language-switcher", LanguageSwitcher);
}

/** 从 wsx-language-switcher 的 shadow 内取 wsx-dropdown 的触发按钮 */
function getDropdownButton(el: HTMLElement): HTMLButtonElement | null {
    const dropdown = el.shadowRoot?.querySelector("wsx-dropdown");
    return (dropdown?.shadowRoot?.querySelector(".dropdown-button") as HTMLButtonElement) ?? null;
}

/** 从 wsx-dropdown 内取当前显示文本 */
function getDisplayText(el: HTMLElement): string | null {
    const dropdown = el.shadowRoot?.querySelector("wsx-dropdown");
    const text = dropdown?.shadowRoot?.querySelector(".dropdown-text");
    return text?.textContent ?? null;
}

/** 从 wsx-dropdown 内取选项列表 */
function getDropdownOptions(el: HTMLElement): Element[] {
    const dropdown = el.shadowRoot?.querySelector("wsx-dropdown");
    const menu = dropdown?.shadowRoot?.querySelector(".dropdown-menu");
    return menu ? Array.from(menu.querySelectorAll(".dropdown-option")) : [];
}

describe("LanguageSwitcher - 语言切换立即更新修复", () => {
    let component: HTMLElement;

    beforeEach(async () => {
        if (!i18nInstance.isInitialized) {
            await i18nInstance.init({
                lng: "en",
                resources: {
                    en: { translation: {} },
                    zh: { translation: {} },
                },
            });
        }
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        component = document.createElement("wsx-language-switcher");
        document.body.appendChild(component);
        if (component.connectedCallback) component.connectedCallback();
        await new Promise((r) => setTimeout(r, 100));
    });

    afterEach(() => {
        component.remove();
        i18nInstance.changeLanguage("en");
    });

    test("选择新语言后，按钮标签应该立即更新", async () => {
        await new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 50)))
        );

        const button = getDropdownButton(component);
        expect(button).toBeTruthy();
        if (!button) return;

        const initialText = getDisplayText(component);
        expect(initialText).toBeTruthy();

        button.click();
        await new Promise((r) => setTimeout(r, 50));

        const options = getDropdownOptions(component);
        expect(options.length).toBeGreaterThan(1);

        const zhOption = options.find((opt) => opt.textContent?.trim() === "中文");
        expect(zhOption).not.toBeNull();
        (zhOption as HTMLButtonElement).click();

        await new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 100)))
        );

        const updatedText = getDisplayText(component);
        expect(updatedText).not.toBe(initialText);
        expect(updatedText).toBe("中文");
    });

    test("render 使用响应式 currentLanguage，状态更新后显示正确", async () => {
        await new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 50)))
        );

        expect(getDisplayText(component)).toBe("English");

        const instance = component as unknown as { currentLanguage: string; rerender: () => void };
        instance.currentLanguage = "zh";
        instance.rerender();

        await new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 100)))
        );

        expect(getDisplayText(component)).toBe("中文");
    });
});
