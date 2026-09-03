import { describe, expect, it } from "vitest";
import { classifyFrontendRequest, sanitizeLogPath } from "./log-policy";

describe("Frontend 운영 파일 로그 분류", () => {
  it.each([
    [200, "info"],
    [204, "info"],
    [400, "warn"],
    [404, "warn"],
    [500, "error"],
    [504, "error"],
  ])("HTTP %s를 %s로 분류", (status, level) => {
    expect(classifyFrontendRequest("/login", status)?.level).toBe(level);
  });

  it.each([301, 302, 307, 308])("3xx %s를 장기 로그에서 제외", (status) => {
    expect(classifyFrontendRequest("/login", status)).toBeNull();
  });

  it.each([
    "/healthz",
    "/_next/static/chunks/app.js",
    "/_next/image/image.webp",
    "/favicon.ico",
    "/images/profile.png",
    "/fonts/site.woff2",
    "/video/hero.mp4",
  ])("정적·Health 경로 %s를 제외", (path) => {
    expect(classifyFrontendRequest(path, 200)).toBeNull();
  });

  it("정상 Backend Proxy 결과는 제외하고 Proxy 자체 장애만 기록", () => {
    expect(classifyFrontendRequest("/api/v1/public/portfolio", 500)).toBeNull();
    expect(classifyFrontendRequest("/api/v1/public/portfolio", 502, true)?.level).toBe("error");
  });

  it("민감 Query String을 로그 경로에서 제거", () => {
    expect(sanitizeLogPath("/login?password=secret#otp")).toBe("/login");
  });
});
