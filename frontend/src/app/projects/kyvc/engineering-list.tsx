"use client";

import { useState } from "react";
import type { EngineeringItem } from "./kyvc-data";
import styles from "./kyvc-detail.module.css";

type EngineeringListProps = {
  items: readonly EngineeringItem[];
};

const flowLabels = ["문제", "개선 방안", "결과"] as const;

// 문제부터 결과까지 한 흐름으로 펼치는 Engineering Inline Accordion
export default function EngineeringList({ items }: EngineeringListProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <ol className={styles.engineeringList} data-engineering>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const contentId = `engineering-detail-${index + 1}`;
        const details = [item.problem, item.solution, item.result];

        return (
          <li className={styles.engineeringItem} key={item.title}>
            <button
              className={styles.engineeringTrigger}
              type="button"
              aria-controls={contentId}
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span className={`${styles.engineeringNumber} type-small`}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={styles.engineeringHeading}>
                <span className={`${styles.engineeringTitle} type-title`}>{item.title}</span>
                <span className={`${styles.engineeringSummary} type-body`}>{item.summary}</span>
              </span>
              <span className={`${styles.engineeringIndicator} type-title`} aria-hidden="true">
                {isOpen ? "−" : "+"}
              </span>
            </button>

            <div
              className={styles.engineeringDetail}
              data-open={isOpen ? "true" : "false"}
              id={contentId}
              aria-hidden={!isOpen}
            >
              <div className={styles.engineeringDetailInner}>
                <ol className={styles.solutionFlow}>
                  {flowLabels.map((label, detailIndex) => (
                    <li className={styles.solutionStep} key={label}>
                      <span className={styles.solutionNode} aria-hidden="true" />
                      <div>
                        <h3 className={`${styles.solutionLabel} type-small`}>{label}</h3>
                        <p className={`${styles.solutionText} type-body`}>{details[detailIndex]}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
