"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./kyvc-detail.module.css";

export const projectSections = [
  { id: "detail-stack-result", label: "기술 스택 · 성과" },
  { id: "detail-background", label: "문제 배경 · 주요 기능" },
  { id: "detail-development", label: "직접 담당한 개발 영역" },
  { id: "detail-architecture", label: "아키텍처" },
  { id: "detail-engineering", label: "기술적 문제 해결" },
] as const;

// Cache된 Section 위치 기반 현재 구간과 Scroll 진행도 표시
export default function ProjectRail() {
  const [activeSection, setActiveSection] = useState<(typeof projectSections)[number]["id"]>(
    projectSections[0].id,
  );
  const [progress, setProgress] = useState(0);
  const positionsRef = useRef<number[]>([]);

  useEffect(() => {
    let frameId = 0;

    const measureSections = () => {
      positionsRef.current = projectSections.map(({ id }) => {
        const section = document.getElementById(id);

        return section ? window.scrollY + section.getBoundingClientRect().top : 0;
      });
    };

    // Viewport 상단과 중앙 사이 기준점에 도달한 마지막 Section 활성화
    const updateRail = () => {
      frameId = 0;
      const positions = positionsRef.current;

      if (positions.length === 0) {
        return;
      }

      const probe = window.scrollY + window.innerHeight * 0.36;
      let activeIndex = 0;

      positions.forEach((position, index) => {
        if (position <= probe) {
          activeIndex = index;
        }
      });

      const first = positions[0];
      const last = positions[positions.length - 1];
      const distance = last - first;
      const nextProgress = distance <= 0
        ? 0
        : Math.min(1, Math.max(0, (probe - first) / distance));

      setActiveSection(projectSections[activeIndex].id);
      setProgress(nextProgress);
    };

    const scheduleUpdate = () => {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(updateRail);
    };

    const handleLayoutChange = () => {
      measureSections();
      scheduleUpdate();
    };

    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(handleLayoutChange);

    projectSections.forEach(({ id }) => {
      const section = document.getElementById(id);

      if (section) {
        resizeObserver?.observe(section);
      }
    });

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", handleLayoutChange);
    measureSections();
    scheduleUpdate();

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", handleLayoutChange);
      resizeObserver?.disconnect();
    };
  }, []);

  return (
    <aside
      className={styles.projectRail}
      data-project-rail
      aria-label="프로젝트 상세 영역"
      style={{ "--rail-progress": progress } as CSSProperties}
    >
      <ol className={styles.railList}>
        {projectSections.map((section) => {
          const isActive = section.id === activeSection;

          return (
            <li className={styles.railItem} key={section.id}>
              <a
                className={`${styles.railLink}${isActive ? ` ${styles.railLinkActive}` : ""} type-small`}
                href={`#${section.id}`}
                aria-current={isActive ? "location" : undefined}
              >
                <span className={styles.railNode} aria-hidden="true" />
                <span>{section.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
