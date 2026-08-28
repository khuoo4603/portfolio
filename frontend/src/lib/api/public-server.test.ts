import { afterEach, describe, expect, it, vi } from "vitest";
import { PUBLIC_PORTFOLIO_FIXTURE } from "@/test/public-portfolio-fixture";
import { PublicApiError, fetchPublicPortfolio } from "./public-server";

const ORIGINAL_BACKEND_BASE_URL = process.env.BACKEND_BASE_URL;

describe("Public Server API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    if (ORIGINAL_BACKEND_BASE_URL === undefined) {
      delete process.env.BACKEND_BASE_URL;
    } else {
      process.env.BACKEND_BASE_URL = ORIGINAL_BACKEND_BASE_URL;
    }
  });

  it("서버 전용 Backend Target과 no-store로 Portfolio를 조회", async () => {
    process.env.BACKEND_BASE_URL = "http://backend:8080/";
    const fetchMock = vi.fn().mockResolvedValue(Response.json(PUBLIC_PORTFOLIO_FIXTURE));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchPublicPortfolio()).resolves.toEqual(PUBLIC_PORTFOLIO_FIXTURE);
    expect(fetchMock).toHaveBeenCalledWith("http://backend:8080/api/v1/public/portfolio", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  });

  it("Backend ErrorResponse의 Status·traceId를 보존", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      code: "COMMON_INTERNAL_ERROR",
      message: "처리 실패",
      traceId: "trace-public",
      fieldErrors: [],
    }, { status: 503 })));

    const error = await fetchPublicPortfolio().catch((caught) => caught);
    expect(error).toBeInstanceOf(PublicApiError);
    expect(error).toMatchObject({ status: 503, response: { traceId: "trace-public" } });
  });
});
