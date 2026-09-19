import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { StateSwitch } from "./admin-ui";

afterEach(() => cleanup());

describe("공용 StateSwitch", () => {
  it("switch 접근성 계약과 ON/OFF 상태 전환을 유지", () => {
    function Harness() {
      const [enabled, setEnabled] = useState(true);
      return <StateSwitch enabled={enabled} label="서비스 활성화" onClick={() => setEnabled((current) => !current)} />;
    }

    render(<Harness />);

    const toggle = screen.getByRole("switch", { name: "서비스 활성화" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(toggle).toHaveTextContent("ON");
    expect(toggle.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(toggle.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(toggle).toHaveTextContent("OFF");
  });
});
