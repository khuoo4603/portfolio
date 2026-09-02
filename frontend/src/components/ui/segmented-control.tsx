"use client";

import type { CSSProperties } from "react";
import styles from "./segmented-control.module.css";

type SegmentOption<Value extends string | number> = {
  value: Value;
  label: string;
};

type SegmentedControlProps<Value extends string | number> = {
  label: string;
  options: ReadonlyArray<SegmentOption<Value>>;
  value: Value;
  onChange: (value: Value) => void;
  className?: string;
};

// 동일 범주의 단일 선택 Filter 표현
export default function SegmentedControl<Value extends string | number>({
  label,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<Value>) {
  const activeIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const trackStyle = {
    "--active-index": activeIndex,
    "--segment-count": options.length,
  } as CSSProperties;

  return (
    <div
      className={[styles.viewport, className].filter(Boolean).join(" ")}
      role="group"
      aria-label={label}
    >
      <div className={styles.track} data-segment-track style={trackStyle}>
        <span aria-hidden="true" className={styles.activeTile} />
        {options.map((option) => (
          <button
            key={option.value}
            className={`${styles.segment} type-body`}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
