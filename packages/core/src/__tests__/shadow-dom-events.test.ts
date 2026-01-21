import { WebComponent } from "../web-component";
import { h } from "../jsx-factory";

// Mock loggers to avoid console output during tests
jest.mock("@wsxjs/wsx-logger", () => ({
    createLogger: () => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        trace: jest.fn(),
    }),
}));

// Mock component to test event handling
class TestShadowEvents extends WebComponent {
    // Use h() for rendering to match other tests
    render() {
        return h("div", {}, [h("input", { type: "text", id: "shadow-input" })]);
    }
}

// Register custom element
if (!customElements.get("test-shadow-events")) {
    customElements.define("test-shadow-events", TestShadowEvents);
}

describe("Shadow DOM Event Handling (RTC 0056)", () => {
    let container: HTMLDivElement;
    let component: TestShadowEvents;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        component = document.createElement("test-shadow-events") as TestShadowEvents;

        // Spy on the private handleGlobalBlur method BEFORE connecting
        // This ensures the listener attached in connectedCallback is the spy
        // handleGlobalBlur is an arrow function property, so we can mock it directly
        // checking if it exists first to avoid TS issues if possible (casting to any)
        const originalHandler = (component as any).handleGlobalBlur;
        (component as any).handleGlobalBlur = jest.fn((e: FocusEvent) => {
            // We can call original if needed, but for catching the event call, just the spy is enough
            // If the implementation relies on logic inside, we should call original.
            // For RFC 0056 regression, we just care that the LISTENER receives the event.
            if (originalHandler) originalHandler.call(component, e);
        });

        container.appendChild(component);
    });

    afterEach(() => {
        if (container.parentNode) {
            document.body.removeChild(container);
        }
        jest.clearAllMocks();
    });

    test("should capture blur events originating from inside Shadow DOM", () => {
        // 1. Get input from Shadow DOM
        const input = component.shadowRoot!.querySelector("input") as HTMLInputElement;
        expect(input).toBeTruthy();

        // 2. Focus the input (helper to set activeElement)
        input.focus();

        // 3. Trigger blur event manually
        // Standard blur event doesn't bubble and isn't composed
        const blurEvent = new FocusEvent("blur", {
            bubbles: false,
            composed: false,
            cancelable: false,
        });

        // Dispatch specifically on the input inside shadow root
        input.dispatchEvent(blurEvent);

        // 4. Assert that our handler caught it
        // The handler is attached to shadowRoot (getActiveRoot) via capture phase,
        // so it should intercept the event.
        expect((component as any).handleGlobalBlur).toHaveBeenCalled();
    });

    test("listener should be attached to shadowRoot (verifying fix behavior)", () => {
        // This test verifies that even if an event happens directly on shadowRoot, it is caught.
        // This confirms the listener is NOT on document (or at least IS on shadowRoot).

        const rootBlurEvent = new FocusEvent("blur", {
            bubbles: false,
            composed: false,
        });

        // Dispatch on shadowRoot
        component.shadowRoot!.dispatchEvent(rootBlurEvent);

        expect((component as any).handleGlobalBlur).toHaveBeenCalled();
    });
});
