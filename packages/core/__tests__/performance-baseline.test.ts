import { WebComponent } from "../src/web-component";
import { state } from "../src/reactive-decorator";
import { h } from "../src/jsx-factory";

/**
 * Performance Baseline Test
 * Measures DOM operation counts to establish a baseline for RFC 0037 optimization.
 *
 * Current Behavior (Unoptimized):
 * - Rerender replaces the entire Shadow DOM.
 * - Creation count = Total Elements * Updates.
 *
 * Expected Behavior (Optimized):
 * - Creation count = 0 (for updates).
 */

class BaselineArticle extends WebComponent {
    @state content = "Initial content";
    @state title = "Initial title";

    render() {
        return h("div", { class: "article" }, h("h1", {}, this.title), h("p", {}, this.content));
    }
}

customElements.define("baseline-article", BaselineArticle);

class BaselineList extends WebComponent {
    @state items = Array.from({ length: 10 }, (_, i) => `Item ${i}`);

    render() {
        return h("ul", {}, ...this.items.map((item) => h("li", {}, item)));
    }
}

customElements.define("baseline-list", BaselineList);

describe("RFC 0037 Performance Baseline", () => {
    let createElementSpy: jest.SpyInstance;
    let creationCount = 0;

    beforeEach(() => {
        creationCount = 0;
        createElementSpy = jest.spyOn(document, "createElement").mockImplementation((tag) => {
            creationCount++;
            return Object.getPrototypeOf(document).createElement.call(document, tag);
        });
        document.body.innerHTML = "";
    });

    afterEach(() => {
        createElementSpy.mockRestore();
    });

    // Helper to wait for re-renders (using generous timeout for stability)
    const waitForRender = () => new Promise<void>((resolve) => setTimeout(resolve, 100));

    test("Baseline: Static Content Update Creation Count", async () => {
        const component = new BaselineArticle();
        document.body.appendChild(component);
        await waitForRender();

        // Reset for update measurement
        creationCount = 0;

        // Update 10 times
        for (let i = 0; i < 10; i++) {
            component.content = `Updated ${i}`;
            // Use scheduleRerender via any cast as it is protected
            (component as any).scheduleRerender();
            await waitForRender();
        }

        // Unoptimized: Each render creates 3 elements (div, h1, p) * 10 updates = 30
        console.log(`Baseline Static Update Creations: ${creationCount}`);
        expect(creationCount).toBeGreaterThan(0);
    });

    test("Baseline: List Update Creation Count", async () => {
        const component = new BaselineList();
        document.body.appendChild(component);
        await waitForRender();

        creationCount = 0;

        // Update list 5 times
        for (let i = 0; i < 5; i++) {
            component.items = [...component.items, `New Item ${i}`];
            (component as any).scheduleRerender();
            await waitForRender();
        }

        // Unoptimized: Each render creates 1 ul + N li elements.
        // It grows: 11, 12, 13, 14, 15 items.
        // Total creations will be sum of those.
        console.log(`Baseline List Update Creations: ${creationCount}`);
        expect(creationCount).toBeGreaterThan(0);
    });
});
