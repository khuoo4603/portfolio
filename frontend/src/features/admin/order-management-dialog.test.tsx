import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import OrderManagementDialog from "./order-management-dialog";

describe("표시 순서 관리 모달", () => {
  afterEach(() => cleanup());

  it("Site 탭 패널의 transform을 벗어나 body에 Portal로 렌더링하고 Footer에 저장·초기화 배치", async () => {
    const onClose = vi.fn();
    const onReset = vi.fn();
    const onSave = vi.fn();
    render(
      <div className="siteTabPanel">
        <OrderManagementDialog open dirty={false} onClose={onClose} onReset={onReset} onSave={onSave}>
          <p>순서 목록</p>
        </OrderManagementDialog>
      </div>,
    );

    const dialog = await screen.findByRole("dialog", { name: "표시 순서 관리" });
    expect(dialog.closest('[role="presentation"]')?.parentElement).toBe(document.body);
    const footer = dialog.querySelector("footer");
    expect(footer).toBeInTheDocument();
    expect(within(footer as HTMLElement).getByRole("button", { name: "초기화" })).toBeDisabled();
    expect(within(footer as HTMLElement).getByRole("button", { name: "순서 저장" })).toBeDisabled();
    expect(dialog.querySelector(".orderDialogToolbar")).not.toBeInTheDocument();
  });

  it("변경 상태에서 초기화는 저장 없이 호출되고 저장 버튼만 활성화", async () => {
    const onReset = vi.fn();
    const onSave = vi.fn();
    render(
      <OrderManagementDialog open dirty onClose={vi.fn()} onReset={onReset} onSave={onSave}>
        <p>순서 목록</p>
      </OrderManagementDialog>,
    );

    const dialog = await screen.findByRole("dialog", { name: "표시 순서 관리" });
    const reset = within(dialog).getByRole("button", { name: "초기화" });
    const save = within(dialog).getByRole("button", { name: "순서 저장" });
    expect(reset).toBeEnabled();
    expect(save).toBeEnabled();
    fireEvent.click(reset);
    expect(onReset).toHaveBeenCalledOnce();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("busy 상태에서는 Footer 동작 버튼과 닫기를 비활성화", async () => {
    const onClose = vi.fn();
    render(
      <OrderManagementDialog open dirty busy onClose={onClose} onReset={vi.fn()} onSave={vi.fn()}>
        <p>순서 목록</p>
      </OrderManagementDialog>,
    );

    const dialog = await screen.findByRole("dialog", { name: "표시 순서 관리" });
    expect(within(dialog).getByRole("button", { name: "초기화" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "순서 저장" })).toBeDisabled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("모바일 표의 표시 순서 전용 grid 영역을 제거", () => {
    const css = readFileSync(resolve(process.cwd(), "src/features/admin/admin.module.css"), "utf8");
    expect(css).not.toMatch(/projectOrderSummary|monitoringOrderSummary/);
    expect(css).not.toMatch(/siteProfileTable td:nth-child\(6\)|siteExternalLinksTable td:nth-child\(3\)|toolLinksTable td:nth-child\(5\)/);
    expect(css).toContain('"year status"');
    expect(css).toContain('"status status"');
    expect(css).toContain('"organization organization organization"');
    expect(css).toContain('"category category status"');
  });
});
