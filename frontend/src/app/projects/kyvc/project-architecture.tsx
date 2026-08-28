import type { ProjectArchitecture as ProjectArchitectureData } from "@/types/api";
import { hasProjectArchitecture } from "@/features/portfolio/project-detail";
import styles from "./kyvc-detail.module.css";

type ProjectArchitectureProps = {
  slug: string;
  projectName: string;
  architecture: ProjectArchitectureData;
};

const groupLabels = {
  clients: "클라이언트 계층",
  services: "서비스 계층",
  dataAndExternal: "데이터 / 외부 시스템",
  runtime: "인프라 / 실행 환경",
  delivery: "인프라 / 배포",
} as const;

// KYvC 고정 좌표·Edge 적용 가능 여부 확인
function supportsKyvcVisual(architecture: ProjectArchitectureData) {
  return (
    (architecture.clients?.length ?? 0) >= 3
    && (architecture.services?.length ?? 0) >= 4
    && (architecture.dataAndExternal?.length ?? 0) >= 5
  );
}

// 다른 프로젝트의 Backend Node Group만 표시하는 Edge 없는 Architecture 구성
function ArchitectureGroups({ architecture }: { architecture: ProjectArchitectureData }) {
  const groups = (Object.keys(groupLabels) as (keyof typeof groupLabels)[]).flatMap((key) => {
    const nodes = architecture[key] ?? [];
    return nodes.length > 0 ? [{ key, label: groupLabels[key], nodes }] : [];
  });

  return (
    <div className={styles.architectureGroups} data-architecture-groups>
      {groups.map((group) => (
        <section className={styles.infrastructureFlow} key={group.key}>
          <h3 className={`${styles.infrastructureLabel} type-small`}>{group.label}</h3>
          <div className={styles.infrastructureNodes}>
            {group.nodes.map((node) => (
              <span className={`${styles.infrastructureNode} type-small`} key={node}>{node}</span>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// API Node Label과 프로젝트별 Frontend Visual Config 기반 아키텍처 시각화
export default function ProjectArchitecture({
  slug,
  projectName,
  architecture,
}: ProjectArchitectureProps) {
  if (!hasProjectArchitecture(architecture)) {
    return <p className={`${styles.emptyValue} type-body`}>-</p>;
  }

  if (slug !== "kyvc" || !supportsKyvcVisual(architecture)) {
    return <ArchitectureGroups architecture={architecture} />;
  }

  const clients = architecture.clients!;
  const services = architecture.services!;
  const dataAndExternal = architecture.dataAndExternal!;
  const runtime = architecture.runtime ?? [];
  const delivery = architecture.delivery ?? [];

  return (
    <div className={styles.architectureVisual} data-architecture data-visual-config="kyvc">
      <div
        className={styles.architectureMap}
        role="img"
        aria-label={`${projectName} 서비스와 데이터·외부 시스템의 연결 구조`}
      >
        <div className={styles.architectureDesktop} aria-hidden="true">
          <span className={`${styles.layerLabel} ${styles.clientLabel} type-small`}>클라이언트 계층</span>
          <span className={`${styles.layerLabel} ${styles.serviceLabel} type-small`}>서비스 계층</span>
          <span className={`${styles.layerLabel} ${styles.dataLabel} type-small`}>데이터 / 외부 시스템</span>

          <svg className={styles.architectureConnections} viewBox="0 0 1000 640" preserveAspectRatio="none">
            <defs>
              <marker
                id="architecture-arrow"
                viewBox="0 0 8 8"
                refX="7"
                refY="4"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path className={styles.architectureArrow} d="M0 0L8 4L0 8Z" />
              </marker>
            </defs>
            <g className={styles.connectionGuide}>
              <path d="M0 184H1000" />
              <path d="M0 360H1000" />
            </g>
            <g className={styles.connectionPrimary} markerEnd="url(#architecture-arrow)">
              <path d="M120 128V256" />
              <path d="M370 128V256" />
              <path d="M860 128V256" />
              <path d="M192 280C300 280 450 280 558 280" />
              <path d="M120 304C120 360 100 376 100 432" />
              <path d="M370 304C370 376 100 366 100 432" />
              <path d="M630 304C630 368 320 368 320 432" />
              <path d="M630 304C630 366 520 376 520 432" />
              <path d="M630 304C630 366 720 376 720 432" />
              <path d="M630 304C630 366 900 366 900 432" />
              <path d="M860 304C860 384 320 366 320 432" />
            </g>
            <g className={styles.connectionBlocked}>
              <path d="M442 320H538" />
              <path d="M538 308V332" />
            </g>
          </svg>

          <span className={`${styles.archNode} ${styles.userWeb} type-small`}>{clients[0]}</span>
          <span className={`${styles.archNode} ${styles.adminWeb} type-small`}>{clients[1]}</span>
          <span className={`${styles.archNode} ${styles.coreAdmin} type-small`}>{clients[2]}</span>

          <span className={`${styles.archNode} ${styles.backend} type-small`}>{services[0]}</span>
          <span className={`${styles.archNode} ${styles.backendAdmin} type-small`}>{services[1]}</span>
          <span className={`${styles.archNode} ${styles.core} type-small`}>{services[2]}</span>
          <span className={`${styles.archNode} ${styles.coreAdminApi} type-small`}>{services[3]}</span>

          <span className={`${styles.archNode} ${styles.businessDatabase} type-small`}>
            {dataAndExternal[0]}
          </span>
          <span className={`${styles.archNode} ${styles.coreDatabase} type-small`}>
            {dataAndExternal[1]}
          </span>
          <span className={`${styles.archNode} ${styles.ocrLlm} type-small`}>
            {dataAndExternal[2]}
          </span>
          <span className={`${styles.archNode} ${styles.xrpl} type-small`}>
            {dataAndExternal[3]}
          </span>
          <span className={`${styles.archNode} ${styles.androidWallet} type-small`}>
            {dataAndExternal[4]}
          </span>

          <span className={`${styles.boundaryNote} type-small`}>직접 호출 없음 / 업무 DB 기준</span>
        </div>

        <div className={styles.architectureMobile} aria-hidden="true">
          <div className={styles.mobileFlow}>
            <span className={`${styles.mobileLayerLabel} type-small`}>클라이언트 → 서비스</span>
            <p className="type-small">{clients[0]} <b>→</b> {services[0]}</p>
            <p className="type-small">{clients[1]} <b>→</b> {services[1]} <b>→</b> {dataAndExternal[0]}</p>
            <p className="type-small">{clients[2]} <b>→</b> {services[3]} <b>→</b> {dataAndExternal[1]}</p>
          </div>
          <div className={styles.mobileFlow}>
            <span className={`${styles.mobileLayerLabel} type-small`}>업무 서비스 → Core</span>
            <p className="type-small">{services[0]} <b>→</b> {services[2]}</p>
            <p className="type-small">
              {services[2]} <b>→</b> {dataAndExternal.slice(1).join(" / ")}
            </p>
            <p className="type-small">{services[1]} <b>↛</b> {services[2]} · 업무 Database 기준</p>
          </div>
        </div>
      </div>

      {runtime.length > 0 || delivery.length > 0 ? (
        <div className={styles.infrastructureFlows} aria-label="인프라 계층">
          {runtime.length > 0 ? (
            <div className={styles.infrastructureFlow}>
              <span className={`${styles.infrastructureLabel} type-small`}>인프라 / 실행 환경</span>
              <div className={styles.infrastructureNodes}>
                {runtime.map((node, index) => (
                  <span className={`${styles.infrastructureNode} type-small`} key={node}>
                    {index > 0 ? <span className={styles.infrastructureArrow} aria-hidden="true">→</span> : null}
                    <span>{node}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {delivery.length > 0 ? (
            <div className={styles.infrastructureFlow}>
              <span className={`${styles.infrastructureLabel} type-small`}>인프라 / 배포</span>
              <div className={styles.infrastructureNodes}>
                {delivery.map((node, index) => (
                  <span className={`${styles.infrastructureNode} type-small`} key={node}>
                    {index > 0 ? <span className={styles.infrastructureArrow} aria-hidden="true">→</span> : null}
                    <span>{node}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
