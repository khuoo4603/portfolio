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

export const MOBILE_KOREA_CROP = {
  lat: { min: 16, max: 59 },
  lng: { min: 116, max: 138 },
} as const;

export const EAST_ASIA_ZOOM_SCALE = 1.75;

export const EAST_ASIA_MAP_SIZE = {
  width: 1600,
  height: 900,
} as const;

export const EAST_ASIA_VIEWBOX = {
  x: 0,
  y: 0,
  ...EAST_ASIA_MAP_SIZE,
} as const;

type GeoPoint = {
  lat: number;
  lng: number;
};

type GeoRegion = {
  lat: { min: number; max: number };
  lng: { min: number; max: number };
};

export type MapViewBox = {
  height: number;
  width: number;
  x: number;
  y: number;
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

const TABLET_PORTRAIT_MAP_ASPECT = 4 / 5;
const tabletPortraitViewBoxWidth = EAST_ASIA_MAP_SIZE.height * TABLET_PORTRAIT_MAP_ASPECT;

// Tablet Portrait의 세로 Stage와 대한민국 중심을 함께 유지하는 Camera 영역
export const TABLET_PORTRAIT_KOREA_VIEWBOX: MapViewBox = {
  x: EAST_ASIA_FOCUS_POINT.x - tabletPortraitViewBoxWidth / 2,
  y: 0,
  width: tabletPortraitViewBoxWidth,
  height: EAST_ASIA_MAP_SIZE.height,
};

// 지리 범위를 East Asia Asset ViewBox로 변환
function calculateEastAsiaViewBox(region: GeoRegion): MapViewBox {
  const topLeft = projectEastAsiaPoint({
    lat: region.lat.max,
    lng: region.lng.min,
  });
  const bottomRight = projectEastAsiaPoint({
    lat: region.lat.min,
    lng: region.lng.max,
  });

  return {
    x: topLeft.x,
    y: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };
}

export const MOBILE_KOREA_VIEWBOX = calculateEastAsiaViewBox(MOBILE_KOREA_CROP);

// 현재 Camera ViewBox 내부의 대한민국 상대 좌표 계산
export function calculateEastAsiaFocusRatio(viewBox: MapViewBox) {
  return {
    x: (EAST_ASIA_FOCUS_POINT.x - viewBox.x) / viewBox.width,
    y: (EAST_ASIA_FOCUS_POINT.y - viewBox.y) / viewBox.height,
  };
}

// SVG viewBox Attribute 전용 좌표 문자열 구성
export function formatMapViewBox(viewBox: MapViewBox) {
  return [viewBox.x, viewBox.y, viewBox.width, viewBox.height].join(" ");
}

export const WORLD_MAP_GRID_HEIGHT = 280;
export const WORLD_MAP_DOT_COUNT = 54643;
const WORLD_MAP_DOT_ASSET = "/maps/world-map-dots.svg#world-map-dots";

export const EAST_ASIA_GRID_HEIGHT = 240;
export const EAST_ASIA_GRID_WIDTH = Math.round(
  EAST_ASIA_GRID_HEIGHT * (EAST_ASIA_MAP_SIZE.width / EAST_ASIA_MAP_SIZE.height),
);

export const EAST_ASIA_DOT_COUNT = 64775;
const EAST_ASIA_DOT_ASSET = "/maps/east-asia-map-dots.svg#east-asia-map-dots";

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
        <use
          className="topology-map-dots"
          data-dot-count={WORLD_MAP_DOT_COUNT}
          href={WORLD_MAP_DOT_ASSET}
        />
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
        <use
          className="topology-narrative-world-map-dots"
          data-dot-count={WORLD_MAP_DOT_COUNT}
          href={WORLD_MAP_DOT_ASSET}
        />
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
      viewBox={formatMapViewBox(EAST_ASIA_VIEWBOX)}
    >
      <g className="topology-focus-map-zoom">
        <use
          className="topology-focus-map-dots"
          data-dot-count={EAST_ASIA_DOT_COUNT}
          href={EAST_ASIA_DOT_ASSET}
        />
      </g>
    </svg>
  );
}
