"use client";

import { useEffect, useRef } from "react";

type NetworkParticle = {
  x: number;
  y: number;
  z: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  sizeVariance: number;
  phase: number;
  tone: number;
};

type ProjectedParticle = {
  x: number;
  y: number;
  z: number;
  radius: number;
  opacity: number;
  tone: number;
  cellX: number;
  cellY: number;
};

type IdleWindow = Window & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const DEPTH_THRESHOLD = 0.26;
const MAX_CONNECTION_DISTANCE_MULTIPLIER = 1.1;

// Hero 전체에서 생성과 해체를 반복하는 Canvas Network Cluster 배경
export default function HeroNetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || typeof ResizeObserver === "undefined") {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const root = document.documentElement;
    const idleWindow = window as IdleWindow;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const particles: NetworkParticle[] = [];
    const projectedParticles: ProjectedParticle[] = [];
    const spatialCells: number[][] = [];
    let candidateMarks = new Uint32Array(0);
    let candidateGeneration = 0;
    let connectionCounts = new Uint8Array(0);
    let connectionLimits = new Uint8Array(0);
    let width = 0;
    let height = 0;
    let frameId = 0;
    let idleCallbackId = 0;
    let startupTimeoutId = 0;
    let lastTime = performance.now();
    let isVisible = !document.hidden;
    let isIntersecting = true;
    let isReducedMotion = motionQuery.matches;
    let isDark = root.dataset.theme !== "light";
    let continuousAnimationReady = false;
    let particleColors = ["", "", ""];
    let connectionColor = "";
    let gridColumns = 0;
    let gridRows = 0;
    let gridMinX = 0;
    let gridMinY = 0;

    // Theme 변경 시 Canvas 색상과 명암 상태 일괄 갱신
    const readColors = () => {
      const canvasStyles = getComputedStyle(canvas);
      const rootStyles = getComputedStyle(root);

      particleColors = [canvasStyles.color, canvasStyles.borderTopColor, canvasStyles.outlineColor];
      connectionColor = canvasStyles.borderTopColor;
      isDark = rootStyles.colorScheme === "dark";
    };

    // Viewport 구간별 가독성과 Rendering 비용을 고려한 Particle 밀도
    const getTargetCount = (canvasWidth: number, canvasHeight: number) => {
      const area = canvasWidth * canvasHeight;

      if (canvasWidth < 768) {
        return Math.min(56, Math.max(38, Math.round(area / 7600)));
      }

      if (canvasWidth < 1024) {
        return Math.min(84, Math.max(60, Math.round(area / 8800)));
      }

      if (canvasWidth < 1440) {
        return Math.min(160, Math.max(120, Math.round(area / 7200)));
      }

      return Math.min(170, Math.max(135, Math.round(area / 7600)));
    };

    const createParticle = (): NetworkParticle => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3.8 + Math.random() * 3.8;
      const graphCluster = Math.random() < 0.38;
      // 전체 Stage의 기본 분포와 Architecture 주변의 완만한 Density Bias
      const x = graphCluster
        ? width * (0.5 + Math.random() * 0.44)
        : width * Math.random();
      const y = graphCluster
        ? height * (0.22 + Math.random() * 0.62)
        : height * Math.random();
      const xRatio = width > 0 ? x / width : 0.5;
      const maxDepth = Math.min(1, 0.58 + xRatio * 0.42);

      return {
        x,
        y,
        z: Math.random() * maxDepth,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        velocityZ: (0.04 + Math.random() * 0.05) * (Math.random() < 0.5 ? -1 : 1),
        sizeVariance: 0.92 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2,
        tone: Math.floor(Math.random() * particleColors.length),
      };
    };

    // Particle 수 변경 시 Projection과 Connection Buffer 크기 동기화
    const syncRenderBuffers = (targetCount: number) => {
      while (projectedParticles.length < targetCount) {
        projectedParticles.push({
          x: 0,
          y: 0,
          z: 0,
          radius: 0,
          opacity: 0,
          tone: 0,
          cellX: 0,
          cellY: 0,
        });
      }

      projectedParticles.length = targetCount;

      if (connectionCounts.length !== targetCount) {
        connectionCounts = new Uint8Array(targetCount);
        connectionLimits = new Uint8Array(targetCount);
        candidateMarks = new Uint32Array(targetCount);
      }

      connectionLimits.fill(width < 1024 ? 2 : 3);
      if (width >= 1024) {
        for (let index = 0; index < targetCount; index += 6) {
          connectionLimits[index] = 4;
        }
      }
    };

    const syncParticles = (previousWidth: number, previousHeight: number) => {
      if (previousWidth > 0 && previousHeight > 0) {
        particles.forEach((particle) => {
          particle.x = (particle.x / previousWidth) * width;
          particle.y = (particle.y / previousHeight) * height;
        });
      }

      const targetCount = getTargetCount(width, height);

      while (particles.length < targetCount) {
        particles.push(createParticle());
      }

      if (particles.length > targetCount) {
        particles.length = targetCount;
      }

      syncRenderBuffers(targetCount);
    };

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();

      if (bounds.width === 0 || bounds.height === 0) {
        return;
      }

      const previousWidth = width;
      const previousHeight = height;
      // 고해상도 Display의 Rendering 비용 제한
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      syncParticles(previousWidth, previousHeight);
    };

    const getIdentityMask = (x: number, y: number) => (
      x < width * 0.52 && y > height * 0.14 && y < height * 0.62 ? 0.66 : 1
    );

    // 재사용 Projection Buffer와 최대 연결 거리 기반 Spatial Grid 구성
    const projectParticles = (cellSize: number) => {
      let minX = Number.POSITIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        const projected = projectedParticles[index];
        const perspective = 0.72 + particle.z * 0.5;

        projected.x = width / 2 + (particle.x - width / 2) * perspective;
        projected.y = height / 2 + (particle.y - height / 2) * perspective;
        projected.z = particle.z;
        projected.radius = (
          0.95 + particle.z * 1.35 + particle.z * particle.z * 1.55
        ) * particle.sizeVariance;
        projected.opacity = 0.28 + particle.z * 0.64;
        projected.tone = particle.tone;
        minX = Math.min(minX, projected.x);
        minY = Math.min(minY, projected.y);
        maxX = Math.max(maxX, projected.x);
        maxY = Math.max(maxY, projected.y);
      }

      gridMinX = Math.floor(minX / cellSize) * cellSize;
      gridMinY = Math.floor(minY / cellSize) * cellSize;
      gridColumns = Math.max(1, Math.floor((maxX - gridMinX) / cellSize) + 1);
      gridRows = Math.max(1, Math.floor((maxY - gridMinY) / cellSize) + 1);
      const requiredCellCount = gridColumns * gridRows;

      while (spatialCells.length < requiredCellCount) {
        spatialCells.push([]);
      }
      for (let index = 0; index < requiredCellCount; index += 1) {
        spatialCells[index].length = 0;
      }

      for (let index = 0; index < projectedParticles.length; index += 1) {
        const projected = projectedParticles[index];

        projected.cellX = Math.min(
          gridColumns - 1,
          Math.max(0, Math.floor((projected.x - gridMinX) / cellSize)),
        );
        projected.cellY = Math.min(
          gridRows - 1,
          Math.max(0, Math.floor((projected.y - gridMinY) / cellSize)),
        );
        spatialCells[projected.cellY * gridColumns + projected.cellX].push(index);
      }
    };

    const drawFrame = (time: number, delta: number) => {
      if (width === 0 || height === 0) {
        return;
      }

      const connectionDistance = width < 768 ? 104 : width < 1024 ? 128 : 156;
      const cellSize = connectionDistance * MAX_CONNECTION_DISTANCE_MULTIPLIER;
      const connectionOpacity = isDark ? 0.38 : 0.26;
      const particleOpacity = isDark ? 0.8 : 0.62;

      connectionCounts.fill(0);
      context.clearRect(0, 0, width, height);

      if (delta > 0) {
        for (const particle of particles) {
          const driftX = Math.sin(time * 0.00018 + particle.phase) * 1.25;
          const driftY = Math.cos(time * 0.00015 + particle.phase) * 1.25;
          const depthSpeed = 0.62 + particle.z * 0.78;
          particle.x += (particle.velocityX + driftX) * depthSpeed * delta;
          particle.y += (particle.velocityY + driftY) * depthSpeed * delta;
          particle.z += particle.velocityZ * delta;

          if (particle.z <= 0) {
            particle.z = 0;
            particle.velocityZ = Math.abs(particle.velocityZ);
          } else if (particle.z >= 1) {
            particle.z = 1;
            particle.velocityZ = -Math.abs(particle.velocityZ);
          }

          if (particle.x < width * -0.12) particle.x = width * 1.12;
          if (particle.x > width * 1.12) particle.x = width * -0.12;
          if (particle.y < height * -0.12) particle.y = height * 1.12;
          if (particle.y > height * 1.12) particle.y = height * -0.12;
        }
      }

      projectParticles(cellSize);
      context.strokeStyle = connectionColor;

      // 인접 Cell 후보만 기존 Index 순서로 검사하는 Cluster Connection Fade
      for (let index = 0; index < projectedParticles.length; index += 1) {
        const particle = projectedParticles[index];

        if (candidateGeneration >= 0xfffffffe) {
          candidateMarks.fill(0);
          candidateGeneration = 0;
        }
        candidateGeneration += 1;
        const candidateMark = candidateGeneration;

        for (
          let cellY = Math.max(0, particle.cellY - 1);
          cellY <= Math.min(gridRows - 1, particle.cellY + 1);
          cellY += 1
        ) {
          for (
            let cellX = Math.max(0, particle.cellX - 1);
            cellX <= Math.min(gridColumns - 1, particle.cellX + 1);
            cellX += 1
          ) {
            const cell = spatialCells[cellY * gridColumns + cellX];

            for (const targetIndex of cell) {
              if (targetIndex > index) {
                candidateMarks[targetIndex] = candidateMark;
              }
            }
          }
        }

        for (
          let targetIndex = index + 1;
          targetIndex < projectedParticles.length;
          targetIndex += 1
        ) {
          if (connectionCounts[index] >= connectionLimits[index]) break;
          if (candidateMarks[targetIndex] !== candidateMark) continue;
          if (connectionCounts[targetIndex] >= connectionLimits[targetIndex]) continue;

          const target = projectedParticles[targetIndex];
          const depthDistance = Math.abs(target.z - particle.z);

          if (depthDistance >= DEPTH_THRESHOLD) continue;

          const offsetX = target.x - particle.x;
          const offsetY = target.y - particle.y;
          const screenDistanceSquared = offsetX * offsetX + offsetY * offsetY;
          const averageDepth = (particle.z + target.z) / 2;
          const distanceThreshold = connectionDistance * (0.84 + averageDepth * 0.26);

          if (screenDistanceSquared >= distanceThreshold * distanceThreshold) continue;

          const screenDistance = Math.sqrt(screenDistanceSquared);
          const midpointX = (particle.x + target.x) / 2;
          const midpointY = (particle.y + target.y) / 2;
          const areaWeight = (0.68 + 0.32 * Math.min(1, midpointX / (width * 0.72)))
            * getIdentityMask(midpointX, midpointY);
          const distanceFade = 1 - screenDistance / distanceThreshold;
          const depthFade = 1 - depthDistance / DEPTH_THRESHOLD;
          context.lineWidth = 0.62 + averageDepth * 0.58;
          context.globalAlpha = distanceFade * depthFade * connectionOpacity * areaWeight;
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(target.x, target.y);
          context.stroke();
          connectionCounts[index] += 1;
          connectionCounts[targetIndex] += 1;
        }
      }

      for (const particle of projectedParticles) {
        const areaWeight = (0.7 + 0.3 * Math.min(1, particle.x / (width * 0.72)))
          * getIdentityMask(particle.x, particle.y);
        context.globalAlpha = particle.opacity * particleOpacity * areaWeight;
        context.fillStyle = particleColors[particle.tone];
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 1;
    };

    const canAnimate = () => (
      continuousAnimationReady && isVisible && isIntersecting && !isReducedMotion
    );

    const render = (time: number) => {
      frameId = 0;
      const delta = Math.min((time - lastTime) / 1000, 0.032);
      lastTime = time;
      drawFrame(time, delta);

      if (canAnimate()) {
        frameId = requestAnimationFrame(render);
      }
    };

    // Reduced Motion·비활성 Tab·Hero 이탈 상태의 정적 Frame 유지
    const refreshAnimation = () => {
      if (!canAnimate()) {
        if (frameId) cancelAnimationFrame(frameId);
        frameId = 0;
        drawFrame(performance.now(), 0);
        return;
      }

      if (!frameId) {
        lastTime = performance.now();
        frameId = requestAnimationFrame(render);
      }
    };

    // 최초 정적 Frame 이후 Idle 시점의 Continuous RAF 시작
    const scheduleContinuousAnimation = () => {
      const startAnimation = () => {
        idleCallbackId = 0;
        startupTimeoutId = 0;
        continuousAnimationReady = true;
        refreshAnimation();
      };

      if (idleWindow.requestIdleCallback) {
        idleCallbackId = idleWindow.requestIdleCallback(startAnimation, { timeout: 80 });
      } else {
        startupTimeoutId = window.setTimeout(startAnimation, 0);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      drawFrame(performance.now(), 0);
    });
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isIntersecting = entry.isIntersecting;
      refreshAnimation();
    });
    const themeObserver = new MutationObserver(() => {
      readColors();
      drawFrame(performance.now(), 0);
    });
    const handleVisibility = () => {
      isVisible = !document.hidden;
      refreshAnimation();
    };
    const handleMotion = (event: MediaQueryListEvent) => {
      isReducedMotion = event.matches;
      refreshAnimation();
    };

    readColors();
    resizeCanvas();
    drawFrame(performance.now(), 0);
    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);
    themeObserver.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    document.addEventListener("visibilitychange", handleVisibility);
    motionQuery.addEventListener("change", handleMotion);
    scheduleContinuousAnimation();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (idleCallbackId) idleWindow.cancelIdleCallback?.(idleCallbackId);
      if (startupTimeoutId) window.clearTimeout(startupTimeoutId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener("change", handleMotion);
    };
  }, []);

  return <canvas aria-hidden="true" className="hero-network-canvas" data-motion ref={canvasRef} />;
}
