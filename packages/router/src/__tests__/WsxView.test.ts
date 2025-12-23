import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Import to register the component
import "../WsxView.wsx";
// Import type for proper typing
import type WsxView from "../WsxView.wsx";

// Type for accessing protected methods in tests
interface WsxViewWithProtectedMethods extends WsxView {
    onAttributeChanged(name: string, oldValue: string, newValue: string): void;
}

describe("WsxView", () => {
    let view: WsxView;

    beforeEach(() => {
        // Create view instance using custom element
        view = document.createElement("wsx-view") as WsxView;
        document.body.appendChild(view);
    });

    afterEach(() => {
        document.body.removeChild(view);
        vi.clearAllMocks();
    });

    it("should create view instance", () => {
        expect(view.tagName.toLowerCase()).toBe("wsx-view");
        expect(view).toBeInstanceOf(HTMLElement);
    });

    it("should have shadow DOM", () => {
        expect(view.shadowRoot).toBeTruthy();
    });

    it("should update component attribute", () => {
        view.setAttribute("component", "home-page");
        view.connectedCallback();
        // Manually trigger attribute change since setAttribute doesn't automatically trigger it in tests
        (view as WsxViewWithProtectedMethods).onAttributeChanged("component", "", "home-page");

        expect(view.getAttribute("component")).toBe("home-page");
    });

    it("should update route attribute", () => {
        view.setAttribute("route", "/users");
        view.connectedCallback();
        // Manually trigger attribute change since setAttribute doesn't automatically trigger it in tests
        (view as WsxViewWithProtectedMethods).onAttributeChanged("route", "", "/users");

        expect(view.getAttribute("route")).toBe("/users");
    });

    it("should handle params attribute", () => {
        const params = JSON.stringify({ id: "123", name: "test" });
        view.setAttribute("params", params);
        view.connectedCallback();
        // Manually trigger attribute change since setAttribute doesn't automatically trigger it in tests
        (view as WsxViewWithProtectedMethods).onAttributeChanged("params", "", params);

        expect(view.getAttribute("params")).toBe(params);
    });

    it("should render route view container", () => {
        view.connectedCallback();

        const container = view.shadowRoot?.querySelector(".route-view");
        expect(container).toBeTruthy();
    });

    it("should have route view structure", () => {
        // Test the view container structure
        view.connectedCallback();

        const container = view.shadowRoot?.querySelector(".route-view");
        expect(container).toBeTruthy();
        expect(container?.getAttribute("part")).toBe("view");
    });
});
