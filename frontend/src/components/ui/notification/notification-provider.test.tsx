import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotificationProvider, useNotification } from "./notification-provider";

function NotificationTrigger({ type = "success", title = "저장 완료", message = "변경사항을 저장했습니다." }: { type?: "success" | "info" | "error"; title?: string; message?: string }) {
  const { notify } = useNotification();

  return <button type="button" onClick={() => notify({ type, title, message })}>알림 추가</button>;
}

describe("NotificationProvider", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("success와 info 알림을 status로 표시하고 10초 후 제거", () => {
    vi.useFakeTimers();
    render(<NotificationProvider><NotificationTrigger /></NotificationProvider>);

    fireEvent.click(screen.getByRole("button", { name: "알림 추가" }));
    expect(screen.getByRole("status")).toHaveTextContent("저장 완료");
    act(() => vi.advanceTimersByTime(10_180));
    expect(screen.queryByRole("status")).toBeNull();

    render(<NotificationProvider><NotificationTrigger type="info" title="동기화 완료" /></NotificationProvider>);
    fireEvent.click(screen.getAllByRole("button", { name: "알림 추가" })[1]);
    expect(screen.getByRole("status")).toHaveTextContent("동기화 완료");
    act(() => vi.advanceTimersByTime(10_180));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("error 알림은 alert로 표시하고 30초 후 제거", () => {
    vi.useFakeTimers();
    render(<NotificationProvider><NotificationTrigger type="error" title="저장 실패" message="다시 시도해 주세요." /></NotificationProvider>);
    fireEvent.click(screen.getByRole("button", { name: "알림 추가" }));
    const notification = screen.getByRole("alert");
    expect(notification).toHaveTextContent("저장 실패");
    act(() => vi.advanceTimersByTime(29_999));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(181));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("직접 닫기는 180ms 퇴장 Animation 뒤에 제거", () => {
    vi.useFakeTimers();
    render(<NotificationProvider><NotificationTrigger type="error" title="저장 실패" message="다시 시도해 주세요." /></NotificationProvider>);
    fireEvent.click(screen.getByRole("button", { name: "알림 추가" }));
    const notification = screen.getByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "저장 실패 알림 닫기" }));
    expect(notification).toHaveAttribute("data-closing", "true");
    act(() => vi.advanceTimersByTime(179));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("다섯 번째 알림은 가장 오래된 Active 알림을 closing으로 전환", () => {
    function StackTrigger() {
      const { notify } = useNotification();
      const index = useRef(0);
      return <button type="button" onClick={() => { index.current += 1; notify({ type: "info", title: `알림 ${index.current}`, message: "확인" }); }}>추가</button>;
    }

    vi.useFakeTimers();
    render(<NotificationProvider><StackTrigger /></NotificationProvider>);
    const trigger = screen.getByRole("button", { name: "추가" });
    for (let index = 1; index <= 5; index += 1) {
      fireEvent.click(trigger);
    }

    const notifications = screen.getAllByRole("status");
    expect(notifications.filter((item) => item.getAttribute("data-closing") !== "true")).toHaveLength(4);
    expect(screen.getByText("알림 1").closest("section")).toHaveAttribute("data-closing", "true");
    act(() => vi.advanceTimersByTime(180));
    expect(screen.queryByText("알림 1")).toBeNull();
  });

  it("Closing 알림은 새 알림을 추가해도 Exit Animation 동안 DOM에 유지", () => {
    function StackTrigger() {
      const { notify } = useNotification();
      const index = useRef(0);
      return <button type="button" onClick={() => { index.current += 1; notify({ type: "info", title: `알림 ${index.current}`, message: "확인" }); }}>추가</button>;
    }

    vi.useFakeTimers();
    render(<NotificationProvider><StackTrigger /></NotificationProvider>);
    const trigger = screen.getByRole("button", { name: "추가" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "알림 1 알림 닫기" }));
    fireEvent.click(trigger);

    expect(screen.getAllByRole("status")).toHaveLength(2);
    expect(screen.getByText("알림 1").closest("section")).toHaveAttribute("data-closing", "true");
    expect(screen.getByText("알림 2")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(179));
    expect(screen.getByText("알림 1")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText("알림 1")).toBeNull();
  });

  it("Provider unmount 시 예약된 알림 타이머를 정리", () => {
    vi.useFakeTimers();
    const clearTimer = vi.spyOn(window, "clearTimeout");
    const { unmount } = render(<NotificationProvider><NotificationTrigger /></NotificationProvider>);

    fireEvent.click(screen.getByRole("button", { name: "알림 추가" }));
    unmount();

    expect(clearTimer).toHaveBeenCalled();
  });
});
