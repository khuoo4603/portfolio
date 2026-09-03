import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("Frontend Health Route", () => {
  it("외부 의존성 없이 UP 응답", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ status: "UP" });
  });
});
