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
};

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
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let particles: NetworkParticle[] = [];
    let width = 0;
    let height = 0;
    let frameId = 0;
    let lastTime = performance.now();
    let isVisible = !document.hidden;
    let isIntersecting = true;
    let isReducedMotion = motionQuery.matches;
    let particleColors = ["", "", ""];
    let connectionColor = "";

    const readColors = () => {
      const styles = getComputedStyle(canvas);
      particleColors = [styles.color, styles.borderTopColor, styles.outlineColor];
      connectionColor = styles.borderTopColor;
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
        particles = particles.slice(0, targetCount);
      }
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

    const drawFrame = (time: number, delta: number) => {
      if (width === 0 || height === 0) {
        return;
      }

      const isDark = getComputedStyle(root).colorScheme === "dark";
      const connectionDistance = width < 768 ? 104 : width < 1024 ? 128 : 156;
      const connectionOpacity = isDark ? 0.38 : 0.26;
      const particleOpacity = isDark ? 0.8 : 0.62;
      const connectionCounts = new Uint8Array(particles.length);
      const getConnectionLimit = (index: number) => {
        if (width < 1024) return 2;

        return index % 6 === 0 ? 4 : 3;
      };
      const getIdentityMask = (x: number, y: number) => (
        x < width * 0.52 && y > height * 0.14 && y < height * 0.62 ? 0.66 : 1
      );

      context.clearRect(0, 0, width, height);

      if (delta > 0) {
        particles.forEach((particle) => {
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
        });
      }

      const projectedParticles: ProjectedParticle[] = particles.map((particle) => {
        const perspective = 0.72 + particle.z * 0.5;
        const radius = (0.95 + particle.z * 1.35 + particle.z * particle.z * 1.55) * particle.sizeVariance;

        return {
          x: width / 2 + (particle.x - width / 2) * perspective,
          y: height / 2 + (particle.y - height / 2) * perspective,
          z: particle.z,
          radius,
          opacity: 0.28 + particle.z * 0.64,
          tone: particle.tone,
        };
      });

      context.strokeStyle = connectionColor;

      // 화면상 거리와 Depth 차이를 함께 반영한 Cluster Connection Fade
      projectedParticles.forEach((particle, index) => {
        for (let targetIndex = index + 1; targetIndex < projectedParticles.length; targetIndex += 1) {
          if (connectionCounts[index] >= getConnectionLimit(index)) break;
          if (connectionCounts[targetIndex] >= getConnectionLimit(targetIndex)) continue;

          const target = projectedParticles[targetIndex];
          const offsetX = target.x - particle.x;
          const offsetY = target.y - particle.y;
          const screenDistance = Math.hypot(offsetX, offsetY);
          const depthDistance = Math.abs(target.z - particle.z);
          const averageDepth = (particle.z + target.z) / 2;
          const depthThreshold = 0.26;
          const distanceThreshold = connectionDistance * (0.84 + averageDepth * 0.26);

          if (screenDistance >= distanceThreshold || depthDistance >= depthThreshold) continue;

          const midpointX = (particle.x + target.x) / 2;
          const midpointY = (particle.y + target.y) / 2;
          const areaWeight = (0.68 + 0.32 * Math.min(1, midpointX / (width * 0.72)))
            * getIdentityMask(midpointX, midpointY);
          const distanceFade = 1 - screenDistance / distanceThreshold;
          const depthFade = 1 - depthDistance / depthThreshold;
          context.lineWidth = 0.62 + averageDepth * 0.58;
          context.globalAlpha = distanceFade * depthFade * connectionOpacity * areaWeight;
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(target.x, target.y);
          context.stroke();
          connectionCounts[index] += 1;
          connectionCounts[targetIndex] += 1;
        }
      });

      projectedParticles.forEach((particle) => {
        const areaWeight = (0.7 + 0.3 * Math.min(1, particle.x / (width * 0.72)))
          * getIdentityMask(particle.x, particle.y);
        context.globalAlpha = particle.opacity * particleOpacity * areaWeight;
        context.fillStyle = particleColors[particle.tone];
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });

      context.globalAlpha = 1;
    };

    const canAnimate = () => isVisible && isIntersecting && !isReducedMotion;

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
    refreshAnimation();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener("change", handleMotion);
    };
  }, []);

  return <canvas aria-hidden="true" className="hero-network-canvas" data-motion ref={canvasRef} />;
}
