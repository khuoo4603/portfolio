"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { PublicProjectCard } from "@/types/api";

type TimelineGeometry = {
  rowCenters: number[];
};

type ProjectsSectionProps = {
  projects: PublicProjectCard[];
  sectionLabel?: string;
  sectionTitle?: string;
  detailLabel?: string;
};

// 연도별 Project History와 근접 Viewport 전용 Scroll Timeline 구성
export default function ProjectsSection({
  projects,
  sectionLabel,
  sectionTitle,
  detailLabel,
}: ProjectsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const projectHistoryRef = useRef<HTMLOListElement>(null);
  const projectRowRefs = useRef<Array<HTMLElement | null>>([]);
  const projectNodeRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [activeProject, setActiveProject] = useState<string | null>(projects[0]?.slug ?? null);
  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(() => new Set());

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
      setActiveProject(projects[nearestIndex]?.slug ?? null);
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
  }, [projects]);

  // Hover 항목 순서 기준 Timeline Beam 진행도 임시 적용
  const setHoveredTimelineProgress = (index: number) => {
    const lastIndex = projects.length - 1;
    const progress = lastIndex <= 0 ? 1 : index / lastIndex;

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
      aria-labelledby={sectionTitle ? "projects-title" : undefined}
      ref={sectionRef}
    >
      <div className="content-container projects-inner">
        <header className="projects-heading">
          {sectionLabel ? <p className="section-meta type-small">{sectionLabel}</p> : null}
          {sectionTitle ? <h2 className="section-title type-heading" id="projects-title">{sectionTitle}</h2> : null}
        </header>

        <div className="project-stage">
          <ol
            className="project-showcases"
            aria-label="연도별 프로젝트"
            ref={projectHistoryRef}
            onMouseLeave={restoreTimelineProgress}
          >
            {projects.map((project, index) => {
              const isActive = activeProject === project.slug;
              const showsYear = index === 0 || projects[index - 1].year !== project.year;
              const thumbnailKey = `${project.id}:${project.thumbnailUrl ?? ""}`;
              const showThumbnail = Boolean(project.thumbnailUrl) && !failedThumbnails.has(thumbnailKey);

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
                      href={`#project-${project.slug}`}
                    >
                      <span className="project-tab-name type-body" id={`project-label-${project.slug}`}>
                        {project.name}
                      </span>
                    </a>
                  </div>

                  <article
                    className="project-panel"
                    id={`project-${project.slug}`}
                    aria-labelledby={`project-label-${project.slug}`}
                    ref={(row) => {
                      projectRowRefs.current[index] = row;
                    }}
                  >
                    {showThumbnail && project.thumbnailUrl ? (
                      <a
                        className="project-thumbnail"
                        href={`/projects/${project.slug}`}
                        aria-label={`${project.name} 프로젝트 상세 보기`}
                      >
                        <Image
                          alt={`${project.name} 프로젝트 대표 화면`}
                          className="project-thumbnail-image"
                          src={project.thumbnailUrl}
                          width={1280}
                          height={720}
                          onError={() => setFailedThumbnails((current) => new Set(current).add(thumbnailKey))}
                          sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1023px) 20vw, 260px"
                        />
                      </a>
                    ) : (
                      <div className="project-thumbnail project-thumbnail-placeholder" aria-hidden="true" />
                    )}

                    <div className="project-information">
                      <div className="project-information-group">
                        <div className="project-information-content">
                          {project.tagline ? <p className="project-tagline type-title">{project.tagline}</p> : null}
                          {project.description ? <p className="project-description type-body">{project.description}</p> : null}
                          {project.cardRole || project.technologies.length > 0 ? (
                            <div className="project-meta type-small">
                              {project.cardRole ? (
                                <span className="project-meta-badge project-role-badge">{project.cardRole}</span>
                              ) : null}
                              {project.technologies.length > 0 ? (
                                <span className="project-meta-badge project-tech-badge">
                              {project.technologies.map((technology, technologyIndex) => (
                                <span className="project-tech-item" key={technology.id}>
                                  {technologyIndex > 0 ? (
                                    <span className="project-tech-separator" aria-hidden="true">
                                      {"\u00A0·\u00A0"}
                                    </span>
                                  ) : null}
                                  <span>{technology.name}</span>
                                </span>
                              ))}
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                        {detailLabel ? (
                          <a
                            className="project-detail-link type-body"
                            href={`/projects/${project.slug}`}
                            aria-label={`${project.name} ${detailLabel}`}
                          >
                            {detailLabel} <span aria-hidden="true">↗</span>
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
