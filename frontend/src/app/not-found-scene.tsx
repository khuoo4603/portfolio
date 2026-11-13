"use client";

import { useEffect, useRef } from "react";

export type DotPoint3D = {
  x: number;
  z: number;
};

export type DotPointWithHeight = DotPoint3D & {
  y: number;
};

export type DotViewport = {
  width: number;
  height: number;
};

export type ProjectedDot = {
  x: number;
  y: number;
  scale: number;
  radius: number;
};

const FLOOR_ROWS = 20;
const PREVIOUS_MIN_GRID_COLUMNS = 18;
const PREVIOUS_MAX_GRID_COLUMNS = 51;
const GRID_COLUMN_RATIO = 0.625;
const FLOOR_X_MIN = -1.75;
const FLOOR_X_MAX = 4.75;
const NEAR_ROW_STAGGER_CUTOFF = 0.42;
const FULL_STAGGER_START = 0.72;
const FLOOR_NEAR_Z = 0.38;
const FLOOR_ROW_STEP = 5.58 / (FLOOR_ROWS - 1);
const FLOOR_FAR_Z = FLOOR_NEAR_Z + (FLOOR_ROWS - 1) * FLOOR_ROW_STEP;
const SURFACE_HEIGHT_RANGE = 0.24;
const SURFACE_DEPTH_RANGE = 0.2;
const SURFACE_SLOPE = -0.025;
const NEAR_HEIGHT_FACTOR = 0.25;
const NEAR_HEIGHT_RECOVERY_Z = 2.5;
const TERRAIN_AMPLITUDE_SCALE = 0.82;
const LOCAL_COLOR_HEIGHT_SCALE = 0.035;
const NEAR_BRIGHTNESS = 245;
const FAR_BRIGHTNESS = 110;
const FAR_DARKENING_START = 0.25;
const FAR_DARKENING_END = 0.95;
const FAR_DARKENING = 35;
const LEFT_DEPTH_SPREAD = 0.04;
const MAX_DEVICE_PIXEL_RATIO = 2;
const INITIAL_SURFACE_TIME = 12000;

type SurfaceBump = {
  centerX: number;
  centerZ: number;
  amplitude: number;
  sigmaX: number;
  sigmaZ: number;
  phase: number;
  frequency: number;
};

const SURFACE_BUMPS: SurfaceBump[] = [
  { centerX: -1.7, centerZ: 0.95, amplitude: 0.135, sigmaX: 0.58, sigmaZ: 0.55, phase: 0.2, frequency: 0.82 },
  { centerX: 0.45, centerZ: 1.35, amplitude: -0.1, sigmaX: 0.72, sigmaZ: 0.62, phase: 1.4, frequency: 1.17 },
  { centerX: 1.6, centerZ: 1.95, amplitude: 0.16, sigmaX: 0.65, sigmaZ: 0.6, phase: 2.7, frequency: 0.68 },
  { centerX: -0.6, centerZ: 2.6, amplitude: 0.13, sigmaX: 0.85, sigmaZ: 0.68, phase: 0.5, frequency: 1.35 },
  { centerX: 0.9, centerZ: 3, amplitude: -0.11, sigmaX: 0.72, sigmaZ: 0.68, phase: 3.3, frequency: 0.93 },
  { centerX: -1.75, centerZ: 3.55, amplitude: 0.15, sigmaX: 0.82, sigmaZ: 0.7, phase: 4, frequency: 0.76 },
  { centerX: 0.35, centerZ: 4.1, amplitude: 0.11, sigmaX: 0.7, sigmaZ: 0.75, phase: 1.9, frequency: 1.25 },
  { centerX: 1.9, centerZ: 4.7, amplitude: -0.1, sigmaX: 0.75, sigmaZ: 0.7, phase: 5.1, frequency: 0.64 },
  { centerX: -0.85, centerZ: 5.05, amplitude: 0.13, sigmaX: 0.9, sigmaZ: 0.78, phase: 2.2, frequency: 1.08 },
  { centerX: 0.9, centerZ: 5.55, amplitude: 0.1, sigmaX: 0.8, sigmaZ: 0.68, phase: 3.7, frequency: 0.88 },
];

// 기존 Grid 대비 절반 밀도의 고정된 x/z Floor 점 배열 생성
export function createDotGrid(width: number): DotPoint3D[] {
  const previousColumns = Math.max(
    PREVIOUS_MIN_GRID_COLUMNS,
    Math.min(PREVIOUS_MAX_GRID_COLUMNS, Math.ceil(width / 36.3)),
  );
  const columns = Math.round(previousColumns * GRID_COLUMN_RATIO);
  const xRange = FLOOR_X_MAX - FLOOR_X_MIN;
  const evenSpacing = xRange / Math.max(1, columns - 1);
  const points: DotPoint3D[] = [];

  for (let row = 0; row < FLOOR_ROWS; row += 1) {
    const z = FLOOR_NEAR_Z + row * FLOOR_ROW_STEP;
    const staggeredRow = row % 2 === 1;
    const rowProgress = row / Math.max(1, FLOOR_ROWS - 1);
    const staggerProgress = rowProgress <= NEAR_ROW_STAGGER_CUTOFF
      ? 0
      : rowProgress >= FULL_STAGGER_START
        ? 1
        : (rowProgress - NEAR_ROW_STAGGER_CUTOFF)
          / (FULL_STAGGER_START - NEAR_ROW_STAGGER_CUTOFF);
    const staggerStrength = staggeredRow ? 0.5 * staggerProgress : 0;
    const staggerOffset = evenSpacing * staggerStrength;
    const rowStart = FLOOR_X_MIN + staggerOffset;
    const rowEnd = FLOOR_X_MAX - staggerOffset;
    const rowSpacing = (rowEnd - rowStart) / Math.max(1, columns - 1);

    for (let column = 0; column < columns; column += 1) {
      const x = staggeredRow
        ? rowStart + column * rowSpacing
        : FLOOR_X_MIN + column * evenSpacing;
      points.push({ x, z });
    }
  }

  return points;
}

// X/Z 양방향으로 국소 지형 범위를 제한하는 2D Gaussian 계산
function gaussian2D(x: number, z: number, bump: SurfaceBump): number {
  const horizontalDistance = (x - bump.centerX) / bump.sigmaX;
  const depthDistance = (z - bump.centerZ) / bump.sigmaZ;
  return Math.exp(-0.5 * (horizontalDistance * horizontalDistance + depthDistance * depthDistance));
}

// 봉우리별 고정 위치와 독립적인 높이 Envelope를 결합한 지형 요소 계산
function gaussianBump(
  x: number,
  z: number,
  bump: SurfaceBump,
  surfaceTime: number,
): number {
  const cycle = 0.5 - 0.5 * Math.cos(surfaceTime * bump.frequency + bump.phase);
  const heightEnvelope = bump.amplitude >= 0
    ? -0.45 + 1.45 * cycle
    : 0.12 + 0.88 * cycle;

  return bump.amplitude * gaussian2D(x, z, bump) * heightEnvelope;
}

// 진행형 전체 Wave 없이 국소 봉우리와 골짜기만 시간에 따라 변화시키는 높이 계산
function calculateLocalTerrainHeight(x: number, z: number, time: number): number {
  const surfaceTime = time * 0.00056;
  const localizedSurface = SURFACE_BUMPS.reduce(
    (height, bump) => height + gaussianBump(x, z, bump, surfaceTime),
    0,
  );
  const limitedHeight = localizedSurface >= 0
    ? SURFACE_HEIGHT_RANGE * Math.tanh(localizedSurface / SURFACE_HEIGHT_RANGE)
    : -SURFACE_DEPTH_RANGE * Math.tanh(-localizedSurface / SURFACE_DEPTH_RANGE);
  const progress = Math.max(
    0,
    Math.min(1, (z - FLOOR_NEAR_Z) / (NEAR_HEIGHT_RECOVERY_Z - FLOOR_NEAR_Z)),
  );
  const smoothProgress = progress * progress * (3 - 2 * progress);
  const depthHeightFactor = NEAR_HEIGHT_FACTOR
    + (1 - NEAR_HEIGHT_FACTOR) * smoothProgress;

  return limitedHeight * depthHeightFactor * TERRAIN_AMPLITUDE_SCALE;
}

// 국소 지형 높이에 깊이 방향 경사를 합산한 최종 높이 계산
export function calculateDotHeight(x: number, z: number, time: number): number {
  const localHeight = calculateLocalTerrainHeight(x, z, time);
  return localHeight + SURFACE_SLOPE * (z - FLOOR_NEAR_Z);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// 거리 우선 명도와 경사를 제외한 국소 Relief 보정을 합산한 Grayscale 계산
function calculateDotBrightness(z: number, localHeight: number): number {
  const depthProgress = clamp01((z - FLOOR_NEAR_Z) / (FLOOR_FAR_Z - FLOOR_NEAR_Z));
  const distanceFactor = Math.pow(depthProgress, 0.85);
  const distanceBrightness = NEAR_BRIGHTNESS
    - distanceFactor * (NEAR_BRIGHTNESS - FAR_BRIGHTNESS);
  const farProgress = clamp01(
    (depthProgress - FAR_DARKENING_START) / (FAR_DARKENING_END - FAR_DARKENING_START),
  );
  const smoothFarProgress = farProgress * farProgress * (3 - 2 * farProgress);
  const adjustedDistanceBrightness = distanceBrightness - FAR_DARKENING * smoothFarProgress;
  const normalizedRelief = Math.max(
    -1,
    Math.min(1, localHeight / LOCAL_COLOR_HEIGHT_SCALE),
  );
  const heightBrightness = normalizedRelief >= 0
    ? normalizedRelief * 28
    : normalizedRelief * 42;

  return Math.round(Math.max(45, Math.min(255, adjustedDistanceBrightness + heightBrightness)));
}

// 기존 Perspective 투영과 깊이 방향 Y 보정을 결합한 Floor Projection
export function projectDot(point: DotPointWithHeight, viewport: DotViewport): ProjectedDot {
  const depth = point.z + 0.92;
  const focalLength = Math.max(viewport.width * 1.1, viewport.height * 1.2, 420);
  const scale = focalLength / depth;
  const horizon = viewport.height * 0.26;
  const floorOffset = 0.22;
  const projectedX = viewport.width * 0.25 + point.x * scale;
  const horizontalProgress = clamp01(
    (projectedX / viewport.width - 0.12) / 0.2,
  );
  const smoothHorizontal = horizontalProgress
    * horizontalProgress
    * (3 - 2 * horizontalProgress);
  const leftWeight = 1 - smoothHorizontal;
  const depthProgress = clamp01(
    (point.z - FLOOR_NEAR_Z) / (FLOOR_FAR_Z - FLOOR_NEAR_Z),
  );
  const spreadShape = Math.sin(Math.PI * depthProgress);
  const leftYCorrection = -viewport.height
    * LEFT_DEPTH_SPREAD
    * leftWeight
    * spreadShape;
  const baseProjectedY = horizon + floorOffset * scale - point.y * scale;
  const projectedY = baseProjectedY + leftYCorrection;
  const nearProgress = clamp01(
    (FLOOR_FAR_Z - point.z) / (FLOOR_FAR_Z - FLOOR_NEAR_Z),
  );
  const radius = Math.min(14, 0.85 + Math.pow(nearProgress, 2.2) * 12);

  return {
    x: projectedX,
    y: projectedY,
    scale,
    radius,
  };
}

function drawFloor(
  context: CanvasRenderingContext2D,
  viewport: DotViewport,
  points: DotPoint3D[],
  time: number,
) {
  context.clearRect(0, 0, viewport.width, viewport.height);

  // 불투명 도트 겹침 시 가까운 점을 전면에 두는 원거리 우선 렌더링
  for (let index = points.length - 1; index >= 0; index -= 1) {
    const point = points[index];
    const localHeight = calculateLocalTerrainHeight(point.x, point.z, time);
    const terrainHeight = localHeight + SURFACE_SLOPE * (point.z - FLOOR_NEAR_Z);
    const projected = projectDot({
      ...point,
      y: terrainHeight,
    }, viewport);
    if (
      projected.x < -projected.radius
      || projected.x > viewport.width + projected.radius
      || projected.y < -projected.radius
      || projected.y > viewport.height + projected.radius
    ) {
      continue;
    }

    context.beginPath();
    const shade = calculateDotBrightness(point.z, localHeight);
    context.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
    context.arc(projected.x, projected.y, projected.radius, 0, Math.PI * 2);
    context.fill();
  }
}

// 공통 오류 Scene의 점 Floor 수명주기와 모션 제어
export function NotFoundScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    let context: CanvasRenderingContext2D | null = null;
    try {
      context = canvas.getContext("2d");
    } catch {
      return undefined;
    }

    if (!context) {
      return undefined;
    }

    const canvasContext = context;
    let viewport: DotViewport = { width: 1, height: 1 };
    let points: DotPoint3D[] = [];
    let animationFrame: number | null = null;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(bounds.width || window.innerWidth || 1));
      const height = Math.max(1, Math.floor(bounds.height || window.innerHeight || 1));
      const devicePixelRatio = Math.min(Math.max(window.devicePixelRatio || 1, 1), MAX_DEVICE_PIXEL_RATIO);

      viewport = { width, height };
      points = createDotGrid(width);
      canvas.width = Math.floor(width * devicePixelRatio);
      canvas.height = Math.floor(height * devicePixelRatio);
      canvasContext.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      drawFloor(canvasContext, viewport, points, INITIAL_SURFACE_TIME);
    };

    const scheduleFrame = () => {
      if (
        reducedMotion
        || animationFrame !== null
        || document.visibilityState === "hidden"
        || typeof window.requestAnimationFrame !== "function"
      ) {
        return;
      }

      animationFrame = window.requestAnimationFrame(render);
    };

    const render = (time: number) => {
      animationFrame = null;
      if (document.visibilityState === "hidden") {
        return;
      }

      drawFloor(canvasContext, viewport, points, INITIAL_SURFACE_TIME + time);
      scheduleFrame();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        scheduleFrame();
      }
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    scheduleFrame();

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="error-scene-floor not-found-floor" aria-hidden="true" />;
}

export default NotFoundScene;
