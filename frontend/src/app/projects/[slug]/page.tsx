import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { mapProjectDetail } from "@/features/portfolio/project-detail";
import { mapPublicPortfolio } from "@/features/portfolio/public-portfolio";
import {
  PublicApiError,
  fetchPublicPortfolio,
  fetchPublicProject,
} from "@/lib/api/public-server";
import ProjectDetailView, { ProjectErrorView } from "./project-detail-view";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

const loadProjectPageData = cache(async (slug: string) => Promise.allSettled([
  fetchPublicProject(slug),
  fetchPublicPortfolio(),
]));

function traceId(result: PromiseRejectedResult) {
  return result.reason instanceof PublicApiError ? result.reason.response?.traceId : undefined;
}

// 실제 Project와 Portfolio Data 기반 동적 Metadata 구성
export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [projectResult, portfolioResult] = await loadProjectPageData(slug);
  if (projectResult.status === "rejected") {
    return {};
  }

  const project = mapProjectDetail(projectResult.value);
  const owner = portfolioResult.status === "fulfilled"
    ? mapPublicPortfolio(portfolioResult.value).content.NAME
    : null;

  return {
    title: owner ? `${project.name} | ${owner} 포트폴리오` : project.name,
    description: project.summaryText || undefined,
  };
}

// 공개 slug 조회 결과의 404와 Backend 장애를 분리하는 동적 Project Detail Route
export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const [projectResult, portfolioResult] = await loadProjectPageData(slug);

  if (
    projectResult.status === "rejected"
    && projectResult.reason instanceof PublicApiError
    && projectResult.reason.status === 404
  ) {
    notFound();
  }

  const portfolio = portfolioResult.status === "fulfilled"
    ? mapPublicPortfolio(portfolioResult.value)
    : null;

  if (projectResult.status === "rejected" || !portfolio) {
    let errorTraceId: string | undefined;
    if (projectResult.status === "rejected") {
      errorTraceId = traceId(projectResult);
    } else if (portfolioResult.status === "rejected") {
      errorTraceId = traceId(portfolioResult);
    }
    return <ProjectErrorView portfolio={portfolio} traceId={errorTraceId} />;
  }

  return (
    <ProjectDetailView
      project={mapProjectDetail(projectResult.value)}
      portfolio={portfolio}
    />
  );
}
