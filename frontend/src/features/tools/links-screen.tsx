"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { formatApiError } from "@/lib/api/client";
import type { ToolLink, ToolLinkCategory } from "@/types/api";
import { getToolLinks } from "./tools-api";
import { useToolsSession } from "./tools-shell";
import styles from "./tools.module.css";

export const DEFAULT_LINK_IMAGE_URL = "/images/tools/links/default-link-preview.svg";

const CATEGORIES: ReadonlyArray<{ key: ToolLinkCategory; label: string }> = [
  { key: "REFERENCE", label: "Reference" },
  { key: "MY_SERVICES", label: "My Services" },
];

type LinkFilter = "ALL" | ToolLinkCategory;

const LINK_FILTERS: ReadonlyArray<{ value: LinkFilter; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "REFERENCE", label: "Reference" },
  { value: "MY_SERVICES", label: "My Services" },
];

export function getLinkMeta(value: string) {
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

// Backend 활성 Link의 실제 Category 및 데이터 표시 순서 유지
export function groupActiveLinks(links: readonly ToolLink[]) {
  return CATEGORIES.map((category) => ({
    ...category,
    items: links.flatMap((link) => {
      if (link.category !== category.key) {
        return [];
      }

      const metadata = getLinkMeta(link.url);
      return metadata ? [{ link, metadata }] : [];
    }),
  })).filter((category) => category.items.length > 0);
}

// 한 번 조회한 Link 배열의 선택 Category 필터링
export function filterActiveLinks(links: readonly ToolLink[], filter: LinkFilter) {
  return filter === "ALL" ? [...links] : links.filter((link) => link.category === filter);
}

export function LinkCard({
  link,
  metadata,
}: {
  link: ToolLink;
  metadata: NonNullable<ReturnType<typeof getLinkMeta>>;
}) {
  const requestedImage = link.imageUrl || DEFAULT_LINK_IMAGE_URL;
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const imageSrc = failedImage === requestedImage ? DEFAULT_LINK_IMAGE_URL : requestedImage;

  // 대표 이미지 로딩 실패 시 공통 Default Preview 전환
  const handleImageError = () => {
    if (imageSrc !== DEFAULT_LINK_IMAGE_URL) {
      setFailedImage(requestedImage);
    }
  };

  return (
    <a
      className={styles.linkCard}
      data-link-card
      href={metadata.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className={styles.linkCover}>
        <Image
          alt={link.name || metadata.domain}
          className={styles.linkCoverImage}
          fill
          unoptimized
          onError={handleImageError}
          sizes="(min-width: 1440px) 244px, (min-width: 1200px) calc((100vw - 128px) / 5), (min-width: 1024px) calc((100vw - 112px) / 4), (min-width: 768px) calc((100vw - 88px) / 3), calc(100vw - 40px)"
          src={imageSrc}
        />
      </span>

      <span className={styles.linkCardContent}>
        <span className={styles.linkCardMeta}>
          <span className={`${styles.linkDomain} type-small`}>{metadata.domain}</span>
          <ExternalLink aria-hidden="true" className={styles.linkExternalIcon} />
        </span>
        <strong className={`${styles.linkName} type-body`}>{link.name}</strong>
        <span
          aria-hidden={link.description ? undefined : true}
          className={`${styles.linkDescription} type-small`}
          data-link-description
        >
          {link.description || "\u00a0"}
        </span>
      </span>
    </a>
  );
}

// 이미지 중심 Blog Grid로 구성된 Category별 Link 조회 화면
export default function LinksScreen() {
  const { hasTool } = useToolsSession();
  const [links, setLinks] = useState<ToolLink[] | null>(null);
  const [linkFilter, setLinkFilter] = useState<LinkFilter>("ALL");
  const [error, setError] = useState("");
  const linksEnabled = hasTool("LINKS");
  const groups = groupActiveLinks(filterActiveLinks(links ?? [], linkFilter));
  const totalLinks = groups.reduce((total, group) => total + group.items.length, 0);

  useEffect(() => {
    if (!linksEnabled) {
      return;
    }

    let active = true;
    void getToolLinks()
      .then((response) => {
        if (active) setLinks(response.items);
      })
      .catch((caught: unknown) => {
        if (active) setError(formatApiError(caught));
      });
    return () => {
      active = false;
    };
  }, [linksEnabled]);

  if (!linksEnabled) {
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

  if (error) {
    return (
      <main className={styles.toolsPage} role="alert">
        <div className="content-container">{error}</div>
      </main>
    );
  }

  if (!links) {
    return <main className={styles.toolsPage} aria-busy="true" aria-label="Links 불러오는 중" />;
  }

  return (
    <main className={styles.toolsPage}>
      <div className="content-container">
        <header className={`${styles.pageHeader} ${styles.linksHeader}`}>
          <h1 className="type-heading">Links</h1>
          <span className={`${styles.linksTotal} type-small`}>
            {totalLinks} {totalLinks === 1 ? "link" : "links"}
          </span>
        </header>

        <div className={styles.linksFilters} role="group" aria-label="Link 분류">
          {LINK_FILTERS.map((filter) => (
            <button
              key={filter.value}
              className="type-body"
              type="button"
              aria-pressed={linkFilter === filter.value}
              onClick={() => setLinkFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {groups.length === 0 ? (
          <div className={styles.emptyState}>
            <h2 className="type-title">등록된 Link가 없습니다</h2>
            <p className="type-body">현재 표시할 활성 Link가 없습니다.</p>
          </div>
        ) : (
          <div className={styles.linkGroups}>
            {groups.map((group) => (
              <section className={styles.linkGroup} aria-labelledby={`links-${group.key}`} key={group.key}>
                <div className={styles.linkGroupHeading}>
                  <h2 className="type-body" id={`links-${group.key}`}>{group.label}</h2>
                  <span
                    aria-label={`${group.items.length} links`}
                    className={`${styles.linkGroupCount} type-small`}
                  >
                    {String(group.items.length).padStart(2, "0")}
                  </span>
                </div>
                <ul className={styles.linkGrid} data-link-grid>
                  {group.items.map(({ link, metadata }) => (
                    <li key={link.id}>
                      <LinkCard link={link} metadata={metadata} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
