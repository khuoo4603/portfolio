import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { Server } from "node:http";
import { resolve } from "node:path";
import { createLogger, format, transports, type Logger } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { classifyFrontendRequest, sanitizeLogPath, type FrontendLogLevel } from "./log-policy";

const REQUEST_ID_HEADER = "x-request-id";
const TRACE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const REQUEST_LOGGING_KEY = "__portfolioFrontendRequestLogging";

type RequestLog = {
  method: string;
  path: string;
  status: number;
  durationMs: number;
  traceId: string;
  proxyFailure?: boolean;
  errorCode?: string;
  stack?: string;
};

type LoggingGlobal = typeof globalThis & {
  [REQUEST_LOGGING_KEY]?: boolean;
};

type RequestLoggingContext = {
  traceId: string;
  errorCode?: string;
  stack?: string;
};

let logger: Logger | null = null;
const requestLoggingContext = new AsyncLocalStorage<RequestLoggingContext>();

// Next.js Node Server의 실제 응답 완료 시점 기반 요청 로그 연결
export function registerFrontendRequestLogging() {
  const loggingGlobal = globalThis as LoggingGlobal;
  if (loggingGlobal[REQUEST_LOGGING_KEY]) {
    return;
  }
  loggingGlobal[REQUEST_LOGGING_KEY] = true;

  const originalEmit = Server.prototype.emit;
  Server.prototype.emit = function emit(this: Server, event: string | symbol, ...args: unknown[]) {
    if (event === "request") {
      const request = args[0] as {
        headers?: Record<string, string | string[] | undefined>;
        method?: string;
        url?: string;
      };
      const response = args[1] as {
        headersSent?: boolean;
        once?: (event: string, listener: () => void) => void;
        setHeader?: (name: string, value: string) => void;
        statusCode?: number;
      };
      const startedAt = process.hrtime.bigint();
      const traceId = resolveFrontendTraceId(request.headers?.[REQUEST_ID_HEADER]);

      if (request.headers) {
        request.headers[REQUEST_ID_HEADER] = traceId;
      }
      if (!response.headersSent) {
        response.setHeader?.("X-Request-Id", traceId);
      }
      const requestContext: RequestLoggingContext = { traceId };
      response.once?.("finish", () => {
        const status = response.statusCode ?? 500;
        const exception = status >= 500 ? requestContext : undefined;
        writeFrontendRequestLog({
          method: request.method ?? "GET",
          path: request.url ?? "/",
          status,
          durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000,
          traceId,
          errorCode: exception?.errorCode,
          stack: exception?.stack,
        });
      });
      return requestLoggingContext.run(
        requestContext,
        () => Reflect.apply(originalEmit, this, [event, ...args]) as boolean,
      );
    }
    return Reflect.apply(originalEmit, this, [event, ...args]) as boolean;
  } as typeof Server.prototype.emit;
}

// 상태 분류와 고정 필드만 사용하는 Frontend 요청 파일 로그 기록
export function writeFrontendRequestLog(entry: RequestLog) {
  const decision = classifyFrontendRequest(entry.path, entry.status, entry.proxyFailure);
  if (!decision) {
    return;
  }

  getLogger().log(decision.level, decision.message, {
    environment: environmentName(),
    traceId: resolveFrontendTraceId(entry.traceId),
    method: sanitizeMethod(entry.method),
    path: sanitizeLogPath(entry.path),
    status: entry.status,
    durationMs: Math.max(0, Math.round(entry.durationMs)),
    ...(entry.errorCode ? { errorCode: entry.errorCode.slice(0, 100) } : {}),
    ...(entry.stack ? { stackTrace: safeStack(entry.stack) } : {}),
  });
}

// Next.js Exception 정보를 현재 HTTP 요청의 최종 응답 로그에 연결
export function attachFrontendException(entry: Omit<RequestLog, "status" | "durationMs"> & { stack?: string }) {
  const requestContext = requestLoggingContext.getStore();
  if (!requestContext || requestContext.traceId !== entry.traceId) {
    return false;
  }
  requestContext.errorCode ??= entry.errorCode;
  requestContext.stack ??= entry.stack;
  return true;
}

function getLogger() {
  if (logger) {
    return logger;
  }

  const logPath = resolve(/* turbopackIgnore: true */ process.env.LOG_PATH?.trim() || "build/logs");
  mkdirSync(logPath, { recursive: true });
  const lineFormat = format.printf((info) => JSON.stringify({
    timestamp: kstTimestamp(),
    level: String(info.level).toUpperCase(),
    service: "frontend",
    environment: info.environment,
    traceId: info.traceId,
    method: info.method,
    path: info.path,
    status: info.status,
    durationMs: info.durationMs,
    ...(info.errorCode ? { errorCode: info.errorCode } : {}),
    message: info.message,
    ...(info.stackTrace ? { stack: info.stackTrace } : {}),
  }));
  const applicationTransport = rotatingTransport(logPath, "application", "application.log", "info", lineFormat);
  applicationTransport.format = format.combine(
    format((info) => info.level === "error" ? false : info)(),
    lineFormat,
  );
  const errorTransport = rotatingTransport(logPath, "error", "error.log", "error", lineFormat);

  logger = createLogger({
    levels: { error: 0, warn: 1, info: 2 },
    transports: [
      new transports.Console({ format: lineFormat }),
      applicationTransport,
      errorTransport,
    ],
  });
  return logger;
}

function rotatingTransport(
  logPath: string,
  fileName: string,
  symlinkName: string,
  level: FrontendLogLevel,
  lineFormat: ReturnType<typeof format.printf>,
) {
  const transport = new DailyRotateFile({
    dirname: logPath,
    filename: `${fileName}-%DATE%`,
    datePattern: "YYYY-MM-DD",
    extension: ".log",
    level,
    maxSize: "50m",
    zippedArchive: false,
    createSymlink: true,
    symlinkName,
    auditFile: resolve(logPath, `.${fileName}-audit.json`),
    format: lineFormat,
  });
  transport.on("error", () => {
    console.error(`[frontend-logging] ${fileName} 파일 기록 실패`);
  });
  return transport;
}

export function resolveFrontendTraceId(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && TRACE_ID.test(candidate) ? candidate : randomUUID();
}

function sanitizeMethod(method: string) {
  return method.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 10) || "GET";
}

function safeStack(stack: string) {
  return stack.split("\n").slice(1, 31).join("\n").slice(0, 8000);
}

function environmentName() {
  return (process.env.APP_ENVIRONMENT?.trim() || process.env.NODE_ENV || "default")
    .replace(/[^A-Za-z0-9,_-]/g, "")
    .slice(0, 50) || "default";
}

function kstTimestamp() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
    hourCycle: "h23",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}:${part("second")}.${part("fractionalSecond")}`;
}
