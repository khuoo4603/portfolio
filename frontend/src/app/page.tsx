import { mapPublicPortfolio } from "@/features/portfolio/public-portfolio";
import { fetchPublicPortfolio } from "@/lib/api/public-server";
import PageViewTracker from "@/lib/analytics/page-view-tracker";
import { HomeView } from "./home-view";
import {
  PublicErrorState,
  resolveErrorSceneCode,
  resolveErrorTraceId,
} from "./public-error-state";

export const dynamic = "force-dynamic";

// 서버 전용 Backend Target을 사용하는 동적 Public SSR Route
export default async function Home() {
  let portfolio;
  try {
    portfolio = await fetchPublicPortfolio();
  } catch (error) {
    return (
      <PublicErrorState
        code={resolveErrorSceneCode(error)}
        traceId={resolveErrorTraceId(error)}
      />
    );
  }
  return (
    <>
      <PageViewTracker path="/" />
      <HomeView model={mapPublicPortfolio(portfolio)} />
    </>
  );
}
