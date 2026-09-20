"use client";

import { Github, Instagram, Linkedin, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { PUBLIC_COPY, type ContentMap } from "@/features/portfolio/public-portfolio";
import type { ExternalLink, ResumeMetadata } from "@/types/api";
import ThemeToggle from "./theme-toggle";

type SiteHeaderProps = {
  detail?: boolean;
  mark: string;
  markHref?: string;
  markLabel: string;
  navigation: readonly HeaderNavigationItem[];
  navigationLabel?: string;
  navigationActions?: ReactNode;
  leadingUtilityActions?: ReactNode;
  utilityActions?: ReactNode;
  mobileUtilityActions?: ReactNode;
};

export type HeaderNavigationItem = {
  label: string;
  href: string;
  active?: boolean;
};

type PortfolioFooterProps = {
  content: ContentMap;
  externalLinks: ExternalLink[];
  resume?: ResumeMetadata | null;
};

function externalLinkIcon(name: string) {
  const service = name.trim().toLowerCase();
  if (service === "github") {
    return <Github aria-hidden="true" strokeWidth={1.75} />;
  }
  if (service === "instagram") {
    return <Instagram aria-hidden="true" strokeWidth={1.75} />;
  }
  if (service === "linkedin" || service === "linked in") {
    return <Linkedin aria-hidden="true" strokeWidth={1.75} />;
  }
  return null;
}

// Public과 인증 Workspace가 공유하는 Portfolio Header 구조
export function SiteHeader({
  detail = false,
  mark,
  markHref,
  markLabel,
  navigation,
  navigationLabel = "포트폴리오 주요 영역",
  navigationActions,
  leadingUtilityActions,
  utilityActions,
  mobileUtilityActions,
}: SiteHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Mobile Sidebar 열림 상태의 배경 Scroll과 Escape 종료 처리
  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="site-header">
      <div className="content-container header-inner">
        <a
          className="site-mark type-small"
          href={markHref || (detail ? "/" : "#home")}
          aria-label={markLabel}
        >
          <span>{mark}</span>
        </a>

        <nav className="primary-navigation" aria-label={navigationLabel}>
          {navigation.map((item) => (
            <a
              className="navigation-link type-small"
              href={item.href}
              key={item.href}
              aria-current={item.active ? "page" : undefined}
            >
              {item.label}
            </a>
          ))}
          {navigationActions}
        </nav>

        <div className="header-utilities" role="group" aria-label="Header 유틸리티">
          {leadingUtilityActions}
          <ThemeToggle />
          {utilityActions}
          <button
            aria-controls="mobile-navigation"
            aria-expanded={isMenuOpen}
            aria-label="모바일 메뉴 열기"
            className="mobile-menu-trigger"
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span aria-hidden="true" className="mobile-menu-trigger-line" />
            <span aria-hidden="true" className="mobile-menu-trigger-line" />
          </button>
        </div>

        <div className={`mobile-sidebar${isMenuOpen ? " is-open" : ""}`}>
          <div aria-hidden="true" className="mobile-sidebar-backdrop" onClick={closeMenu} />
          <aside aria-label="모바일 메뉴" className="mobile-sidebar-panel" id="mobile-navigation">
            <div className="mobile-sidebar-heading">
              <span className="type-small">MENU</span>
              <button
                aria-label="모바일 메뉴 닫기"
                className="mobile-sidebar-close"
                type="button"
                onClick={closeMenu}
              >
                <span aria-hidden="true" />
                <span aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="모바일 포트폴리오 메뉴" className="mobile-sidebar-navigation">
              {navigation.map((item) => (
                <a
                  className="mobile-sidebar-link type-title"
                  href={item.href}
                  key={item.href}
                  onClick={closeMenu}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {mobileUtilityActions ? (
              <div className="mobile-sidebar-utilities">
                {mobileUtilityActions}
              </div>
            ) : null}

            <div className="mobile-sidebar-theme">
              <span className="type-small">Theme</span>
              <ThemeToggle ariaLabel="모바일 색상 테마 전환" />
            </div>
          </aside>
        </div>
      </div>
    </header>
  );
}

// Main과 Project Detail에서 공유하는 Portfolio Footer
export function PortfolioFooter({ content, externalLinks, resume = null }: PortfolioFooterProps) {
  const hasContact = Boolean(content.EMAIL) || externalLinks.length > 0;

  return (
    <footer className="portfolio-footer" id="footer">
      <div className="content-container footer-inner">
        <div className="footer-identity">
          {content.NAME ? (
            <h2 className="footer-name type-heading">{content.NAME}</h2>
          ) : null}
          {content.POSITION ? (
            <p className="footer-role type-small">{content.POSITION}</p>
          ) : null}
        </div>

        <div className="footer-information">
          <div className="footer-info-group">
            <p className="type-small">{PUBLIC_COPY.footer.resume}</p>
            <div className="footer-resume-actions">
              {resume ? (
                <>
                  <a
                    className="type-body-lg"
                    href="/api/v1/public/resume"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {PUBLIC_COPY.footer.resumeView}
                  </a>
                  <a className="type-body-lg" href="/api/v1/public/resume" download={resume.fileName}>
                    {PUBLIC_COPY.footer.resumeDownload}
                  </a>
                </>
              ) : (
                <>
                  <span className="type-body-lg" aria-disabled="true">{PUBLIC_COPY.footer.resumeView}</span>
                  <span className="type-body-lg" aria-disabled="true">{PUBLIC_COPY.footer.resumeDownload}</span>
                </>
              )}
            </div>
          </div>

          {hasContact ? (
            <div className="footer-info-group footer-contact">
              <p className="type-small">{PUBLIC_COPY.footer.contact}</p>
              <div className="footer-contact-links">
                {content.EMAIL ? (
                  <a href={`mailto:${content.EMAIL}`} aria-label={content.EMAIL}>
                    <Mail aria-hidden="true" strokeWidth={1.75} />
                  </a>
                ) : null}
                {externalLinks.map((link) => {
                  const icon = externalLinkIcon(link.name);
                  return (
                    <a
                      className={icon ? undefined : "footer-text-link type-small"}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.name}
                      key={link.id}
                    >
                      {icon ?? link.name}
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="footer-bottom type-small">
          <span>{PUBLIC_COPY.footer.portfolio}</span>
          <span>{PUBLIC_COPY.footer.copyright}</span>
        </div>
      </div>
    </footer>
  );
}
