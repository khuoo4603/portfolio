"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { PUBLIC_COPY } from "@/features/portfolio/public-portfolio";

export type TypingTextLine = {
  text: string;
  className?: string;
};

type TypingTextProps = {
  lines: ReadonlyArray<TypingTextLine>;
  onComplete?: () => void;
  speed?: number;
  start?: boolean | "viewport";
};

type ScrollRevealProps = {
  as?: "li" | "p" | "span" | "strong";
  children: ReactNode;
  className?: string;
  effect: "blur" | "opacity";
};

type AboutSequenceProps = {
  statement?: string;
  position?: string;
  description1?: string;
  description2?: string;
};

const TYPING_STEP_MS = 150;
const ABOUT_TYPING_STEP_MS = 130;
const TYPING_VIEWPORT_ROOT_MARGIN = "-20% 0px -20% 0px";
const BLUR_VIEWPORT_ROOT_MARGIN = "-10% 0px -20% 0px";
const OPACITY_VIEWPORT_ROOT_MARGIN = "-20% 0px -20% 0px";

function getVisibleLines(lines: ReadonlyArray<TypingTextLine>, typedCount: number) {
  let remaining = typedCount;

  return lines.map((line) => {
    const visible = line.text.slice(0, Math.min(line.text.length, remaining));
    remaining = Math.max(0, remaining - line.text.length);
    return visible;
  });
}

function getActiveLine(lines: ReadonlyArray<TypingTextLine>, typedCount: number) {
  let offset = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const nextOffset = offset + lines[index].text.length;
    if (typedCount < nextOffset) {
      return index;
    }
    offset = nextOffset;
  }

  return -1;
}

// 영문 이름과 About 핵심 문구의 일회성 순차 입력 및 완료 상태 유지
export function TypingText({ lines, onComplete, speed = TYPING_STEP_MS, start = true }: TypingTextProps) {
  const totalCharacters = lines.reduce((total, line) => total + line.text.length, 0);
  const fullText = lines.map((line) => line.text).join("\n");
  const initialTypedCount = start === "viewport" || start === false ? 0 : totalCharacters;
  const [typedCount, setTypedCount] = useState(initialTypedCount);
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasStartedRef = useRef(false);
  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    hasStartedRef.current = false;
    hasCompletedRef.current = false;

    let intervalId: number | undefined;
    let observer: IntersectionObserver | undefined;

    const cleanup = (startId?: number) => {
      if (startId !== undefined) {
        window.clearTimeout(startId);
      }
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
      observer?.disconnect();
    };

    const complete = () => {
      setTypedCount(totalCharacters);
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onCompleteRef.current?.();
      }
    };

    const beginTyping = (immediate: boolean) => {
      if (hasStartedRef.current) {
        return;
      }

      hasStartedRef.current = true;
      if (immediate) {
        complete();
        return;
      }

      let nextCount = 0;
      setTypedCount(0);
      intervalId = window.setInterval(() => {
        nextCount += 1;
        setTypedCount(nextCount);

        if (nextCount >= totalCharacters && intervalId !== undefined) {
          window.clearInterval(intervalId);
          complete();
        }
      }, speed);
    };

    if (totalCharacters === 0) {
      complete();
      return undefined;
    }

    if (start === false) {
      return undefined;
    }

    const mediaQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (mediaQuery?.matches) {
      beginTyping(true);
      return undefined;
    }

    if (start === "viewport") {
      const element = elementRef.current;
      if (!element || typeof IntersectionObserver === "undefined") {
        beginTyping(false);
        return undefined;
      }

      try {
        observer = new IntersectionObserver(
          ([entry]) => {
            if (entry?.isIntersecting) {
              beginTyping(false);
              observer?.disconnect();
            }
          },
          { threshold: 0.01, rootMargin: TYPING_VIEWPORT_ROOT_MARGIN },
        );
        observer.observe(element);
      } catch {
        beginTyping(false);
      }
      return cleanup;
    }

    const startId = window.setTimeout(() => beginTyping(false), 0);

    return () => cleanup(startId);
  }, [fullText, initialTypedCount, speed, start, totalCharacters]);

  const visibleLines = getVisibleLines(lines, typedCount);
  const activeLine = getActiveLine(lines, typedCount);
  const isComplete = typedCount >= totalCharacters;

  return (
    <span
      className={["typing-text", start === "viewport" ? "typing-text--viewport" : undefined]
        .filter(Boolean)
        .join(" ")}
      data-typing-complete={isComplete ? "true" : "false"}
      data-typing-text
      ref={elementRef}
    >
      {lines.map((line, index) => (
        <span
          className={["typing-text-line", line.className].filter(Boolean).join(" ")}
          key={`${index}-${line.text}`}
        >
          <span className="typing-text-measure" aria-hidden="true">
            {line.text || "\u00a0"}
          </span>
          <span className="typing-text-visual" data-typing-visual aria-hidden="true">
            {visibleLines[index]}
            {activeLine === index ? (
              <span className="typing-cursor" data-typing-cursor aria-hidden="true" />
            ) : null}
          </span>
        </span>
      ))}
    </span>
  );
}

// About 핵심 문구 완료 이후 설명 그룹의 동시 Fade In 순서 관리
export function AboutSequence({ statement, position, description1, description2 }: AboutSequenceProps) {
  const [isIntroductionVisible, setIntroductionVisible] = useState(!statement);
  const revealTimerRef = useRef<number | undefined>(undefined);
  const revealScheduledRef = useRef(false);
  const statementLines = statement
    ? statement.split(/\r?\n/).map((text, index) => ({
        text,
        className: index === 1 ? "about-statement-accent" : undefined,
      }))
    : [];

  useEffect(() => () => {
    if (revealTimerRef.current !== undefined) {
      window.clearTimeout(revealTimerRef.current);
    }
  }, []);

  const handleTypingComplete = () => {
    if (revealScheduledRef.current) {
      return;
    }

    revealScheduledRef.current = true;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      setIntroductionVisible(true);
      return;
    }

    revealTimerRef.current = window.setTimeout(() => {
      setIntroductionVisible(true);
    }, 200);
  };

  return (
    <>
      <div className="about-heading">
        <h2 className="section-title type-heading" id="about-title">
          <span>{PUBLIC_COPY.about.title}</span>
        </h2>
        {statement ? (
          <p className="about-statement type-statement" aria-label={statement}>
            <TypingText
              lines={statementLines}
              speed={ABOUT_TYPING_STEP_MS}
              start="viewport"
              onComplete={handleTypingComplete}
            />
          </p>
        ) : null}
      </div>

      <div
        className={`about-introduction type-body-lg${isIntroductionVisible ? " is-visible" : ""}`}
        aria-hidden={!isIntroductionVisible}
      >
        {position ? <p className="about-position type-title">{position}</p> : null}
        {description1 ? <p>{description1}</p> : null}
        {description2 ? <p>{description2}</p> : null}
      </div>
    </>
  );
}

// Public 텍스트와 목록의 Viewport 중앙 유지 구간 기반 상태 관리
export function ScrollReveal({ as = "span", children, className, effect }: ScrollRevealProps) {
  const elementRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [motionDirection, setMotionDirection] = useState<"entering" | "exiting">("entering");
  const hasRevealedRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    const mediaQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");

    if (!element || mediaQuery?.matches || typeof IntersectionObserver === "undefined") {
      hasRevealedRef.current = effect === "opacity";
      setIsVisible(true);
      return undefined;
    }

    let observer: IntersectionObserver | undefined;
    let initialHideId: number | undefined;
    const rootMargin = effect === "blur"
      ? BLUR_VIEWPORT_ROOT_MARGIN
      : OPACITY_VIEWPORT_ROOT_MARGIN;

    try {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (initialHideId !== undefined) {
            window.clearTimeout(initialHideId);
            initialHideId = undefined;
          }

          if (effect === "opacity") {
            if (!entry?.isIntersecting || hasRevealedRef.current) {
              return;
            }

            hasRevealedRef.current = true;
            setIsVisible(true);
            observer?.disconnect();
            return;
          }

          setMotionDirection(entry?.isIntersecting ? "entering" : "exiting");
          setIsVisible(entry?.isIntersecting ?? false);
        },
        { threshold: 0.01, rootMargin },
      );
      observer.observe(element);
    } catch {
      hasRevealedRef.current = effect === "opacity";
      return undefined;
    }

    initialHideId = window.setTimeout(() => {
      setIsVisible(false);
    }, 0);

    return () => {
      if (initialHideId !== undefined) {
        window.clearTimeout(initialHideId);
      }
      observer?.disconnect();
    };
  }, [effect]);

  const Tag: ElementType = as;
  const revealClassName = [
    className,
    "public-motion-reveal",
    `public-motion-reveal--${effect}`,
    `public-motion-reveal--${motionDirection}`,
    isVisible ? "is-visible" : undefined,
  ].filter(Boolean).join(" ");

  return (
    <Tag
      className={revealClassName}
      data-motion-effect={effect}
      ref={(node: HTMLElement | null) => {
        elementRef.current = node;
      }}
    >
      {children}
    </Tag>
  );
}
