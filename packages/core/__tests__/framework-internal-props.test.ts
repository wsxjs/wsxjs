/**
 * Test for framework internal props filtering (RFC 0037)
 *
 * Verifies that framework internal props (key, __wsxPositionId, __wsxIndex, __testId)
 * are not rendered to DOM elements, following JSX conventions.
 */

import { h } from "../src/jsx-factory";
import { WebComponent } from "../src/web-component";
import { isFrameworkInternalProp } from "../src/utils/props-utils";

class InternalPropsTestComponent extends WebComponent {
    render() {
        return h("div", {
            key: "test-key",
            __wsxPositionId: "pos-123",
            __wsxIndex: 0,
            __testId: "test-element",
            id: "actual-id",
            className: "test-class",
        });
    }
}

customElements.define("internal-props-test-component", InternalPropsTestComponent);

describe("Framework Internal Props Filtering", () => {
    test("isFrameworkInternalProp 应该正确识别框架内部属性", () => {
        expect(isFrameworkInternalProp("key")).toBe(true);
        expect(isFrameworkInternalProp("__wsxPositionId")).toBe(true);
        expect(isFrameworkInternalProp("__wsxIndex")).toBe(true);
        expect(isFrameworkInternalProp("__testId")).toBe(true);
        expect(isFrameworkInternalProp("ref")).toBe(true);

        // 普通属性不应该被识别为内部属性
        expect(isFrameworkInternalProp("id")).toBe(false);
        expect(isFrameworkInternalProp("className")).toBe(false);
        expect(isFrameworkInternalProp("class")).toBe(false);
        expect(isFrameworkInternalProp("style")).toBe(false);
        expect(isFrameworkInternalProp("onClick")).toBe(false);
    });

    test("框架内部属性不应该被渲染到 DOM 元素", async () => {
        const component = new InternalPropsTestComponent();
        document.body.appendChild(component);

        // 等待渲染完成
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        const div = component.shadowRoot!.querySelector("div");

        // 验证框架内部属性不存在于 DOM
        expect(div).not.toHaveAttribute("key");
        expect(div).not.toHaveAttribute("__wsxPositionId");
        expect(div).not.toHaveAttribute("__wsxIndex");
        expect(div).not.toHaveAttribute("__testId");

        // 验证普通属性正确渲染
        expect(div).toHaveAttribute("id", "actual-id");
        expect(div).toHaveClass("test-class");

        // 验证属性对象中也不存在这些属性
        const attributes = Array.from(div!.attributes).map((attr) => attr.name);
        expect(attributes).not.toContain("key");
        expect(attributes).not.toContain("__wsxPositionId");
        expect(attributes).not.toContain("__wsxIndex");
        expect(attributes).not.toContain("__testId");
        expect(attributes).toContain("id");
        expect(attributes).toContain("class");

        component.remove();
    });

    test("直接调用 h() 时，框架内部属性不应该被渲染", () => {
        const element = h("div", {
            key: "direct-key",
            __wsxPositionId: "direct-pos",
            __wsxIndex: 1,
            __testId: "direct-test",
            id: "direct-id",
        });

        // 验证框架内部属性不存在于 DOM
        expect(element).not.toHaveAttribute("key");
        expect(element).not.toHaveAttribute("__wsxPositionId");
        expect(element).not.toHaveAttribute("__wsxIndex");
        expect(element).not.toHaveAttribute("__testId");

        // 验证普通属性正确渲染
        expect(element).toHaveAttribute("id", "direct-id");

        // 验证属性对象中也不存在这些属性
        const attributes = Array.from(element.attributes).map((attr) => attr.name);
        expect(attributes).not.toContain("key");
        expect(attributes).not.toContain("__wsxPositionId");
        expect(attributes).not.toContain("__wsxIndex");
        expect(attributes).not.toContain("__testId");
        expect(attributes).toContain("id");
    });

    test("更新 props 时，框架内部属性不应该被添加或移除", async () => {
        const component = new InternalPropsTestComponent();
        document.body.appendChild(component);

        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        const div = component.shadowRoot!.querySelector("div");

        // 初始状态：框架内部属性不应该存在
        expect(div).not.toHaveAttribute("key");
        expect(div).not.toHaveAttribute("__wsxPositionId");

        // 触发重新渲染（改变其他属性）
        component.rerender();

        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        const updatedDiv = component.shadowRoot!.querySelector("div");

        // 重新渲染后，框架内部属性仍然不应该存在
        expect(updatedDiv).not.toHaveAttribute("key");
        expect(updatedDiv).not.toHaveAttribute("__wsxPositionId");
        expect(updatedDiv).not.toHaveAttribute("__wsxIndex");
        expect(updatedDiv).not.toHaveAttribute("__testId");

        component.remove();
    });
});
