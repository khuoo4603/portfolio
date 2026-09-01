import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PUBLIC_PORTFOLIO_FIXTURE } from "@/test/public-portfolio-fixture";
import ProjectsSection from "./projects-section";

describe("동적 Project Timeline Guard", () => {
  afterEach(cleanup);

  it("Project 0개에서 빈 Timeline을 안전하게 유지", () => {
    render(<ProjectsSection projects={[]} sectionLabel="PROJECTS" sectionTitle="프로젝트" detailLabel="자세히 보기" />);
    expect(screen.getByRole("list", { name: "연도별 프로젝트" })).toBeEmptyDOMElement();
    expect(document.querySelector(".project-history-row")).not.toBeInTheDocument();
  });

  it("Project 1개에서 Hover 진행도와 내부 slug Link를 유지", () => {
    const project = PUBLIC_PORTFOLIO_FIXTURE.projects[0];
    render(<ProjectsSection projects={[project]} sectionLabel="PROJECTS" sectionTitle="프로젝트" detailLabel="자세히 보기" />);

    const history = screen.getByRole("list", { name: "연도별 프로젝트" });
    fireEvent.mouseEnter(history.querySelector(".project-history-row")!);

    expect(history.style.getPropertyValue("--project-timeline-progress")).toBe("1");
    expect(screen.getByRole("link", { name: `${project.name} 자세히 보기` }))
      .toHaveAttribute("href", `/projects/${project.slug}`);
  });

  it("API 배열 증가에 따라 Row와 Timeline Node를 같은 수로 렌더링", () => {
    const projects = PUBLIC_PORTFOLIO_FIXTURE.projects;
    render(<ProjectsSection projects={projects} sectionLabel="PROJECTS" sectionTitle="프로젝트" detailLabel="자세히 보기" />);
    expect(document.querySelectorAll(".project-history-row")).toHaveLength(projects.length);
    expect(document.querySelectorAll(".project-node")).toHaveLength(projects.length);
  });
});
