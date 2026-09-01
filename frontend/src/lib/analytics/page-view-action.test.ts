import { beforeEach, describe, expect, it, vi } from "vitest";
import { recordInternalPageView } from "./internal-analytics";
import { recordPageView } from "./page-view-action";

vi.mock("./internal-analytics", () => ({ recordInternalPageView: vi.fn() }));

describe("Page View Server Action 경계", () => {
  beforeEach(() => vi.mocked(recordInternalPageView).mockReset().mockResolvedValue(undefined));

  it("허용 Public path와 UUID만 내부 호출", async () => {
    await recordPageView("123e4567-e89b-42d3-a456-426614174000", "/");
    await recordPageView("123e4567-e89b-42d3-a456-426614174000", "/projects/kyvc");
    expect(recordInternalPageView).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["invalid", "/"],
    ["123e4567-e89b-42d3-a456-426614174000", "/admin"],
    ["123e4567-e89b-42d3-a456-426614174000", "/tools"],
    ["123e4567-e89b-42d3-a456-426614174000", "/projects/kyvc?token=secret"],
  ])("잘못된 visitorKey 또는 비대상 path를 차단", async (visitorKey, path) => {
    await recordPageView(visitorKey, path);
    expect(recordInternalPageView).not.toHaveBeenCalled();
  });
});
