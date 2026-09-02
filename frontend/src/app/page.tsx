import { mapPublicPortfolio } from "@/features/portfolio/public-portfolio";
import { fetchPublicPortfolio } from "@/lib/api/public-server";
import PageViewTracker from "@/lib/analytics/page-view-tracker";
import { HomeView } from "./home-view";

export const dynamic = "force-dynamic";

// 서버 전용 Backend Target을 사용하는 동적 Public SSR Route
export default async function Home() {
  const portfolio = await fetchPublicPortfolio().catch(() => null);
  if (!portfolio) {
    return (
      <main className="content-container main-section" role="alert">
        공개 콘텐츠를 불러오지 못했습니다.
      </main>
    );
  }
  return (
    <>
      <PageViewTracker path="/" />
      <HomeView model={mapPublicPortfolio(portfolio)} />
    </>
  );
}
