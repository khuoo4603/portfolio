import { createServer, Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loggingMocks = vi.hoisted(() => ({
  log: vi.fn(),
  recordFrontendError: vi.fn(),
}));

vi.mock("winston", () => {
  const format = Object.assign(
    vi.fn((transform: unknown) => vi.fn(() => ({ transform }))),
    {
      combine: vi.fn(() => ({})),
      printf: vi.fn(() => ({})),
    },
  );

  return {
    createLogger: vi.fn(() => ({ log: loggingMocks.log })),
    format,
    transports: { Console: class ConsoleTransport {} },
  };
});

vi.mock("winston-daily-rotate-file", () => ({
  default: class DailyRotateFileTransport {
    format: unknown;

    constructor(options: { format?: unknown }) {
      this.format = options.format;
    }

    on() {
      return this;
    }
  },
}));

vi.mock("@/lib/logging/frontend-error", () => ({
  recordFrontendError: loggingMocks.recordFrontendError,
}));

import { onRequestError } from "./instrumentation";
import { registerFrontendRequestLogging } from "./lib/logging/server-logger";

const ORIGINAL_NEXT_RUNTIME = process.env.NEXT_RUNTIME;
const ORIGINAL_LOG_PATH = process.env.LOG_PATH;
const REQUEST_LOGGING_KEY = "__portfolioFrontendRequestLogging";

describe("Frontend 요청 오류 Instrumentation", () => {
  beforeEach(() => {
    process.env.NEXT_RUNTIME = "nodejs";
    process.env.LOG_PATH = tmpdir();
    loggingMocks.log.mockReset();
    loggingMocks.recordFrontendError.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    if (ORIGINAL_NEXT_RUNTIME === undefined) {
      delete process.env.NEXT_RUNTIME;
    } else {
      process.env.NEXT_RUNTIME = ORIGINAL_NEXT_RUNTIME;
    }
    if (ORIGINAL_LOG_PATH === undefined) {
      delete process.env.LOG_PATH;
    } else {
      process.env.LOG_PATH = ORIGINAL_LOG_PATH;
    }
  });

  it("onRequestError Stack을 최종 5xx Request Log 한 건에 연결", async () => {
    const originalEmit = Server.prototype.emit;
    const loggingGlobal = globalThis as typeof globalThis & { [REQUEST_LOGGING_KEY]?: boolean };
    delete loggingGlobal[REQUEST_LOGGING_KEY];
    registerFrontendRequestLogging();

    const server = createServer(async (request, response) => {
      await onRequestError(
        new Error("민감 오류 원문"),
        {
          headers: request.headers,
          method: request.method ?? "GET",
          path: request.url ?? "/",
        },
        {
          routerKind: "App Router",
          revalidateReason: undefined,
          routePath: "/failure",
          routeType: "render",
        },
      );
      response.statusCode = 500;
      response.end("failure");
    });

    try {
      await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
      });
      const address = server.address() as AddressInfo;
      const response = await fetch(`http://127.0.0.1:${address.port}/failure`, {
        headers: { "X-Request-Id": "frontend-duplicate-test" },
      });

      expect(response.status).toBe(500);
      expect(loggingMocks.log).toHaveBeenCalledTimes(1);
      expect(loggingMocks.log).toHaveBeenCalledWith(
        "error",
        "요청 처리 중 오류 발생",
        expect.objectContaining({
          errorCode: "FRONTEND_INTERNAL_ERROR",
          stackTrace: expect.stringContaining("instrumentation.test.ts"),
          status: 500,
          traceId: "frontend-duplicate-test",
        }),
      );
      expect(loggingMocks.recordFrontendError).toHaveBeenCalledTimes(1);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      Server.prototype.emit = originalEmit;
      delete loggingGlobal[REQUEST_LOGGING_KEY];
    }
  });
});
