import { kyvcProject } from "./kyvc-data";
import styles from "./kyvc-detail.module.css";

// KYvC 서비스 책임과 배포 흐름을 연결하는 아키텍처 시각화
export default function ProjectArchitecture() {
  const architecture = kyvcProject.architecture;

  return (
    <div className={styles.architectureVisual} data-architecture>
      <div
        className={styles.architectureMap}
        role="img"
        aria-label="User Web과 Backend, Admin Web과 Backend Admin, Core Admin과 Core Admin API, Backend와 Core 및 데이터·외부 시스템의 연결 구조"
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

          <span className={`${styles.archNode} ${styles.userWeb} type-small`}>{architecture.clients[0]}</span>
          <span className={`${styles.archNode} ${styles.adminWeb} type-small`}>{architecture.clients[1]}</span>
          <span className={`${styles.archNode} ${styles.coreAdmin} type-small`}>{architecture.clients[2]}</span>

          <span className={`${styles.archNode} ${styles.backend} type-small`}>{architecture.services[0]}</span>
          <span className={`${styles.archNode} ${styles.backendAdmin} type-small`}>{architecture.services[1]}</span>
          <span className={`${styles.archNode} ${styles.core} type-small`}>{architecture.services[2]}</span>
          <span className={`${styles.archNode} ${styles.coreAdminApi} type-small`}>{architecture.services[3]}</span>

          <span className={`${styles.archNode} ${styles.businessDatabase} type-small`}>
            {architecture.dataAndExternal[0]}
          </span>
          <span className={`${styles.archNode} ${styles.coreDatabase} type-small`}>
            {architecture.dataAndExternal[1]}
          </span>
          <span className={`${styles.archNode} ${styles.ocrLlm} type-small`}>
            {architecture.dataAndExternal[2]}
          </span>
          <span className={`${styles.archNode} ${styles.xrpl} type-small`}>
            {architecture.dataAndExternal[3]}
          </span>
          <span className={`${styles.archNode} ${styles.androidWallet} type-small`}>
            {architecture.dataAndExternal[4]}
          </span>

          <span className={`${styles.boundaryNote} type-small`}>직접 호출 없음 / 업무 DB 기준</span>
        </div>

        <div className={styles.architectureMobile} aria-hidden="true">
          <div className={styles.mobileFlow}>
            <span className={`${styles.mobileLayerLabel} type-small`}>클라이언트 → 서비스</span>
            <p className="type-small">User Web <b>→</b> Backend</p>
            <p className="type-small">Admin Web <b>→</b> Backend Admin <b>→</b> Business Database</p>
            <p className="type-small">Core Admin <b>→</b> Core Admin API <b>→</b> Core Database</p>
          </div>
          <div className={styles.mobileFlow}>
            <span className={`${styles.mobileLayerLabel} type-small`}>업무 서비스 → Core</span>
            <p className="type-small">Backend <b>→</b> Core</p>
            <p className="type-small">Core <b>→</b> Core Database / OCR / LLM / XRPL / Android Wallet</p>
            <p className="type-small">Backend Admin <b>↛</b> Core · 업무 Database 기준</p>
          </div>
        </div>
      </div>

      <div className={styles.infrastructureFlows} aria-label="인프라 계층">
        <div className={styles.infrastructureFlow}>
          <span className={`${styles.infrastructureLabel} type-small`}>인프라 / 실행 환경</span>
          <div className={styles.infrastructureNodes}>
            {architecture.runtime.map((node, index) => (
              <span className={`${styles.infrastructureNode} type-small`} key={node}>
                {index > 0 ? <span className={styles.infrastructureArrow} aria-hidden="true">→</span> : null}
                <span>{node}</span>
              </span>
            ))}
          </div>
        </div>
        <div className={styles.infrastructureFlow}>
          <span className={`${styles.infrastructureLabel} type-small`}>인프라 / 배포</span>
          <div className={styles.infrastructureNodes}>
            {architecture.delivery.map((node, index) => (
              <span className={`${styles.infrastructureNode} type-small`} key={node}>
                {index > 0 ? <span className={styles.infrastructureArrow} aria-hidden="true">→</span> : null}
                <span>{node}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
