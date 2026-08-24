"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const projects = [
  {
    id: "kyvc",
    name: "KYvC",
    year: 2026,
    href: "/projects/kyvc",
    external: false,
    tagline: "법인 KYC 자동 심사 서비스",
    description: "법인 서류를 기반으로 KYC 심사를 자동화하고 검증 결과를 전자 증명 형태로 연결하는 서비스",
    role: "백엔드 · 인프라",
    technologies: ["Java", "Spring Boot", "PostgreSQL", "Docker"],
    imageSrc: "/images/profile/project-intro-kyvc.webp",
    imageAlt: "KYvC 프로젝트 대표 화면",
    imageWidth: 1280,
    imageHeight: 633,
  },
  {
    id: "shkutrack",
    name: "SHKUTrack",
    year: 2026,
    href: "/projects/shkutrack",
    external: false,
    tagline: "성공회대학교 졸업 관리 서비스",
    description: "졸업요건 확인과 졸업 자료, 마이크로전공, 수강 전략을 하나의 흐름으로 관리하는 서비스",
    role: "풀스택 · 인프라",
    technologies: ["Java", "Spring Boot", "PostgreSQL", "Docker", "Kubernetes", "Nginx"],
    imageSrc: "/images/profile/project-intro-skhutrack.webp",
    imageAlt: "SHKUTrack 프로젝트 대표 화면",
    imageWidth: 1280,
    imageHeight: 638,
  },
  {
    id: "shkuload",
    name: "SHKULoad",
    year: 2023,
    href: "https://github.com/woohyuk0428/SKHU_Contest",
    external: true,
    tagline: "길찾기·중간지점·지하철 정보 서비스",
    description: "목적지 길찾기와 여러 위치의 중간지점 계산, 지하철 위치·지연정보를 제공하는 서비스",
    role: "백엔드",
    technologies: ["JavaScript", "Node.js", "Express", "EJS"],
    imageSrc: null,
    imageAlt: null,
    imageWidth: null,
    imageHeight: null,
  },
] as const;

type TimelineGeometry = {
  rowCenters: number[];
};

// 연도별 Project History와 근접 Viewport 전용 Scroll Timeline 구성
export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const projectHistoryRef = useRef<HTMLOListElement>(null);
  const projectRowRefs = useRef<Array<HTMLElement | null>>([]);
  const projectNodeRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [activeProject, setActiveProject] = useState<(typeof projects)[number]["id"]>(projects[0].id);

  useEffect(() => {
    const section = sectionRef.current;
    const history = projectHistoryRef.current;

    if (!section || !history) {
      return;
    }

    let frameId = 0;
    let isTimelineActive = false;
    let timelineGeometry: TimelineGeometry | null = null;

    // Project Row와 Timeline Node의 문서 기준 Geometry 일괄 측정
    const measureTimeline = () => {
      const rows = projectRowRefs.current.filter((row): row is HTMLElement => row !== null);
      const nodes = projectNodeRefs.current.filter((node): node is HTMLSpanElement => node !== null);

      if (rows.length === 0) {
        timelineGeometry = null;
        return;
      }

      timelineGeometry = {
        rowCenters: rows.map((row) => {
          const rect = row.getBoundingClientRect();

          return window.scrollY + rect.top + rect.height / 2;
        }),
      };

      if (nodes.length === rows.length) {
        const historyRect = history.getBoundingClientRect();
        const nodeCenters = nodes.map((node) => {
          const rect = node.getBoundingClientRect();

          return {
            x: rect.left - historyRect.left + rect.width / 2,
            y: rect.top - historyRect.top + rect.height / 2,
          };
        });
        const firstNode = nodeCenters[0];
        const lastNode = nodeCenters[nodeCenters.length - 1];

        history.style.setProperty("--project-timeline-left", `${firstNode.x}px`);
        history.style.setProperty("--project-timeline-top", `${firstNode.y}px`);
        history.style.setProperty("--project-timeline-height", `${Math.max(0, lastNode.y - firstNode.y)}px`);
      }
    };

    // Cache된 Row Center 기반 Timeline 활성 상태와 Beam 진행도 동기화
    const updateTimeline = () => {
      frameId = 0;

      if (!isTimelineActive || !timelineGeometry || timelineGeometry.rowCenters.length === 0) {
        return;
      }

      const viewportCenter = window.scrollY + window.innerHeight / 2;
      const { rowCenters } = timelineGeometry;
      let nearestIndex = 0;

      rowCenters.forEach((center, index) => {
        if (Math.abs(center - viewportCenter) < Math.abs(rowCenters[nearestIndex] - viewportCenter)) {
          nearestIndex = index;
        }
      });

      const firstCenter = rowCenters[0];
      const lastCenter = rowCenters[rowCenters.length - 1];
      const centerDistance = lastCenter - firstCenter;
      const progress = centerDistance === 0
        ? 0
        : Math.min(1, Math.max(0, (viewportCenter - firstCenter) / centerDistance));

      section.style.setProperty("--project-timeline-progress", String(progress));
      setActiveProject(projects[nearestIndex].id);
    };

    const scheduleTimelineUpdate = () => {
      if (frameId || !isTimelineActive) {
        return;
      }

      frameId = window.requestAnimationFrame(updateTimeline);
    };

    // Layout 변경 시 Geometry Cache 갱신과 현재 Viewport 상태 반영
    const handleLayoutChange = () => {
      measureTimeline();
      scheduleTimelineUpdate();
    };

    const setTimelineActive = (active: boolean) => {
      if (isTimelineActive === active) {
        return;
      }

      isTimelineActive = active;

      if (active) {
        window.addEventListener("scroll", scheduleTimelineUpdate, { passive: true });
        measureTimeline();
        scheduleTimelineUpdate();
      } else {
        window.removeEventListener("scroll", scheduleTimelineUpdate);
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
    };

    const intersectionObserver = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(
        ([entry]) => setTimelineActive(entry.isIntersecting),
        { rootMargin: "100% 0px" },
      );
    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(handleLayoutChange);

    intersectionObserver?.observe(section);
    resizeObserver?.observe(section);
    window.addEventListener("resize", handleLayoutChange);
    measureTimeline();

    if (!intersectionObserver) {
      setTimelineActive(true);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", scheduleTimelineUpdate);
      window.removeEventListener("resize", handleLayoutChange);
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
    };
  }, []);

  // Hover 항목 순서 기준 Timeline Beam 진행도 임시 적용
  const setHoveredTimelineProgress = (index: number) => {
    const lastIndex = projects.length - 1;
    const progress = lastIndex === 0 ? 1 : index / lastIndex;

    projectHistoryRef.current?.style.setProperty("--project-timeline-progress", String(progress));
  };

  // Hover 종료 시 Scroll 기준 Timeline Beam 진행도 복원
  const restoreTimelineProgress = () => {
    projectHistoryRef.current?.style.removeProperty("--project-timeline-progress");
  };

  return (
    <section
      className="main-section projects-section"
      id="projects"
      aria-labelledby="projects-title"
      ref={sectionRef}
    >
      <div className="content-container projects-inner">
        <header className="projects-heading">
          <p className="section-meta type-small">PROJECTS</p>
          <h2 className="section-title type-heading" id="projects-title">프로젝트</h2>
        </header>

        <div className="project-stage">
          <ol
            className="project-showcases"
            aria-label="연도별 프로젝트"
            ref={projectHistoryRef}
            onMouseLeave={restoreTimelineProgress}
          >
            {projects.map((project, index) => {
              const isActive = activeProject === project.id;
              const showsYear = index === 0 || projects[index - 1].year !== project.year;

              return (
                <li
                  className="project-history-row"
                  key={project.id}
                  onMouseEnter={() => setHoveredTimelineProgress(index)}
                >
                  <div className={`project-timeline-entry${showsYear ? " has-year" : ""}`}>
                    <span className="project-year type-small">{showsYear ? project.year : null}</span>
                    <span
                      className={`project-node${isActive ? " is-active" : ""}`}
                      aria-hidden="true"
                      ref={(node) => {
                        projectNodeRefs.current[index] = node;
                      }}
                    />
                    <a
                      aria-current={isActive ? "location" : undefined}
                      className={`project-tab${isActive ? " is-active" : ""}`}
                      href={`#project-${project.id}`}
                    >
                      <span className="project-tab-name type-body" id={`project-label-${project.id}`}>
                        {project.name}
                      </span>
                    </a>
                  </div>

                  <article
                    className="project-panel"
                    id={`project-${project.id}`}
                    aria-labelledby={`project-label-${project.id}`}
                    ref={(row) => {
                      projectRowRefs.current[index] = row;
                    }}
                  >
                    {project.href && project.imageSrc && project.imageAlt && project.imageWidth && project.imageHeight ? (
                      <a
                        className="project-thumbnail"
                        href={project.href}
                        aria-label={`${project.name} 프로젝트 상세 보기`}
                      >
                        <Image
                          alt={project.imageAlt}
                          className="project-thumbnail-image"
                          src={project.imageSrc}
                          width={project.imageWidth}
                          height={project.imageHeight}
                          sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1023px) 20vw, 260px"
                        />
                      </a>
                    ) : (
                      <div className="project-thumbnail project-thumbnail-placeholder" aria-hidden="true" />
                    )}

                    <div className="project-information">
                      <div className="project-information-group">
                        <div className="project-information-content">
                          <p className="project-tagline type-title">{project.tagline}</p>
                          <p className="project-description type-body">{project.description}</p>
                          <div className="project-meta type-small">
                            <span className="project-meta-badge project-role-badge">{project.role}</span>
                            <span className="project-meta-badge project-tech-badge">
                              {project.technologies.map((technology, technologyIndex) => (
                                <span className="project-tech-item" key={technology}>
                                  {technologyIndex > 0 ? (
                                    <span className="project-tech-separator" aria-hidden="true">
                                      {"\u00A0·\u00A0"}
                                    </span>
                                  ) : null}
                                  <span>{technology}</span>
                                </span>
                              ))}
                            </span>
                          </div>
                        </div>
                        {project.href ? (
                          <a
                            className="project-detail-link type-body"
                            href={project.href}
                            aria-label={`${project.name} 자세히 보기`}
                            target={project.external ? "_blank" : undefined}
                            rel={project.external ? "noopener noreferrer" : undefined}
                          >
                            자세히 보기 <span aria-hidden="true">↗</span>
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
