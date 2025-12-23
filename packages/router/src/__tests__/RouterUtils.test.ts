import { describe, it, expect, beforeEach, vi } from "vitest";
import { RouterUtils } from "../RouterUtils";

// Mock window.history and window.location
const mockHistory = {
    pushState: vi.fn(),
    replaceState: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    length: 10,
};

const mockLocation = {
    pathname: "/",
    search: "",
    hash: "",
    href: "http://localhost/",
};

Object.defineProperty(window, "history", {
    value: mockHistory,
    writable: true,
});

Object.defineProperty(window, "location", {
    value: mockLocation,
    writable: true,
    configurable: true,
});

describe("RouterUtils", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Reset mock location
        mockLocation.pathname = "/";
        mockLocation.search = "";
        mockLocation.hash = "";
        mockLocation.href = "http://localhost/";
    });

    describe("navigate", () => {
        it("should push state and dispatch popstate event", () => {
            const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

            RouterUtils.navigate("/test");

            expect(mockHistory.pushState).toHaveBeenCalledWith(null, "", "/test");
            expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(PopStateEvent));
        });

        it("should replace state when replace is true", () => {
            const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

            RouterUtils.navigate("/test", true);

            expect(mockHistory.replaceState).toHaveBeenCalledWith(null, "", "/test");
            expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(PopStateEvent));
        });
    });

    describe("parseRoute", () => {
        it("should match exact routes", () => {
            const result = RouterUtils.parseRoute("/about", "/about");

            expect(result).toEqual({
                route: "/about",
                params: {},
                exact: true,
            });
        });

        it("should match wildcard routes", () => {
            const result = RouterUtils.parseRoute("*", "/anything");

            expect(result).toEqual({
                route: "*",
                params: {},
                exact: false,
            });
        });

        it("should match parameter routes", () => {
            const result = RouterUtils.parseRoute("/users/:id", "/users/123");

            expect(result).toEqual({
                route: "/users/:id",
                params: { id: "123" },
                exact: true,
            });
        });

        it("should match complex parameter routes", () => {
            const result = RouterUtils.parseRoute(
                "/users/:userId/posts/:postId",
                "/users/123/posts/456"
            );

            expect(result).toEqual({
                route: "/users/:userId/posts/:postId",
                params: { userId: "123", postId: "456" },
                exact: true,
            });
        });

        it("should match prefix routes", () => {
            const result = RouterUtils.parseRoute("/admin/*", "/admin/dashboard");

            expect(result).toEqual({
                route: "/admin/*",
                params: {},
                exact: false,
            });
        });

        it("should return null for no match", () => {
            const result = RouterUtils.parseRoute("/users", "/posts");

            expect(result).toBeNull();
        });
    });

    describe("buildPath", () => {
        it("should build path without parameters", () => {
            const path = RouterUtils.buildPath("/about");
            expect(path).toBe("/about");
        });

        it("should build path with parameters", () => {
            const path = RouterUtils.buildPath("/users/:id", { id: "123" });
            expect(path).toBe("/users/123");
        });

        it("should encode parameters", () => {
            const path = RouterUtils.buildPath("/search/:query", { query: "hello world" });
            expect(path).toBe("/search/hello%20world");
        });
    });

    describe("isRouteActive", () => {
        beforeEach(() => {
            mockLocation.pathname = "/users/123";
        });

        it("should match exact routes", () => {
            expect(RouterUtils.isRouteActive("/users/123", true)).toBe(true);
            expect(RouterUtils.isRouteActive("/users", true)).toBe(false);
        });

        it("should match prefix routes", () => {
            expect(RouterUtils.isRouteActive("/users")).toBe(true);
            expect(RouterUtils.isRouteActive("/posts")).toBe(false);
        });

        it("should handle root path exactly", () => {
            mockLocation.pathname = "/";
            expect(RouterUtils.isRouteActive("/")).toBe(true);

            mockLocation.pathname = "/users";
            expect(RouterUtils.isRouteActive("/")).toBe(false);
        });
    });

    describe("getRouteDepth", () => {
        it("should calculate route depth correctly", () => {
            expect(RouterUtils.getRouteDepth("/")).toBe(0);
            expect(RouterUtils.getRouteDepth("/users")).toBe(1);
            expect(RouterUtils.getRouteDepth("/users/123")).toBe(2);
            expect(RouterUtils.getRouteDepth("/users/123/posts/456")).toBe(4);
        });
    });

    describe("getParentRoute", () => {
        it("should get parent route correctly", () => {
            expect(RouterUtils.getParentRoute("/users/123/posts")).toBe("/users/123");
            expect(RouterUtils.getParentRoute("/users/123")).toBe("/users");
            expect(RouterUtils.getParentRoute("/users")).toBe("/");
            expect(RouterUtils.getParentRoute("/")).toBe("/");
        });
    });

    describe("joinPaths", () => {
        it("should join paths correctly", () => {
            expect(RouterUtils.joinPaths("admin", "users")).toBe("/admin/users");
            expect(RouterUtils.joinPaths("/admin/", "/users/")).toBe("/admin/users");
            expect(RouterUtils.joinPaths("", "users", "", "profile")).toBe("/users/profile");
        });
    });

    describe("isExternalUrl", () => {
        it("should identify external URLs", () => {
            expect(RouterUtils.isExternalUrl("https://example.com")).toBe(true);
            expect(RouterUtils.isExternalUrl("http://example.com")).toBe(true);
            expect(RouterUtils.isExternalUrl("mailto:test@example.com")).toBe(true);
            expect(RouterUtils.isExternalUrl("tel:+1234567890")).toBe(true);
            expect(RouterUtils.isExternalUrl("/internal/path")).toBe(false);
            expect(RouterUtils.isExternalUrl("internal")).toBe(false);
        });
    });

    describe("history methods", () => {
        it("should call history.back", () => {
            RouterUtils.goBack();
            expect(mockHistory.back).toHaveBeenCalled();
        });

        it("should call history.forward", () => {
            RouterUtils.goForward();
            expect(mockHistory.forward).toHaveBeenCalled();
        });

        it("should get history length", () => {
            expect(RouterUtils.getHistoryLength()).toBe(10);
        });

        it("should replace current route", () => {
            const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

            RouterUtils.replace("/new-path");

            expect(mockHistory.replaceState).toHaveBeenCalledWith(null, "", "/new-path");
            expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(PopStateEvent));
        });
    });
});
