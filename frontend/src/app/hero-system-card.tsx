"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import HeroWorldMap, {
  EAST_ASIA_FOCUS_POINT,
  EAST_ASIA_MAP_SIZE,
  EAST_ASIA_SOURCE_CROP,
  EAST_ASIA_VIEWBOX,
  EAST_ASIA_ZOOM_SCALE,
  HeroEastAsiaMap,
  HeroNarrativeWorldMap,
  KOREA_ANCHOR,
  MOBILE_KOREA_VIEWBOX,
  TABLET_PORTRAIT_KOREA_VIEWBOX,
  WORLD_MAP_SIZE,
  calculateEastAsiaFocusRatio,
  formatMapViewBox,
  projectPoint,
} from "./hero-world-map";

type IdleWindow = Window & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const serverPoint = projectPoint(KOREA_ANCHOR);
const resetProperties = ["--card-rotate-x", "--card-rotate-y"] as const;

export const HERO_SCROLL_TIMING = {
  topologyHoldEnd: 0.12,
  topologyExitStart: 0.1,
  topologyExitEnd: 0.2,
  mapCenterStart: 0.18,
  mapCenterEnd: 0.3,
  fullMapHoldDuration: 0.06,
  baseZoomDuration: 0.3,
  postZoomHoldDuration: 0.12,
  sceneExitDuration: 0.12,
  tailDuration: 0.2,
} as const;

export const PORTRAIT_HERO_SCROLL_TIMING = {
  topologyHoldEnd: 0.015,
  topologyExitStart: 0,
  topologyExitEnd: 0.08,
  mapCenterStart: 0.01,
  mapCenterEnd: 0.1,
  zoomStart: 0.03,
  fullMapHoldDuration: 0,
  baseZoomDuration: 0.3,
  postZoomHoldDuration: 0.12,
  sceneExitDuration: 0.12,
  tailDuration: 0.2,
} as const;

export const KOREA_ZOOM_DISTANCE_MULTIPLIER = 3.2;
export const KOREA_ZOOM_SCALE_MULTIPLIER = EAST_ASIA_ZOOM_SCALE;
export const MOBILE_KOREA_ZOOM_SCALE = 1.08 * 1.5;
export const TABLET_PORTRAIT_KOREA_ZOOM_SCALE = (
  TABLET_PORTRAIT_KOREA_VIEWBOX.width * EAST_ASIA_ZOOM_SCALE * 1.5
) / EAST_ASIA_MAP_SIZE.width;
export const WORLD_TO_FOCUS_SCALE = 360
  / (EAST_ASIA_SOURCE_CROP.lng.max - EAST_ASIA_SOURCE_CROP.lng.min);
export const FINAL_VIRTUAL_ZOOM_SCALE = WORLD_TO_FOCUS_SCALE * EAST_ASIA_ZOOM_SCALE;
export const FOCUS_HANDOFF_START_SCALE = WORLD_TO_FOCUS_SCALE * 0.97;
export const FOCUS_HANDOFF_END_SCALE = WORLD_TO_FOCUS_SCALE * 1.05;
export const WORLD_CAMERA_PAN_START_SCALE = 1.35;
export const PORTRAIT_WORLD_CAMERA_PAN_START_SCALE = 1.08;

export const MAP_DOT_SCREEN_WIDTH = {
  worldStart: 1.65,
  worldHandoff: 2.05,
  focusFinal: 3.6,
} as const;

export const PROJECT_GALLERY_MOTIONS = [
  { exitX: -0.48, exitY: -0.16, from: 0.08, sideX: -0.32, sideY: -0.11, to: 0.51 },
  { exitX: 0.4, exitY: 0.15, from: 0.295, sideX: 0.25, sideY: 0.09, to: 0.725 },
  { exitX: -0.45, exitY: 0.2, from: 0.51, sideX: -0.29, sideY: 0.13, to: 0.94 },
] as const;

const projectGalleryFrames = [
  {
    height: 525,
    src: "/images/profile/map-zoom-gallery-01.webp",
    width: 700,
  },
  {
    height: 854,
    src: "/images/profile/map-zoom-gallery-02.webp",
    width: 1280,
  },
  {
    height: 520,
    src: "/images/profile/map-zoom-gallery-03.webp",
    width: 960,
  },
] as const;

const vmResources = [
  {
    className: "topology-resource-platform",
    items: ["Kubernetes", "Argo"],
  },
  {
    className: "topology-resource-application",
    items: ["Next.js", "Spring Boot", "PostgreSQL"],
  },
] as const;

const connectionRoutes = [
  {
    delay: "0s",
    id: "topology-route-platform",
    path: `M${serverPoint.x.toFixed(1)} 166.5H410V110H288`,
  },
  {
    delay: "0.4s",
    id: "topology-route-application",
    path: `M${serverPoint.x.toFixed(1)} 166.5V250H640V310`,
  },
  {
    delay: "0.8s",
    id: "topology-route-storage",
    path: `M${serverPoint.x.toFixed(1)} 166.5H360V430H248`,
  },
] as const;

type InfrastructureResourceProps = {
  className: string;
  items?: readonly string[];
  name: string;
};

type TopologyStyle = CSSProperties & {
  "--card-rotate-x": string;
  "--card-rotate-y": string;
  "--connection-depth": string;
  "--flow-depth": string;
  "--flow-opacity": number;
  "--frame-opacity": number;
  "--gallery-plane-left": string;
  "--gallery-perspective": string;
  "--inner-depth": string;
  "--korea-x": string;
  "--korea-y": string;
  "--focus-map-dot-width": string;
  "--focus-map-opacity": number;
  "--card-map-opacity": number;
  "--map-clip-inset": string;
  "--map-filter": string;
  "--map-translate-x": string;
  "--map-translate-y": string;
  "--marker-opacity": number;
  "--marker-pointer-x": string;
  "--marker-pointer-y": string;
  "--narrative-world-map-opacity": number;
  "--resource-depth": string;
  "--server-opacity": number;
  "--topology-opacity": number;
  "--world-map-dot-width": string;
};

type GalleryFrameStyle = CSSProperties & {
  "--gallery-blur": string;
  "--gallery-opacity": number;
  "--gallery-scale": number;
  "--gallery-x": string;
  "--gallery-y": string;
  "--gallery-z": string;
};

export type GalleryViewport = "desktop" | "tablet" | "tabletPortrait" | "mobile";
export type HeroScrollProfile = "default" | "portrait";
export type MapCameraProfile = "default" | "mobilePortrait" | "tabletPortrait";

const galleryViewportMotion = {
  desktop: {
    blur: 18,
    depth: 1,
    offscreenMargin: 32,
    perspective: 1400,
    safeMargin: 24,
    x: 1,
    y: 1,
  },
  tablet: {
    blur: 14,
    depth: 0.88,
    offscreenMargin: 24,
    perspective: 1200,
    safeMargin: 20,
    x: 0.72,
    y: 0.75,
  },
  tabletPortrait: {
    blur: 14,
    depth: 1,
    offscreenMargin: 24,
    perspective: 1200,
    safeMargin: 20,
    x: 1,
    y: 1,
  },
  mobile: {
    blur: 5,
    depth: 0.72,
    offscreenMargin: 16,
    perspective: 900,
    safeMargin: 16,
    x: 0.45,
    y: 0.63,
  },
} as const;

const GALLERY_MARKER_HALF_SIZE = 12;
const GALLERY_SPAWN_GAP = 10;
const GALLERY_SPAWN_PROGRESS = 0.1;
const GALLERY_FRONT_PROGRESS = 0.82;
const GALLERY_FOLLOW_RATE = 14;
const GALLERY_PROGRESS_EPSILON = 0.0005;
const GALLERY_ORIGIN_EPSILON = 0.05;

const initialStyle: TopologyStyle = {
  "--card-rotate-x": "0deg",
  "--card-rotate-y": "0deg",
  "--connection-depth": "16px",
  "--flow-depth": "28px",
  "--flow-opacity": 1,
  "--frame-opacity": 1,
  "--gallery-plane-left": "0px",
  "--gallery-perspective": `${galleryViewportMotion.desktop.perspective}px`,
  "--inner-depth": "52px",
  "--korea-x": `${(serverPoint.x / WORLD_MAP_SIZE.width) * 100}%`,
  "--korea-y": `${(serverPoint.y / WORLD_MAP_SIZE.height) * 100}%`,
  "--focus-map-dot-width": String(MAP_DOT_SCREEN_WIDTH.worldHandoff),
  "--focus-map-opacity": 0,
  "--card-map-opacity": 1,
  "--map-clip-inset": "0px",
  "--map-filter": "none",
  "--map-translate-x": "0px",
  "--map-translate-y": "0px",
  "--marker-opacity": 1,
  "--marker-pointer-x": "0px",
  "--marker-pointer-y": "0px",
  "--narrative-world-map-opacity": 0,
  "--resource-depth": "44px",
  "--server-opacity": 1,
  "--topology-opacity": 1,
  "--world-map-dot-width": String(MAP_DOT_SCREEN_WIDTH.worldStart),
};

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
const interpolate = (from: number, to: number, progress: number) => from + (to - from) * progress;
const phaseProgress = (progress: number, from: number, to: number) => clamp((progress - from) / (to - from));
const smoothProgress = (progress: number, from: number, to: number) => {
  const phase = phaseProgress(progress, from, to);

  return phase * phase * (3 - 2 * phase);
};

// World와 Focus 지도의 공통 Camera 배율 계산
export function calculateVirtualZoomScale(zoomProgress: number) {
  return interpolate(1, FINAL_VIRTUAL_ZOOM_SCALE, clamp(zoomProgress));
}

// LOD 기준 배율 중심의 짧은 World·Focus Cross Fade 진행도 계산
export function calculateFocusTransition(virtualZoomScale: number) {
  if (virtualZoomScale <= WORLD_TO_FOCUS_SCALE) {
    return smoothProgress(
      virtualZoomScale,
      FOCUS_HANDOFF_START_SCALE,
      WORLD_TO_FOCUS_SCALE,
    ) * 0.5;
  }

  return 0.5 + smoothProgress(
    virtualZoomScale,
    WORLD_TO_FOCUS_SCALE,
    FOCUS_HANDOFF_END_SCALE,
  ) * 0.5;
}

// 단일 Virtual Zoom에서 파생된 지도 LOD 상태 계산
export function calculateMapZoomState(
  zoomProgress: number,
  cameraProfile: MapCameraProfile = "default",
) {
  const virtualZoomScale = calculateVirtualZoomScale(zoomProgress);
  const desktopFocusScale = Math.min(
    Math.max(virtualZoomScale / WORLD_TO_FOCUS_SCALE, 1),
    EAST_ASIA_ZOOM_SCALE,
  );
  const focusDotProgress = phaseProgress(desktopFocusScale, 1, EAST_ASIA_ZOOM_SCALE);
  const finalFocusScale = cameraProfile === "mobilePortrait"
    ? MOBILE_KOREA_ZOOM_SCALE
    : cameraProfile === "tabletPortrait"
      ? TABLET_PORTRAIT_KOREA_ZOOM_SCALE
      : EAST_ASIA_ZOOM_SCALE;
  const cameraPanStart = cameraProfile === "default"
    ? WORLD_CAMERA_PAN_START_SCALE
    : PORTRAIT_WORLD_CAMERA_PAN_START_SCALE;
  const focusMapScale = interpolate(1, finalFocusScale, focusDotProgress);
  const worldDotProgress = smoothProgress(
    virtualZoomScale,
    1,
    FOCUS_HANDOFF_START_SCALE,
  );

  return {
    virtualZoomScale,
    narrativeWorldMapScale: Math.min(virtualZoomScale, FOCUS_HANDOFF_END_SCALE),
    focusMapScale,
    focusTransition: calculateFocusTransition(virtualZoomScale),
    cameraPanProgress: smoothProgress(
      virtualZoomScale,
      cameraPanStart,
      FOCUS_HANDOFF_START_SCALE,
    ),
    worldMapDotWidth: interpolate(
      MAP_DOT_SCREEN_WIDTH.worldStart,
      MAP_DOT_SCREEN_WIDTH.worldHandoff,
      worldDotProgress,
    ),
    focusMapDotWidth: interpolate(
      MAP_DOT_SCREEN_WIDTH.worldHandoff,
      MAP_DOT_SCREEN_WIDTH.focusFinal,
      focusDotProgress,
    ),
  };
}

const calculateGallerySpatialState = (
  localProgress: number,
  viewport: GalleryViewport,
) => ({
  z: interpolate(-850, 320, localProgress) * galleryViewportMotion[viewport].depth,
  scale: interpolate(0.72, 1.08, localProgress),
});

// 이미지별 Seoul Origin 경로 기반 Project Gallery 진행 상태 계산
export function calculateGalleryFrameState(
  zoomProgress: number,
  index: number,
  viewport: GalleryViewport = "desktop",
) {
  const path = PROJECT_GALLERY_MOTIONS[index];
  const localProgress = phaseProgress(zoomProgress, path.from, path.to);
  const viewportMotion = galleryViewportMotion[viewport];
  const spatialState = calculateGallerySpatialState(localProgress, viewport);
  const blur = interpolate(
    viewportMotion.blur,
    0,
    smoothProgress(localProgress, 0, 0.62),
  );
  const opacity = localProgress <= 0.08
    ? 0
    : localProgress <= 0.2
      ? interpolate(0, 0.55, smoothProgress(localProgress, 0.08, 0.2))
      : localProgress <= 0.62
        ? interpolate(0.55, 1, smoothProgress(localProgress, 0.2, 0.62))
        : localProgress <= 0.9
          ? 1
          : 1 - smoothProgress(localProgress, 0.9, 1);

  return {
    localProgress,
    z: spatialState.z,
    scale: spatialState.scale,
    blur,
    opacity,
    routeProgress: phaseProgress(localProgress, GALLERY_SPAWN_PROGRESS, GALLERY_FRONT_PROGRESS),
    exitProgress: phaseProgress(localProgress, GALLERY_FRONT_PROGRESS, 1),
  };
}

type GalleryPoint = { x: number; y: number };
type GallerySize = { height: number; width: number };
type GalleryMotionPath = (typeof PROJECT_GALLERY_MOTIONS)[number];

type SceneRect = GallerySize & {
  left: number;
  top: number;
};

type SceneGeometry = {
  anchorLocalY: number;
  anchorViewportX: number;
  focusTargetX: number;
  focusTargetY: number;
  focusTranslateX: number;
  focusTranslateY: number;
  galleryViewport: GalleryViewport;
  graph: SceneRect;
  isDesktop: boolean;
  isReducedMotion: boolean;
  mapCameraProfile: MapCameraProfile;
  narrativeTargetX: number;
  narrativeTargetY: number;
  scrollLayout: {
    baseDistance: number;
    metrics: ReturnType<typeof calculateHeroScrollMetrics>;
    sceneStart: number;
  } | null;
  stage: SceneRect & { documentTop: number };
  stickyTop: number;
  worldUnitX: number;
  worldUnitY: number;
};

type GalleryAnchorInput = {
  bounds: GallerySize;
  frame: GallerySize;
  origin: GalleryPoint;
  path: GalleryMotionPath;
  viewport: GalleryViewport;
};

type GalleryPositionInput = GalleryAnchorInput & {
  state: ReturnType<typeof calculateGalleryFrameState>;
};

const clampGalleryCenter = (
  center: number,
  stageSize: number,
  projectedSize: number,
  safeMargin: number,
) => {
  const min = projectedSize / 2 + safeMargin;
  const max = stageSize - projectedSize / 2 - safeMargin;

  return min <= max ? Math.min(Math.max(center, min), max) : stageSize / 2;
};

const calculateProjectedSize = (
  frame: GallerySize,
  z: number,
  scale: number,
  perspective: number,
) => {
  const perspectiveScale = perspective / (perspective - z);
  const visualScale = scale * perspectiveScale;

  return {
    height: frame.height * visualScale,
    width: frame.width * visualScale,
  };
};

// Frame·Viewport별 고정 Spawn·Front·Exit Anchor 계산
export function calculateGalleryFrameAnchors({
  bounds,
  frame,
  origin,
  path,
  viewport,
}: GalleryAnchorInput) {
  const viewportMotion = galleryViewportMotion[viewport];
  const spawnState = calculateGallerySpatialState(GALLERY_SPAWN_PROGRESS, viewport);
  const frontState = calculateGallerySpatialState(GALLERY_FRONT_PROGRESS, viewport);
  const exitState = calculateGallerySpatialState(1, viewport);
  const spawnSize = calculateProjectedSize(
    frame,
    spawnState.z,
    spawnState.scale,
    viewportMotion.perspective,
  );
  const frontSize = calculateProjectedSize(
    frame,
    frontState.z,
    frontState.scale,
    viewportMotion.perspective,
  );
  const exitSize = calculateProjectedSize(
    frame,
    exitState.z,
    exitState.scale,
    viewportMotion.perspective,
  );
  const spawn = {
    x: Math.sign(path.sideX)
      * (spawnSize.width / 2 + GALLERY_MARKER_HALF_SIZE + GALLERY_SPAWN_GAP),
    y: Math.sign(path.sideY)
      * (spawnSize.height / 2 + GALLERY_MARKER_HALF_SIZE + GALLERY_SPAWN_GAP),
  };
  const front = {
    x: clampGalleryCenter(
      origin.x + path.sideX * bounds.width * viewportMotion.x,
      bounds.width,
      frontSize.width,
      viewportMotion.safeMargin,
    ) - origin.x,
    y: clampGalleryCenter(
      origin.y + path.sideY * bounds.height * viewportMotion.y,
      bounds.height,
      frontSize.height,
      viewportMotion.safeMargin,
    ) - origin.y,
  };
  const exitCenterX = Math.sign(path.sideX) < 0
    ? -(exitSize.width / 2 + viewportMotion.offscreenMargin)
    : bounds.width + exitSize.width / 2 + viewportMotion.offscreenMargin;

  return {
    spawn,
    front,
    exit: {
      x: exitCenterX - origin.x,
      y: path.exitY * bounds.height * viewportMotion.y,
    },
  };
}

// 고정 Anchor 사이의 중단 없는 Gallery Frame Offset 계산
export function calculateGalleryFramePosition(input: GalleryPositionInput) {
  const { state } = input;
  const anchors = calculateGalleryFrameAnchors(input);

  if (state.localProgress < GALLERY_SPAWN_PROGRESS) {
    const progress = phaseProgress(state.localProgress, 0, GALLERY_SPAWN_PROGRESS);

    return {
      x: interpolate(0, anchors.spawn.x, progress),
      y: interpolate(0, anchors.spawn.y, progress),
    };
  }

  if (state.localProgress <= GALLERY_FRONT_PROGRESS) {
    return {
      x: interpolate(anchors.spawn.x, anchors.front.x, state.routeProgress),
      y: interpolate(anchors.spawn.y, anchors.front.y, state.routeProgress),
    };
  }

  return {
    x: interpolate(anchors.front.x, anchors.exit.x, state.exitProgress),
    y: interpolate(anchors.front.y, anchors.exit.y, state.exitProgress),
  };
}

// Gallery Follow의 Frame-rate Independent 지수 감쇠 계산
export function dampGalleryValue(
  current: number,
  target: number,
  deltaSeconds: number,
  followRate = GALLERY_FOLLOW_RATE,
) {
  const alpha = 1 - Math.exp(-followRate * Math.max(deltaSeconds, 0));

  return current + (target - current) * alpha;
}

// Stage 내부 Gallery Plane의 Full Viewport Layout 계산
export function calculateGalleryPlaneLayout(
  stageLeft: number,
  stageHeight: number,
  viewportWidth: number,
) {
  return {
    bounds: { height: stageHeight, width: viewportWidth },
    left: -stageLeft,
  };
}

// Portrait World Map의 대한민국 Anchor를 목표 수평 비율에 배치하는 Offset 계산
export function calculatePortraitWorldOffsetX(
  mapWidth: number,
  koreaRatioX: number,
  targetRatio = 0.5,
) {
  return (targetRatio - koreaRatioX) * mapWidth;
}

// Map Camera 이동이 반영된 Seoul Marker의 Gallery Plane Local 좌표 계산
export function calculateGalleryOrigin(
  anchorGlobalX: number,
  anchorGlobalY: number,
  mapTranslateX: number,
  mapTranslateY: number,
  stageTop: number,
) {
  return {
    x: anchorGlobalX + mapTranslateX,
    y: anchorGlobalY + mapTranslateY - stageTop,
  };
}

// Viewport Profile별 Hero Scroll Narrative 픽셀 타임라인 계산
export function calculateHeroScrollMetrics(
  baseDistance: number,
  profile: HeroScrollProfile = "default",
) {
  const safeDistance = Math.max(baseDistance, 1);
  const timing = profile === "portrait" ? PORTRAIT_HERO_SCROLL_TIMING : HERO_SCROLL_TIMING;
  const baseZoomDistance = safeDistance * timing.baseZoomDuration;
  const zoomDistance = baseZoomDistance * KOREA_ZOOM_DISTANCE_MULTIPLIER;
  const mapCenterEnd = safeDistance * timing.mapCenterEnd;
  const fullMapHoldEnd = mapCenterEnd + safeDistance * timing.fullMapHoldDuration;
  const zoomStart = profile === "portrait"
    ? safeDistance * PORTRAIT_HERO_SCROLL_TIMING.zoomStart
    : fullMapHoldEnd;
  const zoomEnd = zoomStart + zoomDistance;
  const sceneExitStart = zoomEnd + safeDistance * timing.postZoomHoldDuration;
  const sceneExitEnd = sceneExitStart + safeDistance * timing.sceneExitDuration;
  const totalDistance = sceneExitEnd + safeDistance * timing.tailDuration;

  return {
    topologyHoldEnd: safeDistance * timing.topologyHoldEnd,
    topologyExitStart: safeDistance * timing.topologyExitStart,
    topologyExitEnd: safeDistance * timing.topologyExitEnd,
    mapCenterStart: safeDistance * timing.mapCenterStart,
    mapCenterEnd,
    fullMapHoldStart: mapCenterEnd,
    fullMapHoldEnd,
    zoomStart,
    zoomDistance,
    zoomEnd,
    postZoomHoldStart: zoomEnd,
    postZoomHoldEnd: sceneExitStart,
    sceneExitStart,
    sceneExitEnd,
    totalDistance,
  } as const;
}

// Scroll 픽셀 위치 기반 Hero Narrative 시각 상태 계산
export function calculateHeroSceneState(
  scrollPixels: number,
  metrics: ReturnType<typeof calculateHeroScrollMetrics>,
  galleryViewport: GalleryViewport = "desktop",
  mapCameraProfile: MapCameraProfile = "default",
) {
  const centerProgress = smoothProgress(scrollPixels, metrics.mapCenterStart, metrics.mapCenterEnd);
  const zoomProgress = phaseProgress(scrollPixels, metrics.zoomStart, metrics.zoomEnd);
  const zoomState = calculateMapZoomState(zoomProgress, mapCameraProfile);
  const mapExit = scrollPixels > metrics.sceneExitStart
    ? smoothProgress(scrollPixels, metrics.sceneExitStart, metrics.sceneExitEnd)
    : 0;
  const topologyExit = smoothProgress(scrollPixels, metrics.topologyExitStart, metrics.topologyExitEnd);
  const depthExit = smoothProgress(scrollPixels, metrics.topologyExitStart, metrics.topologyExitEnd);

  return {
    centerProgress,
    zoomProgress,
    ...zoomState,
    mapExit,
    blurStrength: mapExit * 8,
    cardMapOpacity: (1 - centerProgress) * (1 - mapExit),
    narrativeWorldMapOpacity: centerProgress * (1 - zoomState.focusTransition) * (1 - mapExit),
    focusMapOpacity: zoomState.focusTransition * (1 - mapExit),
    galleryFrames: projectGalleryFrames.map((_, index) => (
      calculateGalleryFrameState(zoomProgress, index, galleryViewport)
    )),
    aboutOpacity: mapExit,
    identityOpacity: 1 - smoothProgress(scrollPixels, metrics.topologyExitStart, metrics.mapCenterEnd),
    topologyOpacity: 1 - topologyExit,
    flowOpacity: 1 - smoothProgress(scrollPixels, metrics.topologyExitStart, metrics.mapCenterStart),
    frameOpacity: 1 - smoothProgress(scrollPixels, metrics.topologyHoldEnd, metrics.mapCenterEnd),
    depth: 1 - depthExit,
    clipProgress: smoothProgress(scrollPixels, metrics.mapCenterStart, metrics.mapCenterEnd),
    markerOpacity: 1 - mapExit,
    serverOpacity: 1 - topologyExit,
  };
}

// 정적 연결선 전용 SVG 구성
function TopologyConnectionLines() {
  return (
    <svg
      aria-hidden="true"
      className="topology-connection-lines"
      focusable="false"
      preserveAspectRatio="none"
      viewBox="0 0 800 500"
    >
      {connectionRoutes.map((route) => (
        <path
          className="topology-connection-line topology-route-path"
          d={route.path}
          id={`${route.id}-line`}
          key={route.id}
        />
      ))}
    </svg>
  );
}

// 이동 Flow Point 전용 SVG 구성
function TopologyFlowOverlay() {
  return (
    <svg
      aria-hidden="true"
      className="topology-flow-overlay"
      focusable="false"
      preserveAspectRatio="none"
      viewBox="0 0 800 500"
    >
      {connectionRoutes.map((route) => (
        <g
          className="topology-flow-route"
          data-delay={route.delay}
          data-duration="3.2s"
          key={`${route.id}-flow`}
        >
          <path
            className="topology-flow-guide topology-route-path"
            d={route.path}
            id={`${route.id}-guide`}
          />
          <g className="topology-flow-point" opacity="0">
            <circle className="topology-flow-point-glow" r="6" />
            <circle className="topology-flow-point-core" r="2.75" />
            <animateMotion begin={route.delay} dur="3.2s" repeatCount="indefinite">
              <mpath href={`#${route.id}-guide`} />
            </animateMotion>
            <animate
              attributeName="opacity"
              begin={route.delay}
              dur="3.2s"
              keyTimes="0;0.08;0.88;1"
              repeatCount="indefinite"
              values="0;1;1;0"
            />
          </g>
        </g>
      ))}
    </svg>
  );
}

// VM Group과 Standalone Resource의 계층형 Surface 구성
function InfrastructureResource({ className, items, name }: InfrastructureResourceProps) {
  return (
    <article
      aria-label={`${name} Resource, 활성 상태 ON${items ? `, Stack ${items.join(", ")}` : ""}`}
      className={`topology-resource ${items ? "topology-resource-group" : "topology-resource-standalone"} ${className}`}
      data-resource={name}
    >
      <header className="topology-resource-header">
        <span className="topology-resource-heading type-small">
          <strong>{name}</strong>
        </span>
        <span className="topology-resource-status type-small">
          <span aria-hidden="true" className="topology-active-dot" />
          ON
        </span>
      </header>

      {items ? (
        <ul className="topology-stack" aria-label={`${name} Stack`}>
          {items.map((item) => (
            <li className="topology-stack-item type-small" key={item}>
              <span aria-hidden="true" className="topology-stack-dot" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

// World Map, East Asia Focus Map, Project Gallery, Server Topology의 단일 Scroll Stage 구성
export default function HeroSystemCard() {
  const stageRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const narrativeMapRef = useRef<HTMLDivElement>(null);
  const focusMapRef = useRef<HTMLDivElement>(null);
  const galleryPlaneRef = useRef<HTMLDivElement>(null);
  const galleryFrameRefs = useRef<Array<HTMLDivElement | null>>([]);
  const progressRef = useRef(0);
  const galleryReadyRef = useRef(false);
  const [galleryReady, setGalleryReady] = useState(false);
  const [mapGeometryReady, setMapGeometryReady] = useState(false);

  useEffect(() => {
    const idleWindow = window as IdleWindow;
    let idleCallbackId = 0;
    let fallbackTimeoutId = 0;
    let activated = false;

    // 최초 Idle 또는 첫 Scroll 중 빠른 시점의 후반 지도 Geometry 활성화
    const activateGeometry = () => {
      if (activated) return;
      activated = true;
      if (idleCallbackId) idleWindow.cancelIdleCallback?.(idleCallbackId);
      if (fallbackTimeoutId) window.clearTimeout(fallbackTimeoutId);
      window.removeEventListener("scroll", activateGeometry);
      setMapGeometryReady(true);
    };

    window.addEventListener("scroll", activateGeometry, { passive: true, once: true });
    if (idleWindow.requestIdleCallback) {
      idleCallbackId = idleWindow.requestIdleCallback(activateGeometry, { timeout: 80 });
    } else {
      fallbackTimeoutId = window.setTimeout(activateGeometry, 0);
    }

    return () => {
      if (idleCallbackId) idleWindow.cancelIdleCallback?.(idleCallbackId);
      if (fallbackTimeoutId) window.clearTimeout(fallbackTimeoutId);
      window.removeEventListener("scroll", activateGeometry);
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const graph = graphRef.current;
    const mapLayer = mapRef.current;
    const narrativeMapViewport = narrativeMapRef.current;
    const focusMapViewport = focusMapRef.current;
    const galleryPlane = galleryPlaneRef.current;
    const narrativeMapZoom = narrativeMapViewport?.querySelector<SVGGElement>(
      ".topology-narrative-world-map-zoom",
    );
    const focusMapZoom = focusMapViewport?.querySelector<SVGGElement>(".topology-focus-map-zoom");
    const focusMapSvg = focusMapViewport?.querySelector<SVGSVGElement>(".topology-focus-map-svg");
    const hero = stage?.closest<HTMLElement>(".hero");
    const heroSystem = stage?.closest<HTMLElement>(".hero-system");
    const aboutSection = document.querySelector<HTMLElement>(".about-section");
    const aboutAnchor = aboutSection?.querySelector<HTMLElement>(".about-anchor");
    const flowSvg = graph?.querySelector<SVGSVGElement>(".topology-flow-overlay");

    if (
      !stage
      || !graph
      || !mapLayer
      || !narrativeMapViewport
      || !focusMapViewport
      || !narrativeMapZoom
      || !focusMapZoom
      || !focusMapSvg
      || !galleryPlane
      || !hero
      || !heroSystem
      || !aboutSection
      || !aboutAnchor
      || !flowSvg
    ) return;

    const galleryImages = Array.from(
      galleryPlane.querySelectorAll<HTMLImageElement>(".topology-project-gallery-image"),
    );
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const portraitMapQuery = window.matchMedia("(max-width: 899px) and (orientation: portrait)");
    const tabletLandscapeQuery = window.matchMedia(
      "(min-width: 768px) and (max-width: 1023px) and (orientation: landscape)",
    );
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    let animationFrame = 0;
    let layoutFrame = 0;
    let galleryAnimationFrame = 0;
    let pointerFrame = 0;
    let markerPointerFrame = 0;
    let galleryLastTimestamp: number | null = null;
    let galleryInitialized = false;
    let galleryTargetProgress = 0;
    let galleryRenderedProgress = 0;
    let galleryTargetOrigin = { x: 0, y: 0 };
    let galleryRenderedOrigin = { x: 0, y: 0 };
    let pointerTilt = { rotateX: 0, rotateY: 0 };
    let markerPointer = { x: 0, y: 0 };
    let galleryLayout: {
      bounds: GallerySize;
      frameSizes: GallerySize[];
      viewport: GalleryViewport;
    } | null = null;
    let flowActive: boolean | null = null;
    let sceneGeometry: SceneGeometry | null = null;

    const getMapCameraProfile = (): MapCameraProfile => {
      if (!portraitMapQuery.matches) return "default";

      return mobileQuery.matches ? "mobilePortrait" : "tabletPortrait";
    };

    const getFocusViewBox = (cameraProfile: MapCameraProfile) => {
      if (cameraProfile === "mobilePortrait") return MOBILE_KOREA_VIEWBOX;
      if (cameraProfile === "tabletPortrait") return TABLET_PORTRAIT_KOREA_VIEWBOX;

      return EAST_ASIA_VIEWBOX;
    };

    // Portrait Profile별 East Asia Camera와 SVG 채움 방식 동기화
    const updateFocusMapLayout = () => {
      const cameraProfile = getMapCameraProfile();
      const viewBox = getFocusViewBox(cameraProfile);

      focusMapSvg.setAttribute("viewBox", formatMapViewBox(viewBox));
      focusMapSvg.setAttribute(
        "preserveAspectRatio",
        cameraProfile === "default" ? "xMidYMid meet" : "xMidYMid slice",
      );
    };

    // Marker Pointer Offset 즉시 복원
    const resetMarkerPointer = () => {
      window.cancelAnimationFrame(markerPointerFrame);
      markerPointerFrame = 0;
      markerPointer = { x: 0, y: 0 };
      stage.style.setProperty("--marker-pointer-x", "0px");
      stage.style.setProperty("--marker-pointer-y", "0px");
    };

    // Cache된 Stage Local Geometry의 현재 Viewport 좌표 계산
    const getInteractionBounds = (rect: SceneRect) => {
      const geometry = sceneGeometry;

      if (!geometry) return null;

      const stageViewportTop = Math.max(
        geometry.stickyTop,
        geometry.stage.documentTop - window.scrollY,
      );

      return {
        left: geometry.stage.left + rect.left,
        top: stageViewportTop + rect.top,
        right: geometry.stage.left + rect.left + rect.width,
        bottom: stageViewportTop + rect.top + rect.height,
        width: rect.width,
        height: rect.height,
      };
    };

    // Hero Pointer 위치 기반 단일 Korea Marker Parallax 갱신
    const handleMarkerPointerMove = (event: globalThis.PointerEvent) => {
      if (
        event.pointerType !== "mouse"
        || !finePointerQuery.matches
        || reducedMotionQuery.matches
      ) {
        resetMarkerPointer();
        return;
      }

      const geometry = sceneGeometry;
      const bounds = geometry
        ? getInteractionBounds(
          progressRef.current <= HERO_SCROLL_TIMING.topologyExitEnd
            ? geometry.graph
            : { left: 0, top: 0, width: geometry.stage.width, height: geometry.stage.height },
        )
        : null;

      if (
        !bounds
        || !bounds.width
        || !bounds.height
        || event.clientX < bounds.left
        || event.clientX > bounds.right
        || event.clientY < bounds.top
        || event.clientY > bounds.bottom
      ) {
        resetMarkerPointer();
        return;
      }

      markerPointer = {
        x: (clamp((event.clientX - bounds.left) / bounds.width) * 2 - 1) * 6,
        y: (clamp((event.clientY - bounds.top) / bounds.height) * 2 - 1) * 5,
      };

      if (markerPointerFrame) {
        return;
      }

      markerPointerFrame = window.requestAnimationFrame(() => {
        markerPointerFrame = 0;
        stage.style.setProperty("--marker-pointer-x", `${markerPointer.x.toFixed(2)}px`);
        stage.style.setProperty("--marker-pointer-y", `${markerPointer.y.toFixed(2)}px`);
      });
    };

    // Cache된 Graph Geometry 기반 초기 Topology Perspective 반영
    const handleCardPointerMove = (event: globalThis.PointerEvent) => {
      const geometry = sceneGeometry;
      const bounds = geometry ? getInteractionBounds(geometry.graph) : null;

      if (
        !bounds
        || event.pointerType !== "mouse"
        || progressRef.current > HERO_SCROLL_TIMING.topologyExitEnd
        || mobileQuery.matches
        || !finePointerQuery.matches
        || reducedMotionQuery.matches
      ) {
        return;
      }

      const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5;
      const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5;
      const tiltStrength = progressRef.current <= HERO_SCROLL_TIMING.topologyHoldEnd
        ? 1
        : (HERO_SCROLL_TIMING.topologyExitEnd - progressRef.current)
          / (HERO_SCROLL_TIMING.topologyExitEnd - HERO_SCROLL_TIMING.topologyHoldEnd);

      pointerTilt = {
        rotateX: offsetY * -14 * tiltStrength,
        rotateY: offsetX * 14 * tiltStrength,
      };

      if (pointerFrame) return;

      pointerFrame = window.requestAnimationFrame(() => {
        pointerFrame = 0;
        graph.style.setProperty("--card-rotate-x", `${pointerTilt.rotateX}deg`);
        graph.style.setProperty("--card-rotate-y", `${pointerTilt.rotateY}deg`);
      });
    };

    // Pointer 이탈 시 Topology 각도와 초기 Marker 위치 복원
    const resetCard = () => {
      window.cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      resetProperties.forEach((property) => graph.style.setProperty(property, "0deg"));

      if (progressRef.current <= HERO_SCROLL_TIMING.topologyExitEnd) {
        resetMarkerPointer();
      }
    };

    // Scroll Phase에 따른 SVG Flow 재생 상태 전환
    const updateFlowState = (active: boolean) => {
      if (flowActive === active) return;

      flowActive = active;
      if (active) {
        flowSvg.unpauseAnimations?.();
      } else {
        flowSvg.pauseAnimations?.();
      }
    };

    // 기존 Layout 높이 기반 Hero 실제 Scroll 거리 계산
    const getBaseScrollDistance = (isPinnedHeroLayout: boolean) => {
      hero.style.removeProperty("--hero-stage-height");
      heroSystem.style.removeProperty("--hero-stage-height");

      if (isPinnedHeroLayout) {
        return Math.max(hero.offsetHeight - window.innerHeight, 1);
      }

      return Math.max(heroSystem.offsetHeight - stage.offsetHeight, 1);
    };

    // 확대 거리와 About 중첩 구간·Anchor 진입 위치를 반영한 Layout 높이 동기화
    const updateScrollLayout = (
      isPinnedHeroLayout: boolean,
      stickyTop: number,
      scrollProfile: HeroScrollProfile,
    ) => {
      const baseDistance = getBaseScrollDistance(isPinnedHeroLayout);
      const metrics = calculateHeroScrollMetrics(baseDistance, scrollProfile);

      if (isPinnedHeroLayout) {
        hero.style.setProperty("--hero-stage-height", `${window.innerHeight + metrics.totalDistance}px`);
        heroSystem.style.removeProperty("--hero-stage-height");
      } else {
        hero.style.removeProperty("--hero-stage-height");
        heroSystem.style.setProperty("--hero-stage-height", `${stage.offsetHeight + metrics.totalDistance}px`);
      }

      const heroRect = hero.getBoundingClientRect();
      const systemRect = heroSystem.getBoundingClientRect();
      const heroTop = window.scrollY + heroRect.top;
      const sceneStart = isPinnedHeroLayout
        ? heroTop
        : window.scrollY + systemRect.top - stickyTop;
      const aboutTop = sceneStart + metrics.sceneExitStart + stickyTop;
      const overlap = Math.max(heroTop + hero.offsetHeight - aboutTop, 0);
      const anchorScrollMargin = Number.parseFloat(window.getComputedStyle(aboutAnchor).scrollMarginTop) || 0;
      // Fixed Header 보정 포함 Cross-fade 종료 시점 Anchor 위치
      const aboutAnchorOffset = Math.max(
        metrics.sceneExitEnd - metrics.sceneExitStart - stickyTop + anchorScrollMargin,
        0,
      );

      aboutSection.style.setProperty("--about-transition-height", `${overlap}px`);
      aboutSection.style.setProperty("--about-anchor-offset", `${aboutAnchorOffset}px`);

      return { baseDistance, metrics, sceneStart };
    };

    const getGalleryViewport = (isDesktop: boolean): GalleryViewport => (
      mobileQuery.matches
        ? "mobile"
        : portraitMapQuery.matches
          ? "tabletPortrait"
          : isDesktop
            ? "desktop"
            : "tablet"
    );

    // Resize 또는 Image Layout 완료 시 Gallery Geometry 일괄 측정
    const measureGalleryLayout = (
      stageRect: DOMRect,
      viewport: GalleryViewport,
    ) => {
      const planeLayout = calculateGalleryPlaneLayout(
        stageRect.left,
        stageRect.height,
        window.innerWidth,
      );
      const frameSizes = galleryFrameRefs.current.map((frame) => ({
        height: frame?.offsetHeight ?? 0,
        width: frame?.offsetWidth ?? 0,
      }));

      stage.style.setProperty("--gallery-plane-left", `${planeLayout.left}px`);
      stage.style.setProperty(
        "--gallery-perspective",
        `${galleryViewportMotion[viewport].perspective}px`,
      );

      return {
        bounds: planeLayout.bounds,
        frameSizes,
        viewport,
      };
    };

    // Resize·Breakpoint·Image Layout 변경 시 Hero Scene Geometry 일괄 측정
    const measureSceneGeometry = () => {
      const isDesktop = desktopQuery.matches;
      const isPinnedHeroLayout = isDesktop || tabletLandscapeQuery.matches;
      const isReducedMotion = reducedMotionQuery.matches;
      const mapCameraProfile = getMapCameraProfile();
      const scrollProfile: HeroScrollProfile = portraitMapQuery.matches ? "portrait" : "default";
      const galleryViewport = getGalleryViewport(isDesktop);
      const stickyTop = Number.parseFloat(window.getComputedStyle(stage).top) || 0;

      if (isReducedMotion) {
        hero.style.removeProperty("--hero-stage-height");
        heroSystem.style.removeProperty("--hero-stage-height");
        aboutSection.style.setProperty("--about-transition-height", "0px");
        aboutSection.style.setProperty("--about-anchor-offset", "0px");
      }

      const scrollLayout = isReducedMotion
        ? null
        : updateScrollLayout(isPinnedHeroLayout, stickyTop, scrollProfile);
      const stageRect = stage.getBoundingClientRect();

      if (portraitMapQuery.matches) {
        const portraitWorldMapWidth = stageRect.height * 2.1;
        const worldKoreaRatioX = serverPoint.x / WORLD_MAP_SIZE.width;
        const portraitWorldOffsetX = calculatePortraitWorldOffsetX(
          portraitWorldMapWidth,
          worldKoreaRatioX,
        );

        stage.style.setProperty("--portrait-world-map-width", `${portraitWorldMapWidth}px`);
        stage.style.setProperty("--portrait-world-map-offset-x", `${portraitWorldOffsetX}px`);
      } else {
        stage.style.removeProperty("--portrait-world-map-width");
        stage.style.removeProperty("--portrait-world-map-offset-x");
      }

      const graphRect = graph.getBoundingClientRect();
      const narrativeMapRect = narrativeMapViewport.getBoundingClientRect();
      const focusMapRect = focusMapViewport.getBoundingClientRect();
      const mapWidth = mapLayer.offsetWidth;
      const mapHeight = mapLayer.offsetHeight;
      const graphLeft = graphRect.left - stageRect.left;
      const graphTop = graphRect.top - stageRect.top;
      const mapLeft = graphLeft + mapLayer.offsetLeft;
      const mapTop = graphTop + mapLayer.offsetTop;
      const anchorLocalX = mapLeft + mapWidth * (serverPoint.x / WORLD_MAP_SIZE.width);
      const anchorLocalY = mapTop + mapHeight * (serverPoint.y / WORLD_MAP_SIZE.height);
      const worldKoreaX = serverPoint.x / WORLD_MAP_SIZE.width;
      const worldKoreaY = serverPoint.y / WORLD_MAP_SIZE.height;
      const narrativeLeft = narrativeMapRect.left - stageRect.left;
      const narrativeTop = narrativeMapRect.top - stageRect.top;
      const narrativeTargetX = narrativeLeft + narrativeMapRect.width * worldKoreaX;
      const narrativeTargetY = narrativeTop + narrativeMapRect.height * worldKoreaY;
      const focusViewBox = getFocusViewBox(mapCameraProfile);
      const focusRatio = calculateEastAsiaFocusRatio(focusViewBox);
      const focusTargetX = focusMapRect.left - stageRect.left + focusMapRect.width * focusRatio.x;
      const focusTargetY = focusMapRect.top - stageRect.top + focusMapRect.height * focusRatio.y;

      galleryLayout = isReducedMotion ? null : measureGalleryLayout(stageRect, galleryViewport);
      sceneGeometry = {
        anchorLocalY,
        anchorViewportX: stageRect.left + anchorLocalX,
        focusTargetX,
        focusTargetY,
        focusTranslateX: focusTargetX - anchorLocalX,
        focusTranslateY: focusTargetY - anchorLocalY,
        galleryViewport,
        graph: {
          left: graphLeft,
          top: graphTop,
          width: graphRect.width,
          height: graphRect.height,
        },
        isDesktop,
        isReducedMotion,
        mapCameraProfile,
        narrativeTargetX,
        narrativeTargetY,
        scrollLayout,
        stage: {
          left: stageRect.left,
          top: stageRect.top,
          width: stageRect.width,
          height: stageRect.height,
          documentTop: window.scrollY + stageRect.top,
        },
        stickyTop,
        worldUnitX: Math.max(narrativeMapRect.width / WORLD_MAP_SIZE.width, Number.EPSILON),
        worldUnitY: Math.max(narrativeMapRect.height / WORLD_MAP_SIZE.height, Number.EPSILON),
      };
    };

    // Cache된 Geometry와 부드러운 Progress·Origin 기반 Gallery CSS 반영
    const applyGalleryState = (progress: number, origin: GalleryPoint) => {
      const layout = galleryLayout;

      if (!layout) return;

      stage.style.setProperty("--gallery-origin-x", `${origin.x}px`);
      stage.style.setProperty("--gallery-origin-y", `${origin.y}px`);

      galleryFrameRefs.current.forEach((frame, index) => {
        const frameSize = layout.frameSizes[index];

        if (!frame || !frameSize) return;

        const galleryState = calculateGalleryFrameState(
          progress,
          index,
          layout.viewport,
        );
        const position = calculateGalleryFramePosition({
          bounds: layout.bounds,
          frame: frameSize,
          origin,
          path: PROJECT_GALLERY_MOTIONS[index],
          state: galleryState,
          viewport: layout.viewport,
        });

        frame.style.setProperty("--gallery-opacity", String(galleryState.opacity));
        frame.style.setProperty("--gallery-blur", `${galleryState.blur}px`);
        frame.style.setProperty("--gallery-scale", String(galleryState.scale));
        frame.style.setProperty("--gallery-x", `${position.x}px`);
        frame.style.setProperty("--gallery-y", `${position.y}px`);
        frame.style.setProperty("--gallery-z", `${galleryState.z}px`);
      });
    };

    const cancelGalleryFrame = () => {
      window.cancelAnimationFrame(galleryAnimationFrame);
      galleryAnimationFrame = 0;
      galleryLastTimestamp = null;
    };

    // Gallery Target 수렴 시 종료되는 전용 Follow RAF
    function renderGalleryFrame(timestamp: number) {
      galleryAnimationFrame = 0;

      if (!galleryLayout || reducedMotionQuery.matches) {
        galleryLastTimestamp = null;
        return;
      }

      const deltaSeconds = galleryLastTimestamp === null
        ? 1 / 60
        : Math.max((timestamp - galleryLastTimestamp) / 1000, 0);
      galleryLastTimestamp = timestamp;
      galleryRenderedProgress = dampGalleryValue(
        galleryRenderedProgress,
        galleryTargetProgress,
        deltaSeconds,
      );
      galleryRenderedOrigin = {
        x: dampGalleryValue(
          galleryRenderedOrigin.x,
          galleryTargetOrigin.x,
          deltaSeconds,
        ),
        y: dampGalleryValue(
          galleryRenderedOrigin.y,
          galleryTargetOrigin.y,
          deltaSeconds,
        ),
      };

      const progressSettled = Math.abs(
        galleryTargetProgress - galleryRenderedProgress,
      ) <= GALLERY_PROGRESS_EPSILON;
      const originSettled = Math.abs(
        galleryTargetOrigin.x - galleryRenderedOrigin.x,
      ) <= GALLERY_ORIGIN_EPSILON
        && Math.abs(
          galleryTargetOrigin.y - galleryRenderedOrigin.y,
        ) <= GALLERY_ORIGIN_EPSILON;

      if (progressSettled && originSettled) {
        galleryRenderedProgress = galleryTargetProgress;
        galleryRenderedOrigin = galleryTargetOrigin;
      }

      applyGalleryState(galleryRenderedProgress, galleryRenderedOrigin);

      if (!progressSettled || !originSettled) {
        galleryAnimationFrame = window.requestAnimationFrame(renderGalleryFrame);
      } else {
        galleryLastTimestamp = null;
      }
    }

    // 실제 Scroll Target만 갱신하고 Gallery Render 값은 짧게 추종
    const updateGalleryTarget = (progress: number, origin: GalleryPoint) => {
      galleryTargetProgress = progress;
      galleryTargetOrigin = origin;

      if (!galleryLayout || reducedMotionQuery.matches) return;

      if (!galleryInitialized) {
        galleryInitialized = true;
        galleryRenderedProgress = progress;
        galleryRenderedOrigin = origin;
        applyGalleryState(progress, origin);
        return;
      }

      if (!galleryAnimationFrame) {
        galleryLastTimestamp = null;
        galleryAnimationFrame = window.requestAnimationFrame(renderGalleryFrame);
      }
    };

    // 자연 Scroll 픽셀 위치 기반 Scene Phase와 World·Focus 지도 좌표 갱신
    const updateScene = () => {
      animationFrame = 0;

      const geometry = sceneGeometry;

      if (!geometry) return;

      const { galleryViewport, isReducedMotion, mapCameraProfile } = geometry;

      if (isReducedMotion) {
        const finalFocusScale = calculateMapZoomState(1, mapCameraProfile).focusMapScale;

        cancelGalleryFrame();
        galleryInitialized = false;
        progressRef.current = 0;
        stage.style.setProperty("--connection-depth", "0px");
        stage.style.setProperty("--flow-depth", "0px");
        stage.style.setProperty("--flow-opacity", "0");
        stage.style.setProperty("--frame-opacity", "0");
        stage.style.setProperty("--inner-depth", "0px");
        stage.style.setProperty(
          "--map-clip-inset",
          `${-Math.max(geometry.stage.width, geometry.stage.height) * 2}px`,
        );
        narrativeMapZoom.setAttribute(
          "transform",
          `translate(${serverPoint.x} ${serverPoint.y}) scale(${FOCUS_HANDOFF_END_SCALE}) translate(${-serverPoint.x} ${-serverPoint.y})`,
        );
        focusMapZoom.setAttribute(
          "transform",
          `translate(${EAST_ASIA_FOCUS_POINT.x} ${EAST_ASIA_FOCUS_POINT.y}) scale(${finalFocusScale}) translate(${-EAST_ASIA_FOCUS_POINT.x} ${-EAST_ASIA_FOCUS_POINT.y})`,
        );
        stage.style.setProperty("--card-map-opacity", "0");
        stage.style.setProperty("--focus-map-dot-width", String(MAP_DOT_SCREEN_WIDTH.focusFinal));
        stage.style.setProperty("--world-map-dot-width", String(MAP_DOT_SCREEN_WIDTH.worldHandoff));
        stage.style.setProperty("--focus-map-opacity", "1");
        stage.style.setProperty("--map-filter", "none");
        stage.style.setProperty("--map-translate-x", `${geometry.focusTranslateX}px`);
        stage.style.setProperty("--map-translate-y", `${geometry.focusTranslateY}px`);
        stage.style.setProperty("--marker-opacity", "1");
        stage.style.setProperty("--resource-depth", "0px");
        stage.style.setProperty("--server-opacity", "0");
        stage.style.setProperty("--topology-opacity", "0");
        stage.style.setProperty("--narrative-world-map-opacity", "0");
        galleryFrameRefs.current.forEach((frame) => {
          frame?.style.setProperty("--gallery-opacity", "0");
        });
        hero.style.setProperty("--identity-opacity", "1");
        aboutSection.style.setProperty("--about-opacity", "1");
        resetProperties.forEach((property) => graph.style.setProperty(property, "0deg"));
        updateFlowState(false);
        return;
      }

      const scrollLayout = geometry.scrollLayout;

      if (!scrollLayout) return;

      const { baseDistance, metrics, sceneStart } = scrollLayout;
      const scrollPixels = Math.min(Math.max(window.scrollY - sceneStart, 0), metrics.totalDistance);

      // Gallery 진입 전 저우선순위 이미지 요청 활성화
      if (!galleryReadyRef.current && scrollPixels >= metrics.mapCenterStart) {
        galleryReadyRef.current = true;
        setGalleryReady(true);
      }

      progressRef.current = scrollPixels / baseDistance;
      const state = calculateHeroSceneState(
        scrollPixels,
        metrics,
        galleryViewport,
        mapCameraProfile,
      );

      // World Camera와 Marker의 동일 Pan 좌표 적용
      const worldCameraShiftX = (
        geometry.focusTargetX - geometry.narrativeTargetX
      ) * state.cameraPanProgress;
      const worldCameraShiftY = (
        geometry.focusTargetY - geometry.narrativeTargetY
      ) * state.cameraPanProgress;
      const worldShiftSvgX = worldCameraShiftX / geometry.worldUnitX;
      const worldShiftSvgY = worldCameraShiftY / geometry.worldUnitY;
      const translateX = (
        geometry.narrativeTargetX - (geometry.anchorViewportX - geometry.stage.left)
      ) * state.centerProgress
        + worldCameraShiftX;
      const translateY = (
        geometry.narrativeTargetY - geometry.anchorLocalY
      ) * state.centerProgress
        + worldCameraShiftY;
      const clipInset = -Math.max(
        geometry.stage.width,
        geometry.stage.height,
      ) * 2 * state.clipProgress;
      const galleryOrigin = calculateGalleryOrigin(
        geometry.anchorViewportX,
        geometry.stage.top + geometry.anchorLocalY,
        translateX,
        translateY,
        geometry.stage.top,
      );

      narrativeMapZoom.setAttribute(
        "transform",
        `translate(${worldShiftSvgX} ${worldShiftSvgY}) translate(${serverPoint.x} ${serverPoint.y}) scale(${state.narrativeWorldMapScale}) translate(${-serverPoint.x} ${-serverPoint.y})`,
      );
      focusMapZoom.setAttribute(
        "transform",
        `translate(${EAST_ASIA_FOCUS_POINT.x} ${EAST_ASIA_FOCUS_POINT.y}) scale(${state.focusMapScale}) translate(${-EAST_ASIA_FOCUS_POINT.x} ${-EAST_ASIA_FOCUS_POINT.y})`,
      );
      stage.style.setProperty("--card-map-opacity", String(state.cardMapOpacity));
      stage.style.setProperty("--connection-depth", `${16 * state.depth}px`);
      stage.style.setProperty("--flow-depth", `${28 * state.depth}px`);
      stage.style.setProperty("--flow-opacity", String(state.flowOpacity));
      stage.style.setProperty("--frame-opacity", String(state.frameOpacity));
      stage.style.setProperty("--focus-map-dot-width", String(state.focusMapDotWidth));
      stage.style.setProperty("--inner-depth", `${52 * state.depth}px`);
      stage.style.setProperty("--focus-map-opacity", String(state.focusMapOpacity));
      stage.style.setProperty("--map-clip-inset", `${clipInset}px`);
      stage.style.setProperty("--map-filter", state.mapExit > 0 ? `blur(${state.blurStrength}px)` : "none");
      stage.style.setProperty("--map-translate-x", `${translateX}px`);
      stage.style.setProperty("--map-translate-y", `${translateY}px`);
      stage.style.setProperty("--marker-opacity", String(state.markerOpacity));
      stage.style.setProperty("--narrative-world-map-opacity", String(state.narrativeWorldMapOpacity));
      stage.style.setProperty("--resource-depth", `${44 * state.depth}px`);
      stage.style.setProperty("--server-opacity", String(state.serverOpacity));
      stage.style.setProperty("--topology-opacity", String(state.topologyOpacity));
      stage.style.setProperty("--world-map-dot-width", String(state.worldMapDotWidth));
      aboutSection.style.setProperty("--about-opacity", String(state.aboutOpacity));
      updateGalleryTarget(state.zoomProgress, galleryOrigin);

      hero.style.setProperty("--identity-opacity", String(state.identityOpacity));
      updateFlowState(scrollPixels < metrics.topologyExitEnd);

      if (scrollPixels > metrics.topologyHoldEnd) {
        resetProperties.forEach((property) => graph.style.setProperty(property, "0deg"));
      }
    };

    const scheduleSceneUpdate = () => {
      if (animationFrame) return;

      animationFrame = window.requestAnimationFrame(updateScene);
    };

    const handleScroll = () => {
      if (!reducedMotionQuery.matches) {
        scheduleSceneUpdate();
      }
    };

    const handleLayoutChange = () => {
      cancelGalleryFrame();
      galleryLayout = null;
      galleryInitialized = false;
      sceneGeometry = null;
      updateFocusMapLayout();
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      window.cancelAnimationFrame(layoutFrame);
      layoutFrame = window.requestAnimationFrame(() => {
        layoutFrame = 0;
        measureSceneGeometry();
        updateScene();
      });
    };

    // Motion 또는 Pointer 환경 변경 시 Marker 복원과 Layout 재계산
    const handleInteractionPreferenceChange = () => {
      resetMarkerPointer();
      handleLayoutChange();
    };

    updateFocusMapLayout();
    measureSceneGeometry();
    updateScene();
    galleryImages.forEach((image) => image.addEventListener("load", handleLayoutChange));
    graph.addEventListener("pointermove", handleCardPointerMove, { passive: true });
    graph.addEventListener("pointercancel", resetCard);
    graph.addEventListener("pointerleave", resetCard);
    hero.addEventListener("pointermove", handleMarkerPointerMove, { passive: true });
    hero.addEventListener("pointerleave", resetMarkerPointer);
    window.addEventListener("blur", resetMarkerPointer);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleLayoutChange);
    desktopQuery.addEventListener("change", handleLayoutChange);
    mobileQuery.addEventListener("change", handleLayoutChange);
    portraitMapQuery.addEventListener("change", handleLayoutChange);
    tabletLandscapeQuery.addEventListener("change", handleLayoutChange);
    reducedMotionQuery.addEventListener("change", handleInteractionPreferenceChange);
    finePointerQuery.addEventListener("change", handleInteractionPreferenceChange);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(layoutFrame);
      cancelGalleryFrame();
      window.cancelAnimationFrame(pointerFrame);
      window.cancelAnimationFrame(markerPointerFrame);
      resetCard();
      resetMarkerPointer();
      galleryImages.forEach((image) => image.removeEventListener("load", handleLayoutChange));
      graph.removeEventListener("pointermove", handleCardPointerMove);
      graph.removeEventListener("pointercancel", resetCard);
      graph.removeEventListener("pointerleave", resetCard);
      hero.removeEventListener("pointermove", handleMarkerPointerMove);
      hero.removeEventListener("pointerleave", resetMarkerPointer);
      window.removeEventListener("blur", resetMarkerPointer);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleLayoutChange);
      desktopQuery.removeEventListener("change", handleLayoutChange);
      mobileQuery.removeEventListener("change", handleLayoutChange);
      portraitMapQuery.removeEventListener("change", handleLayoutChange);
      tabletLandscapeQuery.removeEventListener("change", handleLayoutChange);
      reducedMotionQuery.removeEventListener("change", handleInteractionPreferenceChange);
      finePointerQuery.removeEventListener("change", handleInteractionPreferenceChange);
      hero.style.removeProperty("--identity-opacity");
      hero.style.removeProperty("--hero-stage-height");
      heroSystem.style.removeProperty("--hero-stage-height");
      stage.style.removeProperty("--portrait-world-map-width");
      stage.style.removeProperty("--portrait-world-map-offset-x");
      aboutSection.style.removeProperty("--about-opacity");
      aboutSection.style.removeProperty("--about-transition-height");
      aboutSection.style.removeProperty("--about-anchor-offset");
    };
  }, []);

  return (
    <div className="hero-visual-stage" ref={stageRef} style={initialStyle}>
      <div aria-hidden="true" className="topology-narrative-world-map-plane">
        <div className="topology-narrative-world-map-viewport" ref={narrativeMapRef}>
          <HeroNarrativeWorldMap geometryReady={mapGeometryReady} />
        </div>
      </div>

      <div aria-hidden="true" className="topology-focus-map-plane">
        <div className="topology-focus-map-viewport" ref={focusMapRef}>
          <HeroEastAsiaMap geometryReady={mapGeometryReady} />
        </div>
      </div>

      <div
        aria-hidden="true"
        className="topology-project-gallery-plane"
        ref={galleryPlaneRef}
      >
        {projectGalleryFrames.map((frame, index) => {
          const initialFrameState = calculateGalleryFrameState(0, index);
          const frameStyle: GalleryFrameStyle = {
            aspectRatio: `${frame.width} / ${frame.height}`,
            "--gallery-blur": `${initialFrameState.blur}px`,
            "--gallery-opacity": initialFrameState.opacity,
            "--gallery-scale": initialFrameState.scale,
            "--gallery-x": "0px",
            "--gallery-y": "0px",
            "--gallery-z": `${initialFrameState.z}px`,
          };

          return (
            <div
              className="topology-project-gallery-frame"
              data-gallery-index={index + 1}
              key={frame.src}
              ref={(element) => {
                galleryFrameRefs.current[index] = element;
              }}
              style={frameStyle}
            >
              {galleryReady ? (
                <Image
                  alt=""
                  className="topology-project-gallery-image"
                  decoding="async"
                  fetchPriority="low"
                  height={frame.height}
                  loading="lazy"
                  sizes="(max-width: 767px) 52vw, (max-width: 1023px) 50vw, 31vw"
                  src={frame.src}
                  width={frame.width}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <div
        aria-label="세계지도 위 대한민국 Server와 VM 두 개, Storage가 연결된 Server Topology"
        className="service-graph"
        ref={graphRef}
        role="group"
      >
        <div aria-hidden="true" className="topology-card-frame" />

        <div className="topology-map-clip">
          <div className="topology-map-layer" ref={mapRef}>
            <HeroWorldMap />
          </div>
        </div>

        <div className="topology-tilt-layer">
          <div className="topology-layer">
            <TopologyConnectionLines />
            <TopologyFlowOverlay />
            <InfrastructureResource className={vmResources[0].className} items={vmResources[0].items} name="VM" />
            <InfrastructureResource className={vmResources[1].className} items={vmResources[1].items} name="VM" />
            <InfrastructureResource className="topology-resource-storage" name="STORAGE" />
          </div>
        </div>
      </div>

      <div className="topology-marker-plane">
        <div className="topology-marker-layer">
          <div className="topology-korea-anchor" data-testid="korea-anchor">
            <div className="topology-korea-motion">
              <div aria-label="대한민국 위치" className="topology-korea-marker" data-testid="korea-marker">
                <span aria-hidden="true" className="topology-korea-marker-ring" />
                <span aria-hidden="true" className="topology-korea-marker-diamond">
                  <span className="topology-korea-marker-core" />
                </span>
              </div>
              <span className="topology-server-label type-small">SERVER</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
