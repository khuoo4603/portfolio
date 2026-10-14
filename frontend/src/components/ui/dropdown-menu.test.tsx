import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DropdownMenu from "./dropdown-menu";

describe("공통 DropdownMenu", () => {
  afterEach(cleanup);

  it("메뉴 항목 실행 뒤 Trigger Focus를 복귀", () => {
    const onRename = vi.fn();
    render(<DropdownMenu triggerLabel="과목 메뉴" items={[{ label: "이름 변경", onSelect: onRename }, { label: "과목 삭제", danger: true, onSelect: vi.fn() }]} />);

    const trigger = screen.getByRole("button", { name: "과목 메뉴" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "이름 변경" }));

    expect(onRename).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("Escape와 외부 Pointer로 메뉴를 닫기", () => {
    render(<><DropdownMenu triggerLabel="계정 작업" items={[{ label: "활성화", onSelect: vi.fn() }]} /><button type="button">외부</button></>);
    const trigger = screen.getByRole("button", { name: "계정 작업" });

    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.click(trigger);
    fireEvent.pointerDown(screen.getByRole("button", { name: "외부" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
