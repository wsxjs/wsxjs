import { RenderContext } from "../src/render-context";
import { BaseComponent } from "../src/base-component";

// Mock component for testing
class MockComponent extends BaseComponent {
    render() {
        return null;
    }
}

customElements.define("test-render-context-component", MockComponent);

describe("RenderContext", () => {
    test("keeps context null by default", () => {
        expect(RenderContext.getCurrentComponent()).toBeNull();
    });

    test("sets current component during execution", () => {
        const component = new MockComponent();
        let capturedComponent: BaseComponent | null = null;

        RenderContext.runInContext(component, () => {
            capturedComponent = RenderContext.getCurrentComponent();
        });

        expect(capturedComponent).toBe(component);
        expect(RenderContext.getCurrentComponent()).toBeNull();
    });

    test("handles nested contexts correctly", () => {
        const parent = new MockComponent();
        const child = new MockComponent();

        let innerCaptured: BaseComponent | null = null;
        let outerCapturedAfter: BaseComponent | null = null;

        RenderContext.runInContext(parent, () => {
            RenderContext.runInContext(child, () => {
                innerCaptured = RenderContext.getCurrentComponent();
            });
            outerCapturedAfter = RenderContext.getCurrentComponent();
        });

        expect(innerCaptured).toBe(child);
        expect(outerCapturedAfter).toBe(parent);
        expect(RenderContext.getCurrentComponent()).toBeNull();
    });

    test("restores context even if error thrown", () => {
        const component = new MockComponent();

        try {
            RenderContext.runInContext(component, () => {
                throw new Error("Test error");
            });
        } catch (e) {
            // ignore
        }

        expect(RenderContext.getCurrentComponent()).toBeNull();
    });
});
