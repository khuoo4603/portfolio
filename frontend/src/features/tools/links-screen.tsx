"use client";

import { ExternalLink } from "lucide-react";
import {
  MOCK_TOOL_LINKS,
  type ToolLinkCategory,
} from "./mock-tools";
import { useToolsSession } from "./tools-shell";
import styles from "./tools.module.css";

const CATEGORIES: ReadonlyArray<{ key: ToolLinkCategory; label: string }> = [
  { key: "REFERENCE", label: "Reference" },
  { key: "DEVELOPMENT", label: "Development" },
  { key: "MY_SERVICES", label: "My Services" },
  { key: "PERSONAL", label: "Personal" },
];

function linkMetadata(value: string) {
  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return { href: url.href, domain: url.hostname };
  } catch {
    return null;
  }
}

// 활성 Mock Link의 Category별 조회 화면
export default function LinksScreen() {
  const { hasTool } = useToolsSession();
  const groups = CATEGORIES.map((category) => ({
    ...category,
    items: MOCK_TOOL_LINKS.filter((link) => (
      link.category === category.key && linkMetadata(link.url) !== null
    )),
  })).filter((category) => category.items.length > 0);

  if (!hasTool("LINKS")) {
    return (
      <main className={styles.toolsPage}>
        <div className="content-container">
          <header className={styles.pageHeader}>
            <h1 className="type-heading">Links</h1>
          </header>
          <div className={styles.emptyState}>
            <h2 className="type-title">요청한 Tool을 찾을 수 없습니다</h2>
            <p className="type-body">현재 사용할 수 있는 Tool 목록을 확인해 주세요.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.toolsPage}>
      <div className="content-container">
        <header className={styles.pageHeader}>
          <h1 className="type-heading">Links</h1>
        </header>

        {groups.length === 0 ? (
          <div className={styles.emptyState}>
            <h2 className="type-title">등록된 Link가 없습니다</h2>
            <p className="type-body">현재 표시할 활성 Link가 없습니다.</p>
          </div>
        ) : (
          <div className={styles.linkGroups}>
            {groups.map((group) => (
              <section className={styles.linkGroup} aria-labelledby={`links-${group.key}`} key={group.key}>
                <h2 className="type-small" id={`links-${group.key}`}>{group.label}</h2>
                <ul className={styles.linkList}>
                  {group.items.map((link) => {
                    const metadata = linkMetadata(link.url);

                    if (!metadata) {
                      return null;
                    }

                    return (
                      <li key={link.id}>
                        <a
                          className={styles.linkRow}
                          href={metadata.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className={styles.linkContent}>
                            <span className={styles.linkIdentity}>
                              <strong className="type-body">{link.name}</strong>
                              <span className="type-small">{metadata.domain}</span>
                            </span>
                            {link.description && (
                              <span className={`${styles.linkDescription} type-body`}>{link.description}</span>
                            )}
                          </span>
                          <ExternalLink aria-hidden="true" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
