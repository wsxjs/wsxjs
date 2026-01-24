import { LightComponent } from "../light-component";
import { autoRegister } from "../index";
import { h } from "../jsx-factory";

@autoRegister({ tagName: "test-calendar-repro" })
class TestCalendarRepro extends LightComponent {
    private stage: number = 0;

    setStage(stage: number) {
        this.stage = stage;
        this.scheduleRerender();
    }

    render() {
        if (this.stage === 0) {
            // Stage 0: Simple list of text nodes (like Jan 28, 29, 30, 31)
            // Using numbers to mimic calendar
            return h("div", { class: "grid" }, ["28", "29", "30", "31", "1", "2", "3"]);
        } else {
            // Stage 1: Shifted list for next month (Feb)
            // Should be: 1, 2, 3, 4, 5, 6, 7
            // If bug exists, we might see orphans or incorrect reuse
            return h("div", { class: "grid" }, ["1", "2", "3", "4", "5", "6", "7"]);
        }
    }
}

describe("Calendar Ghost Node Reproduction", () => {
    let el: TestCalendarRepro;

    beforeEach(() => {
        el = document.createElement("test-calendar-repro") as TestCalendarRepro;
        document.body.appendChild(el);
    });

    afterEach(() => {
        if (el.parentNode) {
            document.body.removeChild(el);
        }
    });

    test("should cleanly replace text nodes in grid", async () => {
        // Stage 0
        el.setStage(0);
        await new Promise((r) => setTimeout(r, 60));

        const grid = el.querySelector(".grid")!;
        const textNodes0 = Array.from(grid.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE);
        const textContent0 = textNodes0.map((n) => n.textContent?.trim());

        expect(textContent0).toEqual(["28", "29", "30", "31", "1", "2", "3"]);
        expect(grid.childNodes.length).toBe(7); // pure text nodes

        // Stage 1
        el.setStage(1);
        await new Promise((r) => setTimeout(r, 60));

        const gridUpdated = el.querySelector(".grid")!;
        const textNodes1 = Array.from(gridUpdated.childNodes).filter(
            (n) => n.nodeType === Node.TEXT_NODE
        );
        const textContent1 = textNodes1.map((n) => n.textContent?.trim());

        // CRITICAL CHECK: No "ghost" nodes from previous render (like 28, 29) appended at the end
        expect(textContent1).toEqual(["1", "2", "3", "4", "5", "6", "7"]);

        // Ensure strictly 7 nodes
        expect(gridUpdated.childNodes.length).toBe(7);
    });
});
