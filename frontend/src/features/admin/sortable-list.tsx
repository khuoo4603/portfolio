"use client";

import { GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import styles from "./admin.module.css";

// 순서 이동 대상의 안정적인 식별자와 표시 정보를 연결하는 공통 계약
export type SortableListProps<T> = {
  items: T[];
  getKey: (item: T) => string | number;
  getTitle: (item: T) => string;
  renderExtra?: (item: T, index: number) => ReactNode;
  renderActions?: (item: T, index: number, controls: { moveUp: ReactNode; moveDown: ReactNode }) => ReactNode;
  layout?: "compact" | "expanded";
  onChange: (items: T[]) => void;
  disabled?: boolean;
  emptyMessage?: string;
};

// 배열 내부 항목을 경계 안에서 이동하는 순수 정렬 함수
export function moveItem<T>(items: T[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

// 마우스·터치·키보드와 위·아래 버튼을 함께 제공하는 관리자 정렬 목록
export default function SortableList<T>({
  items,
  getKey,
  getTitle,
  renderExtra,
  renderActions,
  layout = "compact",
  onChange,
  disabled = false,
  emptyMessage = "정렬할 항목이 없습니다.",
}: SortableListProps<T>) {
  const listRef = useRef<HTMLUListElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const touchIndex = useRef<number | null>(null);

  // 현재 SortableList Root 내부의 Drop Row 판별
  const getOwnedRow = (target: EventTarget | Element | null) => {
    if (!(target instanceof Element)) return null;
    const row = target.closest<HTMLElement>("[data-sortable-index]");
    return row && row.closest("[data-sortable-list-root]") === listRef.current ? row : null;
  };

  const change = (from: number, to: number) => {
    if (disabled) return;
    const next = moveItem(items, from, to);
    if (next !== items) onChange(next);
  };

  if (items.length === 0) {
    return <p className={`${styles.emptyState} type-small`}>{emptyMessage}</p>;
  }

  return (
    <ul ref={listRef} className={styles.sortableList} aria-label="표시 순서 관리" data-sortable-list-root>
      {items.map((item, index) => {
        const title = getTitle(item);
        const key = getKey(item);
        return (
          <li
            key={key}
            aria-label={title}
            className={`${styles.sortableRow} ${layout === "expanded" ? styles.sortableRowExpanded : ""} ${dropIndex === index ? styles.sortableRowDropTarget : ""}`}
            data-sortable-index={index}
            draggable={!disabled}
            onDragStart={() => { setDragIndex(index); setDropIndex(index); }}
            onDragOver={(event) => { if (!disabled && getOwnedRow(event.target)) { event.preventDefault(); setDropIndex(index); } }}
            onDrop={(event) => { const row = getOwnedRow(event.target); if (row) { event.preventDefault(); if (dragIndex !== null) change(dragIndex, index); } setDragIndex(null); setDropIndex(null); }}
            onDragEnd={() => { setDragIndex(null); setDropIndex(null); }}
            onPointerDown={(event) => {
              if (!disabled && event.pointerType === "touch") {
                touchIndex.current = index;
                event.currentTarget.setPointerCapture(event.pointerId);
              }
            }}
            onPointerMove={(event) => {
              if (touchIndex.current === null || event.pointerType !== "touch") return;
              const target = getOwnedRow(document.elementFromPoint(event.clientX, event.clientY));
              const targetIndex = target ? Number(target.dataset.sortableIndex) : -1;
              if (targetIndex >= 0 && targetIndex !== touchIndex.current) {
                change(touchIndex.current, targetIndex);
                touchIndex.current = targetIndex;
              }
            }}
            onPointerUp={() => { touchIndex.current = null; }}
            onPointerCancel={() => { touchIndex.current = null; }}
          >
            <button
              className={styles.sortableHandle}
              type="button"
              aria-label={`${title} 순서 이동`}
              disabled={disabled}
              onKeyDown={(event) => {
                if (event.key === "ArrowUp" && index > 0) {
                  event.preventDefault();
                  change(index, index - 1);
                }
                if (event.key === "ArrowDown" && index < items.length - 1) {
                  event.preventDefault();
                  change(index, index + 1);
                }
              }}
            >
              <GripVertical aria-hidden="true" />
            </button>
            <span className={styles.sortableIndex} aria-label={`${index + 1}번째`}>{index + 1}</span>
            <div className={styles.sortableIdentity}>
              <strong className="type-body">{title}</strong>
            </div>
            {(() => {
              const moveUp = <button className={styles.iconButton} type="button" aria-label={`${title} 위로`} disabled={disabled || index === 0} onClick={() => change(index, index - 1)}><ChevronUp aria-hidden="true" /></button>;
              const moveDown = <button className={styles.iconButton} type="button" aria-label={`${title} 아래로`} disabled={disabled || index === items.length - 1} onClick={() => change(index, index + 1)}><ChevronDown aria-hidden="true" /></button>;
              return layout === "expanded" ? (
                <>
                  <div className={styles.sortableExpandedContent}>{renderExtra?.(item, index)}</div>
                  <div className={styles.sortableActions}>{moveUp}{moveDown}</div>
                </>
              ) : (
                <div className={styles.sortableActions}>{renderActions?.(item, index, { moveUp, moveDown }) ?? <>{moveUp}{moveDown}</>}</div>
              );
            })()}
          </li>
        );
      })}
    </ul>
  );
}
