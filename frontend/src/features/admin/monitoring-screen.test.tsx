import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { NotificationProvider } from "@/components/ui/notification/notification-provider";
import type { AdminMonitoringData } from "./admin-types";
import { createMonitoringTarget, getAdminMonitoring, updateMonitoringSettings, updateMonitoringTarget } from "./admin-read-api";
import MonitoringScreen from "./monitoring-screen";

vi.mock("./admin-read-api", () => ({
  getAdminMonitoring: vi.fn(),
  updateMonitoringSettings: vi.fn(),
  createMonitoringTarget: vi.fn(),
  updateMonitoringTarget: vi.fn(),
}));

function monitoringData(): AdminMonitoringData {
  return {
    settings: {
      enabled: true,
      checkIntervalSeconds: 60,
      connectTimeoutMs: 2_000,
      requestTimeoutMs: 3_000,
      retryDelayMs: 0,
      maxRetries: 1,
      updatedAt: "2026-09-19T10:00:00+09:00",
    },
    targets: [
      {
        id: 7,
        serviceKey: "PORTFOLIO_BACKEND",
        displayName: "Portfolio API",
        healthUrl: "http://portfolio-backend:8080/actuator/health/readiness/very-long-path",
        enabled: true,
        displayOrder: 0,
        createdAt: "2026-09-19T10:00:00+09:00",
        updatedAt: "2026-09-19T10:00:00+09:00",
      },
      {
        id: 8,
        serviceKey: "LEGACY_SERVICE",
        displayName: "Legacy Service",
        healthUrl: null,
        enabled: false,
        displayOrder: 1,
        createdAt: "2026-09-19T10:00:00+09:00",
        updatedAt: "2026-09-19T10:00:00+09:00",
      },
    ],
  };
}

describe("Monitoring 독립 관리 화면", () => {
  beforeEach(() => {
    vi.mocked(getAdminMonitoring).mockReset();
    vi.mocked(updateMonitoringSettings).mockReset();
    vi.mocked(createMonitoringTarget).mockReset();
    vi.mocked(updateMonitoringTarget).mockReset();
    vi.mocked(getAdminMonitoring).mockImplementation(async () => monitoringData());
  });

  afterEach(() => cleanup());

  it("Settings와 전체 Target을 독립 Surface로 표시", async () => {
    render(<MonitoringScreen />);

    expect(await screen.findByRole("heading", { name: "Monitoring" })).toBeInTheDocument();
    expect(screen.getByText("서비스 점검 설정과 Monitoring Target을 관리합니다.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Monitoring 설정" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Target" })).toBeInTheDocument();
    expect(screen.getByText("URL 미설정")).toBeInTheDocument();
    expect(screen.queryByText("점검 주기와 요청 정책을 관리합니다.")).not.toBeInTheDocument();
    expect(screen.queryByText("등록된 전체 서비스 점검 대상을 관리합니다.")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Monitoring 설정" })).not.toBeInTheDocument();
  });

  it("첫 조회 오류를 표시하고 재시도로 Monitoring 데이터를 다시 조회", async () => {
    vi.mocked(getAdminMonitoring)
      .mockRejectedValueOnce(new ApiError(503, {
        code: "COMMON_INTERNAL_ERROR",
        message: "Monitoring 정보를 불러올 수 없습니다.",
        traceId: "trace-monitoring",
        fieldErrors: [],
      }))
      .mockImplementation(async () => monitoringData());
    render(<MonitoringScreen />);

    expect(await screen.findByText("Monitoring 정보를 불러올 수 없습니다. (추적 ID: trace-monitoring)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(await screen.findByText("Portfolio API")).toBeInTheDocument();
  });

  it("GET settings.enabled와 무관하게 전역 Switch 없이 5개 설정 필드를 표시", async () => {
    vi.mocked(getAdminMonitoring).mockImplementation(async () => ({
      ...monitoringData(),
      settings: { ...monitoringData().settings, enabled: false },
    }));
    render(<MonitoringScreen />);

    expect(await screen.findByRole("heading", { name: "Monitoring 설정" })).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "Monitoring 활성 전환" })).not.toBeInTheDocument();
    expect(updateMonitoringSettings).not.toHaveBeenCalled();
    expect(screen.getAllByRole("button", { name: "설정 저장" })).toHaveLength(1);
    ["검사 주기", "연결 Timeout", "요청 Timeout", "Retry Delay", "최대 재시도"].forEach((label) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });
  });

  it("설정 저장은 enabled true를 포함한 5개 숫자 payload를 Header 버튼으로 전송", async () => {
    vi.mocked(updateMonitoringSettings).mockResolvedValue(monitoringData().settings);
    render(<MonitoringScreen />);

    const interval = await screen.findByLabelText("검사 주기");
    fireEvent.change(interval, { target: { value: "120" } });
    fireEvent.click(screen.getByRole("button", { name: "설정 저장" }));
    await waitFor(() => expect(updateMonitoringSettings).toHaveBeenCalledWith({
      enabled: true,
      checkIntervalSeconds: 120,
      connectTimeoutMs: 2_000,
      requestTimeoutMs: 3_000,
      retryDelayMs: 0,
      maxRetries: 1,
    }));
    expect(screen.getAllByRole("button", { name: "설정 저장" })).toHaveLength(1);
  });

  it("Settings 숫자 입력은 빈 값과 0을 구분해 검증", async () => {
    render(<MonitoringScreen />);

    const interval = await screen.findByLabelText("검사 주기");
    fireEvent.change(interval, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "설정 저장" }));
    expect(interval).toHaveAttribute("aria-invalid", "true");
    expect(updateMonitoringSettings).not.toHaveBeenCalled();
  });

  it("URL이 있는 Target은 목록 Switch에서 serviceKey 없이 PATCH", async () => {
    vi.mocked(updateMonitoringTarget).mockResolvedValue(monitoringData().targets[0]);
    render(<MonitoringScreen />);

    const toggle = await screen.findByRole("switch", { name: "Portfolio API 비활성화" });
    fireEvent.click(toggle);
    await waitFor(() => expect(updateMonitoringTarget).toHaveBeenCalledWith(7, {
      displayName: "Portfolio API",
      healthUrl: "http://portfolio-backend:8080/actuator/health/readiness/very-long-path",
      enabled: false,
      displayOrder: 0,
    }));
  });

  it("URL 없는 OFF Target을 활성화하면 enabled Draft의 수정 Dialog를 열기", async () => {
    render(<MonitoringScreen />);

    fireEvent.click(await screen.findByRole("switch", { name: "Legacy Service 활성화" }));
    const dialog = await screen.findByRole("dialog", { name: "Target 수정" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Legacy Service 비활성화" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("button", { name: "Target 저장" }));
    expect(await screen.findByText("활성 Target에는 Health URL이 필요합니다.")).toBeInTheDocument();
    expect(updateMonitoringTarget).not.toHaveBeenCalled();
  });

  it("Target 추가 Dialog는 빈 URL을 null로 POST", async () => {
    vi.mocked(createMonitoringTarget).mockResolvedValue(monitoringData().targets[1]);
    render(<MonitoringScreen />);

    await screen.findByText("Portfolio API");
    fireEvent.click(screen.getByRole("button", { name: "Target 추가" }));
    fireEvent.change(screen.getByLabelText("Service Key"), { target: { value: "NEW_SERVICE" } });
    fireEvent.change(screen.getByLabelText("표시명"), { target: { value: "New Service" } });
    fireEvent.click(screen.getByRole("button", { name: "Target 등록" }));
    await waitFor(() => expect(createMonitoringTarget).toHaveBeenCalledWith({
      serviceKey: "NEW_SERVICE",
      displayName: "New Service",
      healthUrl: null,
      enabled: false,
      displayOrder: 2,
    }));
  });

  it("Target 수정 Dialog는 Service Key를 읽기 전용으로 두고 PATCH에서 제외", async () => {
    vi.mocked(updateMonitoringTarget).mockResolvedValue(monitoringData().targets[0]);
    render(<MonitoringScreen />);

    await screen.findByText("Portfolio API");
    fireEvent.click(screen.getAllByRole("button", { name: "수정" })[0]);
    expect(screen.queryByRole("textbox", { name: "Service Key" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("표시명"), { target: { value: "Portfolio Runtime API" } });
    fireEvent.click(screen.getByRole("button", { name: "Target 저장" }));
    await waitFor(() => expect(updateMonitoringTarget).toHaveBeenCalledWith(7, {
      displayName: "Portfolio Runtime API",
      healthUrl: "http://portfolio-backend:8080/actuator/health/readiness/very-long-path",
      enabled: true,
      displayOrder: 0,
    }));
  });

  it("Target Dialog Backend fieldErrors를 해당 입력에 표시", async () => {
    vi.mocked(createMonitoringTarget).mockRejectedValue(new ApiError(400, {
      code: "VALIDATION_ERROR",
      message: "입력값을 확인하세요.",
      traceId: "trace-target",
      fieldErrors: [{ field: "displayName", message: "표시명 중복" }],
    }));
    render(<NotificationProvider><MonitoringScreen /></NotificationProvider>);

    await screen.findByText("Portfolio API");
    fireEvent.click(screen.getByRole("button", { name: "Target 추가" }));
    fireEvent.change(screen.getByLabelText("Service Key"), { target: { value: "NEW_SERVICE" } });
    fireEvent.change(screen.getByLabelText("표시명"), { target: { value: "New Service" } });
    fireEvent.click(screen.getByRole("button", { name: "Target 등록" }));
    expect(await screen.findByText("표시명 중복")).toBeInTheDocument();
    expect(screen.getByLabelText("표시명")).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("Settings 일반 요청 오류는 Notification으로 표시", async () => {
    vi.mocked(updateMonitoringSettings).mockRejectedValue(new ApiError(500, {
      code: "COMMON_INTERNAL_ERROR",
      message: "설정 저장을 완료하지 못했습니다.",
      traceId: "trace-settings",
      fieldErrors: [],
    }));
    render(<NotificationProvider><MonitoringScreen /></NotificationProvider>);

    await screen.findByLabelText("검사 주기");
    fireEvent.click(screen.getByRole("button", { name: "설정 저장" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("설정 저장을 완료하지 못했습니다.");
  });

  it("Settings Backend fieldErrors는 입력 오류만 표시", async () => {
    vi.mocked(updateMonitoringSettings).mockRejectedValue(new ApiError(400, {
      code: "VALIDATION_ERROR",
      message: "입력값을 확인하세요.",
      traceId: "trace-settings-field",
      fieldErrors: [{ field: "checkIntervalSeconds", message: "검사 주기 오류" }],
    }));
    render(<NotificationProvider><MonitoringScreen /></NotificationProvider>);

    await screen.findByLabelText("검사 주기");
    fireEvent.click(screen.getByRole("button", { name: "설정 저장" }));

    expect(await screen.findByText("검사 주기 오류")).toBeInTheDocument();
    expect(screen.getByLabelText("검사 주기")).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("Target 일반 요청 오류는 Dialog를 유지하고 Notification으로 표시", async () => {
    vi.mocked(createMonitoringTarget).mockRejectedValue(new ApiError(500, {
      code: "COMMON_INTERNAL_ERROR",
      message: "Target을 등록하지 못했습니다.",
      traceId: "trace-target-general",
      fieldErrors: [],
    }));
    render(<NotificationProvider><MonitoringScreen /></NotificationProvider>);

    await screen.findByText("Portfolio API");
    fireEvent.click(screen.getByRole("button", { name: "Target 추가" }));
    fireEvent.change(screen.getByLabelText("Service Key"), { target: { value: "NEW_SERVICE" } });
    fireEvent.change(screen.getByLabelText("표시명"), { target: { value: "New Service" } });
    fireEvent.click(screen.getByRole("button", { name: "Target 등록" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Target을 등록하지 못했습니다.");
    expect(screen.getByRole("dialog", { name: "Target 추가" })).toBeInTheDocument();
  });
});
