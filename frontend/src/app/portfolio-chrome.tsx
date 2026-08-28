import { Github, Instagram, Linkedin, Mail } from "lucide-react";
import type { ReactNode } from "react";
import type { ContentMap } from "@/features/portfolio/public-portfolio";
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
  utilityActions?: ReactNode;
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
  utilityActions,
}: SiteHeaderProps) {
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
          <ThemeToggle />
          {utilityActions}
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
          {content.FOOTER_NAME ? (
            <h2 className="footer-name type-heading">{content.FOOTER_NAME}</h2>
          ) : null}
          {content.FOOTER_ROLE ? (
            <p className="footer-role type-small">{content.FOOTER_ROLE}</p>
          ) : null}
        </div>

        <div className="footer-information">
          {content.RESUME_LABEL ? (
            <div className="footer-info-group">
              <p className="type-small">{content.RESUME_LABEL}</p>
              <div className="footer-resume-actions">
                {resume ? (
                  <>
                    {content.RESUME_VIEW_LABEL ? (
                      <a
                        className="type-body-lg"
                        href="/api/v1/public/resume"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {content.RESUME_VIEW_LABEL}
                      </a>
                    ) : null}
                    {content.RESUME_DOWNLOAD_LABEL ? (
                      <a className="type-body-lg" href="/api/v1/public/resume" download={resume.fileName}>
                        {content.RESUME_DOWNLOAD_LABEL}
                      </a>
                    ) : null}
                  </>
                ) : (
                  <>
                    {content.RESUME_VIEW_LABEL ? (
                      <span className="type-body-lg" aria-disabled="true">{content.RESUME_VIEW_LABEL}</span>
                    ) : null}
                    {content.RESUME_DOWNLOAD_LABEL ? (
                      <span className="type-body-lg" aria-disabled="true">{content.RESUME_DOWNLOAD_LABEL}</span>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          ) : null}

          {hasContact ? (
            <div className="footer-info-group footer-contact">
              {content.CONTACT_LABEL ? <p className="type-small">{content.CONTACT_LABEL}</p> : null}
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
          {content.PORTFOLIO_LABEL ? <span>{content.PORTFOLIO_LABEL}</span> : null}
          {content.COPYRIGHT ? <span>{content.COPYRIGHT}</span> : null}
        </div>
      </div>
    </footer>
  );
}
