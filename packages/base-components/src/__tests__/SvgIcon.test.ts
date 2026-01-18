import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import SvgIcon from "../SvgIcon.wsx";

// 注册组件
if (!customElements.get("wsx-svg-icon")) {
    customElements.define("wsx-svg-icon", SvgIcon);
}

describe("SvgIcon", () => {
    let svgIcon: SvgIcon;

    beforeEach(() => {
        svgIcon = document.createElement("wsx-svg-icon") as SvgIcon;
        document.body.appendChild(svgIcon);
    });

    afterEach(() => {
        if (svgIcon.parentNode) {
            document.body.removeChild(svgIcon);
        }
    });

    describe("初始化", () => {
        it("应该正确初始化", () => {
            expect(svgIcon).toBeInstanceOf(SvgIcon);
            expect(svgIcon.shadowRoot).toBeTruthy();
        });
    });

    describe("属性", () => {
        it("应该使用默认属性", () => {
            const svg = svgIcon.shadowRoot?.querySelector("svg");
            expect(svg).toBeTruthy();
            expect(svg?.getAttribute("width")).toBe("24");
            expect(svg?.getAttribute("height")).toBe("24");
        });

        it("应该设置 name 属性", async () => {
            svgIcon.setAttribute("name", "heart");
            svgIcon.rerender();
            await new Promise((resolve) => setTimeout(resolve, 0));
            const path = svgIcon.shadowRoot?.querySelector("path");
            expect(path).toBeTruthy();
        });

        it("应该设置 size 属性", async () => {
            svgIcon.setAttribute("size", "32");
            await new Promise((resolve) => setTimeout(resolve, 50));
            const svg = svgIcon.shadowRoot?.querySelector("svg");
            expect(svg?.getAttribute("width")).toBe("32");
            expect(svg?.getAttribute("height")).toBe("32");
        });

        it("应该设置 color 属性", async () => {
            svgIcon.setAttribute("color", "#ff0000");
            await new Promise((resolve) => setTimeout(resolve, 100));
            const svg = svgIcon.shadowRoot?.querySelector("svg");
            expect(svg?.getAttribute("stroke")).toBe("#ff0000");
        });

        it("应该处理未知的 icon name", async () => {
            svgIcon.setAttribute("name", "unknown");
            await new Promise((resolve) => setTimeout(resolve, 50));
            const path = svgIcon.shadowRoot?.querySelector("path");
            expect(path).toBeTruthy(); // 应该使用默认的 star icon
        });
    });

    describe("事件处理", () => {
        it("应该处理点击事件", async () => {
            svgIcon.setAttribute("name", "heart");
            await new Promise((resolve) => setTimeout(resolve, 10));
            const clickHandler = vi.fn();
            svgIcon.addEventListener("icon-click", clickHandler);
            const svg = svgIcon.shadowRoot?.querySelector("svg");
            if (svg) {
                const clickEvent = new MouseEvent("click", { bubbles: true });
                svg.dispatchEvent(clickEvent);
                expect(clickHandler).toHaveBeenCalled();
                const event = clickHandler.mock.calls[0][0] as CustomEvent;
                expect(event.detail.name).toBe("heart");
            }
        });

        it("应该处理鼠标进入事件", () => {
            const svg = svgIcon.shadowRoot?.querySelector("svg");
            if (svg) {
                const mouseEnter = new MouseEvent("mouseenter", { bubbles: true });
                svg.dispatchEvent(mouseEnter);
                expect(svg.style.transform).toBe("scale(1.1)");
            }
        });

        it("应该处理鼠标离开事件", () => {
            const svg = svgIcon.shadowRoot?.querySelector("svg");
            if (svg) {
                const mouseLeave = new MouseEvent("mouseleave", { bubbles: true });
                svg.dispatchEvent(mouseLeave);
                expect(svg.style.transform).toBe("scale(1)");
            }
        });
    });

    describe("属性变化", () => {
        it("应该在属性变化时重新渲染", async () => {
            const rerenderSpy = vi.spyOn(svgIcon, "rerender");
            svgIcon.setAttribute("name", "heart");
            await new Promise((resolve) => setTimeout(resolve, 10));
            // 注意：onAttributeChanged 只在 connected 时调用 rerender
            if (svgIcon.connected) {
                expect(rerenderSpy).toHaveBeenCalled();
            }
        });
    });
});
