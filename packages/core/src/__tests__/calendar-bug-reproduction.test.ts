import { updateChildren } from "../utils/element-update";
import { markElement } from "../utils/element-marking";

describe("Calendar Bug Verification - Fixed Test Environment", () => {
    test("should handle text nodes correctly when positions shift", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");

        // Initial: [Div(cell31)]
        const cell31 = document.createElement("div");
        cell31.textContent = "31";
        parent.appendChild(cell31);

        const oldChildren = [cell31] as any[];
        const newChildren = ["30", cell31];

        updateChildren(parent, oldChildren, newChildren);

        // Expected: ["30", Div(cell31)]
        expect(parent.childNodes.length).toBe(2);
        expect(parent.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
        expect(parent.childNodes[0].textContent).toBe("30");
        expect(parent.childNodes[1]).toBe(cell31);
    });
});
