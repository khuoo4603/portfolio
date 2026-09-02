import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import SegmentedControl from "./segmented-control";

const OPTIONS = [
  { value: "ALL", label: "전체" },
  { value: "ACTIVE", label: "활성" },
] as const;

// 선택 상태와 변경 동작 검증 Fixture
function SegmentedControlFixture() {
  const [value, setValue] = useState<(typeof OPTIONS)[number]["value"]>("ALL");

  return (
    <SegmentedControl
      label="상태 필터"
      options={OPTIONS}
      value={value}
      onChange={setValue}
    />
  );
}

describe("SegmentedControl", () => {
  it("동일 그룹의 선택 항목만 활성 상태로 전환", () => {
    render(<SegmentedControlFixture />);

    const group = screen.getByRole("group", { name: "상태 필터" });
    const track = group.querySelector<HTMLElement>("[data-segment-track]");
    const allButton = within(group).getByRole("button", { name: "전체" });
    const activeButton = within(group).getByRole("button", { name: "활성" });

    expect(track?.style.getPropertyValue("--active-index")).toBe("0");
    expect(allButton).toHaveAttribute("aria-pressed", "true");
    expect(activeButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(activeButton);

    expect(track?.style.getPropertyValue("--active-index")).toBe("1");
    expect(allButton).toHaveAttribute("aria-pressed", "false");
    expect(activeButton).toHaveAttribute("aria-pressed", "true");
  });
});
