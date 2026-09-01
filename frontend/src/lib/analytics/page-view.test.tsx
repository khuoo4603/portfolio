import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { recordInternalPageView } from "./internal-analytics";
import { recordPageView } from "./page-view-action";
import PageViewTracker from "./page-view-tracker";

vi.mock("./page-view-action", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./page-view-action")>();
  return { ...actual, recordPageView: vi.fn() };
});

const ORIGINAL_BACKEND_BASE_URL = process.env.BACKEND_BASE_URL;

describe("Public Page View Analytics", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    if (ORIGINAL_BACKEND_BASE_URL === undefined) delete process.env.BACKEND_BASE_URL;
    else process.env.BACKEND_BASE_URL = ORIGINAL_BACKEND_BASE_URL;
  });

  it("Server helper가 내부 API에 정확한 익명 UUID와 pathname만 전달", async () => {
    process.env.BACKEND_BASE_URL = "http://backend:8080";
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await recordInternalPageView({ visitorKey: "123e4567-e89b-42d3-a456-426614174000", path: "/projects/kyvc" });
    expect(fetchMock).toHaveBeenCalledWith("http://backend:8080/internal/v1/analytics/page-view", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorKey: "123e4567-e89b-42d3-a456-426614174000", path: "/projects/kyvc" }),
    });
  });

  it("내부 Analytics 연결 실패를 Public 오류로 전파하지 않음", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("backend unavailable")));
    await expect(recordInternalPageView({ visitorKey: "123e4567-e89b-42d3-a456-426614174000", path: "/" })).resolves.toBeUndefined();
  });

  it("Browser Tracker는 익명 UUID를 재사용하고 Server Action만 호출", async () => {
    const uuid = "123e4567-e89b-42d3-a456-426614174000";
    Object.defineProperty(window.crypto, "randomUUID", { configurable: true, value: vi.fn(() => uuid) });
    vi.mocked(recordPageView).mockResolvedValue(undefined);
    const first = render(<PageViewTracker path="/" />);
    await waitFor(() => expect(recordPageView).toHaveBeenCalledWith(uuid, "/"));
    first.unmount();
    render(<PageViewTracker path="/projects/kyvc" />);
    await waitFor(() => expect(recordPageView).toHaveBeenLastCalledWith(uuid, "/projects/kyvc"));
    expect(window.localStorage.getItem("portfolio_visitor_key")).toBe(uuid);
  });
});
