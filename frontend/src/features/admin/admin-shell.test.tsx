import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminShell from "./admin-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => ({ replace: vi.fn() }),
}));

describe("Admin Desktop Sidebar", () => {
  afterEach(() => cleanup());

  it("초기 상태부터 전체 Navigation Label을 노출", () => {
    render(<AdminShell><div>관리 본문</div></AdminShell>);

    const sidebar = screen.getByLabelText("관리자 Sidebar 공간");
    const navigation = within(sidebar).getByRole("navigation", { name: "관리자 메뉴" });

    expect(sidebar.querySelector("[data-expanded]")).not.toBeInTheDocument();
    for (const label of ["Dashboard", "Site", "Accounts", "Tools", "Logs"]) {
      expect(within(navigation).getByText(label)).not.toHaveAttribute("aria-hidden");
    }
    expect(within(sidebar).getByText("Theme")).toBeInTheDocument();
    expect(within(sidebar).getByText("Logout")).toBeInTheDocument();
  });
});
