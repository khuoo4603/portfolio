import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MOCK_ADMIN_OTP } from "@/features/auth/mock-auth";
import SiteScreen from "./site-screen";

function confirmAdminAction() {
  fireEvent.paste(screen.getByLabelText("인증번호 1번째 숫자"), {
    clipboardData: { getData: () => MOCK_ADMIN_OTP },
  });
  fireEvent.click(screen.getByRole("button", { name: "변경 실행" }));
}

describe("Admin Site Mock 관리", () => {
  afterEach(() => cleanup());

  it("실제 Portfolio 기반 콘텐츠와 Registry를 일곱 탭에서 노출", () => {
    render(<SiteScreen />);

    expect(screen.getByRole("heading", { level: 1, name: "Site" })).toBeInTheDocument();
    expect(screen.getByText("포트폴리오에 노출되는 콘텐츠와 공개 상태를 관리합니다.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "메인·공통 콘텐츠" })).toBeInTheDocument();
    expect(screen.queryByText("이름, Hero, Footer에 연결된 고정값")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("김현우")).toBeInTheDocument();
    expect(screen.getByText("COMMON/NAME")).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(7);

    fireEvent.click(screen.getByRole("tab", { name: "프로필·학력·연락처" }));
    expect(screen.getByDisplayValue("성공회대학교")).toBeInTheDocument();
    expect(screen.getByText("CONTACT/EMAIL")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "경력·활동·수상·자격" }));
    expect(screen.getByText("QED")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "기술" }));
    expect(screen.getByText("Spring Boot")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "프로젝트" }));
    expect(screen.getByText("KYVC")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /프로젝트 추가/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "외부 링크" }));
    expect(screen.getByText("https://github.com/khuoo4603")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "이력서" }));
    expect(screen.getByText("미등록")).toBeInTheDocument();
    expect(screen.getByText("최대 10MB")).toBeInTheDocument();
  });

  it("콘텐츠 저장 결과를 로컬 상태에 유지", async () => {
    render(<SiteScreen />);

    fireEvent.change(screen.getByDisplayValue("김현우"), { target: { value: "김현우 Mock 수정" } });
    fireEvent.click(screen.getByRole("button", { name: "인증 후 저장" }));
    confirmAdminAction();

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("tab", { name: "프로필·학력·연락처" }));
    fireEvent.click(screen.getByRole("tab", { name: "메인·공통 콘텐츠" }));
    expect(screen.getByDisplayValue("김현우 Mock 수정")).toBeInTheDocument();
  });

  it("프로필 항목을 로컬 상태에서 추가·수정·상태 변경·삭제", async () => {
    render(<SiteScreen />);
    fireEvent.click(screen.getByRole("tab", { name: "경력·활동·수상·자격" }));

    fireEvent.click(screen.getByRole("button", { name: "항목 추가" }));
    fireEvent.change(screen.getByLabelText("제목"), { target: { value: "Mock 검증 항목" } });
    fireEvent.click(screen.getByRole("button", { name: "인증 후 저장" }));
    confirmAdminAction();
    await waitFor(() => expect(screen.getByText("Mock 검증 항목")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Mock 검증 항목 작업" }));
    fireEvent.click(screen.getByRole("button", { name: "수정" }));
    fireEvent.change(screen.getByLabelText("제목"), { target: { value: "Mock 수정 항목" } });
    fireEvent.click(screen.getByRole("button", { name: "인증 후 저장" }));
    confirmAdminAction();
    await waitFor(() => expect(screen.getByText("Mock 수정 항목")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("switch", { name: "Mock 수정 항목 비노출 전환" }));
    confirmAdminAction();
    await waitFor(() => expect(screen.getByRole("switch", { name: "Mock 수정 항목 노출 전환" })).not.toBeChecked());

    fireEvent.click(screen.getByRole("button", { name: "Mock 수정 항목 작업" }));
    fireEvent.click(screen.getByRole("button", { name: "삭제" }));
    confirmAdminAction();
    await waitFor(() => expect(screen.queryByText("Mock 수정 항목")).not.toBeInTheDocument());
  });

  it("프로젝트 공개 상태를 로컬 상태에서 전환", async () => {
    render(<SiteScreen />);
    fireEvent.click(screen.getByRole("tab", { name: "프로젝트" }));

    fireEvent.click(screen.getByRole("switch", { name: "KYVC 프로젝트 비공개 전환" }));
    confirmAdminAction();

    await waitFor(() => expect(screen.getByRole("switch", { name: "KYVC 프로젝트 공개 전환" })).not.toBeChecked());
    expect(screen.getAllByText("비공개")).toHaveLength(2);
  });
});
