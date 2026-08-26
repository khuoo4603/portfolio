import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useState } from "react";
import OtpInput from "./otp-input";
import { formatCountdown } from "./challenge-time";

function ControlledOtp() {
  const [value, setValue] = useState("");
  return <OtpInput value={value} onChange={setValue} autoFocus />;
}

describe("6자리 인증번호 입력", () => {
  afterEach(cleanup);

  it("숫자 Paste를 여섯 입력칸에 분배", () => {
    render(<ControlledOtp />);
    const inputs = Array.from({ length: 6 }, (_, index) => screen.getByLabelText(`인증번호 ${index + 1}번째 숫자`) as HTMLInputElement);

    fireEvent.paste(inputs[0], { clipboardData: { getData: () => "12a3456" } });

    expect(inputs.map((input) => input.value).join("")).toBe("123456");
    expect(inputs[5]).toHaveFocus();
  });

  it("빈 입력칸 Backspace에서 이전 숫자를 지우고 Focus 이동", () => {
    render(<ControlledOtp />);
    const inputs = Array.from({ length: 6 }, (_, index) => screen.getByLabelText(`인증번호 ${index + 1}번째 숫자`) as HTMLInputElement);
    fireEvent.paste(inputs[0], { clipboardData: { getData: () => "123456" } });
    fireEvent.change(inputs[5], { target: { value: "" } });
    fireEvent.keyDown(inputs[5], { key: "Backspace" });

    expect(inputs.map((input) => input.value).join("")).toBe("1234");
    expect(inputs[4]).toHaveFocus();
  });

  it("남은 시간을 mm:ss로 표기", () => {
    expect(formatCountdown(65)).toBe("01:05");
    expect(formatCountdown(0)).toBe("00:00");
  });
});
