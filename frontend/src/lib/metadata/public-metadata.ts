export const DEFAULT_OG_IMAGE_PATH = "/images/og/portfolio-og.png";

// Public Site Origin 환경값 검증
export function getPublicSiteOrigin() {
  const configured = process.env.PUBLIC_SITE_URL?.trim();

  if (!configured) {
    return null;
  }

  try {
    const url = new URL(configured);

    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

// Public Origin 기반 절대 URL 구성
export function publicUrl(origin: string, path: string) {
  return new URL(path, origin).toString();
}

// Public 공유 이미지 절대 URL 구성
export function getDefaultOgImageUrl(origin: string | null) {
  return origin ? publicUrl(origin, DEFAULT_OG_IMAGE_PATH) : undefined;
}
