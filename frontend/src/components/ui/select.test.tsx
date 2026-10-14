import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Select from "./select";

const options = [
  { value: "", label: "전체" },
  { value: "USER", label: "USER" },
  { value: "ADMIN", label: "ADMIN" },
  { value: "BLOCKED", label: "BLOCKED", disabled: true },
];

describe("공통 Select", () => {
  afterEach(cleanup);

  it("선택값을 표시하고 키보드로 활성 Option을 선택", () => {
    function ControlledSelect() {
      const [value, setValue] = useState("USER");
      return <Select aria-label="권한" options={options} value={value} onValueChange={setValue} />;
    }

    render(<ControlledSelect />);
    const trigger = screen.getByRole("combobox", { name: "권한" });
    expect(trigger).toHaveTextContent("USER");

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const listbox = screen.getByRole("listbox", { name: "권한" });
    expect(within(listbox).getByRole("option", { name: "ADMIN" })).toHaveAttribute("aria-selected", "false");
    fireEvent.keyDown(trigger, { key: "Enter" });

    expect(trigger).toHaveTextContent("ADMIN");
    expect(screen.queryByRole("listbox", { name: "권한" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("Disabled Option을 건너뛰고 Escape와 외부 Pointer로 닫기", () => {
    const onValueChange = vi.fn();
    render(<><Select aria-label="권한" options={options} value="ADMIN" onValueChange={onValueChange} /><button type="button">외부</button></>);
    const trigger = screen.getByRole("combobox", { name: "권한" });

    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.getByRole("option", { name: "전체" })).toHaveAttribute("data-active", "true");
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("listbox", { name: "권한" })).not.toBeInTheDocument();
    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.click(trigger);
    fireEvent.pointerDown(screen.getByRole("button", { name: "외부" }));
    expect(screen.queryByRole("listbox", { name: "권한" })).not.toBeInTheDocument();
  });
});
