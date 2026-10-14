import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ConfirmDialog from "./confirm-dialog";
import DialogFrame from "./dialog-frame";

describe("공통 Dialog Frame", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("제목·설명·본문·Footer를 연결하고 Escape로 닫기", () => {
    const onClose = vi.fn();
    render(<DialogFrame open title="계정 생성" description="새 계정 정보 입력" onClose={onClose} footer={<button type="button">계정 생성</button>}><label>이름<input /></label></DialogFrame>);
    const dialog = screen.getByRole("dialog", { name: "계정 생성" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(within(dialog).getByText("새 계정 정보 입력")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("이름")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("Backdrop 정책과 닫기 후 Trigger Focus 복귀를 유지", async () => {
    const onClose = vi.fn();
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    const { container, rerender } = render(<DialogFrame open title="확인" onClose={onClose}><button type="button">본문 작업</button></DialogFrame>);
    await waitFor(() => expect(screen.getByRole("button", { name: "대화상자 닫기" })).toHaveFocus());
    fireEvent.mouseDown(container.firstElementChild!);
    expect(onClose).toHaveBeenCalledOnce();
    rerender(<DialogFrame open={false} title="확인" onClose={onClose} />);
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it("부모 재렌더링 중에도 입력 Focus를 유지하고 닫을 때 Trigger로 복귀", async () => {
    function RerenderingDialog() {
      const [open, setOpen] = useState(false);
      const [value, setValue] = useState("");

      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>열기</button>
          <DialogFrame open={open} title="과목 추가" onClose={() => setOpen(false)}>
            <label>과목 이름<input value={value} onChange={(event) => setValue(event.currentTarget.value)} /></label>
          </DialogFrame>
        </>
      );
    }

    vi.useFakeTimers();
    render(<RerenderingDialog />);
    const trigger = screen.getByRole("button", { name: "열기" });
    trigger.focus();
    fireEvent.click(trigger);
    const input = screen.getByLabelText("과목 이름");
    await act(async () => vi.runAllTimers());
    expect(input).toHaveFocus();

    fireEvent.change(input, { target: { value: "서버구축" } });
    expect(screen.getByLabelText("과목 이름")).toBe(input);
    expect(input).toHaveValue("서버구축");
    expect(input).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "과목 추가" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("Confirm 실행 중 취소와 중복 실행을 차단", async () => {
    let resolve: (() => void) | undefined;
    const onConfirm = vi.fn(() => new Promise<void>((done) => { resolve = done; }));
    render(<ConfirmDialog open title="저장본 삭제" description="저장된 문제를 삭제할까요?" confirmLabel="삭제" danger onCancel={vi.fn()} onConfirm={onConfirm} />);
    const confirm = screen.getByRole("dialog", { name: "저장본 삭제" });
    const action = within(confirm).getByRole("button", { name: "삭제" });
    fireEvent.click(action);
    fireEvent.click(action);
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(action).toBeDisabled();
    expect(within(confirm).getByRole("button", { name: "취소" })).toBeDisabled();
    await act(async () => resolve?.());
  });
});
