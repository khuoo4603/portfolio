import DottedMap from "dotted-map";

export const WORLD_MAP_SIZE = {
  width: 800,
  height: 400,
} as const;

export const KOREA_ANCHOR = {
  lat: 37.5665,
  lng: 126.978,
} as const;

export const EAST_ASIA_CROP = {
  lat: { min: 20, max: 58 },
  lng: { min: 92, max: 157 },
} as const;

export const EAST_ASIA_ZOOM_SCALE = 1.75;

export const EAST_ASIA_MAP_SIZE = {
  width: 1600,
  height: 900,
} as const;

type GeoPoint = {
  lat: number;
  lng: number;
};

type GeoRegion = {
  lat: { min: number; max: number };
  lng: { min: number; max: number };
};

// 단일 Equirectangular 좌표계 기반 위도·경도 투영
export function projectPoint({ lat, lng }: GeoPoint) {
  return {
    x: (lng + 180) * (WORLD_MAP_SIZE.width / 360),
    y: (90 - lat) * (WORLD_MAP_SIZE.height / 180),
  };
}

const finalLngSpan = EAST_ASIA_CROP.lng.max - EAST_ASIA_CROP.lng.min;
const finalLatSpan = EAST_ASIA_CROP.lat.max - EAST_ASIA_CROP.lat.min;

export const EAST_ASIA_FOCUS = {
  x: (KOREA_ANCHOR.lng - EAST_ASIA_CROP.lng.min) / finalLngSpan,
  y: (EAST_ASIA_CROP.lat.max - KOREA_ANCHOR.lat) / finalLatSpan,
} as const;

// 최종 Crop의 대한민국 상대 위치를 유지한 Regional Source Crop 계산
function calculateEastAsiaSourceCrop(): GeoRegion {
  const sourceLngSpan = finalLngSpan * EAST_ASIA_ZOOM_SCALE;
  const sourceLatSpan = finalLatSpan * EAST_ASIA_ZOOM_SCALE;
  const lngMin = KOREA_ANCHOR.lng - EAST_ASIA_FOCUS.x * sourceLngSpan;
  const latMax = KOREA_ANCHOR.lat + EAST_ASIA_FOCUS.y * sourceLatSpan;

  return {
    lat: {
      min: latMax - sourceLatSpan,
      max: latMax,
    },
    lng: {
      min: lngMin,
      max: lngMin + sourceLngSpan,
    },
  };
}

export const EAST_ASIA_SOURCE_CROP = calculateEastAsiaSourceCrop();

// East Asia Source Crop 전용 Equirectangular 좌표 투영
export function projectEastAsiaPoint({ lat, lng }: GeoPoint) {
  return {
    x: ((lng - EAST_ASIA_SOURCE_CROP.lng.min)
      / (EAST_ASIA_SOURCE_CROP.lng.max - EAST_ASIA_SOURCE_CROP.lng.min))
      * EAST_ASIA_MAP_SIZE.width,
    y: ((EAST_ASIA_SOURCE_CROP.lat.max - lat)
      / (EAST_ASIA_SOURCE_CROP.lat.max - EAST_ASIA_SOURCE_CROP.lat.min))
      * EAST_ASIA_MAP_SIZE.height,
  };
}

export const EAST_ASIA_FOCUS_POINT = projectEastAsiaPoint(KOREA_ANCHOR);

export const WORLD_MAP_GRID_HEIGHT = 280;

const map = new DottedMap({
  height: WORLD_MAP_GRID_HEIGHT,
  grid: "diagonal",
  projection: { name: "equirectangular" },
  region: {
    lat: { min: -90, max: 90 },
    lng: { min: -180, max: 180 },
  },
});

const gridSize = {
  width: WORLD_MAP_GRID_HEIGHT * 2,
  height: WORLD_MAP_GRID_HEIGHT,
} as const;

const mapPoints = map.getPoints();

export const WORLD_MAP_DOT_COUNT = mapPoints.length;

const dotPath = mapPoints
  .map((point) => {
    const x = (point.x / gridSize.width) * WORLD_MAP_SIZE.width;
    const y = (point.y / gridSize.height) * WORLD_MAP_SIZE.height;

    return `M${x.toFixed(2)} ${y.toFixed(2)}h0`;
  })
  .join("");

export const EAST_ASIA_GRID_HEIGHT = 240;
export const EAST_ASIA_GRID_WIDTH = Math.round(
  EAST_ASIA_GRID_HEIGHT * (EAST_ASIA_MAP_SIZE.width / EAST_ASIA_MAP_SIZE.height),
);

const eastAsiaMap = new DottedMap({
  height: EAST_ASIA_GRID_HEIGHT,
  width: EAST_ASIA_GRID_WIDTH,
  grid: "diagonal",
  projection: { name: "equirectangular" },
  region: EAST_ASIA_SOURCE_CROP,
});

const eastAsiaMapPoints = eastAsiaMap.getPoints();

export const EAST_ASIA_DOT_COUNT = eastAsiaMapPoints.length;

// dotted-map Region-local 격자 좌표의 Focus ViewBox 정규화
const eastAsiaDotPath = eastAsiaMapPoints
  .map((point) => {
    const x = (point.x / EAST_ASIA_GRID_WIDTH) * EAST_ASIA_MAP_SIZE.width;
    const y = (point.y / EAST_ASIA_GRID_HEIGHT) * EAST_ASIA_MAP_SIZE.height;

    return `M${x.toFixed(2)} ${y.toFixed(2)}h0`;
  })
  .join("");

// Aceternity 계열의 실제 대륙 Dot Field 지도
export default function HeroWorldMap() {
  return (
    <svg
      aria-hidden="true"
      className="topology-map-svg"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="geometricPrecision"
      viewBox={`0 0 ${WORLD_MAP_SIZE.width} ${WORLD_MAP_SIZE.height}`}
    >
      <g className="topology-map-zoom">
        <path className="topology-map-dots" d={dotPath} />
      </g>
    </svg>
  );
}

// Hero Scroll Narrative Full Stage 전용 World Map
export function HeroNarrativeWorldMap() {
  return (
    <svg
      aria-hidden="true"
      className="topology-narrative-world-map-svg"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="geometricPrecision"
      viewBox={`0 0 ${WORLD_MAP_SIZE.width} ${WORLD_MAP_SIZE.height}`}
    >
      <g className="topology-narrative-world-map-zoom">
        <path className="topology-narrative-world-map-dots" d={dotPath} />
      </g>
    </svg>
  );
}

// Korea Zoom 후반부 LOD 전환 전용 East Asia Regional Map
export function HeroEastAsiaMap() {
  return (
    <svg
      aria-hidden="true"
      className="topology-focus-map-svg"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="geometricPrecision"
      viewBox={`0 0 ${EAST_ASIA_MAP_SIZE.width} ${EAST_ASIA_MAP_SIZE.height}`}
    >
      <g className="topology-focus-map-zoom">
        <path className="topology-focus-map-dots" d={eastAsiaDotPath} />
      </g>
    </svg>
  );
}
