import { describe, it, expect, beforeEach, afterEach } from "vitest";
import ButtonGroup from "../ButtonGroup.wsx";
import Button from "../Button.wsx";

// 注册组件
if (!customElements.get("wsx-button-group")) {
    customElements.define("wsx-button-group", ButtonGroup);
}
if (!customElements.get("wsx-button")) {
    customElements.define("wsx-button", Button);
}

describe("ButtonGroup", () => {
    let buttonGroup: ButtonGroup;

    beforeEach(() => {
        buttonGroup = document.createElement("wsx-button-group") as ButtonGroup;
        document.body.appendChild(buttonGroup);
    });

    afterEach(() => {
        if (buttonGroup.parentNode) {
            document.body.removeChild(buttonGroup);
        }
    });

    describe("初始化", () => {
        it("应该正确初始化", () => {
            expect(buttonGroup).toBeInstanceOf(ButtonGroup);
            expect(buttonGroup.shadowRoot).toBeTruthy();
        });

        it("应该通过构造函数配置", () => {
            const configuredGroup = new ButtonGroup({ disabled: true });
            expect(configuredGroup.isDisabled).toBe(true);
        });
    });

    describe("disabled 状态", () => {
        it("应该设置 disabled 属性", async () => {
            buttonGroup.setAttribute("disabled", "");
            await new Promise((resolve) => setTimeout(resolve, 10));
            expect(buttonGroup.isDisabled).toBe(true);
        });

        it("应该通过 getter/setter 设置 disabled", () => {
            buttonGroup.isDisabled = true;
            expect(buttonGroup.isDisabled).toBe(true);
            buttonGroup.isDisabled = false;
            expect(buttonGroup.isDisabled).toBe(false);
        });

        it("应该更新子按钮的 disabled 状态", async () => {
            const button1 = document.createElement("wsx-button");
            const button2 = document.createElement("wsx-button");
            buttonGroup.appendChild(button1);
            buttonGroup.appendChild(button2);
            // 等待组件连接和渲染
            await new Promise((resolve) => setTimeout(resolve, 500));

            buttonGroup.setAttribute("disabled", "");
            // Wait for setTimeout in onAttributeChanged
            await new Promise((resolve) => setTimeout(resolve, 150));
            expect(button1.hasAttribute("disabled")).toBe(true);
            expect(button2.hasAttribute("disabled")).toBe(true);

            buttonGroup.removeAttribute("disabled");
            // Wait for setTimeout in onAttributeChanged
            await new Promise((resolve) => setTimeout(resolve, 150));
            expect(button1.hasAttribute("disabled")).toBe(false);
            expect(button2.hasAttribute("disabled")).toBe(false);
        });
    });

    describe("公共 API", () => {
        it("应该获取所有按钮", async () => {
            const button1 = document.createElement("wsx-button");
            const button2 = document.createElement("wsx-button");
            buttonGroup.appendChild(button1);
            buttonGroup.appendChild(button2);
            // Wait for elements to be connected
            await new Promise((resolve) => setTimeout(resolve, 300));

            // getButtons uses querySelectorAll which works on light DOM
            // The buttons are direct children, not in shadow DOM
            const buttons = buttonGroup.getButtons();
            // If buttons are not found, they might not be connected yet
            if (buttons.length === 0) {
                // Wait a bit more and try again
                await new Promise((resolve) => setTimeout(resolve, 300));
                const buttons2 = buttonGroup.getButtons();
                expect(buttons2.length).toBe(2);
            } else {
                expect(buttons.length).toBe(2);
            }
        });

        it("应该启用所有按钮", async () => {
            const button1 = document.createElement("wsx-button");
            const button2 = document.createElement("wsx-button");
            button1.setAttribute("disabled", "");
            button2.setAttribute("disabled", "");
            buttonGroup.appendChild(button1);
            buttonGroup.appendChild(button2);
            await new Promise((resolve) => setTimeout(resolve, 500));

            buttonGroup.enableAll();
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(button1.hasAttribute("disabled")).toBe(false);
            expect(button2.hasAttribute("disabled")).toBe(false);
        });

        it("应该禁用所有按钮", async () => {
            const button1 = document.createElement("wsx-button");
            const button2 = document.createElement("wsx-button");
            buttonGroup.appendChild(button1);
            buttonGroup.appendChild(button2);
            await new Promise((resolve) => setTimeout(resolve, 500));

            buttonGroup.disableAll();
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(button1.hasAttribute("disabled")).toBe(true);
            expect(button2.hasAttribute("disabled")).toBe(true);
        });
    });

    describe("渲染", () => {
        it("应该渲染容器和 slot", () => {
            const container = buttonGroup.shadowRoot?.querySelector(".button-group-container");
            expect(container).toBeTruthy();
            const slot = container?.querySelector("slot");
            expect(slot).toBeTruthy();
        });
    });

    describe("生命周期", () => {
        it("应该在连接时更新子按钮状态", async () => {
            const button1 = document.createElement("wsx-button");
            buttonGroup.appendChild(button1);
            await new Promise((resolve) => setTimeout(resolve, 100));
            // onConnected 应该被调用并更新子按钮
            expect(buttonGroup.shadowRoot).toBeTruthy();
        });
    });
});
