import { Github, Instagram, Linkedin, Mail } from "lucide-react";
import ThemeToggle from "./theme-toggle";

const navigationItems = [
  { label: "소개", href: "#about" },
  { label: "기술스택", href: "#tech" },
  { label: "프로젝트", href: "#projects" },
  { label: "학력 및 성과", href: "#education" },
] as const;

type SiteHeaderProps = {
  detail?: boolean;
};

// Main과 Project Detail에서 공유하는 Portfolio Header
export function SiteHeader({ detail = false }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="content-container header-inner">
        <a
          className="site-mark type-small"
          href={detail ? "/" : "#home"}
          aria-label="김현우 포트폴리오 Home"
        >
          <span>KIM HYUNWOO</span>
        </a>

        <nav className="primary-navigation" aria-label="포트폴리오 주요 영역">
          {navigationItems.map((item) => (
            <a
              className="navigation-link type-small"
              href={detail ? `/${item.href}` : item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}

// Main과 Project Detail에서 공유하는 Portfolio Footer
export function PortfolioFooter() {
  return (
    <footer className="portfolio-footer" id="footer">
      <div className="content-container footer-inner">
        <div className="footer-identity">
          <h2 className="footer-name type-heading">김현우</h2>
          <p className="footer-role type-small">BACKEND / INFRA DEVELOPER</p>
        </div>

        <div className="footer-information">
          <div className="footer-info-group">
            <p className="type-small">RESUME</p>
            <div className="footer-disabled-actions">
              <span className="type-body-lg" aria-disabled="true">이력서 보기</span>
              <span className="type-body-lg" aria-disabled="true">PDF 다운로드</span>
            </div>
          </div>

          <div className="footer-info-group footer-contact">
            <p className="type-small">CONTACT</p>
            <div className="footer-contact-links">
              <a href="mailto:khuoo4603@gmail.com" aria-label="khuoo4603@gmail.com">
                <Mail aria-hidden="true" strokeWidth={1.75} />
              </a>
              <a
                href="https://www.instagram.com/hyun_woooooooooo/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Instagram aria-hidden="true" strokeWidth={1.75} />
              </a>
              <a
                href="https://github.com/khuoo4603"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <Github aria-hidden="true" strokeWidth={1.75} />
              </a>
              <a
                href="https://www.linkedin.com/in/%ED%98%84%EC%9A%B0-%EA%B9%80-b0201a414/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <Linkedin aria-hidden="true" strokeWidth={1.75} />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom type-small">
          <span>PORTFOLIO / 2026</span>
          <span>© 2026 Kim Hyunwoo. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
