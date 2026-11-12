import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateDotHeight,
  createDotGrid,
  NotFoundScene,
  projectDot,
} from "./not-found-scene";

const canvasContext = {
  arc: vi.fn(),
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  fill: vi.fn(),
  setTransform: vi.fn(),
};

function motionMedia(matches: boolean): MediaQueryList {
  return {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;
}

describe("NotFoundScene", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      canvasContext as unknown as CanvasRenderingContext2D,
    );
    vi.stubGlobal("matchMedia", vi.fn(() => motionMedia(false)));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    canvasContext.arc.mockReset();
    canvasContext.beginPath.mockReset();
    canvasContext.clearRect.mockReset();
    canvasContext.fill.mockReset();
    canvasContext.setTransform.mockReset();
  });

  it("Perspective X축과 깊이 보정 Y 배치 및 시간 기반 높이 계산 유지", () => {
    const viewport = { width: 1000, height: 700 };
    const near = projectDot({ x: 0.5, z: 0.4, y: 0 }, viewport);
    const far = projectDot({ x: 0.5, z: 1.4, y: 0 }, viewport);
    const distant = projectDot({ x: 0.5, z: 5.96, y: 0 }, viewport);

    expect(near.scale).toBeGreaterThan(far.scale);
    expect(far.scale).toBeGreaterThan(distant.scale);
    expect(near.x).toBeGreaterThan(far.x);
    expect(near.y).toBeGreaterThan(far.y);
    expect(near.radius).toBeGreaterThan(far.radius);
    expect(near.radius).toBeGreaterThan(3);
    expect(far.radius).toBeGreaterThan(distant.radius);
    expect(near.radius).toBeGreaterThan(10);
    expect(far.radius).toBeGreaterThan(5);
    expect(distant.radius).toBeLessThan(1.2);
    expect(near.x).toBeGreaterThan(near.radius);
    expect(near.y + near.radius).toBeLessThan(viewport.height);
    expect(calculateDotHeight(0.4, 0.8, 0)).not.toBe(calculateDotHeight(0.4, 0.8, 1000));
  });

  it("국소 봉우리와 골짜기가 서로 다른 높이로 연결된 2D Surface를 계산", () => {
    const heights = [
      calculateDotHeight(-1.7, 0.95, 0),
      calculateDotHeight(1.6, 1.95, 0),
      calculateDotHeight(-0.6, 2.6, 0),
      calculateDotHeight(0.35, 4.1, 0),
      calculateDotHeight(-0.85, 5.05, 0),
    ];
    const rowHeights = [-2, -1, 0, 1, 2].map((x) => calculateDotHeight(x, 2.6, 0));
    const nearSlope = calculateDotHeight(2.7, 0.38, 0);
    const farSlope = calculateDotHeight(2.7, 5.96, 0);

    expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(0.03);
    expect(Math.max(...rowHeights) - Math.min(...rowHeights)).toBeGreaterThan(0.01);
    expect(nearSlope).toBeGreaterThan(farSlope);
    expect(calculateDotHeight(1.6, 1.95, 0)).not.toBe(calculateDotHeight(1.6, 1.95, 1000));
  });

  it("봉우리 주변의 높이 감소와 골짜기 및 완만한 높이 제한을 유지", () => {
    const peak = calculateDotHeight(1.6, 1.95, 0);
    const peakShoulder = calculateDotHeight(2.3, 1.95, 0);
    const secondPeak = calculateDotHeight(-0.6, 2.6, 0);
    const valley = calculateDotHeight(0.9, 3, 0);

    expect(peak).toBeGreaterThan(0);
    expect(peak).toBeGreaterThan(peakShoulder);
    expect(secondPeak).toBeGreaterThan(valley);
    expect(valley).toBeLessThan(0);
    expect(peak).toBeLessThan(0.3);
    expect(valley).toBeGreaterThan(-0.22);
    expect(peak).not.toBe(secondPeak);
  });

  it("왼쪽 25% 기준 투영과 안정적인 엇갈림 Grid 유지", () => {
    const viewport = { width: 1000, height: 700 };
    const center = projectDot({ x: 0, z: 2, y: 0 }, viewport);
    const firstGrid = createDotGrid(1000);
    const secondGrid = createDotGrid(1000);

    expect(center.x).toBeCloseTo(viewport.width * 0.25, 5);
    expect(firstGrid).toEqual(secondGrid);
    expect(firstGrid).toHaveLength(20 * 18);
    const columns = 18;
    const xRange = 4.75 - (-1.75);
    const xStep = firstGrid[1].x - firstGrid[0].x;
    const zStep = 5.58 / (20 - 1);

    expect(firstGrid[columns].x).toBeCloseTo(firstGrid[0].x, 8);
    expect(firstGrid[columns].z - firstGrid[0].z).toBeCloseTo(zStep, 8);
    expect(firstGrid[columns + 1].x - firstGrid[columns].x).toBeCloseTo(xStep, 8);
    expect(firstGrid[columns + 1].z).toBeCloseTo(firstGrid[columns].z, 8);
    const farRowStart = columns * 19;
    const farRowSpacing = (xRange - xStep) / (columns - 1);
    expect(firstGrid[farRowStart].x).toBeGreaterThan(firstGrid[0].x);
    expect(firstGrid[farRowStart + 1].x - firstGrid[farRowStart].x).toBeCloseTo(farRowSpacing, 8);
  });

  it("Canvas 2D 실패 없이 정적 Floor를 그린 뒤 RAF를 정리", () => {
    const frame = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(17);
    const cancel = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);

    render(<NotFoundScene />);

    expect(canvasContext.setTransform).toHaveBeenCalled();
    expect(canvasContext.beginPath).toHaveBeenCalled();
    expect(canvasContext.arc).toHaveBeenCalled();
    expect(canvasContext.fill).toHaveBeenCalled();
    expect(frame).toHaveBeenCalled();

    cleanup();

    expect(cancel).toHaveBeenCalledWith(17);
  });

  it("reduced motion에서는 RAF 없이 정적 Floor만 유지", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => motionMedia(true)));
    const frame = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(17);

    render(<NotFoundScene />);

    expect(canvasContext.fill).toHaveBeenCalled();
    expect(frame).not.toHaveBeenCalled();
  });

  it("Resize 이벤트에서 Canvas 해상도와 Floor를 다시 계산", () => {
    const { container } = render(<NotFoundScene />);
    const canvas = container.querySelector("canvas");

    expect(canvas).toBeInTheDocument();
    fireEvent(window, new Event("resize"));

    expect(canvasContext.setTransform).toHaveBeenCalledTimes(2);
    expect(canvasContext.clearRect).toHaveBeenCalledTimes(2);
  });
});
