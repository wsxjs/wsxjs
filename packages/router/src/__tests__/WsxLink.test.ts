import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
// Import to register the component
import "../WsxLink.wsx";
// Import type for proper typing
import type WsxLink from "../WsxLink.wsx";

// Type for accessing protected methods in tests
interface WsxLinkWithProtectedMethods extends WsxLink {
    onAttributeChanged(name: string, oldValue: string, newValue: string): void;
}

describe("WsxLink", () => {
    let link: WsxLink;

    beforeEach(() => {
        // Mock window.location and history
        Object.defineProperty(window, "location", {
            value: {
                pathname: "/",
                search: "",
                hash: "",
            },
            writable: true,
        });

        Object.defineProperty(window, "history", {
            value: {
                pushState: vi.fn(),
                replaceState: vi.fn(),
            },
            writable: true,
        });

        // Mock window.open
        Object.defineProperty(window, "open", {
            value: vi.fn(),
            writable: true,
        });

        // Create link instance using custom element
        link = document.createElement("wsx-link") as WsxLink;
        document.body.appendChild(link);
    });

    afterEach(() => {
        document.body.removeChild(link);
        vi.clearAllMocks();
    });

    it("should create link instance", () => {
        expect(link.tagName.toLowerCase()).toBe("wsx-link");
        expect(link).toBeInstanceOf(HTMLElement);
    });

    it("should have shadow DOM", () => {
        expect(link.shadowRoot).toBeTruthy();
    });

    it("should set href attribute from to prop", () => {
        link.setAttribute("to", "/users");
        // Trigger attribute change callback manually
        link.connectedCallback();
        // Manually trigger attribute change since setAttribute doesn't automatically trigger it in tests
        (link as WsxLinkWithProtectedMethods).onAttributeChanged("to", "", "/users");

        const anchor = link.shadowRoot?.querySelector("a");
        expect(anchor?.getAttribute("href")).toBe("/users");
    });

    it("should navigate on click", () => {
        const historyPushSpy = vi.spyOn(window.history, "pushState");
        const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

        // Set up the component properly
        link.setAttribute("to", "/test");
        link.connectedCallback();
        // Manually trigger attribute change since setAttribute doesn't automatically trigger it in tests
        (link as WsxLinkWithProtectedMethods).onAttributeChanged("to", "", "/test");

        // Wait for attribute change to be processed
        const anchor = link.shadowRoot?.querySelector("a");
        expect(anchor).toBeTruthy();

        // Create and dispatch click event
        const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
        anchor?.dispatchEvent(clickEvent);

        expect(historyPushSpy).toHaveBeenCalledWith(null, "", "/test");
        expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(PopStateEvent));
    });

    it("should programmatically navigate", () => {
        const historyPushSpy = vi.spyOn(window.history, "pushState");

        link.setAttribute("to", "/programmatic");
        link.connectedCallback();
        // Manually trigger attribute change since setAttribute doesn't automatically trigger it in tests
        (link as WsxLinkWithProtectedMethods).onAttributeChanged("to", "", "/programmatic");

        // Call navigate method on the custom element
        link.navigate();

        expect(historyPushSpy).toHaveBeenCalledWith(null, "", "/programmatic");
    });
});
