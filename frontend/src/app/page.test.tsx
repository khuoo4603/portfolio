import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PUBLIC_COPY, mapPublicPortfolio } from "@/features/portfolio/public-portfolio";
import { PUBLIC_PORTFOLIO_FIXTURE } from "@/test/public-portfolio-fixture";
import {
  EAST_ASIA_CROP,
  EAST_ASIA_DOT_COUNT,
  EAST_ASIA_FOCUS,
  EAST_ASIA_FOCUS_POINT,
  EAST_ASIA_GRID_HEIGHT,
  EAST_ASIA_GRID_WIDTH,
  EAST_ASIA_MAP_SIZE,
  EAST_ASIA_SOURCE_CROP,
  EAST_ASIA_VIEWBOX,
  EAST_ASIA_ZOOM_SCALE,
  KOREA_ANCHOR,
  MOBILE_KOREA_CROP,
  MOBILE_KOREA_VIEWBOX,
  TABLET_PORTRAIT_KOREA_VIEWBOX,
  WORLD_MAP_DOT_COUNT,
  WORLD_MAP_GRID_HEIGHT,
  WORLD_MAP_SIZE,
  calculateEastAsiaFocusRatio,
  formatMapViewBox,
  projectPoint,
} from "./hero-world-map";
import {
  FINAL_VIRTUAL_ZOOM_SCALE,
  FOCUS_HANDOFF_END_SCALE,
  FOCUS_HANDOFF_START_SCALE,
  KOREA_ZOOM_DISTANCE_MULTIPLIER,
  KOREA_ZOOM_SCALE_MULTIPLIER,
  MAP_DOT_SCREEN_WIDTH,
  MOBILE_KOREA_ZOOM_SCALE,
  PORTRAIT_WORLD_CAMERA_PAN_START_SCALE,
  PROJECT_GALLERY_MOTIONS,
  TABLET_PORTRAIT_KOREA_ZOOM_SCALE,
  WORLD_CAMERA_PAN_START_SCALE,
  WORLD_TO_FOCUS_SCALE,
  calculateFocusTransition,
  calculateGalleryFrameAnchors,
  calculateGalleryFramePosition,
  calculateGalleryFrameState,
  calculateGalleryOrigin,
  calculateGalleryPlaneLayout,
  calculateHeroSceneState,
  calculateHeroScrollMetrics,
  calculateMapZoomState,
  calculatePortraitWorldOffsetX,
  calculateVirtualZoomScale,
  dampGalleryValue,
} from "./hero-system-card";
import { HomeView } from "./home-view";
import { calculateThemeReveal } from "./theme-toggle";

const PUBLIC_MODEL = mapPublicPortfolio(PUBLIC_PORTFOLIO_FIXTURE);

function Home() {
  return <HomeView model={PUBLIC_MODEL} />;
}

describe("포트폴리오 메인", () => {
  afterEach(() => {
    cleanup();
    Reflect.deleteProperty(document, "startViewTransition");
    Reflect.deleteProperty(document.documentElement, "animate");
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query.includes("min-width: 1024px") && !query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));
    document.documentElement.dataset.theme = "dark";
    window.localStorage.clear();
  });

  it("이름, 포지션, 한글 Navigation, Server Topology를 표시", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1, name: "김현우" })).toBeInTheDocument();
    expect(document.querySelector(".hero-intro")).toHaveTextContent("BACKEND / INFRA DEVELOPER");
    expect(document.querySelector(".hero-intro")).toHaveClass("type-title");
    const header = within(document.querySelector<HTMLElement>(".site-header")!);
    const siteMark = header.getByRole("link", { name: "김현우 포트폴리오 Home" });
    expect(siteMark).toHaveTextContent("KIM HYUNWOO");
    expect(siteMark).toHaveAttribute("href", "#home");
    expect(siteMark).not.toHaveTextContent("PORTFOLIO / 2026");
    const navigation = screen.getByRole("navigation", { name: "포트폴리오 주요 영역" });
    expect(navigation).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /대한민국 Server/ })).toBeInTheDocument();
    expect(document.querySelector(".hero-network-canvas")).toBeInTheDocument();
    expect(document.querySelectorAll(".hero-network-canvas")).toHaveLength(1);
    expect(document.querySelector(".hero-about-flow > .hero-shared-visual")).toBeInTheDocument();
    expect(document.querySelector(".hero > .hero-network-canvas")).not.toBeInTheDocument();
    expect(document.querySelector(".hero-inner")).not.toHaveClass("content-container");
    expect(document.querySelector(".about-inner")).toHaveClass("content-container");
    expect(document.querySelector(".hero-identity")).toBeInTheDocument();
    expect(document.querySelector(".hero-system")).toBeInTheDocument();
    expect(document.querySelector(".topology-card-frame")).toBeInTheDocument();
    expect(document.querySelector(".topology-map-svg")).toBeInTheDocument();
    expect(document.querySelectorAll(".topology-map-svg")).toHaveLength(1);
    expect(document.querySelector(".topology-map-dots")).toBeInTheDocument();
    expect(document.querySelectorAll(".topology-map-zoom")).toHaveLength(1);
    expect(document.querySelectorAll(".topology-narrative-world-map-svg")).toHaveLength(1);
    expect(document.querySelectorAll(".topology-narrative-world-map-dots")).toHaveLength(0);
    expect(document.querySelectorAll(".topology-narrative-world-map-zoom")).toHaveLength(1);
    expect(document.querySelectorAll(".topology-focus-map-svg")).toHaveLength(1);
    expect(document.querySelectorAll(".topology-focus-map-dots")).toHaveLength(0);
    expect(document.querySelector(".topology-focus-map-svg")).toHaveAttribute(
      "viewBox",
      formatMapViewBox(EAST_ASIA_VIEWBOX),
    );
    expect(document.querySelectorAll(".topology-focus-map-zoom")).toHaveLength(1);
    expect(document.querySelector(".topology-map-dots")).toHaveAttribute(
      "href",
      "/maps/world-map-dots.svg#world-map-dots",
    );
    const koreaAnchor = screen.getByTestId("korea-anchor");
    const koreaMarker = screen.getByTestId("korea-marker");

    expect(koreaAnchor.closest(".topology-marker-layer")?.closest(".topology-marker-plane")).not.toBeNull();
    expect(koreaAnchor).toContainElement(koreaMarker);
    expect(koreaAnchor).toHaveTextContent("SERVER");
    expect(koreaMarker).toHaveAttribute("aria-label", "대한민국 위치");
    expect(document.querySelectorAll(".topology-korea-marker")).toHaveLength(1);
    expect(document.querySelector(".topology-server-layer")).not.toBeInTheDocument();
    expect(document.querySelectorAll(".topology-resource")).toHaveLength(3);
    expect(within(navigation).queryByRole("link", { name: "홈" })).not.toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "소개" })).toHaveAttribute("href", "#about");
    expect(within(navigation).getByRole("link", { name: "기술스택" })).toHaveAttribute("href", "#tech");
    expect(within(navigation).getByRole("link", { name: "프로젝트" })).toHaveAttribute("href", "#projects");
    expect(within(navigation).getByRole("link", { name: "학력 및 성과" })).toHaveAttribute("href", "#education");
  });

  it("Browser Idle 이후 후반 지도 Geometry를 기존 Asset과 Dot 수로 활성화", async () => {
    const idleCallbacks: IdleRequestCallback[] = [];
    vi.stubGlobal("requestIdleCallback", vi.fn((callback: IdleRequestCallback) => {
      idleCallbacks.push(callback);
      return idleCallbacks.length;
    }));
    vi.stubGlobal("cancelIdleCallback", vi.fn());
    render(<Home />);

    expect(document.querySelector(".topology-narrative-world-map-dots")).not.toBeInTheDocument();
    expect(document.querySelector(".topology-focus-map-dots")).not.toBeInTheDocument();

    await act(async () => {
      idleCallbacks.forEach((callback) => callback({
        didTimeout: false,
        timeRemaining: () => 50,
      }));
    });

    expect(document.querySelector(".topology-narrative-world-map-dots"))
      .toHaveAttribute("href", "/maps/world-map-dots.svg#world-map-dots");
    expect(document.querySelector(".topology-narrative-world-map-dots"))
      .toHaveAttribute("data-dot-count", String(WORLD_MAP_DOT_COUNT));
    expect(document.querySelector(".topology-focus-map-dots"))
      .toHaveAttribute("href", "/maps/east-asia-map-dots.svg#east-asia-map-dots");
    expect(document.querySelector(".topology-focus-map-dots"))
      .toHaveAttribute("data-dot-count", String(EAST_ASIA_DOT_COUNT));
  });

  it("대한민국 Server와 지정된 세 Resource만 표시", () => {
    render(<Home />);

    const topology = screen.getByRole("group", { name: /대한민국 Server/ });
    const resources = topology.querySelectorAll<HTMLElement>(".topology-resource");
    const vmGroups = topology.querySelectorAll<HTMLElement>(".topology-resource-group[data-resource='VM']");
    const standaloneResources = topology.querySelectorAll<HTMLElement>(".topology-resource-standalone");
    const resourceText = Array.from(resources)
      .map((resource) => resource.textContent)
      .join(" ");
    const korea = projectPoint(KOREA_ANCHOR);

    expect(resources).toHaveLength(3);
    expect(resourceText.match(/VM/g)).toHaveLength(2);
    expect(vmGroups).toHaveLength(2);
    expect(standaloneResources).toHaveLength(1);
    expect(within(vmGroups[0]).getAllByRole("listitem")).toHaveLength(2);
    expect(within(vmGroups[0]).getByText("Kubernetes")).toBeInTheDocument();
    expect(within(vmGroups[0]).getByText("Argo")).toBeInTheDocument();
    expect(within(vmGroups[1]).getAllByRole("listitem")).toHaveLength(3);
    expect(within(vmGroups[1]).getByText("Next.js")).toBeInTheDocument();
    expect(within(vmGroups[1]).getByText("Spring Boot")).toBeInTheDocument();
    expect(within(vmGroups[1]).getByText("PostgreSQL")).toBeInTheDocument();
    expect(resourceText).not.toContain("SSLVPN");
    expect(resourceText).toContain("STORAGE");
    expect(topology.querySelectorAll(".topology-resource-status")).toHaveLength(3);
    expect(topology.querySelectorAll(".topology-stack")).toHaveLength(2);
    expect(standaloneResources[0].querySelector(".topology-stack")).not.toBeInTheDocument();
    expect(document.querySelector(".hero-visual-stage")).toHaveStyle({
      "--korea-x": `${(korea.x / WORLD_MAP_SIZE.width) * 100}%`,
      "--korea-y": `${(korea.y / WORLD_MAP_SIZE.height) * 100}%`,
    });
    expect(topology.querySelectorAll(".topology-connection-lines")).toHaveLength(1);
    expect(topology.querySelectorAll(".topology-flow-overlay")).toHaveLength(1);
    expect(topology.querySelectorAll(".topology-connection-line")).toHaveLength(3);
    expect(topology.querySelectorAll(".topology-flow-guide")).toHaveLength(3);
    expect(topology.querySelectorAll(".topology-flow-point")).toHaveLength(3);
    expect(
      Array.from(topology.querySelectorAll<SVGMPathElement>("mpath")).map((path) => path.getAttribute("href")),
    ).toEqual([
      "#topology-route-platform-guide",
      "#topology-route-application-guide",
      "#topology-route-storage-guide",
    ]);
    expect(
      Array.from(topology.querySelectorAll<SVGGElement>(".topology-flow-route")).map((route) => ({
        delay: route.dataset.delay,
        duration: route.dataset.duration,
      })),
    ).toEqual([
      { delay: "0s", duration: "3.2s" },
      { delay: "0.4s", duration: "3.2s" },
      { delay: "0.8s", duration: "3.2s" },
    ]);

    ["CLIENT", "REVERSE PROXY", "FRONTEND", "BACKEND", "DATABASE", "GITHUB", "CI/CD", "DOCKER COMPOSE"].forEach((node) => {
      expect(resourceText).not.toContain(node);
    });
    expect(document.querySelector(".service-card-lines")).not.toBeInTheDocument();
    expect(document.querySelector(".service-card-nodes")).not.toBeInTheDocument();
    expect(document.querySelector(".service-card-backend")).not.toBeInTheDocument();
    expect(topology.querySelector(".topology-map-land")).not.toBeInTheDocument();
    expect(document.querySelector(".topology-intro")).not.toBeInTheDocument();
    expect(within(document.querySelector<HTMLElement>(".hero")!).queryByText(
      "성공회대학교에 재학 중인 Backend / Infra 개발자 김현우입니다.",
    )).not.toBeInTheDocument();
  });

  it("세 지도 Surface와 Project Zoom Gallery를 독립 Layer로 유지", async () => {
    render(<Home />);

    const stage = document.querySelector<HTMLElement>(".hero-visual-stage");
    const narrativeMapPlane = document.querySelector<HTMLElement>(".topology-narrative-world-map-plane");
    const focusMapPlane = document.querySelector<HTMLElement>(".topology-focus-map-plane");
    const galleryPlane = document.querySelector<HTMLElement>(".topology-project-gallery-plane");
    const galleryFrames = galleryPlane?.querySelectorAll<HTMLElement>(".topology-project-gallery-frame");
    const serviceGraph = document.querySelector<HTMLElement>(".service-graph");

    expect(document.querySelectorAll(".topology-narrative-world-map-dots")).toHaveLength(0);
    expect(document.querySelectorAll(".topology-focus-map-dots")).toHaveLength(0);
    fireEvent.scroll(window);

    expect(WORLD_MAP_GRID_HEIGHT).toBe(280);
    expect(WORLD_MAP_DOT_COUNT).toBeGreaterThan(50000);
    expect(EAST_ASIA_GRID_HEIGHT).toBe(240);
    expect(EAST_ASIA_GRID_WIDTH).toBe(427);
    expect(EAST_ASIA_DOT_COUNT).toBeGreaterThan(40000);
    expect(MAP_DOT_SCREEN_WIDTH.worldStart).toBeCloseTo(1.65);
    expect(MAP_DOT_SCREEN_WIDTH.worldHandoff).toBeCloseTo(2.05);
    expect(MAP_DOT_SCREEN_WIDTH.focusFinal).toBeCloseTo(3.6);
    expect(document.querySelectorAll(".topology-map-svg")).toHaveLength(1);
    expect(document.querySelectorAll(".topology-map-zoom")).toHaveLength(1);
    expect(document.querySelectorAll(".topology-map-dots")).toHaveLength(1);
    expect(document.querySelectorAll(".topology-narrative-world-map-svg")).toHaveLength(1);
    expect(document.querySelectorAll(".topology-narrative-world-map-zoom")).toHaveLength(1);
    expect(document.querySelectorAll(".topology-narrative-world-map-dots")).toHaveLength(1);
    expect(document.querySelectorAll(".topology-focus-map-svg")).toHaveLength(1);
    expect(document.querySelectorAll(".topology-focus-map-zoom")).toHaveLength(1);
    expect(document.querySelectorAll(".topology-focus-map-dots")).toHaveLength(1);
    expect(narrativeMapPlane?.parentElement).toBe(stage);
    expect(focusMapPlane?.parentElement).toBe(stage);
    expect(galleryPlane?.parentElement).toBe(stage);
    expect(galleryPlane).toHaveAttribute("aria-hidden", "true");
    expect(stage?.style.getPropertyValue("--gallery-plane-left")).not.toBe("");
    expect(stage?.style.getPropertyValue("--gallery-origin-x")).not.toBe("");
    expect(stage?.style.getPropertyValue("--gallery-origin-y")).not.toBe("");
    expect(galleryFrames).toHaveLength(3);
    expect(galleryPlane?.querySelectorAll(".topology-project-gallery-image")).toHaveLength(0);
    galleryFrames?.forEach((frame) => {
      expect(frame.style.aspectRatio).not.toBe("");
      expect(frame.style.getPropertyValue("--gallery-blur")).not.toBe("");
      expect(frame.style.getPropertyValue("--gallery-x")).not.toBe("");
      expect(frame.style.getPropertyValue("--gallery-y")).not.toBe("");
      expect(frame.style.getPropertyValue("--gallery-z")).not.toBe("");
      expect(frame.style.getPropertyValue("--gallery-translate-x")).toBe("");
      expect(frame.style.getPropertyValue("--gallery-translate-y")).toBe("");
      expect(frame.style.getPropertyValue("--gallery-rotate")).toBe("");
    });

    vi.spyOn(window, "scrollY", "get").mockReturnValue(1000);
    fireEvent.scroll(window);
    await waitFor(() => {
      expect(galleryPlane?.querySelectorAll(".topology-project-gallery-image")).toHaveLength(3);
    });
    const galleryImages = galleryPlane?.querySelectorAll<HTMLImageElement>(".topology-project-gallery-image");

    expect(Array.from(galleryImages ?? []).map((image) => image.getAttribute("src"))).toEqual([
      expect.stringContaining("map-zoom-gallery-01.webp"),
      expect.stringContaining("map-zoom-gallery-02.webp"),
      expect.stringContaining("map-zoom-gallery-03.webp"),
    ]);
    galleryImages?.forEach((image) => {
      expect(image).toHaveAttribute("loading", "lazy");
      expect(image).toHaveAttribute("fetchpriority", "low");
      expect(image).toHaveAttribute("decoding", "async");
    });
    expect(serviceGraph?.contains(narrativeMapPlane)).toBe(false);
    expect(serviceGraph?.contains(focusMapPlane)).toBe(false);
    expect(document.querySelector(".topology-values")).not.toBeInTheDocument();
    expect(document.querySelector(".topology-school-panel")).not.toBeInTheDocument();
    expect(document.querySelector(".topology-value-network")).not.toBeInTheDocument();
    expect(document.querySelector(".topology-value")).not.toBeInTheDocument();
  });

  it("Source Crop 기반 Virtual Zoom과 짧은 LOD Handoff 관계를 유지", () => {
    const finalLngSpan = EAST_ASIA_CROP.lng.max - EAST_ASIA_CROP.lng.min;
    const finalLatSpan = EAST_ASIA_CROP.lat.max - EAST_ASIA_CROP.lat.min;
    const sourceLngSpan = EAST_ASIA_SOURCE_CROP.lng.max - EAST_ASIA_SOURCE_CROP.lng.min;
    const sourceLatSpan = EAST_ASIA_SOURCE_CROP.lat.max - EAST_ASIA_SOURCE_CROP.lat.min;
    const sourceFocusX = (KOREA_ANCHOR.lng - EAST_ASIA_SOURCE_CROP.lng.min) / sourceLngSpan;
    const sourceFocusY = (EAST_ASIA_SOURCE_CROP.lat.max - KOREA_ANCHOR.lat) / sourceLatSpan;
    const handoffProgress = (WORLD_TO_FOCUS_SCALE - 1) / (FINAL_VIRTUAL_ZOOM_SCALE - 1);
    const initialState = calculateMapZoomState(0);
    const handoffState = calculateMapZoomState(handoffProgress);
    const finalState = calculateMapZoomState(1);

    expect(EAST_ASIA_CROP).toEqual({
      lat: { min: 20, max: 58 },
      lng: { min: 92, max: 157 },
    });
    expect(KOREA_ANCHOR.lng).toBeGreaterThan(EAST_ASIA_CROP.lng.min);
    expect(KOREA_ANCHOR.lng).toBeLessThan(EAST_ASIA_CROP.lng.max);
    expect(KOREA_ANCHOR.lat).toBeGreaterThan(EAST_ASIA_CROP.lat.min);
    expect(KOREA_ANCHOR.lat).toBeLessThan(EAST_ASIA_CROP.lat.max);
    expect(EAST_ASIA_ZOOM_SCALE).toBe(1.75);
    expect(KOREA_ZOOM_SCALE_MULTIPLIER).toBe(EAST_ASIA_ZOOM_SCALE);
    expect(sourceLngSpan / finalLngSpan).toBeCloseTo(EAST_ASIA_ZOOM_SCALE);
    expect(sourceLatSpan / finalLatSpan).toBeCloseTo(EAST_ASIA_ZOOM_SCALE);
    expect(EAST_ASIA_SOURCE_CROP.lng.min).toBeCloseTo(65.7665, 4);
    expect(EAST_ASIA_SOURCE_CROP.lng.max).toBeCloseTo(179.5165, 4);
    expect(EAST_ASIA_SOURCE_CROP.lat.min).toBeCloseTo(6.825125, 4);
    expect(EAST_ASIA_SOURCE_CROP.lat.max).toBeCloseTo(73.325125, 4);
    expect(EAST_ASIA_SOURCE_CROP.lng.min).toBeGreaterThanOrEqual(-180);
    expect(EAST_ASIA_SOURCE_CROP.lng.max).toBeLessThanOrEqual(180);
    expect(sourceFocusX).toBeCloseTo(EAST_ASIA_FOCUS.x);
    expect(sourceFocusY).toBeCloseTo(EAST_ASIA_FOCUS.y);
    expect(EAST_ASIA_FOCUS_POINT.x / EAST_ASIA_MAP_SIZE.width).toBeCloseTo(sourceFocusX);
    expect(EAST_ASIA_FOCUS_POINT.y / EAST_ASIA_MAP_SIZE.height).toBeCloseTo(sourceFocusY);
    expect(WORLD_TO_FOCUS_SCALE).toBeCloseTo(360 / sourceLngSpan);
    expect(WORLD_TO_FOCUS_SCALE).toBeCloseTo(3.16, 2);
    expect(FINAL_VIRTUAL_ZOOM_SCALE).toBeCloseTo(WORLD_TO_FOCUS_SCALE * EAST_ASIA_ZOOM_SCALE);
    expect(FINAL_VIRTUAL_ZOOM_SCALE).toBeCloseTo(5.54, 2);
    expect(FOCUS_HANDOFF_START_SCALE).toBeCloseTo(WORLD_TO_FOCUS_SCALE * 0.97);
    expect(FOCUS_HANDOFF_END_SCALE).toBeCloseTo(WORLD_TO_FOCUS_SCALE * 1.05);
    expect(WORLD_CAMERA_PAN_START_SCALE).toBe(1.35);
    expect(calculateFocusTransition(1)).toBe(0);
    expect(calculateFocusTransition(FOCUS_HANDOFF_START_SCALE)).toBe(0);
    expect(calculateFocusTransition(WORLD_TO_FOCUS_SCALE)).toBeCloseTo(0.5);
    expect(calculateFocusTransition(FOCUS_HANDOFF_END_SCALE)).toBe(1);
    expect(calculateVirtualZoomScale(0)).toBe(1);
    expect(calculateVirtualZoomScale(1)).toBeCloseTo(FINAL_VIRTUAL_ZOOM_SCALE);
    expect(initialState).toMatchObject({
      virtualZoomScale: 1,
      narrativeWorldMapScale: 1,
      focusMapScale: 1,
      worldMapDotWidth: MAP_DOT_SCREEN_WIDTH.worldStart,
      focusMapDotWidth: MAP_DOT_SCREEN_WIDTH.worldHandoff,
      cameraPanProgress: 0,
    });
    expect(handoffState.virtualZoomScale).toBeCloseTo(WORLD_TO_FOCUS_SCALE);
    expect(handoffState.narrativeWorldMapScale).toBeCloseTo(WORLD_TO_FOCUS_SCALE);
    expect(handoffState.focusMapScale).toBeCloseTo(1);
    expect(handoffState.worldMapDotWidth).toBeCloseTo(MAP_DOT_SCREEN_WIDTH.worldHandoff);
    expect(handoffState.focusMapDotWidth).toBeCloseTo(MAP_DOT_SCREEN_WIDTH.worldHandoff);
    expect(handoffState.worldMapDotWidth).toBeCloseTo(handoffState.focusMapDotWidth);
    expect(handoffState.cameraPanProgress).toBe(1);
    expect(finalState.virtualZoomScale).toBeCloseTo(FINAL_VIRTUAL_ZOOM_SCALE);
    expect(finalState.focusMapScale).toBe(EAST_ASIA_ZOOM_SCALE);
    expect(finalState.focusMapDotWidth).toBeCloseTo(MAP_DOT_SCREEN_WIDTH.focusFinal);
  });

  it("Mobile Korea Camera를 Portrait Crop과 중앙 Focus 비율로 계산", () => {
    const focusRatio = calculateEastAsiaFocusRatio(MOBILE_KOREA_VIEWBOX);
    const fullMapRatio = calculateEastAsiaFocusRatio(EAST_ASIA_VIEWBOX);
    const mobileState = calculateMapZoomState(1, "mobilePortrait");
    const earlyZoomProgress = (1.1 - 1) / (FINAL_VIRTUAL_ZOOM_SCALE - 1);

    expect(MOBILE_KOREA_CROP).toEqual({
      lat: { min: 16, max: 59 },
      lng: { min: 116, max: 138 },
    });
    expect(MOBILE_KOREA_VIEWBOX.height).toBeGreaterThan(MOBILE_KOREA_VIEWBOX.width);
    expect(MOBILE_KOREA_VIEWBOX.x).toBeGreaterThanOrEqual(0);
    expect(MOBILE_KOREA_VIEWBOX.y).toBeGreaterThanOrEqual(0);
    expect(MOBILE_KOREA_VIEWBOX.x + MOBILE_KOREA_VIEWBOX.width).toBeLessThanOrEqual(
      EAST_ASIA_MAP_SIZE.width,
    );
    expect(MOBILE_KOREA_VIEWBOX.y + MOBILE_KOREA_VIEWBOX.height).toBeLessThanOrEqual(
      EAST_ASIA_MAP_SIZE.height,
    );
    expect(focusRatio.x).toBeCloseTo(0.5, 2);
    expect(focusRatio.y).toBeCloseTo(0.5, 2);
    expect(fullMapRatio.x).toBeCloseTo(EAST_ASIA_FOCUS_POINT.x / EAST_ASIA_MAP_SIZE.width);
    expect(fullMapRatio.y).toBeCloseTo(EAST_ASIA_FOCUS_POINT.y / EAST_ASIA_MAP_SIZE.height);
    expect(MOBILE_KOREA_ZOOM_SCALE).toBeCloseTo(1.08 * 1.5);
    expect(mobileState.focusMapScale).toBe(MOBILE_KOREA_ZOOM_SCALE);
    expect(calculateMapZoomState(earlyZoomProgress).cameraPanProgress).toBe(0);
    expect(
      calculateMapZoomState(earlyZoomProgress, "mobilePortrait").cameraPanProgress,
    ).toBeGreaterThan(0);
    expect(PORTRAIT_WORLD_CAMERA_PAN_START_SCALE).toBe(1.08);
  });

  it("Portrait World Map의 Korea Anchor를 화면 중앙축으로 이동", () => {
    const mapWidth = 1600;
    const koreaRatioX = projectPoint(KOREA_ANCHOR).x / WORLD_MAP_SIZE.width;
    const offsetX = calculatePortraitWorldOffsetX(mapWidth, koreaRatioX);

    expect(koreaRatioX).toBeCloseTo(0.8527, 3);
    expect(offsetX).toBeCloseTo(-564.32, 0);

    const portraitStages = [
      { height: 780, width: 390 },
      { height: 900, width: 768 },
    ];
    const responsiveOffsets = portraitStages.map((stage) => {
      const responsiveMapWidth = stage.height * 2.1;
      const responsiveOffsetX = calculatePortraitWorldOffsetX(
        responsiveMapWidth,
        koreaRatioX,
      );
      const mapLeft = stage.width * 0.5 + responsiveOffsetX - responsiveMapWidth * 0.5;
      const koreaTargetX = mapLeft + responsiveMapWidth * koreaRatioX;

      expect(koreaTargetX / stage.width).toBeCloseTo(0.5);
      expect(koreaTargetX / stage.width).toBeGreaterThanOrEqual(0.45);
      expect(koreaTargetX / stage.width).toBeLessThanOrEqual(0.55);

      return responsiveOffsetX;
    });

    expect(responsiveOffsets[0]).not.toBe(responsiveOffsets[1]);
  });

  it("Tablet Portrait Camera의 최종 가시 폭을 기존보다 1.5배 확대", () => {
    const focusRatio = calculateEastAsiaFocusRatio(TABLET_PORTRAIT_KOREA_VIEWBOX);
    const currentVisibleWidth = EAST_ASIA_MAP_SIZE.width / EAST_ASIA_ZOOM_SCALE;
    const portraitVisibleWidth = (
      TABLET_PORTRAIT_KOREA_VIEWBOX.width / TABLET_PORTRAIT_KOREA_ZOOM_SCALE
    );
    const tabletPortraitState = calculateMapZoomState(1, "tabletPortrait");

    expect(TABLET_PORTRAIT_KOREA_VIEWBOX.height).toBe(EAST_ASIA_MAP_SIZE.height);
    expect(TABLET_PORTRAIT_KOREA_VIEWBOX.width).toBeCloseTo(720);
    expect(focusRatio.x).toBeCloseTo(0.5);
    expect(focusRatio.y).toBeGreaterThan(0);
    expect(focusRatio.y).toBeLessThan(1);
    expect(currentVisibleWidth / portraitVisibleWidth).toBeCloseTo(1.5);
    expect(tabletPortraitState.focusMapScale).toBeCloseTo(
      TABLET_PORTRAIT_KOREA_ZOOM_SCALE,
    );
  });

  it("Project Gallery를 Seoul Origin 기반 이미지별 Side 경로로 계산", () => {
    expect(PROJECT_GALLERY_MOTIONS).toEqual([
      { exitX: -0.48, exitY: -0.16, from: 0.08, sideX: -0.32, sideY: -0.11, to: 0.51 },
      { exitX: 0.4, exitY: 0.15, from: 0.295, sideX: 0.25, sideY: 0.09, to: 0.725 },
      { exitX: -0.45, exitY: 0.2, from: 0.51, sideX: -0.29, sideY: 0.13, to: 0.94 },
    ]);
    const [first, second, third] = PROJECT_GALLERY_MOTIONS;
    const firstMidpoint = (first.from + first.to) / 2;
    const secondMidpoint = (second.from + second.to) / 2;
    const thirdMidpoint = (third.from + third.to) / 2;

    expect(second.from).toBeCloseTo(firstMidpoint);
    expect(first.to).toBeCloseTo(secondMidpoint);
    expect(third.from).toBeCloseTo(secondMidpoint);
    expect(second.to).toBeCloseTo(thirdMidpoint);
    const stageLayout = { height: 900, left: 300, width: 1500 };
    const planeLayout = calculateGalleryPlaneLayout(
      stageLayout.left,
      stageLayout.height,
      1920,
    );

    expect(planeLayout).toEqual({
      bounds: { height: 900, width: 1920 },
      left: -300,
    });
    expect(stageLayout.left + planeLayout.left).toBe(0);
    expect(planeLayout.bounds.width).not.toBe(stageLayout.width);
    expect(calculateGalleryOrigin(1000, 420, 0, 40, 64)).toEqual({
      x: 1000,
      y: 396,
    });

    PROJECT_GALLERY_MOTIONS.forEach((path, index) => {
      const phaseLength = path.to - path.from;
      const spawn = calculateGalleryFrameState(path.from, index);
      const spawnEnd = calculateGalleryFrameState(path.from + phaseLength * 0.18, index);
      const fadeInEnd = calculateGalleryFrameState(path.from + phaseLength * 0.2, index);
      const approach = calculateGalleryFrameState(path.from + phaseLength * 0.4, index);
      const approachEnd = calculateGalleryFrameState(path.from + phaseLength * 0.62, index);
      const front = calculateGalleryFrameState(path.from + phaseLength * 0.82, index);
      const exit = calculateGalleryFrameState(path.to, index);

      [spawn, approach, front, exit].forEach((state) => {
        expect(Object.keys(state)).toEqual([
          "localProgress",
          "z",
          "scale",
          "blur",
          "opacity",
          "routeProgress",
          "exitProgress",
        ]);
      });

      expect(spawn).toMatchObject({
        localProgress: 0,
        z: -850,
        scale: 0.72,
        blur: 18,
        opacity: 0,
        routeProgress: 0,
        exitProgress: 0,
      });
      expect(approach.z).toBeGreaterThan(spawn.z);
      expect(approach.z).toBeLessThan(0);
      expect(approach.blur).toBeGreaterThan(0);
      expect(approach.blur).toBeLessThan(spawn.blur);
      expect(approach.opacity).toBeGreaterThan(0.55);
      expect(spawnEnd.z).toBeCloseTo(-639.4);
      expect(spawnEnd.scale).toBeCloseTo(0.7848);
      expect(fadeInEnd.opacity).toBeCloseTo(0.55);
      expect(approachEnd.z).toBeCloseTo(-124.6);
      expect(approachEnd.scale).toBeCloseTo(0.9432);
      expect(approachEnd).toMatchObject({ blur: 0, opacity: 1 });
      expect(front.blur).toBe(0);
      expect(front.opacity).toBe(1);
      expect(front.z).toBeCloseTo(109.4);
      expect(front.scale).toBeCloseTo(1.0152);
      expect(front.routeProgress).toBe(1);
      expect(exit.z).toBeGreaterThan(0);
      expect(exit.scale).toBeCloseTo(1.08);
      expect(exit.exitProgress).toBe(1);
      expect(exit.opacity).toBe(0);
    });

    const positions = PROJECT_GALLERY_MOTIONS.map((path, index) => {
      const phaseLength = path.to - path.from;
      const state = calculateGalleryFrameState(path.from + phaseLength * 0.82, index);

      return calculateGalleryFramePosition({
        bounds: { height: 900, width: 1920 },
        frame: { height: 240, width: 400 },
        origin: { x: 960, y: 450 },
        path,
        state,
        viewport: "desktop",
      });
    });

    expect(Math.sign(positions[0].x)).toBe(-1);
    expect(Math.sign(positions[0].y)).toBe(-1);
    expect(Math.sign(positions[1].x)).toBe(1);
    expect(Math.sign(positions[1].y)).toBe(1);
    expect(Math.sign(positions[2].x)).toBe(-1);
    expect(Math.sign(positions[2].y)).toBe(1);
  });

  it("Gallery Phase 중첩과 Viewport별 Side 이동 강도를 유지", () => {
    const atFirstMidpoint = [0, 1, 2].map((index) => (
      calculateGalleryFrameState(0.295, index)
    ));
    const atSharedMidpoint = [0, 1, 2].map((index) => (
      calculateGalleryFrameState(0.51, index)
    ));
    const atThirdMidpoint = [0, 1, 2].map((index) => (
      calculateGalleryFrameState(0.725, index)
    ));

    expect(atFirstMidpoint[0].localProgress).toBeCloseTo(0.5);
    expect(atFirstMidpoint[0].opacity).toBeGreaterThan(0);
    expect(atFirstMidpoint[1].localProgress).toBe(0);
    expect(atSharedMidpoint[0].opacity).toBe(0);
    expect(atSharedMidpoint[1].localProgress).toBeCloseTo(0.5);
    expect(atSharedMidpoint[1].opacity).toBeGreaterThan(0);
    expect(atSharedMidpoint[2].localProgress).toBe(0);
    expect(atThirdMidpoint[1].opacity).toBe(0);
    expect(atThirdMidpoint[2].localProgress).toBeCloseTo(0.5);
    expect(atThirdMidpoint[2].opacity).toBeGreaterThan(0);

    [0.295 + 0.43 * 0.1, 0.51 + 0.43 * 0.1].forEach((zoomProgress, overlapIndex) => {
      const visibleFrames = [0, 1, 2]
        .map((index) => calculateGalleryFrameState(zoomProgress, index))
        .filter((state) => state.opacity > 0);

      expect(visibleFrames).toHaveLength(2);
      expect(calculateGalleryFrameState(zoomProgress, overlapIndex + 1).opacity).toBeGreaterThan(0);
    });

    const desktopSpawn = calculateGalleryFrameState(0.295, 1, "desktop");
    const tabletSpawn = calculateGalleryFrameState(0.295, 1, "tablet");
    const tabletPortraitSpawn = calculateGalleryFrameState(0.295, 1, "tabletPortrait");
    const mobileSpawn = calculateGalleryFrameState(0.295, 1, "mobile");
    const frontProgress = 0.295 + (0.725 - 0.295) * 0.82;
    const desktopFront = calculateGalleryFrameState(frontProgress, 1, "desktop");
    const tabletFront = calculateGalleryFrameState(frontProgress, 1, "tablet");
    const tabletPortraitFront = calculateGalleryFrameState(frontProgress, 1, "tabletPortrait");
    const mobileFront = calculateGalleryFrameState(frontProgress, 1, "mobile");
    const positionFor = (
      viewport: "desktop" | "tablet" | "tabletPortrait" | "mobile",
      state: ReturnType<typeof calculateGalleryFrameState>,
    ) => calculateGalleryFramePosition({
      bounds: { height: 1800, width: 3000 },
      frame: { height: 240, width: 400 },
      origin: { x: 1500, y: 900 },
      path: PROJECT_GALLERY_MOTIONS[1],
      state,
      viewport,
    });
    const desktopPosition = positionFor("desktop", desktopFront);
    const tabletPosition = positionFor("tablet", tabletFront);
    const tabletPortraitPosition = positionFor("tabletPortrait", tabletPortraitFront);
    const mobilePosition = positionFor("mobile", mobileFront);

    expect(tabletSpawn.z).toBeCloseTo(desktopSpawn.z * 0.88);
    expect(tabletPortraitSpawn.z).toBeCloseTo(desktopSpawn.z);
    expect(mobileSpawn.z).toBeCloseTo(desktopSpawn.z * 0.72);
    expect(tabletSpawn.blur).toBe(14);
    expect(tabletPortraitSpawn.blur).toBe(14);
    expect(mobileSpawn.blur).toBe(5);
    expect(tabletPosition.x).toBeCloseTo(desktopPosition.x * 0.72);
    expect(tabletPosition.y).toBeCloseTo(desktopPosition.y * 0.75);
    expect(tabletPortraitPosition.x).toBeCloseTo(desktopPosition.x);
    expect(tabletPortraitPosition.y).toBeCloseTo(desktopPosition.y);
    expect(mobilePosition.x).toBeCloseTo(desktopPosition.x * 0.45);
    expect(mobilePosition.y).toBeCloseTo(desktopPosition.y * 0.63);
    expect(mobilePosition.x).not.toBe(0);
    expect(mobilePosition.y).not.toBe(0);
  });

  it("Gallery Spawn Gap과 Safe Bound 및 Exit 예외를 계산", () => {
    const frame = { height: 240, width: 400 };
    const bounds = { height: 900, width: 1920 };
    const centeredOrigin = { x: 960, y: 450 };

    PROJECT_GALLERY_MOTIONS.forEach((path, index) => {
      const phaseLength = path.to - path.from;
      const state = calculateGalleryFrameState(path.from + phaseLength * 0.1, index);
      const anchors = calculateGalleryFrameAnchors({
        bounds,
        frame,
        origin: centeredOrigin,
        path,
        viewport: "desktop",
      });
      const position = calculateGalleryFramePosition({
        bounds,
        frame,
        origin: centeredOrigin,
        path,
        state,
        viewport: "desktop",
      });
      const perspectiveScale = 1400 / (1400 - state.z);
      const projectedWidth = frame.width * state.scale * perspectiveScale;
      const projectedHeight = frame.height * state.scale * perspectiveScale;

      expect(position.x).toBeCloseTo(anchors.spawn.x);
      expect(position.y).toBeCloseTo(anchors.spawn.y);
      expect(Math.sign(position.x)).toBe(Math.sign(path.sideX));
      expect(Math.sign(position.y)).toBe(Math.sign(path.sideY));
      expect(Math.abs(position.x) - projectedWidth / 2 - 12).toBeCloseTo(10);
      expect(Math.abs(position.y) - projectedHeight / 2 - 12).toBeCloseTo(10);
      expect(calculateGalleryFrameAnchors({
        bounds,
        frame,
        origin: centeredOrigin,
        path,
        viewport: "desktop",
      })).toEqual(anchors);
    });

    const edgeOrigin = { x: 1720, y: 720 };
    const responsiveBounds = [
      { perspective: 1400, safeMargin: 24, viewport: "desktop" as const },
      { perspective: 1200, safeMargin: 20, viewport: "tablet" as const },
      { perspective: 1200, safeMargin: 20, viewport: "tabletPortrait" as const },
      { perspective: 900, safeMargin: 16, viewport: "mobile" as const },
    ];

    responsiveBounds.forEach(({ perspective, safeMargin, viewport }) => {
      const path = PROJECT_GALLERY_MOTIONS[1];
      const frontProgress = path.from + (path.to - path.from) * 0.82;
      const state = calculateGalleryFrameState(frontProgress, 1, viewport);
      const anchors = calculateGalleryFrameAnchors({
        bounds,
        frame,
        origin: edgeOrigin,
        path,
        viewport,
      });
      const perspectiveScale = perspective / (perspective - state.z);
      const projectedWidth = frame.width * state.scale * perspectiveScale;
      const projectedHeight = frame.height * state.scale * perspectiveScale;
      const centerX = edgeOrigin.x + anchors.front.x;
      const centerY = edgeOrigin.y + anchors.front.y;

      expect(centerX - projectedWidth / 2).toBeGreaterThanOrEqual(safeMargin - 0.001);
      expect(centerX + projectedWidth / 2).toBeLessThanOrEqual(bounds.width - safeMargin + 0.001);
      expect(centerY - projectedHeight / 2).toBeGreaterThanOrEqual(safeMargin - 0.001);
      expect(centerY + projectedHeight / 2).toBeLessThanOrEqual(bounds.height - safeMargin + 0.001);
    });

    PROJECT_GALLERY_MOTIONS.forEach((path, index) => {
      const exitState = calculateGalleryFrameState(path.to, index);
      const anchors = calculateGalleryFrameAnchors({
        bounds,
        frame,
        origin: edgeOrigin,
        path,
        viewport: "desktop",
      });
      const exitPosition = calculateGalleryFramePosition({
        bounds,
        frame,
        origin: edgeOrigin,
        path,
        state: exitState,
        viewport: "desktop",
      });
      const perspectiveScale = 1400 / (1400 - exitState.z);
      const projectedWidth = frame.width * exitState.scale * perspectiveScale;
      const centerX = edgeOrigin.x + exitPosition.x;

      expect(exitPosition).toEqual(anchors.exit);
      if (path.sideX < 0) {
        expect(centerX + projectedWidth / 2).toBeLessThanOrEqual(-32);
      } else {
        expect(centerX - projectedWidth / 2).toBeGreaterThanOrEqual(bounds.width + 32);
      }
    });

    const exitPath = PROJECT_GALLERY_MOTIONS[1];
    const heldExitOpacity = calculateGalleryFrameState(
      exitPath.from + (exitPath.to - exitPath.from) * 0.89,
      1,
    );
    const fadingExitOpacity = calculateGalleryFrameState(
      exitPath.from + (exitPath.to - exitPath.from) * 0.91,
      1,
    );

    expect(heldExitOpacity.opacity).toBe(1);
    expect(fadingExitOpacity.opacity).toBeLessThan(1);
    expect(fadingExitOpacity.opacity).toBeGreaterThan(0);
  });

  it("Gallery Spatial Motion 경계와 RAF Damping을 연속 계산", () => {
    const path = PROJECT_GALLERY_MOTIONS[0];
    const phaseLength = path.to - path.from;
    const geometry = {
      bounds: { height: 900, width: 1920 },
      frame: { height: 240, width: 400 },
      origin: { x: 960, y: 450 },
      path,
      viewport: "desktop" as const,
    };
    const sample = (localProgress: number) => {
      const state = calculateGalleryFrameState(
        path.from + phaseLength * localProgress,
        0,
      );

      return {
        position: calculateGalleryFramePosition({ ...geometry, state }),
        state,
      };
    };

    [0.18, 0.62, 0.82].forEach((boundary) => {
      const before = sample(boundary - 0.001);
      const at = sample(boundary);
      const after = sample(boundary + 0.001);
      const beforeMove = at.position.x - before.position.x;
      const afterMove = after.position.x - at.position.x;
      const beforeMoveY = at.position.y - before.position.y;
      const afterMoveY = after.position.y - at.position.y;

      expect(Math.abs(beforeMove)).toBeGreaterThan(0);
      expect(Math.abs(afterMove)).toBeGreaterThan(0);
      expect(beforeMove * afterMove).toBeGreaterThan(0);
      expect(Math.abs(beforeMoveY)).toBeGreaterThan(0);
      expect(Math.abs(afterMoveY)).toBeGreaterThan(0);
      expect(beforeMoveY * afterMoveY).toBeGreaterThan(0);
      expect(at.state.z - before.state.z).toBeGreaterThan(0);
      expect(after.state.z - at.state.z).toBeGreaterThan(0);
      expect(at.state.scale - before.state.scale).toBeGreaterThan(0);
      expect(after.state.scale - at.state.scale).toBeGreaterThan(0);
    });

    const firstStep = dampGalleryValue(0, 1, 0.016, 14);
    let sixtyFps = 0;
    let thirtyFps = 0;

    for (let index = 0; index < 60; index += 1) {
      sixtyFps = dampGalleryValue(sixtyFps, 1, 1 / 60, 14);
    }
    for (let index = 0; index < 30; index += 1) {
      thirtyFps = dampGalleryValue(thirtyFps, 1, 1 / 30, 14);
    }

    expect(firstStep).toBeGreaterThan(0);
    expect(firstStep).toBeLessThan(1);
    expect(sixtyFps).toBeCloseTo(thirtyFps, 10);
    expect(dampGalleryValue(sixtyFps, 0, 0.016, 14)).toBeLessThan(sixtyFps);
  });

  it("새 Zoom 거리와 Gallery 종료 뒤 Focus Hold·About Exit 순서를 유지", () => {
    const metrics = calculateHeroScrollMetrics(1000);

    expect(KOREA_ZOOM_DISTANCE_MULTIPLIER).toBe(3.2);
    expect(metrics.mapCenterStart).toBe(180);
    expect(metrics.mapCenterEnd).toBe(300);
    expect(metrics.fullMapHoldStart).toBe(300);
    expect(metrics.fullMapHoldEnd).toBe(360);
    expect(metrics.zoomStart).toBe(360);
    expect(metrics.zoomDistance).toBe(960);
    expect(metrics.zoomEnd).toBe(1320);
    expect(metrics.postZoomHoldStart).toBe(1320);
    expect(metrics.postZoomHoldEnd).toBe(1440);
    expect(metrics.sceneExitStart).toBe(1440);
    expect(metrics.sceneExitEnd).toBe(1560);
    expect(metrics.totalDistance).toBe(1760);
    expect(PROJECT_GALLERY_MOTIONS.at(-1)?.to).toBeLessThan(1);
    expect(metrics.zoomEnd).toBeLessThan(metrics.sceneExitStart);
    expect(metrics.sceneExitStart).toBeLessThan(metrics.sceneExitEnd);
  });

  it("Portrait에서는 Center와 Zoom을 겹치며 초기 대기 구간을 제거", () => {
    const metrics = calculateHeroScrollMetrics(1000, "portrait");

    expect(metrics.topologyHoldEnd).toBe(15);
    expect(metrics.topologyExitStart).toBe(0);
    expect(metrics.topologyExitEnd).toBe(80);
    expect(metrics.mapCenterStart).toBe(10);
    expect(metrics.mapCenterEnd).toBe(100);
    expect(metrics.fullMapHoldStart).toBe(100);
    expect(metrics.fullMapHoldEnd).toBe(100);
    expect(metrics.zoomStart).toBe(30);
    expect(metrics.zoomDistance).toBe(960);
    expect(metrics.zoomEnd).toBe(990);
    expect(metrics.sceneExitStart).toBe(1110);
    expect(metrics.sceneExitEnd).toBe(1230);
    expect(metrics.totalDistance).toBe(1430);
    expect(metrics.zoomStart).toBeLessThan(metrics.mapCenterEnd);
    expect(metrics.zoomStart / 360).toBeLessThan(0.1);
    expect(calculateHeroSceneState(31, metrics).zoomProgress).toBeGreaterThan(0);
  });

  it("소개 Anchor를 색이 100%가 되는 Cross-fade 종료 시점으로 배치", async () => {
    render(<Home />);

    const hero = document.querySelector<HTMLElement>(".hero")!;
    const aboutSection = document.querySelector<HTMLElement>(".about-section")!;
    const aboutAnchor = document.querySelector<HTMLElement>(".about-anchor")!;
    const getComputedStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
      if (element === aboutAnchor) {
        return { scrollMarginTop: "64px" } as CSSStyleDeclaration;
      }

      return getComputedStyle(element);
    });
    Object.defineProperty(hero, "offsetHeight", {
      configurable: true,
      value: window.innerHeight + 1000,
    });

    fireEvent.resize(window);
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

    const metrics = calculateHeroScrollMetrics(1000);
    expect(calculateHeroSceneState(metrics.sceneExitEnd, metrics).aboutOpacity).toBe(1);
    expect(aboutSection.style.getPropertyValue("--about-anchor-offset")).toBe(
      `${metrics.sceneExitEnd - metrics.sceneExitStart + 64}px`,
    );
  });

  it("Full Map Hold부터 최종 Focus Hold와 기존 About Cross-fade까지 상태를 유지", () => {
    const metrics = calculateHeroScrollMetrics(1000);
    const atFullMap = calculateHeroSceneState(300, metrics);
    const atZoomStart = calculateHeroSceneState(360, metrics);
    const atZoomMiddle = calculateHeroSceneState(840, metrics);
    const atZoomEnd = calculateHeroSceneState(1320, metrics);
    const atFocusHold = calculateHeroSceneState(1380, metrics);
    const atExitStart = calculateHeroSceneState(1440, metrics);
    const atExitMiddle = calculateHeroSceneState(1500, metrics);
    const atExitEnd = calculateHeroSceneState(1560, metrics);

    [atFullMap, atZoomStart].forEach((state) => {
      expect(state).toMatchObject({
        cardMapOpacity: 0,
        narrativeWorldMapOpacity: 1,
        focusMapOpacity: 0,
        zoomProgress: 0,
        mapExit: 0,
        aboutOpacity: 0,
      });
    });
    expect(atZoomMiddle.virtualZoomScale).toBeGreaterThan(1);
    expect(atZoomMiddle.virtualZoomScale).toBeLessThan(FINAL_VIRTUAL_ZOOM_SCALE);
    expect(atZoomMiddle.galleryFrames.some((frame) => frame.opacity > 0)).toBe(true);
    expect(atZoomEnd).toMatchObject({
      zoomProgress: 1,
      focusMapOpacity: 1,
      focusMapScale: EAST_ASIA_ZOOM_SCALE,
      mapExit: 0,
      aboutOpacity: 0,
    });
    expect(atZoomEnd.galleryFrames.every((frame) => frame.opacity === 0)).toBe(true);
    [atFocusHold, atExitStart].forEach((state) => {
      expect(state).toMatchObject({
        focusMapOpacity: 1,
        focusMapScale: EAST_ASIA_ZOOM_SCALE,
        mapExit: 0,
        aboutOpacity: 0,
      });
      expect(state.galleryFrames.every((frame) => frame.opacity === 0)).toBe(true);
    });
    expect(atExitMiddle.mapExit).toBeGreaterThan(0);
    expect(atExitMiddle.blurStrength).toBeGreaterThan(0);
    expect(atExitMiddle.aboutOpacity).toBeGreaterThan(0);
    expect(atExitEnd).toMatchObject({
      focusMapOpacity: 0,
      mapExit: 1,
      aboutOpacity: 1,
    });

    [atFullMap, atZoomStart, atZoomMiddle, atZoomEnd, atFocusHold, atExitStart].forEach((state) => {
      expect(state.narrativeWorldMapOpacity + state.focusMapOpacity).toBeCloseTo(1);
      expect(state.mapExit).toBe(0);
      expect(state.aboutOpacity).toBe(0);
    });
  });

  it("Mobile에서도 세 Resource와 Line, Flow를 Landscape 좌표계로 유지", () => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query.includes("max-width: 767px") || query.includes("max-width: 899px"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));
    render(<Home />);

    const topology = screen.getByRole("group", { name: /대한민국 Server/ });
    const connections = topology.querySelector<SVGSVGElement>(".topology-connection-lines");
    const flow = topology.querySelector<SVGSVGElement>(".topology-flow-overlay");
    const paths = topology.querySelectorAll<SVGPathElement>(".topology-connection-line");
    const guides = topology.querySelectorAll<SVGPathElement>(".topology-flow-guide");
    const focusMap = document.querySelector<SVGSVGElement>(".topology-focus-map-svg");

    expect(topology.querySelectorAll(".topology-resource")).toHaveLength(3);
    expect(connections).toHaveAttribute("viewBox", "0 0 800 500");
    expect(flow).toHaveAttribute("viewBox", "0 0 800 500");
    expect(paths).toHaveLength(3);
    expect(guides).toHaveLength(3);
    expect(paths[0]).toHaveAttribute("d", expect.stringContaining("H410V110H288"));
    expect(paths[1]).toHaveAttribute("d", expect.stringContaining("V250H640V310"));
    expect(paths[2]).toHaveAttribute("d", expect.stringContaining("H360V430H248"));
    expect(guides[0]).toHaveAttribute("d", paths[0].getAttribute("d"));
    expect(guides[1]).toHaveAttribute("d", paths[1].getAttribute("d"));
    expect(guides[2]).toHaveAttribute("d", paths[2].getAttribute("d"));
    expect(focusMap).toHaveAttribute("viewBox", formatMapViewBox(MOBILE_KOREA_VIEWBOX));
    expect(focusMap).toHaveAttribute("preserveAspectRatio", "xMidYMid slice");
  });

  it("Tablet Portrait에서 전용 Camera ViewBox와 세로 채움 방식을 사용", () => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query.includes("max-width: 899px") && query.includes("orientation: portrait"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));
    render(<Home />);

    const focusMap = document.querySelector<SVGSVGElement>(".topology-focus-map-svg");

    expect(focusMap).toHaveAttribute(
      "viewBox",
      formatMapViewBox(TABLET_PORTRAIT_KOREA_VIEWBOX),
    );
    expect(focusMap).toHaveAttribute("preserveAspectRatio", "xMidYMid slice");
  });

  it("지정된 Main 흐름과 숫자 없는 Section 구성을 표시", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "소개" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "기술 스택" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "프로젝트" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "학력 및 성과" })).toBeInTheDocument();
    expect(document.querySelector("#experience")).not.toBeInTheDocument();
    expect(screen.queryByText("01 / MAIN")).not.toBeInTheDocument();
    expect(screen.queryByText("02 / PROFILE")).not.toBeInTheDocument();
    expect(screen.queryByText("03 / TECHNOLOGY")).not.toBeInTheDocument();
    expect(screen.queryByText("04 / SELECTED WORK")).not.toBeInTheDocument();
    expect(screen.queryByText("05 / ENDING")).not.toBeInTheDocument();
    expect(screen.queryByText("공개 Profile 데이터 연결 전")).not.toBeInTheDocument();
    expect(screen.queryByText("공개 이력 데이터 연결 전")).not.toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("프로필 사진과 자기소개, 개발 철학을 한 Composition에 표시", () => {
    render(<Home />);

    const aboutValues = document.querySelector<HTMLElement>(".about-values")!;
    const valueCards = aboutValues.querySelectorAll<HTMLElement>("[data-value-card]");

    expect(document.querySelectorAll("#about")).toHaveLength(1);
    expect(document.querySelector("#about")).toHaveClass("about-anchor");
    expect(document.querySelector(".about-section")).not.toHaveAttribute("id");
    expect(document.querySelectorAll(".about-introduction")).toHaveLength(1);
    expect(document.querySelectorAll(".about-transition-window")).toHaveLength(1);
    expect(document.querySelectorAll(".about-viewport")).toHaveLength(1);
    expect(document.querySelectorAll(".about-details")).toHaveLength(0);
    expect(document.querySelector(".about-primary")).toContainElement(aboutValues);
    expect(screen.getByRole("img", { name: "김현우 프로필 사진" })).toHaveAttribute(
      "src",
      expect.stringContaining("kim-hyunwoo-profile.webp"),
    );
    const introduction = document.querySelector<HTMLElement>(".about-introduction")!;
    expect(within(introduction).getByText("BACKEND / INFRA DEVELOPER")).toHaveClass("type-title");
    expect(introduction.querySelectorAll("p:not(.about-position)")).toHaveLength(2);
    expect(introduction).toHaveTextContent(/성공회대학교에 재학 중인 김현우입니다/);
    expect(introduction).toHaveTextContent(/실제로 운영 가능한 상태까지 완성하는 것을 중요하게 생각합니다/);
    expect(within(aboutValues).getByRole("heading", { name: "개발 철학" })).toBeInTheDocument();
    expect(valueCards).toHaveLength(3);
    valueCards.forEach((card) => {
      expect(card.querySelector("[data-border-glow]")).toBeInTheDocument();
    });
    expect(within(aboutValues).getByText("문서화의 가치")).toBeInTheDocument();
    expect(within(aboutValues).getByText("덜어냄의 미학")).toBeInTheDocument();
    expect(within(aboutValues).getByText("운영까지")).toBeInTheDocument();
    expect(screen.queryByText("끝까지 완성")).not.toBeInTheDocument();
    expect(screen.queryByText("필요한 만큼만")).not.toBeInTheDocument();
    expect(screen.queryByText("운영까지 고려")).not.toBeInTheDocument();
    expect(screen.queryByText("구조부터 생각")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "개발 여정" })).not.toBeInTheDocument();
    expect(screen.queryByText("개발을 접하다")).not.toBeInTheDocument();
    expect(screen.queryByText("Backend Development")).not.toBeInTheDocument();
  });

  it("6개 기술군의 독립 Fixture 기술을 아이콘 Index로 표시", () => {
    render(<Home />);

    const techSection = screen.getByRole("region", { name: "기술 스택" });

    expect(within(techSection).getByText("Infrastructure")).toBeInTheDocument();
    expect(within(techSection).getByText("Frontend")).toBeInTheDocument();
    expect(within(techSection).getByText("React")).toBeInTheDocument();
    expect(within(techSection).getByText("Kubernetes")).toBeInTheDocument();
    expect(within(techSection).getByText("GHCR")).toBeInTheDocument();
    expect(within(techSection).getByText("Docker Compose")).toBeInTheDocument();
    expect(techSection.querySelectorAll(".tech-item")).toHaveLength(13);
    expect(techSection.querySelectorAll("img.tech-icon")).toHaveLength(13);
    expect(techSection.querySelectorAll("svg.tech-icon")).toHaveLength(0);
    expect(within(techSection).queryByText("Backend / Infra 개발자로서 핵심적으로 사용하는 기술")).not.toBeInTheDocument();
    expect(within(techSection).queryByText("서비스 로직 구현과 관계형 데이터 처리의 기본 언어")).not.toBeInTheDocument();
    expect(within(techSection).queryByText(/Source 변경부터 Build, Image 생성과 배포/)).not.toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("기술 아이콘 URL 누락 시 중립 아이콘 상태를 표시", () => {
    const response = {
      ...PUBLIC_PORTFOLIO_FIXTURE,
      portfolioTechnologies: PUBLIC_PORTFOLIO_FIXTURE.portfolioTechnologies.map((technology, index) => (
        index === 0 ? { ...technology, iconUrl: null } : technology
      )),
    };

    render(<HomeView model={mapPublicPortfolio(response)} />);

    expect(screen.getByRole("img", { name: "Java 아이콘 없음" })).toHaveClass("technology-icon-fallback");
  });

  it("Project Identity와 설명, Metadata, Detail CTA를 역할별로 표시", () => {
    render(<Home />);

    const projectsSection = document.querySelector<HTMLElement>(".projects-section")!;
    const projectHistory = within(projectsSection).getByRole("list", { name: "연도별 프로젝트" });
    expect(projectHistory.querySelector(".project-tab[href='#project-kyvc']")).toHaveTextContent("KYvC");
    expect(projectHistory.querySelector(".project-tab[href='#project-shkutrack']")).toHaveTextContent("SHKUTrack");
    expect(projectHistory.querySelector(".project-tab[href='#project-shkuload']")).toHaveTextContent("SHKULoad");
    expect(within(projectsSection).getAllByText("2026")).toHaveLength(1);
    expect(within(projectsSection).getAllByText("2023")).toHaveLength(1);
    expect(within(projectsSection).getByText("법인 KYC 자동 심사 서비스")).toBeInTheDocument();
    expect(within(projectsSection).getByText("성공회대학교 졸업 관리 서비스")).toBeInTheDocument();
    expect(within(projectsSection).getByText("길찾기·중간지점·지하철 정보 서비스"))
      .toBeInTheDocument();
    expect(within(projectsSection).getByText(
      "목적지 길찾기와 여러 위치의 중간지점 계산, 지하철 위치·지연정보를 제공하는 서비스",
    )).toBeInTheDocument();
    expect(within(projectsSection).queryByText("사용자가 현재 프로젝트 목록에 포함시키려는 2023 프로젝트"))
      .not.toBeInTheDocument();
    expect(within(projectsSection).queryByText("프로젝트 정보 정리 예정")).not.toBeInTheDocument();
    expect(within(projectsSection).queryByText("제 시간표를 소개합니다.")).not.toBeInTheDocument();
    expect(projectsSection.querySelectorAll(".project-information .project-name")).toHaveLength(0);
    expect(within(projectsSection).queryByRole("heading", { name: "KYvC" })).not.toBeInTheDocument();
    expect(within(projectsSection).queryByRole("heading", { name: "SHKUTrack" })).not.toBeInTheDocument();
    expect(within(projectsSection).queryByRole("heading", { name: "SHKULoad" })).not.toBeInTheDocument();

    expect(within(projectsSection).getByRole("link", { name: "KYvC 프로젝트 상세 보기" }))
      .toHaveAttribute("href", "/projects/kyvc");
    expect(within(projectsSection).getByRole("link", { name: "SHKUTrack 프로젝트 상세 보기" }))
      .toHaveAttribute("href", "/projects/shkutrack");
    expect(within(projectsSection).getByRole("link", { name: "KYvC 자세히 보기" }))
      .toHaveAttribute("href", "/projects/kyvc");
    expect(within(projectsSection).getByRole("link", { name: "KYvC 자세히 보기" }))
      .toHaveClass("project-detail-link");
    expect(within(projectsSection).getByRole("link", { name: "SHKUTrack 자세히 보기" }))
      .toHaveAttribute("href", "/projects/shkutrack");
    const expectedMetadata = [
      {
        id: "kyvc",
        role: "백엔드 · 인프라",
        technologies: "Java · Spring Boot · PostgreSQL · Docker",
        technologyCount: 4,
      },
      {
        id: "shkutrack",
        role: "풀스택 · 인프라",
        technologies: "Java · Spring Boot · PostgreSQL · Docker · Kubernetes · Nginx",
        technologyCount: 6,
      },
      {
        id: "shkuload",
        role: "백엔드",
        technologies: "JavaScript · Node.js · Express · EJS",
        technologyCount: 4,
      },
    ];

    expectedMetadata.forEach((metadata) => {
      const project = projectsSection.querySelector<HTMLElement>(`#project-${metadata.id}`)!;

      expect(project.querySelectorAll(".project-meta")).toHaveLength(1);
      expect(project.querySelectorAll(".project-role-badge")).toHaveLength(1);
      expect(project.querySelector(".project-role-badge")).toHaveTextContent(metadata.role);
      expect(project.querySelectorAll(".project-tech-badge")).toHaveLength(1);
      expect(project.querySelector(".project-tech-badge")).toHaveTextContent(metadata.technologies);
      expect(project.querySelectorAll(".project-meta-badge")).toHaveLength(2);
      expect(project.querySelectorAll(".project-tech-item")).toHaveLength(metadata.technologyCount);
      expect(project.querySelectorAll(".project-tech-separator")).toHaveLength(metadata.technologyCount - 1);
      expect(Array.from(project.querySelectorAll(".project-tech-separator")).every(
        (separator) => separator.textContent === "\u00A0·\u00A0",
      )).toBe(true);
      expect(project.querySelectorAll(".project-tech-item.project-meta-badge")).toHaveLength(0);
    });
    expect(projectsSection.querySelectorAll(".project-meta")).toHaveLength(3);
    expect(projectsSection.querySelectorAll(".project-role-badge")).toHaveLength(3);
    expect(projectsSection.querySelectorAll(".project-tech-badge")).toHaveLength(3);
    expect(projectsSection.querySelectorAll(".project-meta-separator")).toHaveLength(0);
    expect(projectsSection.querySelectorAll(".project-tech-separator")).toHaveLength(11);
    expect(projectsSection.querySelectorAll(".project-meta-badge")).toHaveLength(6);
    expect(projectsSection.querySelectorAll(".project-technology")).toHaveLength(0);

    const kyvcImageSrc = within(projectsSection).getByRole("img", { name: "KYvC 프로젝트 대표 화면" }).getAttribute("src") ?? "";
    const shkuTrackImageSrc = within(projectsSection).getByRole("img", { name: "SHKUTrack 프로젝트 대표 화면" }).getAttribute("src") ?? "";
    expect(decodeURIComponent(kyvcImageSrc)).toContain("/api/v1/public/media/projects/1/thumbnail");
    expect(decodeURIComponent(shkuTrackImageSrc)).toContain("/api/v1/public/media/projects/2/thumbnail");
    const shkuLoadProject = projectsSection.querySelector<HTMLElement>("#project-shkuload")!;
    expect(shkuLoadProject.querySelector("img")).not.toBeInTheDocument();
    expect(shkuLoadProject.querySelector(".project-thumbnail-placeholder")).toBeInTheDocument();
    const shkuLoadDetailLink = within(projectsSection).getByRole("link", { name: "SHKULoad 자세히 보기" });
    expect(shkuLoadDetailLink).toHaveAttribute("href", "/projects/shkuload");
    expect(shkuLoadDetailLink).not.toHaveAttribute("target");
    expect(within(shkuLoadProject).getAllByRole("link")).toHaveLength(1);
    expect(projectsSection.querySelector("a[href='https://github.com/woohyuk0428/SKHU_Contest']")).not.toBeInTheDocument();
    expect(document.querySelector(".project-visual")).not.toBeInTheDocument();
    expect(document.querySelector(".kyvc-structure")).not.toBeInTheDocument();
    expect(document.querySelector(".shkutrack-structure")).not.toBeInTheDocument();
  });

  it("Project 대표 이미지 로딩 실패 시 기존 Placeholder로 전환", () => {
    render(<Home />);

    const project = document.querySelector<HTMLElement>("#project-kyvc")!;
    fireEvent.error(within(project).getByRole("img", { name: "KYvC 프로젝트 대표 화면" }));

    expect(within(project).queryByRole("img", { name: "KYvC 프로젝트 대표 화면" })).not.toBeInTheDocument();
    expect(project.querySelector(".project-thumbnail-placeholder")).toBeInTheDocument();
  });

  it("Viewport 중심에 가까운 Project를 Timeline 현재 항목으로 표시", async () => {
    render(<Home />);

    const createRect = (top: number, height: number, left = 0, width = 700) => ({
      bottom: top + height,
      height,
      left,
      right: left + width,
      top,
      width,
      x: left,
      y: top,
      toJSON: () => ({}),
    });
    const [kyvcRow, shkuTrackRow, shkuLoadRow] = Array.from(
      document.querySelectorAll<HTMLElement>(".project-panel"),
    );
    const projectHistory = document.querySelector<HTMLOListElement>(".project-showcases")!;
    const projectNodes = Array.from(document.querySelectorAll<HTMLSpanElement>(".project-node"));
    vi.spyOn(kyvcRow, "getBoundingClientRect").mockReturnValue(createRect(-1000, 400));
    vi.spyOn(shkuTrackRow, "getBoundingClientRect").mockReturnValue(createRect(-400, 400));
    vi.spyOn(shkuLoadRow, "getBoundingClientRect").mockReturnValue(createRect(200, 400));
    vi.spyOn(projectHistory, "getBoundingClientRect").mockReturnValue(createRect(0, 900, 0, 1000));
    projectNodes.forEach((node, index) => {
      vi.spyOn(node, "getBoundingClientRect").mockReturnValue(createRect(40 + index * 240, 8, 52, 8));
    });

    fireEvent.resize(window);
    fireEvent.scroll(window);

    const shkuLoadTimelineLink = document.querySelector<HTMLAnchorElement>(
      ".project-tab[href='#project-shkuload']",
    )!;
    await waitFor(() => {
      expect(shkuLoadTimelineLink).toHaveAttribute("aria-current", "location");
    });
    expect(document.querySelector(".project-tab[href='#project-kyvc']")).not.toHaveAttribute("aria-current");
    expect(projectHistory.style.getPropertyValue("--project-timeline-left")).toBe("56px");
    expect(projectHistory.style.getPropertyValue("--project-timeline-top")).toBe("44px");
    expect(projectHistory.style.getPropertyValue("--project-timeline-height")).toBe("480px");
    expect(document.querySelector<HTMLElement>(".projects-section")!.style.getPropertyValue("--project-timeline-progress"))
      .not.toBe("0");
  });

  it("Hover한 Project 위치까지만 Timeline Beam 진행도를 표시", () => {
    render(<Home />);

    const projectHistory = document.querySelector<HTMLOListElement>(".project-showcases")!;
    const projectRows = Array.from(projectHistory.querySelectorAll<HTMLElement>(".project-history-row"));

    fireEvent.mouseEnter(projectRows[0]);
    expect(projectHistory.style.getPropertyValue("--project-timeline-progress")).toBe("0");

    fireEvent.mouseEnter(projectRows[1]);
    expect(projectHistory.style.getPropertyValue("--project-timeline-progress")).toBe("0.5");

    fireEvent.mouseEnter(projectRows[2]);
    expect(projectHistory.style.getPropertyValue("--project-timeline-progress")).toBe("1");

    fireEvent.mouseLeave(projectHistory);
    expect(projectHistory.style.getPropertyValue("--project-timeline-progress")).toBe("");
  });

  it("학력·주요 활동·수상·자격·교육을 독립 그룹으로 최신순 표시", () => {
    render(<Home />);

    expect(screen.getByText("소프트웨어융합전공")).toBeInTheDocument();
    expect(screen.getByText("경기경영고등학교")).toBeInTheDocument();
    expect(screen.getByText("스마트콘텐츠과")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "주요 활동" })).toBeInTheDocument();
    const activityRows = Array.from(document.querySelectorAll(".activity-row"));
    expect(activityRows[0]).toHaveTextContent("QED");
    expect(activityRows[1]).toHaveTextContent("Backend Internship");
    expect(activityRows[2]).toHaveTextContent("One Think IT's");
    expect(screen.getByText("특성화고 졸업자 네트워크")).toBeInTheDocument();
    expect(screen.getByText("성공회대학교 보안동아리")).toBeInTheDocument();
    expect(screen.getByText("현대오토에버 특성화 고교생 화이트해커 양성교육")).toBeInTheDocument();
    expect(screen.getByText("수료/입상")).toBeInTheDocument();
    expect(screen.getByText("성공회대학교 소프트웨어경진대회")).toBeInTheDocument();
    const groupHeadings = Array.from(document.querySelectorAll(".education-info-group > h3"));
    expect(groupHeadings.map((heading) => heading.textContent)).toEqual([
      "학력", "주요 활동", "수상", "자격·교육",
    ]);
    groupHeadings.forEach((heading) => expect(heading).toHaveClass("type-title"));
    const itemTitles = Array.from(document.querySelectorAll(".education-info-title"));
    expect(itemTitles.length).toBeGreaterThan(0);
    itemTitles.forEach((title) => {
      expect(title).toHaveClass("type-body-lg");
      expect(title).not.toHaveClass("type-title");
    });
    const awardRegion = screen.getByRole("region", { name: "수상" });
    const awardRows = Array.from(awardRegion.querySelectorAll(".award-row"));
    expect(awardRows[0]).toHaveTextContent("성공회대학교 소프트웨어경진대회SKHUTRack1등");
    expect(awardRows[1]).toHaveTextContent("KFIP 2026KYvCToss 특별상");
    expect(awardRows[2]).toHaveTextContent("성공회대학교 IT경진대회SKHURoad3등");
    expect(awardRows[3]).toHaveTextContent("SW·AI 교육 수기 공모전최우수상 · 과학기술정보통신부 장관상");
    expect(awardRows[4]).toHaveTextContent("Hello New() WorldNewLife대상");
    expect(awardRows).toHaveLength(5);
    expect(within(awardRegion).queryByText("현대오토에버 특성화 고교생 화이트해커 양성교육")).not.toBeInTheDocument();
    const certificateRegion = screen.getByRole("region", { name: "자격·교육" });
    const certificateRows = Array.from(certificateRegion.querySelectorAll(".certificate-row"));
    expect(certificateRows).toHaveLength(1);
    expect(certificateRows[0]).toHaveTextContent("2021현대오토에버 특성화 고교생 화이트해커 양성교육현대오토에버수료/입상");
    expect(screen.getByText("Toss 특별상")).toBeInTheDocument();
    expect(screen.getByText("최우수상 · 과학기술정보통신부 장관상")).toBeInTheDocument();
    expect(screen.getByText("SW·AI 교육 수기 공모전")).toBeInTheDocument();
    expect(screen.queryByText("신나는 SW·AI 교육 수기 공모전")).not.toBeInTheDocument();
    expect(document.querySelectorAll(".education-info-row")).toHaveLength(11);
    expect(document.querySelectorAll(".education-info-detail.type-small")).toHaveLength(10);
    expect(document.querySelectorAll(".education-info-outcome.type-small")).toHaveLength(8);
    expect(screen.queryByRole("heading", { name: "학업 성과" })).not.toBeInTheDocument();
    expect(screen.queryByText("21학점 · 4.5 / 4.5")).not.toBeInTheDocument();
    expect(screen.queryByText("학기 교내 수석")).not.toBeInTheDocument();
  });

  it("자격·교육 데이터가 없으면 해당 그룹만 비노출", () => {
    const model = mapPublicPortfolio({
      ...PUBLIC_PORTFOLIO_FIXTURE,
      profileEntries: PUBLIC_PORTFOLIO_FIXTURE.profileEntries.filter((entry) => entry.entryType !== "CERTIFICATE"),
    });
    render(<HomeView model={model} />);

    expect(screen.getByRole("heading", { name: "학력 및 성과" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "자격·교육" })).not.toBeInTheDocument();
    expect(document.querySelector(".certificates-group")).not.toBeInTheDocument();
  });

  it("실제 Contact Link를 표시", () => {
    render(<Home />);

    expect(screen.getByRole("link", { name: "test-contact@example.com" })).toHaveAttribute("href", "mailto:test-contact@example.com");
    expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute("href", "https://instagram.com/example");
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/example");
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "Portfolio Notes" })).toHaveTextContent("Portfolio Notes");
  });

  it("Footer 이력서 Action을 한글로 표시", () => {
    render(<Home />);

    expect(screen.getByText("이력서 보기")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("PDF 다운로드")).toHaveAttribute("aria-disabled", "true");
  });

  it("Footer Identity와 Copyright를 표시", () => {
    render(<Home />);

    const footer = within(screen.getByRole("contentinfo"));
    expect(footer.getByRole("heading", { name: "김현우" })).toHaveClass("type-heading");
    expect(footer.getByText("BACKEND / INFRA DEVELOPER")).toHaveClass("type-small");
    expect(footer.queryByText("BACKEND /")).not.toBeInTheDocument();
    expect(footer.getByText(PUBLIC_COPY.footer.portfolio)).toBeInTheDocument();
    expect(footer.getByText(PUBLIC_COPY.footer.copyright)).toBeInTheDocument();
  });

  it("Theme 전환 선택값을 저장", () => {
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: "색상 테마 전환" }));

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem("portfolio-theme")).toBe("light");
  });

  it("Light Theme에서 Dark Theme 전환 선택값을 저장", () => {
    document.documentElement.dataset.theme = "light";
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: "색상 테마 전환" }));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("portfolio-theme")).toBe("dark");
  });

  it("Theme Reveal 중심과 가장 먼 Viewport Corner 반경을 계산", () => {
    const reveal = calculateThemeReveal(
      { left: 880, top: 16, width: 40, height: 40 },
      1024,
      768,
    );

    expect(reveal.x).toBe(900);
    expect(reveal.y).toBe(36);
    expect(reveal.radius).toBeCloseTo(Math.hypot(900, 732), 10);
  });

  it("View Transition 지원 시 Theme Button 중심에서 새 Theme Circle을 확장", async () => {
    let themeBeforeUpdate = "";
    let themeAfterUpdate = "";
    const startViewTransition = vi.fn((updateCallback: () => void) => {
      themeBeforeUpdate = document.documentElement.dataset.theme ?? "";
      updateCallback();
      themeAfterUpdate = document.documentElement.dataset.theme ?? "";

      return {
        finished: Promise.resolve(),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition: vi.fn(),
      } as unknown as ViewTransition;
    });
    const animate = vi.fn<typeof document.documentElement.animate>(
      () => ({ finished: Promise.resolve() }) as unknown as Animation,
    );
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: startViewTransition,
    });
    Object.defineProperty(document.documentElement, "animate", {
      configurable: true,
      value: animate,
    });
    render(<Home />);

    const button = screen.getByRole("button", { name: "색상 테마 전환" });
    const buttonRect = {
      bottom: 56,
      height: 40,
      left: 880,
      right: 920,
      top: 16,
      width: 40,
      x: 880,
      y: 16,
      toJSON: () => ({}),
    };
    vi.spyOn(button, "getBoundingClientRect").mockReturnValue(buttonRect);

    fireEvent.click(button);

    await waitFor(() => {
      expect(animate).toHaveBeenCalledTimes(1);
    });
    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(themeBeforeUpdate).toBe("dark");
    expect(themeAfterUpdate).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem("portfolio-theme")).toBe("light");

    const [keyframes, options] = animate.mock.calls[0];
    const clipPaths = (keyframes as PropertyIndexedKeyframes).clipPath as string[];
    const reveal = calculateThemeReveal(buttonRect, window.innerWidth, window.innerHeight);
    const radiusMatch = clipPaths[1].match(/^circle\(([\d.]+)px at /);

    expect(reveal.x).not.toBe(window.innerWidth / 2);
    expect(clipPaths[0]).toBe(`circle(0px at ${reveal.x}px ${reveal.y}px)`);
    expect(clipPaths[1]).toContain(`at ${reveal.x}px ${reveal.y}px`);
    expect(radiusMatch).not.toBeNull();
    expect(Number.parseFloat(radiusMatch![1])).toBeCloseTo(reveal.radius, 10);
    expect(options).toMatchObject({
      duration: 520,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "both",
      pseudoElement: "::view-transition-new(root)",
    });
  });

  it("Reduced Motion에서는 View Transition 없이 Theme을 즉시 변경", () => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));
    const startViewTransition = vi.fn();
    const animate = vi.fn();
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: startViewTransition,
    });
    Object.defineProperty(document.documentElement, "animate", {
      configurable: true,
      value: animate,
    });
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: "색상 테마 전환" }));

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem("portfolio-theme")).toBe("light");
    expect(startViewTransition).not.toHaveBeenCalled();
    expect(animate).not.toHaveBeenCalled();
  });

  it("Theme Transition 완료 전 중복 클릭을 차단", async () => {
    let finishTransition: () => void = () => undefined;
    const finished = new Promise<void>((resolve) => {
      finishTransition = resolve;
    });
    const startViewTransition = vi.fn((updateCallback: () => void) => {
      updateCallback();

      return {
        finished,
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition: vi.fn(),
      } as unknown as ViewTransition;
    });
    const animate = vi.fn<typeof document.documentElement.animate>(
      () => ({ finished: Promise.resolve() }) as unknown as Animation,
    );
    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: startViewTransition,
    });
    Object.defineProperty(document.documentElement, "animate", {
      configurable: true,
      value: animate,
    });
    render(<Home />);

    const button = screen.getByRole("button", { name: "색상 테마 전환" });
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      expect(animate).toHaveBeenCalledTimes(1);
    });
    expect(startViewTransition).toHaveBeenCalledTimes(1);

    finishTransition();
    await finished;
  });

  it("System Card Pointer 위치에 따라 최대 7도 범위 Tilt를 적용하고 복원", async () => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query.includes("min-width: 1024px") || query.includes("hover: hover"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));
    render(<Home />);

    const card = document.querySelector<HTMLElement>(".service-graph");
    expect(card).not.toBeNull();
    vi.spyOn(card!, "getBoundingClientRect").mockReturnValue({
      bottom: 300,
      height: 300,
      left: 0,
      right: 400,
      top: 0,
      width: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    fireEvent.resize(window);
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

    fireEvent.pointerMove(card!, { clientX: 300, clientY: 75, pointerType: "mouse" });
    await waitFor(() => {
      expect(card!.style.getPropertyValue("--card-rotate-x")).toBe("3.5deg");
      expect(card!.style.getPropertyValue("--card-rotate-y")).toBe("3.5deg");
    });
    expect(document.querySelector<HTMLElement>(".topology-map-layer")!.style.transform).toBe("");

    fireEvent.pointerLeave(card!);
    expect(card!.style.getPropertyValue("--card-rotate-x")).toBe("0deg");
    expect(card!.style.getPropertyValue("--card-rotate-y")).toBe("0deg");
  });

  it("단일 Korea Marker가 Fine Pointer 방향으로 최대 6px와 5px 이동 후 복원", async () => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query.includes("min-width: 1024px") || query.includes("hover: hover"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));
    render(<Home />);

    const hero = document.querySelector<HTMLElement>(".hero")!;
    const card = document.querySelector<HTMLElement>(".service-graph")!;
    const stage = document.querySelector<HTMLElement>(".hero-visual-stage")!;
    vi.spyOn(card, "getBoundingClientRect").mockReturnValue({
      bottom: 300,
      height: 300,
      left: 0,
      right: 400,
      top: 0,
      width: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    fireEvent.resize(window);
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

    expect(document.querySelectorAll("[data-testid='korea-marker']")).toHaveLength(1);
    expect(document.querySelectorAll(".topology-korea-motion")).toHaveLength(1);

    fireEvent.pointerMove(hero, { clientX: 200, clientY: 150, pointerType: "mouse" });
    await waitFor(() => {
      expect(Number.parseFloat(stage.style.getPropertyValue("--marker-pointer-x"))).toBeCloseTo(0);
      expect(Number.parseFloat(stage.style.getPropertyValue("--marker-pointer-y"))).toBeCloseTo(0);
    });

    fireEvent.pointerMove(hero, { clientX: 400, clientY: 0, pointerType: "mouse" });
    await waitFor(() => {
      expect(Number.parseFloat(stage.style.getPropertyValue("--marker-pointer-x"))).toBeCloseTo(6);
      expect(Number.parseFloat(stage.style.getPropertyValue("--marker-pointer-y"))).toBeCloseTo(-5);
    });

    fireEvent.pointerLeave(hero);
    expect(stage.style.getPropertyValue("--marker-pointer-x")).toBe("0px");
    expect(stage.style.getPropertyValue("--marker-pointer-y")).toBe("0px");
  });

  it("Reduced Motion에서는 System Card Pointer Tilt를 적용하지 않음", () => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));
    render(<Home />);

    const card = document.querySelector<HTMLElement>(".service-graph");
    const stage = document.querySelector<HTMLElement>(".hero-visual-stage");
    const hero = document.querySelector<HTMLElement>(".hero");
    expect(card).not.toBeNull();
    fireEvent.pointerMove(card!, { clientX: 300, clientY: 75, pointerType: "mouse" });
    fireEvent.pointerMove(hero!, { clientX: 300, clientY: 75, pointerType: "mouse" });
    expect(card!.style.getPropertyValue("--card-rotate-x")).toBe("0deg");
    expect(card!.style.getPropertyValue("--card-rotate-y")).toBe("0deg");
    expect(stage!.style.getPropertyValue("--marker-pointer-x")).toBe("0px");
    expect(stage!.style.getPropertyValue("--marker-pointer-y")).toBe("0px");
    expect(stage).toHaveStyle({
      "--card-map-opacity": "0",
      "--focus-map-dot-width": String(MAP_DOT_SCREEN_WIDTH.focusFinal),
      "--focus-map-opacity": "1",
      "--flow-opacity": "0",
      "--frame-opacity": "0",
      "--narrative-world-map-opacity": "0",
      "--topology-opacity": "0",
      "--marker-opacity": "1",
      "--world-map-dot-width": String(MAP_DOT_SCREEN_WIDTH.worldHandoff),
    });
    document.querySelectorAll<HTMLElement>(".topology-project-gallery-frame").forEach((frame) => {
      expect(frame.style.getPropertyValue("--gallery-opacity")).toBe("0");
    });
    expect(document.querySelector(".topology-narrative-world-map-zoom")).toHaveAttribute(
      "transform",
      expect.stringContaining(`scale(${FOCUS_HANDOFF_END_SCALE})`),
    );
    expect(document.querySelector(".topology-focus-map-zoom")).toHaveAttribute(
      "transform",
      expect.stringContaining(`scale(${MOBILE_KOREA_ZOOM_SCALE})`),
    );
    expect(document.querySelector<HTMLElement>(".about-section")).toHaveStyle({
      "--about-opacity": "1",
      "--about-anchor-offset": "0px",
    });
  });
});
