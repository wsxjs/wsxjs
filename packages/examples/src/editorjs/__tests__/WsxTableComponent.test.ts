import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import type WsxTableComponent from "../WsxTableComponent.wsx";
import "../WsxTableComponent.wsx";

// Mock the stylesheet import
vi.mock("./WsxTableTool.css?inline", () => ({ default: "mocked-styles" }));

describe("WsxTableComponent", () => {
    let component: WsxTableComponent;

    beforeEach(async () => {
        // Create component instance
        component = document.createElement("wsx-table-component") as WsxTableComponent;
        document.body.appendChild(component);

        // Wait for component to be connected
        await new Promise((resolve) => setTimeout(resolve, 0));
    });

    afterEach(() => {
        if (component) {
            component.remove();
        }
    });

    describe("Component Initialization", () => {
        test("should register with correct tag name", () => {
            expect(customElements.get("wsx-table-component")).toBeDefined();
        });

        test("should have initial default values", () => {
            const data = component.getData();
            expect(data.headers).toEqual(["Column 1", "Column 2"]);
            expect(data.rows).toEqual([["", ""]]);
            expect(data.withHeadings).toBe(true);
        });

        test("should render basic structure", () => {
            const tableToolElement = component.shadowRoot?.querySelector(".wsx-table-tool");
            expect(tableToolElement).toBeInTheDocument();

            const toolbar = component.shadowRoot?.querySelector(".table-toolbar");
            expect(toolbar).toBeInTheDocument();

            const tableContainer = component.shadowRoot?.querySelector(".table-container");
            expect(tableContainer).toBeInTheDocument();

            const table = component.shadowRoot?.querySelector(".data-table");
            expect(table).toBeInTheDocument();
        });
    });

    describe("Attribute Handling", () => {
        test("should handle headers attribute", () => {
            const testHeaders = ["Name", "Age", "City"];
            component.setAttribute("headers", JSON.stringify(testHeaders));

            expect(component.getData().headers).toEqual(testHeaders);

            const headerInputs = component.shadowRoot?.querySelectorAll(
                ".header-input"
            ) as NodeListOf<HTMLInputElement>;
            expect(headerInputs).toHaveLength(3);
            expect(headerInputs[0].value).toBe("Name");
            expect(headerInputs[1].value).toBe("Age");
            expect(headerInputs[2].value).toBe("City");
        });

        test("should handle rows attribute", () => {
            const testRows = [
                ["John", "25", "NYC"],
                ["Jane", "30", "LA"],
            ];
            component.setAttribute("rows", JSON.stringify(testRows));

            expect(component.getData().rows).toEqual(testRows);

            const cellInputs = component.shadowRoot?.querySelectorAll(
                "tbody .cell-input"
            ) as NodeListOf<HTMLInputElement>;
            expect(cellInputs[0].value).toBe("John");
            expect(cellInputs[1].value).toBe("25");
            expect(cellInputs[2].value).toBe("NYC");
        });

        test("should handle withheadings attribute", () => {
            component.setAttribute("withheadings", "false");

            expect(component.getData().withHeadings).toBe(false);

            const thead = component.shadowRoot?.querySelector("thead");
            expect(thead).not.toBeInTheDocument();
        });

        test("should handle readonly attribute", () => {
            component.setAttribute("readonly", "true");

            const toolbar = component.shadowRoot?.querySelector(".table-toolbar");
            expect(toolbar).not.toBeInTheDocument();

            const actions = component.shadowRoot?.querySelector(".table-actions");
            expect(actions).not.toBeInTheDocument();
        });
    });

    describe("Table Structure", () => {
        test("should show headers when withHeadings is true", () => {
            component.setAttribute("withheadings", "true");

            const thead = component.shadowRoot?.querySelector("thead");
            expect(thead).toBeInTheDocument();

            const headerCells = component.shadowRoot?.querySelectorAll("th");
            expect(headerCells).toHaveLength(2); // Default 2 columns
        });

        test("should hide headers when withHeadings is false", () => {
            component.setAttribute("withheadings", "false");

            const thead = component.shadowRoot?.querySelector("thead");
            expect(thead).not.toBeInTheDocument();
        });

        test("should render table rows", () => {
            const testRows = [
                ["A", "B"],
                ["C", "D"],
                ["E", "F"],
            ];
            component.setAttribute("rows", JSON.stringify(testRows));

            const tbody = component.shadowRoot?.querySelector("tbody");
            expect(tbody).toBeInTheDocument();

            const rows = component.shadowRoot?.querySelectorAll("tbody tr");
            expect(rows).toHaveLength(3);
        });

        test("should render correct number of cells per row", () => {
            const testHeaders = ["Col1", "Col2", "Col3"];
            const testRows = [["A", "B", "C"]];

            component.setAttribute("headers", JSON.stringify(testHeaders));
            component.setAttribute("rows", JSON.stringify(testRows));

            const cells = component.shadowRoot?.querySelectorAll("tbody td");
            expect(cells).toHaveLength(3);
        });
    });

    describe("User Interactions", () => {
        test("should update cell value when input changes", () => {
            const cellInput = component.shadowRoot?.querySelector(
                "tbody .cell-input"
            ) as HTMLInputElement;

            cellInput.value = "New Value";
            cellInput.dispatchEvent(new Event("input", { bubbles: true }));

            const data = component.getData();
            expect(data.rows[0][0]).toBe("New Value");
        });

        test("should update header value when header input changes", () => {
            const headerInput = component.shadowRoot?.querySelector(
                ".header-input"
            ) as HTMLInputElement;

            headerInput.value = "New Header";
            headerInput.dispatchEvent(new Event("input", { bubbles: true }));

            const data = component.getData();
            expect(data.headers[0]).toBe("New Header");
        });

        test("should emit datachange event when data updates", async () => {
            let eventFired = false;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let eventDetail: any = null;

            component.addEventListener("datachange", (e: CustomEvent) => {
                eventFired = true;
                eventDetail = e.detail;
            });

            const cellInput = component.shadowRoot?.querySelector(
                "tbody .cell-input"
            ) as HTMLInputElement;
            cellInput.value = "Test Value";
            cellInput.dispatchEvent(new Event("input", { bubbles: true }));

            // Wait for event to fire
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(eventFired).toBe(true);
            expect(eventDetail.rows[0][0]).toBe("Test Value");
        });

        test("should toggle headers when checkbox changes", () => {
            const checkbox = component.shadowRoot?.querySelector(
                'input[type="checkbox"]'
            ) as HTMLInputElement;

            checkbox.checked = false;
            checkbox.dispatchEvent(new Event("change", { bubbles: true }));

            expect(component.getData().withHeadings).toBe(false);
        });
    });

    describe("Column Management", () => {
        test("should add column when + Column button clicked", () => {
            const addColumnBtn = component.shadowRoot?.querySelector(
                ".btn:nth-child(2)"
            ) as HTMLButtonElement;
            addColumnBtn?.click();

            const data = component.getData();
            expect(data.headers).toHaveLength(3);
            expect(data.headers[2]).toBe("Column 3");
            expect(data.rows[0]).toHaveLength(3);
        });

        test("should remove column when - Column button clicked", () => {
            // Start with 3 columns
            component.setAttribute("headers", JSON.stringify(["A", "B", "C"]));
            component.setAttribute("rows", JSON.stringify([["1", "2", "3"]]));

            const removeColumnBtn = component.shadowRoot?.querySelector(
                ".btn-danger:nth-child(4)"
            ) as HTMLButtonElement;
            removeColumnBtn?.click();

            const data = component.getData();
            expect(data.headers).toHaveLength(2);
            expect(data.rows[0]).toHaveLength(2);
        });

        test("should not remove column if only one remains", () => {
            // Start with 1 column
            component.setAttribute("headers", JSON.stringify(["A"]));
            component.setAttribute("rows", JSON.stringify([["1"]]));

            const removeColumnBtn = component.shadowRoot?.querySelector(
                ".btn-danger:nth-child(4)"
            ) as HTMLButtonElement;
            removeColumnBtn?.click();

            const data = component.getData();
            expect(data.headers).toHaveLength(1); // Should still have 1
        });
    });

    describe("Row Management", () => {
        test("should add row when + Row button clicked", () => {
            const addRowBtn = component.shadowRoot?.querySelector(
                ".btn:nth-child(3)"
            ) as HTMLButtonElement;
            addRowBtn?.click();

            const data = component.getData();
            expect(data.rows).toHaveLength(2);
            expect(data.rows[1]).toEqual(["", ""]); // New empty row
        });

        test("should remove row when - Row button clicked", () => {
            // Start with 2 rows
            component.setAttribute(
                "rows",
                JSON.stringify([
                    ["A", "B"],
                    ["C", "D"],
                ])
            );

            const removeRowBtn = component.shadowRoot?.querySelector(
                ".btn-danger:nth-child(5)"
            ) as HTMLButtonElement;
            removeRowBtn?.click();

            const data = component.getData();
            expect(data.rows).toHaveLength(1);
        });

        test("should not remove row if only one remains", () => {
            // Start with 1 row
            component.setAttribute("rows", JSON.stringify([["A", "B"]]));

            const removeRowBtn = component.shadowRoot?.querySelector(
                ".btn-danger:nth-child(5)"
            ) as HTMLButtonElement;
            removeRowBtn?.click();

            const data = component.getData();
            expect(data.rows).toHaveLength(1); // Should still have 1
        });
    });

    describe("Cell Selection", () => {
        test("should select cell on click", () => {
            const cell = component.shadowRoot?.querySelector("tbody td") as HTMLTableCellElement;
            cell?.click();

            expect(cell.classList.contains("selected")).toBe(true);
        });

        test("should show cell info when cell is selected", () => {
            const cell = component.shadowRoot?.querySelector("tbody td") as HTMLTableCellElement;
            cell?.click();

            const cellInfo = component.shadowRoot?.querySelector(".cell-info");
            expect(cellInfo).toBeInTheDocument();
            expect(cellInfo?.textContent).toContain("Row 1, Column 1");
        });

        test("should hide cell info when cell is deselected", () => {
            const cell = component.shadowRoot?.querySelector("tbody td") as HTMLTableCellElement;
            cell?.click();

            const cellInput = cell.querySelector(".cell-input") as HTMLInputElement;
            cellInput?.dispatchEvent(new Event("blur", { bubbles: true }));

            const cellInfo = component.shadowRoot?.querySelector(".cell-info");
            expect(cellInfo).not.toBeInTheDocument();
        });
    });

    describe("Table Actions", () => {
        test("should clear all data when Clear All button clicked", () => {
            // Set some data first
            component.setAttribute(
                "rows",
                JSON.stringify([
                    ["A", "B"],
                    ["C", "D"],
                ])
            );

            const clearBtn = component.shadowRoot?.querySelector(
                ".btn-outline:nth-child(2)"
            ) as HTMLButtonElement;
            clearBtn?.click();

            const data = component.getData();
            expect(data.rows).toEqual([
                ["", ""],
                ["", ""],
            ]);
        });

        test("should load sample data when Sample Data button clicked", () => {
            const sampleBtn = component.shadowRoot?.querySelector(
                ".btn-outline:nth-child(3)"
            ) as HTMLButtonElement;
            sampleBtn?.click();

            const data = component.getData();
            expect(data.headers).toEqual(["Product", "Price", "Stock", "Category"]);
            expect(data.rows).toHaveLength(4);
            expect(data.rows[0][0]).toBe("MacBook Pro");
        });

        test("should export CSV when Export CSV button clicked", () => {
            // Mock URL.createObjectURL and document.createElement
            const mockCreateObjectURL = vi.fn().mockReturnValue("blob:mock-url");
            const mockRevokeObjectURL = vi.fn();
            global.URL.createObjectURL = mockCreateObjectURL;
            global.URL.revokeObjectURL = mockRevokeObjectURL;

            const mockClick = vi.fn();
            const mockAnchor = { href: "", download: "", click: mockClick };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as any);

            // Set some test data
            component.setAttribute("headers", JSON.stringify(["Name", "Age"]));
            component.setAttribute(
                "rows",
                JSON.stringify([
                    ["John", "25"],
                    ["Jane", "30"],
                ])
            );

            const exportBtn = component.shadowRoot?.querySelector(
                ".btn-outline:nth-child(1)"
            ) as HTMLButtonElement;
            exportBtn?.click();

            expect(mockCreateObjectURL).toHaveBeenCalled();
            expect(mockClick).toHaveBeenCalled();
            expect(mockRevokeObjectURL).toHaveBeenCalled();
        });
    });

    describe("Readonly Mode", () => {
        test("should hide toolbar in readonly mode", () => {
            component.setAttribute("readonly", "true");

            const toolbar = component.shadowRoot?.querySelector(".table-toolbar");
            expect(toolbar).not.toBeInTheDocument();
        });

        test("should hide actions in readonly mode", () => {
            component.setAttribute("readonly", "true");

            const actions = component.shadowRoot?.querySelector(".table-actions");
            expect(actions).not.toBeInTheDocument();
        });

        test("should disable cell inputs in readonly mode", () => {
            component.setAttribute("readonly", "true");

            const cellInputs = component.shadowRoot?.querySelectorAll(
                ".cell-input"
            ) as NodeListOf<HTMLInputElement>;
            cellInputs.forEach((input) => {
                expect(input.readOnly).toBe(true);
            });
        });

        test("should not allow cell selection in readonly mode", () => {
            component.setAttribute("readonly", "true");

            const cell = component.shadowRoot?.querySelector("tbody td") as HTMLTableCellElement;
            cell?.click();

            expect(cell.classList.contains("selected")).toBe(false);
        });
    });

    describe("Table Info Display", () => {
        test("should show correct table dimensions", () => {
            component.setAttribute("headers", JSON.stringify(["A", "B", "C"]));
            component.setAttribute(
                "rows",
                JSON.stringify([
                    ["1", "2", "3"],
                    ["4", "5", "6"],
                ])
            );

            const tableInfo = component.shadowRoot?.querySelector(".table-info");
            expect(tableInfo?.textContent).toBe("2 rows × 3 columns");
        });

        test("should update dimensions when structure changes", () => {
            const addColumnBtn = component.shadowRoot?.querySelector(
                ".btn:nth-child(2)"
            ) as HTMLButtonElement;
            addColumnBtn?.click();

            const tableInfo = component.shadowRoot?.querySelector(".table-info");
            expect(tableInfo?.textContent).toBe("1 rows × 3 columns");
        });
    });

    describe("Error Handling", () => {
        test("should handle invalid JSON in headers attribute", () => {
            component.setAttribute("headers", "invalid json");

            // Should fallback to default headers
            const data = component.getData();
            expect(data.headers).toEqual(["Column 1", "Column 2"]);
        });

        test("should handle invalid JSON in rows attribute", () => {
            component.setAttribute("rows", "invalid json");

            // Should fallback to default rows
            const data = component.getData();
            expect(data.rows).toEqual([["", ""]]);
        });
    });

    describe("Accessibility", () => {
        test("should have proper labels", () => {
            const checkboxLabel = component.shadowRoot?.querySelector(".checkbox-label");
            expect(checkboxLabel?.textContent).toContain("Headers");
        });

        test("should have proper placeholders", () => {
            const headerInput = component.shadowRoot?.querySelector(
                ".header-input"
            ) as HTMLInputElement;
            expect(headerInput?.placeholder).toBe("Column 1");

            const cellInput = component.shadowRoot?.querySelector(
                "tbody .cell-input"
            ) as HTMLInputElement;
            expect(cellInput?.placeholder).toBe("Enter data...");
        });

        test("should have proper button text", () => {
            const addColumnBtn = component.shadowRoot?.querySelector(
                ".btn:nth-child(2)"
            ) as HTMLButtonElement;
            expect(addColumnBtn?.textContent?.trim()).toBe("+ Column");

            const exportBtn = component.shadowRoot?.querySelector(
                ".btn-outline:nth-child(1)"
            ) as HTMLButtonElement;
            expect(exportBtn?.textContent?.trim()).toBe("📄 Export CSV");
        });
    });
});
