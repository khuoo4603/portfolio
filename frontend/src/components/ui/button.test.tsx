import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Save } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Button from "./button";

describe("Button", () => {
  afterEach(cleanup);

  it("variant와 size, 추가 className을 유지", () => {
    render(<Button className="type-body custom-action" size="small" variant="secondary"><Save aria-hidden="true" />저장</Button>);

    const button = screen.getByRole("button", { name: "저장" });
    expect(button).toHaveClass("custom-action");
    expect(button.querySelector("svg")).not.toBeNull();
    expect(button).toHaveAttribute("data-button-size", "small");
  });

  it("medium 크기를 기본으로 적용", () => {
    render(<Button>저장</Button>);

    expect(screen.getByRole("button", { name: "저장" })).toHaveAttribute("data-button-size", "medium");
  });

  it("disabled 상태에서 click을 막는다", () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>저장</Button>);

    const button = screen.getByRole("button", { name: "저장" });
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("busy 상태에서 click을 막고 loader와 aria-busy를 표시", () => {
    const onClick = vi.fn();
    render(<Button busy onClick={onClick}>저장</Button>);

    const button = screen.getByRole("button", { name: "저장" });
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector("svg")).not.toBeNull();
    expect(onClick).not.toHaveBeenCalled();
  });
});
