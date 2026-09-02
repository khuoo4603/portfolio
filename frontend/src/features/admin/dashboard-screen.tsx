"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SegmentedControl from "@/components/ui/segmented-control";
import { formatApiError } from "@/lib/api/client";
import type { DashboardData, TrafficPoint } from "./admin-types";
import { EmptyState, PageError, PageHeader, PageLoading, StatusLabel, formatDateTime } from "./admin-ui";
import { getAdminDashboard, type DashboardMonths } from "./admin-read-api";
import styles from "./admin.module.css";

const PERIOD_FILTERS: ReadonlyArray<{ value: DashboardMonths; label: string }> = [
  { value: 6, label: "6개월" },
  { value: 12, label: "12개월" },
];

const SERVICE_NAMES: Record<string, string> = {
  PORTFOLIO_FRONTEND: "Portfolio Frontend",
  PORTFOLIO_BACKEND: "Portfolio Backend",
  KYVC_FRONTEND: "KYvC Frontend",
  KYVC_BACKEND: "KYvC Backend",
  KYVC_CORE: "KYvC Core",
  SHKUTRACK: "SHKUTrack",
};

function chartPoints(items: TrafficPoint[], key: "visitors" | "pageViews", maxValue: number) {
  if (items.length === 0) {
    return "";
  }

  return items.map((item, index) => {
    const x = items.length === 1 ? 360 : 24 + (index / (items.length - 1)) * 672;
    const y = 208 - (item[key] / maxValue) * 176;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}

// Backend 월별 방문자·Page View 데이터의 절제된 SVG 추이 표현
function TrafficChart({ trend }: { trend: TrafficPoint[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (trend.length === 0) {
    return <EmptyState title="방문 추이 없음" description="선택한 기간의 집계 데이터가 없습니다." />;
  }

  const maxValue = Math.max(1, ...trend.flatMap((point) => [point.visitors, point.pageViews]));
  const visitors = chartPoints(trend, "visitors", maxValue);
  const pageViews = chartPoints(trend, "pageViews", maxValue);
  const activePoint = activeIndex === null ? null : trend[activeIndex];
  const activeX = activeIndex === null ? 0 : trend.length === 1 ? 360 : 24 + (activeIndex / (trend.length - 1)) * 672;
  const tooltipX = Math.min(542, Math.max(24, activeX - 77));

  return (
    <div className={styles.trafficChart}>
      <div className={`${styles.chartLegend} type-small`}>
        <span className={styles.visitorLegend}>방문자</span>
        <span className={styles.viewLegend}>페이지 조회</span>
      </div>
      <svg viewBox="0 0 720 232" role="img" aria-labelledby="traffic-chart-title traffic-chart-description">
        <title id="traffic-chart-title">월별 방문 추이</title>
        <desc id="traffic-chart-description">최근 월별 방문자 수와 페이지 조회 수 비교</desc>
        {[32, 76, 120, 164, 208].map((y) => (
          <line key={y} className={styles.chartGridLine} x1="24" x2="696" y1={y} y2={y} />
        ))}
        <polyline className={styles.pageViewLine} points={pageViews} />
        <polyline className={styles.visitorLine} points={visitors} />
        {trend.map((point, index) => {
          const x = trend.length === 1 ? 360 : 24 + (index / (trend.length - 1)) * 672;
          const visitorY = 208 - (point.visitors / maxValue) * 176;
          const pageViewY = 208 - (point.pageViews / maxValue) * 176;
          const previousX = index === 0 ? 0 : trend.length === 1 ? 0 : 24 + ((index - 1) / (trend.length - 1)) * 672;
          const nextX = index === trend.length - 1 ? 720 : trend.length === 1 ? 720 : 24 + ((index + 1) / (trend.length - 1)) * 672;
          return (
            <g
              key={point.month}
              className={styles.chartPointGroup}
              tabIndex={0}
              aria-label={`${point.month}, 방문자 ${point.visitors}, 페이지 조회 ${point.pageViews}`}
              onPointerEnter={() => setActiveIndex(index)}
              onPointerLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
            >
              <rect className={styles.chartHitArea} x={(previousX + x) / 2} y="20" width={(nextX - previousX) / 2} height="196" />
              <circle className={styles.pageViewPoint} cx={x} cy={pageViewY} r="3" />
              <circle className={styles.chartPoint} cx={x} cy={visitorY} r="3" />
            </g>
          );
        })}
        {activePoint && (
          <g className={styles.chartTooltip} aria-hidden="true">
            <line x1={activeX} x2={activeX} y1="28" y2="208" />
            <rect x={tooltipX} y="38" width="154" height="74" />
            <text x={tooltipX + 12} y="58">{activePoint.month}</text>
            <text x={tooltipX + 12} y="79">방문자 {activePoint.visitors.toLocaleString("ko-KR")}</text>
            <text x={tooltipX + 12} y="99">페이지 조회 {activePoint.pageViews.toLocaleString("ko-KR")}</text>
          </g>
        )}
      </svg>
      <div className={`${styles.chartMonths} type-small`}>
        {trend.map((point) => <span key={point.month}>{point.month.slice(2)}</span>)}
      </div>
    </div>
  );
}

// 방문 현황과 운영 상태를 한 화면에 정렬한 Admin Dashboard
export default function DashboardScreen() {
  const [months, setMonths] = useState<DashboardMonths>(6);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestSequence = useRef(0);

  // 선택 기간의 Dashboard 조회와 오래된 응답 무시
  const loadDashboard = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setLoading(true);
    setError("");
    try {
      const response = await getAdminDashboard(months);
      if (requestSequence.current === requestId) {
        setData(response);
      }
    } catch (caught) {
      if (requestSequence.current === requestId) {
        setError(formatApiError(caught));
        setData(null);
      }
    } finally {
      if (requestSequence.current === requestId) {
        setLoading(false);
      }
    }
  }, [months]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        void loadDashboard();
      }
    });
    return () => {
      active = false;
      requestSequence.current += 1;
    };
  }, [loadDashboard]);

  // 방문 추이 조회 기간 전환
  const selectMonths = (value: DashboardMonths) => {
    if (value === months) {
      return;
    }

    setMonths(value);
  };

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="방문 현황, 서비스 상태와 사이트 현황을 한눈에 확인합니다."
        action={(
          <SegmentedControl label="방문 추이 기간" options={PERIOD_FILTERS} value={months} onChange={selectMonths} />
        )}
      />

      {loading ? (
        <PageLoading rows={6} />
      ) : error ? (
        <PageError message={error} onRetry={() => void loadDashboard()} />
      ) : data ? (
        <div className={styles.dashboardFlow}>
          <section className={styles.summarySection} aria-labelledby="traffic-summary-title">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="traffic-summary-title" className="type-title">방문 현황</h2>
              </div>
            </div>
            <dl className={styles.summaryRow}>
              <div><dt className="type-small">오늘 방문자</dt><dd>{data.traffic.todayVisitors.toLocaleString("ko-KR")}</dd></div>
              <div><dt className="type-small">오늘 페이지 조회</dt><dd>{data.traffic.todayPageViews.toLocaleString("ko-KR")}</dd></div>
              <div><dt className="type-small">이번 달 방문자</dt><dd>{data.traffic.monthVisitors.toLocaleString("ko-KR")}</dd></div>
              <div><dt className="type-small">이번 달 페이지 조회</dt><dd>{data.traffic.monthPageViews.toLocaleString("ko-KR")}</dd></div>
            </dl>
          </section>

          <div className={styles.dashboardPrimaryGrid}>
            <section className={styles.chartSection} aria-labelledby="trend-title">
              <div className={styles.sectionHeading}>
                <div>
                  <h2 id="trend-title" className="type-title">방문 추이</h2>
                </div>
              </div>
              <TrafficChart trend={data.traffic.trend} />
            </section>

            <section className={styles.serviceSection} aria-labelledby="service-title">
              <div className={styles.sectionHeading}>
                <div>
                  <h2 id="service-title" className="type-title">서비스 상태</h2>
                </div>
              </div>
              <div className={styles.serviceRows}>
                {data.serviceStatus.length === 0 ? (
                  <EmptyState title="서비스 상태 없음" description="수신된 서비스 상태가 없습니다." />
                ) : data.serviceStatus.map((service) => (
                  <div key={service.serviceKey} className={styles.serviceRow}>
                    <div>
                      <strong className="type-body">{SERVICE_NAMES[service.serviceKey] ?? service.serviceKey}</strong>
                      <span className="type-small">{formatDateTime(service.lastCheckedAt)}</span>
                    </div>
                    <StatusLabel tone={service.status === "UP" ? "success" : "error"}>
                      {service.status === "UP" ? "정상" : "장애"}
                    </StatusLabel>
                    <div className={`${styles.serviceMeta} type-small`}>
                      <span>{service.responseTimeMs === null ? "-" : `${service.responseTimeMs} ms`}</span>
                      <span>{service.httpStatus ?? "-"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className={styles.siteSummarySection} aria-labelledby="site-summary-title">
            <div className={styles.sectionHeading}>
              <div>
                <h2 id="site-summary-title" className="type-title">사이트 현황</h2>
              </div>
            </div>
            <dl className={styles.compactSummary}>
              <div><dt className="type-small">공개 프로젝트</dt><dd>{data.siteSummary.publicProjects}</dd></div>
              <div><dt className="type-small">활성 기술</dt><dd>{data.siteSummary.portfolioTechnologies}</dd></div>
              <div><dt className="type-small">활성 Tool</dt><dd>{data.siteSummary.activeTools}</dd></div>
              <div><dt className="type-small">활성 계정</dt><dd>{data.siteSummary.activeAccounts}</dd></div>
            </dl>
          </section>

        </div>
      ) : null}
    </>
  );
}
