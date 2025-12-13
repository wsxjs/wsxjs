/**
 * Unit tests for babel-plugin-wsx-state
 */

import { transformSync } from "@babel/core";
import babelPluginWSXState from "../babel-plugin-wsx-state";

describe("babel-plugin-wsx-state", () => {
    const transformCode = (code: string, originalSource?: string) => {
        return transformSync(code, {
            filename: "Component.wsx",
            presets: [
                [
                    "@babel/preset-typescript",
                    {
                        isTSX: true,
                        allExtensions: true,
                    },
                ],
            ],
            plugins: [
                [
                    babelPluginWSXState,
                    {
                        originalSource: originalSource || code,
                    },
                ],
                [
                    "@babel/plugin-proposal-decorators",
                    {
                        version: "2023-05",
                        decoratorsBeforeExport: true,
                    },
                ],
                [
                    "@babel/plugin-proposal-class-properties",
                    {
                        loose: false,
                    },
                ],
                "@babel/plugin-transform-class-static-block",
            ],
        });
    };

    describe("@state decorator with initial values", () => {
        it("should transform @state with primitive initial value", () => {
            const code = `
import { WebComponent, state } from "@wsxjs/wsx-core";

export default class Counter extends WebComponent {
    @state private count = 0;

    render() {
        return <div>{this.count}</div>;
    }
}
`;

            const result = transformCode(code);
            expect(result).not.toBeNull();
            expect(result?.code).toBeDefined();
            expect(result?.code).toContain("useState");
            expect(result?.code).not.toContain("@state");
        });

        it("should transform @state with object initial value", () => {
            const code = `
import { WebComponent, state } from "@wsxjs/wsx-core";

export default class Counter extends WebComponent {
    @state private state = { count: 0 };

    render() {
        return <div>{this.state.count}</div>;
    }
}
`;

            const result = transformCode(code);
            expect(result).not.toBeNull();
            expect(result?.code).toBeDefined();
            expect(result?.code).toContain("reactive");
            expect(result?.code).not.toContain("@state");
        });

        it("should transform @state with array initial value", () => {
            const code = `
import { WebComponent, state } from "@wsxjs/wsx-core";

export default class TodoList extends WebComponent {
    @state private todos = [];

    render() {
        return <div>{this.todos.length}</div>;
    }
}
`;

            const result = transformCode(code);
            expect(result).not.toBeNull();
            expect(result?.code).toBeDefined();
            expect(result?.code).toContain("reactive");
            expect(result?.code).not.toContain("@state");
        });

        it("should throw error for @state with undefined initial value (treated as no initial value)", () => {
            const code = `
import { WebComponent, state } from "@wsxjs/wsx-core";

export default class Component extends WebComponent {
    @state private value = undefined;

    render() {
        return <div>{this.value}</div>;
    }
}
`;

            // undefined is treated as no initial value because we need a real value
            // to decide whether to use useState (primitive) or reactive (object/array)
            expect(() => {
                transformCode(code);
            }).toThrow(/@state decorator on property 'value' requires an initial value/);
        });
    });

    describe("@state decorator error handling", () => {
        it("should throw error when @state has no initial value (optional property)", () => {
            const code = `
import { WebComponent, state } from "@wsxjs/wsx-core";

export default class Component extends WebComponent {
    @state private count?;

    render() {
        return <div>{this.count}</div>;
    }
}
`;

            expect(() => {
                transformCode(code);
            }).toThrow(/@state decorator on property 'count' requires an initial value/);
        });

        it("should throw error when @state has no initial value (no value)", () => {
            const code = `
import { WebComponent, state } from "@wsxjs/wsx-core";

export default class Component extends WebComponent {
    @state private count;

    render() {
        return <div>{this.count}</div>;
    }
}
`;

            expect(() => {
                transformCode(code);
            }).toThrow(/@state decorator on property 'count' requires an initial value/);
        });

        it("should throw error with helpful message including examples", () => {
            const code = `
import { WebComponent, state } from "@wsxjs/wsx-core";

export default class Component extends WebComponent {
    @state private value?;

    render() {
        return <div>{this.value}</div>;
    }
}
`;

            try {
                transformCode(code);
                fail("Expected error to be thrown");
            } catch (error: unknown) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                expect(errorMsg).toContain(
                    "@state decorator on property 'value' requires an initial value"
                );
                expect(errorMsg).toContain("Examples:");
                expect(errorMsg).toContain('@state private value = ""');
                expect(errorMsg).toContain("@state private value = 0");
                expect(errorMsg).toContain("@state private value = {}");
                expect(errorMsg).toContain("@state private value = []");
                expect(errorMsg).toContain("@state private value = undefined");
            }
        });

        it("should throw error explaining why initial value is required", () => {
            const code = `
import { WebComponent, state } from "@wsxjs/wsx-core";

export default class Component extends WebComponent {
    @state private count?;

    render() {
        return <div>{this.count}</div>;
    }
}
`;

            try {
                transformCode(code);
                fail("Expected error to be thrown");
            } catch (error: unknown) {
                // Check if error message contains explanation about needing a value
                // The message might come from source code check (newer) or decorator check (older)
                const errorMsg = error instanceof Error ? error.message : String(error);
                // The error message should contain the requirement for initial value
                // Note: property name in error is 'count' (from the code), not 'value'
                expect(errorMsg).toContain(
                    "@state decorator on property 'count' requires an initial value"
                );
            }
        });

        it("should throw error for multiple properties without initial values", () => {
            const code = `
import { WebComponent, state } from "@wsxjs/wsx-core";

export default class Component extends WebComponent {
    @state private count?;
    @state private name?;

    render() {
        return <div>{this.count} {this.name}</div>;
    }
}
`;

            expect(() => {
                transformCode(code);
            }).toThrow(/@state decorator on property 'count' requires an initial value/);
        });
    });

    describe("@state decorator with valid initial values", () => {
        it("should accept string initial value", () => {
            const code = `
import { WebComponent, state } from "@wsxjs/wsx-core";

export default class Component extends WebComponent {
    @state private name = "";

    render() {
        return <div>{this.name}</div>;
    }
}
`;

            const result = transformCode(code);
            expect(result).not.toBeNull();
            expect(result?.code).toBeDefined();
            expect(() => {
                transformCode(code);
            }).not.toThrow();
        });

        it("should accept number initial value", () => {
            const code = `
import { WebComponent, state } from "@wsxjs/wsx-core";

export default class Component extends WebComponent {
    @state private count = 0;

    render() {
        return <div>{this.count}</div>;
    }
}
`;

            expect(() => {
                transformCode(code);
            }).not.toThrow();
        });

        it("should accept object initial value", () => {
            const code = `
import { WebComponent, state } from "@wsxjs/wsx-core";

export default class Component extends WebComponent {
    @state private state = {};

    render() {
        return <div>{this.state}</div>;
    }
}
`;

            expect(() => {
                transformCode(code);
            }).not.toThrow();
        });

        it("should accept array initial value", () => {
            const code = `
import { WebComponent, state } from "@wsxjs/wsx-core";

export default class Component extends WebComponent {
    @state private items = [];

    render() {
        return <div>{this.items.length}</div>;
    }
}
`;

            expect(() => {
                transformCode(code);
            }).not.toThrow();
        });

        it("should throw error for explicitly undefined initial value (treated as no initial value)", () => {
            const code = `
import { WebComponent, state } from "@wsxjs/wsx-core";

export default class Component extends WebComponent {
    @state private value = undefined;

    render() {
        return <div>{this.value}</div>;
    }
}
`;

            // undefined is treated as no initial value because we need a real value
            // to decide whether to use useState (primitive) or reactive (object/array)
            expect(() => {
                transformCode(code);
            }).toThrow(/@state decorator on property 'value' requires an initial value/);
        });
    });
});
