import { updateChildren } from "../utils/element-update";
import { markElement } from "../utils/element-marking";

describe("Reconciliation Deep Dive", () => {
    test("should not leak old text when element order changes", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");

        // Initial: [Cell("1"), Cell("2")]
        const c1_old = document.createElement("div");
        markElement(c1_old, "c1");
        c1_old.textContent = "1";
        const c2_old = document.createElement("div");
        markElement(c2_old, "c2");
        c2_old.textContent = "2";
        parent.appendChild(c1_old);
        parent.appendChild(c2_old);

        const oldChildren = [c1_old, c2_old];

        // Target: [NewCell("A"), Cell("1")]
        // Cell("2") should be removed.
        const cA_new = document.createElement("div");
        markElement(cA_new, "cA");
        cA_new.textContent = "A";

        const newChildren = [cA_new, c1_old];

        updateChildren(parent, oldChildren, newChildren);

        expect(parent.childNodes.length).toBe(2);
        expect(parent.childNodes[0]).toBe(cA_new);
        expect(parent.childNodes[1]).toBe(c1_old);
        expect(Array.from(parent.childNodes)).not.toContain(c2_old);
    });

    test("should handle text nodes correctly when leading elements are added", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");

        // Initial: [Div, Text("B")]
        const div = document.createElement("div");
        markElement(div, "d1");
        const tB = document.createTextNode("B");
        (tB as any).__wsxManaged = true;
        parent.appendChild(div);
        parent.appendChild(tB);

        const oldChildren = [div, "B"];

        // Target: ["A", Div, "B"]
        const newChildren = ["A", div, "B"];

        updateChildren(parent, oldChildren, newChildren);

        expect(parent.childNodes.length).toBe(3);
        expect(parent.childNodes[0].textContent).toBe("A");
        expect(parent.childNodes[1]).toBe(div);
        expect(parent.childNodes[2].textContent).toBe("B");
    });

    test("leakage suspected: should remove text nodes of an element that was moved", () => {
        // This simulates a cell moving positions and changing content
        const grid = document.createElement("div");
        markElement(grid, "pk");

        // [Cell1("1"), Cell2("2")]
        const cell1 = document.createElement("div");
        markElement(cell1, "c1");
        cell1.textContent = "1";
        (cell1.firstChild as any).__wsxManaged = true;
        const cell2 = document.createElement("div");
        markElement(cell2, "c2");
        cell2.textContent = "2";
        (cell2.firstChild as any).__wsxManaged = true;
        grid.appendChild(cell1);
        grid.appendChild(cell2);

        // New state: [CellA("A"), Cell1("B")]
        const cellA = document.createElement("div");
        markElement(cellA, "cA");
        cellA.textContent = "A";

        // Logic in updateChildren:
        // 1. Process i=0: newChild = cellA.
        //    cellA is inserted before cell1.
        //    DOM: [cellA, cell1, cell2]
        // 2. Process i=1: newChild = cell1.
        //    cell1 is already there. updateChildren is called on cell1 to update "1" to "B".

        const oldChildren = [cell1, cell2];
        const newChildren = [cellA, cell1];

        // Mocking the updateChildren call on the cell1 inside the main loop
        // (In reality this is done by updateElement or similar)

        // We simulate the whole process
        updateChildren(grid, oldChildren, newChildren);
        updateChildren(cell1, ["1"], ["B"]);

        expect(grid.childNodes.length).toBe(2);
        expect(grid.childNodes[0]).toBe(cellA);
        expect(grid.childNodes[1]).toBe(cell1);
        expect(cell1.textContent).toBe("B");
        expect(cell1.childNodes.length).toBe(1); // Fails if "1" leaked
    });

    test("should handle text node update correctly when an element is reused in a different context", () => {
        // This simulates the 'auto-X' key collision where an element from Jan 25
        // is reused in March 29.
        const parent = document.createElement("div");
        markElement(parent, "pk");

        // Element from Jan 25: div with Text("25")
        const reusedDiv = document.createElement("div");
        markElement(reusedDiv, "auto-100");
        reusedDiv.textContent = "25";
        (reusedDiv.firstChild as any).__wsxManaged = true;

        // Target: div with Text("29")
        // In the second render, we want it to be "29"
        updateChildren(reusedDiv, ["25"], ["29"]);

        expect(reusedDiv.textContent).toBe("29");
        expect(reusedDiv.childNodes.length).toBe(1);
    });

    test("leakage reproduction: multiple text nodes when findTextNode fails", () => {
        const div = document.createElement("div");
        markElement(div, "auto-100");

        // Scenario: Internal div has whitespace + text
        // metadata.children = ["\n", "25", "\n"]
        const t1 = document.createTextNode("\n");
        (t1 as any).__wsxManaged = true;
        const t2 = document.createTextNode("25");
        (t2 as any).__wsxManaged = true;
        const t3 = document.createTextNode("\n");
        (t3 as any).__wsxManaged = true;
        div.appendChild(t1);
        div.appendChild(t2);
        div.appendChild(t3);

        const oldChildren = ["\n", "25", "\n"];
        const newChildren = ["29"]; // New render only has "29"

        updateChildren(div, oldChildren, newChildren);

        // If it works correctly, it should only have "29"
        expect(div.textContent!.trim()).toBe("29");
        expect(div.childNodes.length).toBe(1);
    });
});
