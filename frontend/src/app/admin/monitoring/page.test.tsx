import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MonitoringPage, { metadata } from "./page";

vi.mock("@/features/admin/monitoring-screen", () => ({
  default: () => <div>Monitoring Screen</div>,
}));

describe("Admin Monitoring Route", () => {
  it("Monitoring Screen과 Admin Metadata를 제공", () => {
    render(<MonitoringPage />);

    expect(screen.getByText("Monitoring Screen")).toBeInTheDocument();
    expect(metadata.title).toBe("Monitoring | Portfolio Admin");
  });
});
