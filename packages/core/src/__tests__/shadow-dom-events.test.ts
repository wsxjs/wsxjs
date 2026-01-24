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

describe("Shadow DOM Event Handling (RFC 0056)", () => {
    let container: HTMLDivElement;
    let component: TestShadowEvents;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        component = document.createElement("test-shadow-events") as TestShadowEvents;
        container.appendChild(component);
    });

    afterEach(() => {
        if (container.parentNode) {
            document.body.removeChild(container);
        }
        jest.clearAllMocks();
    });

    test("should verify Shadow DOM structure", () => {
        // 1. Get input from Shadow DOM
        const input = component.shadowRoot!.querySelector("input") as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.id).toBe("shadow-input");
        expect(input.type).toBe("text");
    });

    test("should verify getActiveRoot() returns shadowRoot for WebComponent", () => {
        // This test verifies that getActiveRoot() correctly returns shadowRoot for WebComponent
        // as specified in RFC 0056
        const activeRoot = (component as any).getActiveRoot();
        expect(activeRoot).toBe(component.shadowRoot);
    });
});
