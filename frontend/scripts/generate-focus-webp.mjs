import { readFileSync, writeFileSync } from "node:fs";
import { request } from "node:http";
import { join } from "node:path";
import {
  createTriangularGrid,
  extractMap,
  getOriginalGridSteps,
} from "./lite-grid.mjs";

const cdpPort = Number(process.env.P3_CDP_PORT ?? "9224");
const mapsDirectory = join(process.cwd(), "public", "maps");
const geometryPath = join(process.cwd(), "src", "app", "lite-map-lod-geometry.json");
const geometry = JSON.parse(readFileSync(geometryPath, "utf8"));
const source = readFileSync(join(mapsDirectory, "east-asia-map-dots.svg"), "utf8");
const { points: sourcePoints } = extractMap(source);
const sourceGrid = getOriginalGridSteps(sourcePoints);
const viewportCssWidth = 2560;
const viewportCssHeight = 1440;
const viewBoxWidth = 1600;
const viewBoxHeight = 900;
const presentationScale = Math.min(
  viewportCssWidth / viewBoxWidth,
  viewportCssHeight / viewBoxHeight,
);
const KOREA_ANCHOR = { lat: 37.5665, lng: 126.978 };
const EAST_ASIA_CROP = {
  lat: { min: 20, max: 58 },
  lng: { min: 92, max: 157 },
};
const EAST_ASIA_ZOOM_SCALE = 1.75;
const LITE_FINAL_FOCUS_SCALE = 1.35;
const finalLngSpan = EAST_ASIA_CROP.lng.max - EAST_ASIA_CROP.lng.min;
const finalLatSpan = EAST_ASIA_CROP.lat.max - EAST_ASIA_CROP.lat.min;
const eastAsiaFocus = {
  x: (KOREA_ANCHOR.lng - EAST_ASIA_CROP.lng.min) / finalLngSpan,
  y: (EAST_ASIA_CROP.lat.max - KOREA_ANCHOR.lat) / finalLatSpan,
};
const sourceLngSpan = finalLngSpan * EAST_ASIA_ZOOM_SCALE;
const sourceLatSpan = finalLatSpan * EAST_ASIA_ZOOM_SCALE;
const sourceLngMin = KOREA_ANCHOR.lng - eastAsiaFocus.x * sourceLngSpan;
const sourceLatMax = KOREA_ANCHOR.lat + eastAsiaFocus.y * sourceLatSpan;
const koreaSourcePoint = {
  x: ((KOREA_ANCHOR.lng - sourceLngMin) / sourceLngSpan) * viewBoxWidth,
  y: ((sourceLatMax - KOREA_ANCHOR.lat) / sourceLatSpan) * viewBoxHeight,
};
const WORLD_TO_FOCUS_SCALE = 360 / sourceLngSpan;
const FINAL_VIRTUAL_ZOOM_SCALE = WORLD_TO_FOCUS_SCALE * EAST_ASIA_ZOOM_SCALE;

const themes = [
  { suffix: "dark", color: "rgb(122 142 152)" },
  { suffix: "light", color: "rgb(64 84 96)" },
];

const stages = Object.entries(geometry).map(([key, stage]) => ({
  ...stage,
  name: key === "eastAsia" ? "east-asia" : "korea-mid",
  sourceBounds: [stage.sourceX, stage.sourceY, stage.sourceWidth, stage.sourceHeight],
}));

function calculateReferenceCameraScale(zoomProgress) {
  const virtualZoomScale = 1 + (FINAL_VIRTUAL_ZOOM_SCALE - 1) * zoomProgress;
  const focusProgress = Math.min(
    Math.max((virtualZoomScale / WORLD_TO_FOCUS_SCALE - 1) / (EAST_ASIA_ZOOM_SCALE - 1), 0),
    1,
  );

  return 1 + (LITE_FINAL_FOCUS_SCALE - 1) * focusProgress;
}

function requestJson(path, method = "GET") {
  return new Promise((resolve, reject) => {
    const client = request({
      host: "127.0.0.1",
      method,
      path,
      port: cdpPort,
    }, (response) => {
      let body = "";

      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });

    client.on("error", reject);
    client.end();
  });
}

function connectWebSocket(url) {
  const socket = new WebSocket(url);
  const pending = new Map();
  let messageId = 0;

  const ready = new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const requestEntry = pending.get(message.id);

    if (!requestEntry) return;
    pending.delete(message.id);

    if (message.error) requestEntry.reject(new Error(message.error.message));
    else requestEntry.resolve(message.result);
  });

  return {
    async send(method, params = {}) {
      await ready;
      const id = ++messageId;

      return new Promise((resolve, reject) => {
        pending.set(id, { reject, resolve });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close() {
      socket.close();
    },
  };
}

function createStageData(stage) {
  const referenceCameraScale = calculateReferenceCameraScale(stage.referenceZoomProgress);
  const sourceStepX = stage.targetScreenDotSpacing
    / (presentationScale * referenceCameraScale);
  const sourceStepY = sourceStepX * Math.sqrt(3) / 2;
  const sourcePointsForStage = createTriangularGrid(
    sourcePoints,
    stage.sourceBounds,
    {
      maxDistance: sourceGrid.x * 0.6,
      originX: koreaSourcePoint.x,
      originY: koreaSourcePoint.y,
      stepX: sourceStepX,
      stepY: sourceStepY,
    },
  );
  const strokeWidth = stage.targetScreenDotDiameter
    / (presentationScale * referenceCameraScale);
  const bitmapPixelsPerSourceUnit = stage.outputWidth / stage.sourceWidth;

  return {
    bitmapDotDiameter: strokeWidth * bitmapPixelsPerSourceUnit,
    points: sourcePointsForStage,
    referenceCameraScale,
    sourceStepX,
    sourceStepY,
    strokeWidth,
  };
}

function createSvg(stage, data, color) {
  const pathData = data.points
    .map((point) => `M${point.x} ${point.y}h0`)
    .join("");
  const [sourceX, sourceY, sourceWidth, sourceHeight] = stage.sourceBounds;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${stage.outputWidth}" height="${stage.outputHeight}" viewBox="${sourceX} ${sourceY} ${sourceWidth} ${sourceHeight}"><path d="${pathData}" fill="none" stroke="${color}" stroke-linecap="round" stroke-width="${data.strokeWidth}" opacity="0.9"/></svg>`;
}

const target = await requestJson("/json/new?about:blank", "PUT");
const cdp = connectWebSocket(target.webSocketDebuggerUrl);

try {
  await cdp.send("Page.enable");
  const frameTree = await cdp.send("Page.getFrameTree");
  const frameId = frameTree.frameTree.frame.id;
  await cdp.send("Emulation.setDefaultBackgroundColorOverride", {
    color: { a: 0, b: 0, g: 0, r: 0 },
  });

  for (const stage of stages) {
    const data = createStageData(stage);

    await cdp.send("Emulation.setDeviceMetricsOverride", {
      deviceScaleFactor: 1,
      mobile: false,
      width: stage.outputWidth,
      height: stage.outputHeight,
    });

    for (const theme of themes) {
      await cdp.send("Page.setDocumentContent", {
        frameId,
        html: createSvg(stage, data, theme.color),
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
      const screenshot = await cdp.send("Page.captureScreenshot", {
        captureBeyondViewport: true,
        clip: {
          height: stage.outputHeight,
          scale: 1,
          width: stage.outputWidth,
          x: 0,
          y: 0,
        },
        format: "webp",
        omitBackground: true,
        quality: 100,
      });
      const outputPath = join(mapsDirectory, "lite", `${stage.name}-${theme.suffix}.webp`);

      writeFileSync(outputPath, Buffer.from(screenshot.data, "base64"));
      console.log(`${stage.name}-${theme.suffix}: ${stage.outputWidth}x${stage.outputHeight}, ${data.points.length} dots, source bounds ${stage.sourceBounds.join(" ")}, reference camera ${data.referenceCameraScale.toFixed(6)}, source spacing ${data.sourceStepX.toFixed(3)}x${data.sourceStepY.toFixed(3)}, source stroke ${data.strokeWidth.toFixed(6)}, bitmap dot ${data.bitmapDotDiameter.toFixed(3)}px, ${Buffer.byteLength(screenshot.data, "base64")} bytes`);
    }
  }
} finally {
  cdp.close();
  await requestJson(`/json/close/${target.id}`).catch(() => undefined);
}
