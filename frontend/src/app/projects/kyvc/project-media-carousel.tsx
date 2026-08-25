"use client";

import Image from "next/image";
import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { ProjectMedia } from "./kyvc-data";
import styles from "./kyvc-detail.module.css";

type ProjectMediaCarouselProps = {
  media: readonly ProjectMedia[];
};

const SWIPE_THRESHOLD = 48;
const MAX_DRAG_OFFSET = 160;

// 순환형 Carousel에서 현재 Slide 기준 최단 상대 위치 계산
export function getCarouselOffset(index: number, activeIndex: number, length: number) {
  let offset = index - activeIndex;
  const midpoint = length / 2;

  if (offset > midpoint) {
    offset -= length;
  } else if (offset < -midpoint) {
    offset += length;
  }

  return offset;
}

// Placeholder와 실제 이미지 경로를 동일 구조로 처리하는 Project Media Carousel
export default function ProjectMediaCarousel({ media }: ProjectMediaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<number | null>(null);

  const moveTo = (index: number) => {
    setActiveIndex((index + media.length) % media.length);
  };

  const movePrevious = () => moveTo(activeIndex - 1);
  const moveNext = () => moveTo(activeIndex + 1);

  // Pointer 시작점 저장과 Drag 상태 진입
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }

    dragStartRef.current = event.clientX;
    setIsDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  // Carousel 폭을 넘지 않는 시각적 Drag Offset 적용
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current === null) {
      return;
    }

    const offset = event.clientX - dragStartRef.current;
    setDragOffset(Math.max(-MAX_DRAG_OFFSET, Math.min(MAX_DRAG_OFFSET, offset)));
  };

  // Drag 방향과 임계값 기준 이전·다음 Slide 결정
  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current === null) {
      return;
    }

    const offset = event.clientX - dragStartRef.current;

    if (offset <= -SWIPE_THRESHOLD) {
      moveNext();
    } else if (offset >= SWIPE_THRESHOLD) {
      movePrevious();
    }

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStartRef.current = null;
    setDragOffset(0);
    setIsDragging(false);
  };

  const cancelDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStartRef.current = null;
    setDragOffset(0);
    setIsDragging(false);
  };

  return (
    <section
      className={styles.carousel}
      aria-label="KYvC 프로젝트 미디어"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          movePrevious();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          moveNext();
        }
      }}
    >
      <div
        className={styles.carouselStage}
        data-dragging={isDragging ? "true" : "false"}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={cancelDrag}
        style={{ "--carousel-drag": `${dragOffset}px` } as CSSProperties}
      >
        {media.map((item, index) => {
          const offset = getCarouselOffset(index, activeIndex, media.length);
          const isActive = index === activeIndex;

          return (
            <figure
              className={styles.carouselSlide}
              data-active={isActive ? "true" : "false"}
              data-carousel-slide
              data-offset={offset}
              aria-hidden={!isActive}
              key={item.label}
            >
              {item.src ? (
                <Image
                  alt={item.alt}
                  className={styles.carouselImage}
                  src={item.src}
                  width={item.width}
                  height={item.height}
                  draggable={false}
                  sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1023px) 72vw, 820px"
                />
              ) : (
                <div className={styles.mediaPlaceholder}>
                  <span className={`${styles.placeholderProject} type-small`}>KYvC / 이미지 준비 중</span>
                  <span className={`${styles.placeholderLabel} type-title`}>{item.label}</span>
                </div>
              )}
            </figure>
          );
        })}
      </div>

      <div className={styles.carouselControls}>
        <button
          className={`${styles.carouselButton} type-body`}
          type="button"
          onClick={movePrevious}
          aria-label="이전 프로젝트 미디어"
        >
          ← PREV
        </button>
        <p className={`${styles.carouselCount} type-small`} aria-live="polite">
          {String(activeIndex + 1).padStart(2, "0")} / {String(media.length).padStart(2, "0")}
        </p>
        <button
          className={`${styles.carouselButton} type-body`}
          type="button"
          onClick={moveNext}
          aria-label="다음 프로젝트 미디어"
        >
          NEXT →
        </button>
      </div>
    </section>
  );
}
