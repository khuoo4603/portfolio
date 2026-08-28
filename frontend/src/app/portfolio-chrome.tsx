import { Github, Instagram, Linkedin, Mail } from "lucide-react";
import type { ReactNode } from "react";
import type { ContentMap } from "@/features/portfolio/public-portfolio";
import type { ExternalLink, ResumeMetadata } from "@/types/api";
import ThemeToggle from "./theme-toggle";

const navigationItems = [
  { label: "소개", href: "#about" },
  { label: "기술스택", href: "#tech" },
  { label: "프로젝트", href: "#projects" },
  { label: "학력 및 성과", href: "#education" },
] as const;

type SiteHeaderProps = {
  detail?: boolean;
  mark?: string;
  markHref?: string;
  markLabel?: string;
  navigation?: readonly HeaderNavigationItem[];
  navigationLabel?: string;
  navigationActions?: ReactNode;
  utilityActions?: ReactNode;
};

export type HeaderNavigationItem = {
  label: string;
  href: string;
  active?: boolean;
};

type PortfolioFooterProps = {
  content?: ContentMap;
  externalLinks?: ExternalLink[];
  resume?: ResumeMetadata | null;
};

const LEGACY_FOOTER_CONTENT: ContentMap = {
  FOOTER_NAME: "김현우",
  FOOTER_ROLE: "BACKEND / INFRA DEVELOPER",
  RESUME_LABEL: "RESUME",
  RESUME_VIEW_LABEL: "이력서 보기",
  RESUME_DOWNLOAD_LABEL: "PDF 다운로드",
  CONTACT_LABEL: "CONTACT",
  EMAIL: "khuoo4603@gmail.com",
  PORTFOLIO_LABEL: "PORTFOLIO / 2026",
  COPYRIGHT: "© 2026 Kim Hyunwoo. All rights reserved.",
};

const LEGACY_EXTERNAL_LINKS: ExternalLink[] = [
  { id: 1, name: "Instagram", url: "https://www.instagram.com/hyun_woooooooooo/", displayOrder: 1 },
  { id: 2, name: "GitHub", url: "https://github.com/khuoo4603", displayOrder: 2 },
  {
    id: 3,
    name: "LinkedIn",
    url: "https://www.linkedin.com/in/%ED%98%84%EC%9A%B0-%EA%B9%80-b0201a414/",
    displayOrder: 3,
  },
];

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
  mark = "KIM HYUNWOO",
  markHref,
  markLabel = "김현우 포트폴리오 Home",
  navigation,
  navigationLabel = "포트폴리오 주요 영역",
  navigationActions,
  utilityActions,
}: SiteHeaderProps) {
  const resolvedNavigation: readonly HeaderNavigationItem[] = navigation || navigationItems.map((item) => ({
    ...item,
    href: detail ? `/${item.href}` : item.href,
  }));

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
          {resolvedNavigation.map((item) => (
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
          <ThemeToggle />
          {utilityActions}
        </div>
      </div>
    </header>
  );
}

// Main과 Project Detail에서 공유하는 Portfolio Footer
export function PortfolioFooter({ content, externalLinks, resume = null }: PortfolioFooterProps = {}) {
  const resolvedContent = content ?? LEGACY_FOOTER_CONTENT;
  const resolvedLinks = externalLinks ?? LEGACY_EXTERNAL_LINKS;
  const hasContact = Boolean(resolvedContent.EMAIL) || resolvedLinks.length > 0;

  return (
    <footer className="portfolio-footer" id="footer">
      <div className="content-container footer-inner">
        <div className="footer-identity">
          {resolvedContent.FOOTER_NAME ? (
            <h2 className="footer-name type-heading">{resolvedContent.FOOTER_NAME}</h2>
          ) : null}
          {resolvedContent.FOOTER_ROLE ? (
            <p className="footer-role type-small">{resolvedContent.FOOTER_ROLE}</p>
          ) : null}
        </div>

        <div className="footer-information">
          {resolvedContent.RESUME_LABEL ? (
            <div className="footer-info-group">
              <p className="type-small">{resolvedContent.RESUME_LABEL}</p>
              <div className="footer-resume-actions">
                {resume ? (
                  <>
                    {resolvedContent.RESUME_VIEW_LABEL ? (
                      <a
                        className="type-body-lg"
                        href="/api/v1/public/resume"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {resolvedContent.RESUME_VIEW_LABEL}
                      </a>
                    ) : null}
                    {resolvedContent.RESUME_DOWNLOAD_LABEL ? (
                      <a className="type-body-lg" href="/api/v1/public/resume" download={resume.fileName}>
                        {resolvedContent.RESUME_DOWNLOAD_LABEL}
                      </a>
                    ) : null}
                  </>
                ) : (
                  <>
                    {resolvedContent.RESUME_VIEW_LABEL ? (
                      <span className="type-body-lg" aria-disabled="true">{resolvedContent.RESUME_VIEW_LABEL}</span>
                    ) : null}
                    {resolvedContent.RESUME_DOWNLOAD_LABEL ? (
                      <span className="type-body-lg" aria-disabled="true">{resolvedContent.RESUME_DOWNLOAD_LABEL}</span>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          ) : null}

          {hasContact ? (
            <div className="footer-info-group footer-contact">
              {resolvedContent.CONTACT_LABEL ? <p className="type-small">{resolvedContent.CONTACT_LABEL}</p> : null}
              <div className="footer-contact-links">
                {resolvedContent.EMAIL ? (
                  <a href={`mailto:${resolvedContent.EMAIL}`} aria-label={resolvedContent.EMAIL}>
                    <Mail aria-hidden="true" strokeWidth={1.75} />
                  </a>
                ) : null}
                {resolvedLinks.map((link) => {
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
          {resolvedContent.PORTFOLIO_LABEL ? <span>{resolvedContent.PORTFOLIO_LABEL}</span> : null}
          {resolvedContent.COPYRIGHT ? <span>{resolvedContent.COPYRIGHT}</span> : null}
        </div>
      </div>
    </footer>
  );
}
