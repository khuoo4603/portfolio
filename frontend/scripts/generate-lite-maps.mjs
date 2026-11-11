import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  createTriangularGrid,
  extractMap,
  getOriginalGridSteps,
} from "./lite-grid.mjs";

const mapsDirectory = join(process.cwd(), "public", "maps");
const WORLD_MAP_WIDTH = 800;
const KOREA_LONGITUDE = 126.978;
const koreaX = ((KOREA_LONGITUDE + 180) / 360) * WORLD_MAP_WIDTH;
const koreaCenterOffsetX = WORLD_MAP_WIDTH / 2 - koreaX;

const mapDefinitions = [
  {
    fullFile: "world-map-dots.svg",
    liteFile: "world-map-dots-lite.svg",
    pathId: "world-map-dots-lite",
  },
  {
    fullFile: "east-asia-map-dots.svg",
    liteFile: "east-asia-map-dots-lite.svg",
    pathId: "east-asia-map-dots-lite",
  },
  {
    fullFile: "world-map-dots.svg",
    liteFile: "world-map-dots-lite-korea-centered.svg",
    pathId: "world-map-dots-lite-korea-centered",
    transformPoint: (point) => ({
      ...point,
      x: ((point.x + koreaCenterOffsetX) % WORLD_MAP_WIDTH + WORLD_MAP_WIDTH) % WORLD_MAP_WIDTH,
    }),
  },
];

function formatCoordinate(value) {
  return Number(value.toFixed(3));
}

function createLiteMap(definition) {
  const source = readFileSync(join(mapsDirectory, definition.fullFile), "utf8");
  const { header, points, viewBox, bounds } = extractMap(source);
  const sourceGrid = getOriginalGridSteps(points);
  const targetStepX = sourceGrid.x * Math.SQRT2;
  const targetStepY = targetStepX * Math.sqrt(3) / 2;
  const selectedPoints = createTriangularGrid(points, bounds, {
    maxDistance: sourceGrid.x * 0.6,
    stepX: targetStepX,
    stepY: targetStepY,
  });
  const liteHeader = header
    .replace(/data-dot-count="\d+"/, `data-dot-count="${selectedPoints.length}"`);
  const path = selectedPoints.map((point) => {
    const transformed = definition.transformPoint?.(point) ?? point;

    return `M${formatCoordinate(transformed.x)} ${formatCoordinate(transformed.y)}h0`;
  }).join("");
  const output = `${liteHeader}\n<path id="${definition.pathId}" d="${path}" />\n</svg>\n`;
  writeFileSync(join(mapsDirectory, definition.liteFile), output, "utf8");

  return { file: definition.liteFile, count: selectedPoints.length, viewBox };
}

for (const definition of mapDefinitions) {
  const result = createLiteMap(definition);
  console.log(`${result.file}: ${result.count} points, viewBox ${result.viewBox}`);
}
