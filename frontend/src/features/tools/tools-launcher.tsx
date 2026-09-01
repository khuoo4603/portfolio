"use client";

import Link from "next/link";
import {
  BookOpen,
  Boxes,
  Code2,
  Construction,
  Ellipsis,
  FolderOpen,
  Link2,
  ListChecks,
  UserRound,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, RefObject } from "react";
import { useToolsSession } from "./tools-shell";
import styles from "./tools.module.css";

// 문제 선택 흐름을 추상 행으로 전달하는 Quiz 장식 Preview
function QuizPreview() {
  return (
    <div className={`${styles.cardVisual} ${styles.quizPreview}`} data-card-preview="quiz" aria-hidden="true">
      {[0, 1, 2].map((rowIndex) => (
        <div className={styles.quizPreviewRow} key={rowIndex}>
          <span className={styles.quizPreviewLabel}>Q{rowIndex + 1}</span>
          <span className={styles.quizPreviewTrack}>
            {[0, 1, 2, 3].map((optionIndex) => (
              <span
                className={optionIndex === (rowIndex + 2) % 4 ? styles.quizPreviewSelected : undefined}
                key={optionIndex}
              />
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

type BeamGeometry = {
  width: number;
  height: number;
  path: string;
  startX: number;
  endX: number;
};

// 실제 노드 중심점을 카드 좌표로 변환하는 Links 연결선
function BeamPath({
  containerRef,
  fromRef,
  toRef,
  delay,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  fromRef: RefObject<HTMLSpanElement | null>;
  toRef: RefObject<HTMLSpanElement | null>;
  delay: number;
}) {
  const gradientId = `links-beam-${useId().replace(/:/g, "")}`;
  const [geometry, setGeometry] = useState<BeamGeometry>({
    width: 1,
    height: 1,
    path: "",
    startX: 0,
    endX: 1,
  });

  useEffect(() => {
    const container = containerRef.current;
    const from = fromRef.current;
    const to = toRef.current;

    if (!container || !from || !to) {
      return;
    }

    // 반응형 카드 크기와 노드 배치에 동기화되는 Bezier 좌표
    const updatePath = () => {
      const containerRect = container.getBoundingClientRect();
      const fromRect = from.getBoundingClientRect();
      const toRect = to.getBoundingClientRect();
      const startX = fromRect.right - containerRect.left;
      const startY = fromRect.top - containerRect.top + fromRect.height / 2;
      const endX = toRect.left - containerRect.left;
      const endY = toRect.top - containerRect.top + toRect.height / 2;
      const controlX = startX + (endX - startX) / 2;
      const nextGeometry = {
        width: Math.max(containerRect.width, 1),
        height: Math.max(containerRect.height, 1),
        path: `M ${startX} ${startY} Q ${controlX} ${startY} ${endX} ${endY}`,
        startX,
        endX,
      };

      setGeometry((current) => (
        current.width === nextGeometry.width
        && current.height === nextGeometry.height
        && current.path === nextGeometry.path
          ? current
          : nextGeometry
      ));
    };

    updatePath();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(updatePath);
    observer.observe(container);
    observer.observe(from);
    observer.observe(to);

    return () => observer.disconnect();
  }, [containerRef, fromRef, toRef]);

  const gradientWidth = Math.max(geometry.width * 0.2, 64);

  return (
    <svg
      className={styles.linksBeamPath}
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      preserveAspectRatio="none"
      data-beam-path
    >
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={geometry.startX - gradientWidth}
          y1="0"
          x2={geometry.startX}
          y2="0"
        >
          <stop offset="0" stopColor="var(--preview-beam-start)" stopOpacity="0" />
          <stop offset="0.32" stopColor="var(--preview-beam-start)" />
          <stop offset="0.68" stopColor="var(--preview-beam-stop)" />
          <stop offset="1" stopColor="var(--preview-beam-stop)" stopOpacity="0" />
          <animate
            attributeName="x1"
            values={`${geometry.startX - gradientWidth};${geometry.endX}`}
            dur="3s"
            begin={`${delay}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="x2"
            values={`${geometry.startX};${geometry.endX + gradientWidth}`}
            dur="3s"
            begin={`${delay}s`}
            repeatCount="indefinite"
          />
        </linearGradient>
      </defs>
      <path className={styles.linksBeamBase} d={geometry.path} />
      <path className={styles.linksBeamMoving} d={geometry.path} stroke={`url(#${gradientId})`} />
    </svg>
  );
}

// Magic UI Multiple Outputs 구조의 Source-Hub-Output 연결 Preview
function LinksBeamPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLSpanElement>(null);
  const hubRef = useRef<HTMLSpanElement>(null);
  const bookRef = useRef<HTMLSpanElement>(null);
  const codeRef = useRef<HTMLSpanElement>(null);
  const serverRef = useRef<HTMLSpanElement>(null);
  const userRef = useRef<HTMLSpanElement>(null);
  const moreRef = useRef<HTMLSpanElement>(null);

  return (
    <div className={`${styles.cardVisual} ${styles.linksBeamPreview}`} data-card-preview="links" aria-hidden="true">
      <div className={styles.linksBeamInner} ref={containerRef}>
        <BeamPath containerRef={containerRef} fromRef={sourceRef} toRef={hubRef} delay={0} />
        <BeamPath containerRef={containerRef} fromRef={hubRef} toRef={bookRef} delay={0.2} />
        <BeamPath containerRef={containerRef} fromRef={hubRef} toRef={codeRef} delay={0.4} />
        <BeamPath containerRef={containerRef} fromRef={hubRef} toRef={serverRef} delay={0.6} />
        <BeamPath containerRef={containerRef} fromRef={hubRef} toRef={userRef} delay={0.8} />
        <BeamPath containerRef={containerRef} fromRef={hubRef} toRef={moreRef} delay={1} />
        <span className={styles.beamNodeSurface} ref={sourceRef} data-beam-node data-beam-source>
          <FolderOpen strokeWidth={1.6} />
        </span>
        <span className={`${styles.beamNodeSurface} ${styles.beamHub}`} ref={hubRef} data-beam-node data-beam-hub>
          <Link2 strokeWidth={1.6} />
        </span>
        <span className={styles.beamOutputs}>
          <span className={styles.beamNodeSurface} ref={bookRef} data-beam-node data-beam-output>
            <BookOpen strokeWidth={1.55} />
          </span>
          <span className={styles.beamNodeSurface} ref={codeRef} data-beam-node data-beam-output>
            <Code2 strokeWidth={1.55} />
          </span>
          <span className={styles.beamNodeSurface} ref={serverRef} data-beam-node data-beam-output>
            <Boxes strokeWidth={1.55} />
          </span>
          <span className={styles.beamNodeSurface} ref={userRef} data-beam-node data-beam-output>
            <UserRound strokeWidth={1.55} />
          </span>
          <span className={styles.beamNodeSurface} ref={moreRef} data-beam-node data-beam-output>
            <Ellipsis strokeWidth={1.55} />
          </span>
        </span>
      </div>
    </div>
  );
}

// Magic UI 공식 수치와 동일한 8개 동심원 제작 상태 Preview
function RipplePreview({ variant }: { variant: "wide" | "compact" }) {
  return (
    <div
      className={`${styles.cardVisual} ${styles.ripplePreview} ${variant === "wide" ? styles.rippleWide : styles.rippleCompact}`}
      data-card-preview="ripple"
      data-ripple-variant={variant}
      aria-hidden="true"
    >
      <span className={styles.rippleGeometry}>
        {Array.from({ length: 8 }, (_, ringIndex) => (
          <span
            className={styles.rippleCircle}
            data-ripple-circle
            style={{
              "--ripple-delay": `${ringIndex * 0.06}s`,
              "--ripple-opacity": 0.24 - ringIndex * 0.03,
              "--ripple-size": `${210 + ringIndex * 70}px`,
            } as CSSProperties}
            key={ringIndex}
          />
        ))}
      </span>
      <span className={styles.rippleCore}><Construction strokeWidth={1.5} /></span>
    </div>
  );
}

// 활성 여부에 따라 탐색성을 전환하는 고정 Tool Card
function ToolCard({
  className,
  href,
  icon,
  title,
  description,
  preview,
  enabled,
}: {
  className: string;
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  preview: React.ReactNode;
  enabled: boolean;
}) {
  const cardClassName = `${styles.bentoCard} ${styles.toolCard} ${enabled ? "" : styles.toolCardDisabled} ${className}`;
  const content = (
    <>
      {preview}
      <span className={styles.cardOverlay} aria-hidden="true" />
      <div className={styles.cardContent}>
        <span className={styles.cardIcon} aria-hidden="true">{icon}</span>
        <h2 className={styles.cardTitle}>{title}</h2>
        <p className={styles.cardDescription}>{description}</p>
      </div>
      <span className={styles.cardCta} aria-hidden="true">
        {enabled ? <>자세히 보기 <span className={styles.cardCtaArrow}>→</span></> : "비활성"}
      </span>
    </>
  );

  return enabled ? (
    <Link className={cardClassName} href={href}>{content}</Link>
  ) : (
    <article className={cardClassName} aria-label={`${title} 비활성`}>{content}</article>
  );
}

// 확정되지 않은 기능을 암시하지 않는 준비 상태 Cell
function ComingCard({ className, preview }: { className: string; preview: React.ReactNode }) {
  return (
    <article className={`${styles.bentoCard} ${styles.comingCard} ${className}`} aria-label="제작 중">
      {preview}
      <div className={styles.cardContent}>
        <span className={styles.cardIcon} aria-hidden="true"><Construction strokeWidth={1.8} /></span>
        <h2 className={styles.cardTitle}>제작 중</h2>
        <p className={styles.cardDescription}>새 도구를 준비하고 있습니다.</p>
      </div>
    </article>
  );
}

// 고정 Tool 슬롯 2개와 제작 상태 2개의 Bento Launcher
export default function ToolsLauncher() {
  const { tools } = useToolsSession();
  const quiz = tools.find((tool) => tool.toolKey === "QUIZ");
  const links = tools.find((tool) => tool.toolKey === "LINKS");

  return (
    <main className={styles.launcherPage}>
      <div className="content-container">
        <div className={styles.launcherLayout}>
          <h1 className={styles.launcherTitle}>Quick Menu</h1>
          <div className={styles.launcherCenter}>
            <section className={styles.launcherGrid} aria-label="Tools Launcher">
              <ToolCard
                className={styles.quizCard}
                href="/tools/quiz"
                icon={<ListChecks strokeWidth={1.8} />}
                title={quiz?.name ?? "Quiz"}
                description="GPT 문제 JSON을 불러와 직접 풀고 답안을 정리합니다."
                preview={<QuizPreview />}
                enabled={Boolean(quiz)}
              />
              <ToolCard
                className={styles.linksCard}
                href="/tools/links"
                icon={<Link2 strokeWidth={1.8} />}
                title={links?.name ?? "Links"}
                description="공통 Links 데이터를 분류별로 조회합니다."
                preview={<LinksBeamPreview />}
                enabled={Boolean(links)}
              />
              <ComingCard className={styles.comingWideCard} preview={<RipplePreview variant="wide" />} />
              <ComingCard className={styles.comingNarrowCard} preview={<RipplePreview variant="compact" />} />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
