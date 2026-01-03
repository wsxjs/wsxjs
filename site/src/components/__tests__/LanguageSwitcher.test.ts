/**
 * LanguageSwitcher 组件测试
 * 验证语言切换时按钮标签立即更新的修复
 */

import { describe, test, expect, beforeEach, afterEach } from "vitest";

describe("LanguageSwitcher - 语言切换立即更新修复", () => {
    let component: HTMLElement;

    beforeEach(() => {
        // 清理 DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }

        // 创建组件
        component = document.createElement("language-switcher");
        document.body.appendChild(component);
    });

    afterEach(() => {
        component.remove();
    });

    test("选择新语言后，按钮标签应该立即更新", async () => {
        // 等待组件渲染
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 获取 shadow root
        const shadowRoot = component.shadowRoot;
        expect(shadowRoot).not.toBeNull();

        // 获取按钮
        const button = shadowRoot!.querySelector(".language-switcher-btn");
        expect(button).not.toBeNull();

        // 获取初始语言文本
        const textSpan = button!.querySelector(".language-switcher-text");
        expect(textSpan).not.toBeNull();
        const initialText = textSpan!.textContent;

        // 点击按钮打开下拉菜单
        (button as HTMLButtonElement).click();
        await new Promise((resolve) => setTimeout(resolve, 50));

        // 验证下拉菜单已打开
        const dropdown = shadowRoot!.querySelector(".language-switcher-dropdown");
        expect(dropdown).not.toBeNull();

        // 选择不同的语言（假设初始是 English，选择中文）
        const options = dropdown!.querySelectorAll(".language-switcher-option");
        expect(options.length).toBeGreaterThan(1);

        // 找到中文选项（第二个选项）
        const zhOption = Array.from(options).find(
            (opt) => opt.querySelector(".language-code")?.textContent === "ZH"
        );
        expect(zhOption).not.toBeNull();

        // 点击中文选项
        (zhOption as HTMLButtonElement).click();

        // 关键验证：语言文本应该立即更新，不需要等待异步 i18next.changeLanguage
        await new Promise((resolve) => setTimeout(resolve, 10));
        const updatedText = textSpan!.textContent;
        expect(updatedText).not.toBe(initialText);
        expect(updatedText).toBe("中文");

        // 验证下拉菜单已关闭
        const dropdownAfter = shadowRoot!.querySelector(".language-switcher-dropdown");
        expect(dropdownAfter).toBeNull();
    });

    test("render 方法应该使用响应式状态 currentLanguage 而不是 i18nInstance.language", async () => {
        // 等待组件渲染
        await new Promise((resolve) => setTimeout(resolve, 100));

        const shadowRoot = component.shadowRoot;
        const button = shadowRoot!.querySelector(".language-switcher-btn");
        const textSpan = button!.querySelector(".language-switcher-text");

        // 验证初始状态
        expect(textSpan!.textContent).toBe("English");

        // 模拟状态更新（通过内部 API）
        // 注意：这是测试内部实现，生产代码不应该直接访问
        const componentInstance = component as any;
        componentInstance.currentLanguage = "zh";
        componentInstance.rerender();

        await new Promise((resolve) => setTimeout(resolve, 50));

        // 验证文本已更新
        expect(textSpan!.textContent).toBe("中文");
    });
});
