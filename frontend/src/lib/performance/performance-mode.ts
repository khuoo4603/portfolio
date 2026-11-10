export type EffectivePerformanceMode = "high" | "lite";

export type PerformanceState = {
  effectiveMode: EffectivePerformanceMode;
};

type FrameCallback = (timestamp: number) => void;

export type PerformanceMonitorOptions = {
  requestAnimationFrame?: (callback: FrameCallback) => number;
  cancelAnimationFrame?: (id: number) => void;
  getVisibility?: () => DocumentVisibilityState;
  measurementFrames?: number;
  lowWindowStreak?: number;
  highWindowStreak?: number;
  cooldownMs?: number;
};

type PerformanceMonitor = {
  start: () => void;
  stop: () => void;
};

export const PERFORMANCE_MEASUREMENT_FRAMES = 30;
export const PERFORMANCE_LOW_FPS = 35;
export const PERFORMANCE_LOW_WINDOW_STREAK = 2;
export const PERFORMANCE_HIGH_WINDOW_STREAK = 2;
export const PERFORMANCE_COOLDOWN_MS = 2_000;

const INITIAL_STATE: PerformanceState = { effectiveMode: "high" };
const SERVER_STATE: PerformanceState = { effectiveMode: "high" };
const LONG_TASK_COUNT_THRESHOLD = 2;

let state = INITIAL_STATE;
let runtimeStarted = false;
let monitor: PerformanceMonitor | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function applyEffectiveMode(mode: EffectivePerformanceMode) {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.performance = mode;
  }
}

function applyAutomaticMode(mode: EffectivePerformanceMode) {
  if (!runtimeStarted || state.effectiveMode === mode) {
    return;
  }

  state = { ...state, effectiveMode: mode };
  applyEffectiveMode(mode);
  notify();
}

function startMonitor(options?: PerformanceMonitorOptions) {
  if (!runtimeStarted || monitor) {
    return;
  }

  monitor = createPerformanceMonitor(applyAutomaticMode, options);
  monitor.start();
}

// RAF 간격과 Long Task 보조 지표를 이용한 단일 Browser 성능 측정기
export function createPerformanceMonitor(
  onModeChange: (mode: EffectivePerformanceMode) => void,
  options: PerformanceMonitorOptions = {},
): PerformanceMonitor {
  const requestAnimationFrame = options.requestAnimationFrame
    ?? ((callback: FrameCallback) => window.requestAnimationFrame(callback));
  const cancelAnimationFrame = options.cancelAnimationFrame
    ?? ((id: number) => window.cancelAnimationFrame(id));
  const getVisibility = options.getVisibility ?? (() => document.visibilityState);
  const measurementFrames = options.measurementFrames ?? PERFORMANCE_MEASUREMENT_FRAMES;
  const lowWindowStreakLimit = options.lowWindowStreak ?? PERFORMANCE_LOW_WINDOW_STREAK;
  const highWindowStreakLimit = options.highWindowStreak ?? PERFORMANCE_HIGH_WINDOW_STREAK;
  const cooldownMs = options.cooldownMs ?? PERFORMANCE_COOLDOWN_MS;

  let active = false;
  let frameId: number | null = null;
  let cooldownId: number | null = null;
  let previousTimestamp: number | null = null;
  let frameIntervals: number[] = [];
  let lowWindowStreak = 0;
  let highWindowStreak = 0;
  let longTaskCount = 0;
  let lastModeChangeAt = Number.NEGATIVE_INFINITY;
  let currentMode: EffectivePerformanceMode = "high";
  let longTaskObserver: PerformanceObserver | null = null;

  const resetSamples = () => {
    previousTimestamp = null;
    frameIntervals = [];
    longTaskCount = 0;
  };

  const resetWindow = () => {
    resetSamples();
    lowWindowStreak = 0;
    highWindowStreak = 0;
  };

  const clearScheduledWork = () => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
    if (cooldownId !== null) {
      window.clearTimeout(cooldownId);
      cooldownId = null;
    }
  };

  const scheduleFrame = () => {
    if (!active || getVisibility() === "hidden" || frameId !== null || cooldownId !== null) {
      return;
    }
    frameId = requestAnimationFrame(handleFrame);
  };

  const scheduleNextWindow = () => {
    if (!active || getVisibility() === "hidden") {
      return;
    }
    if (cooldownMs <= 0) {
      scheduleFrame();
      return;
    }
    cooldownId = window.setTimeout(() => {
      cooldownId = null;
      scheduleFrame();
    }, cooldownMs);
  };

  const evaluateWindow = (timestamp: number) => {
    const averageInterval = frameIntervals.reduce((sum, interval) => sum + interval, 0) / frameIntervals.length;
    const fps = 1_000 / averageInterval;
    const hasLongTaskInstability = longTaskCount >= LONG_TASK_COUNT_THRESHOLD;
    const isLowPerformance = fps < PERFORMANCE_LOW_FPS;

    if (isLowPerformance) {
      lowWindowStreak += 1;
      highWindowStreak = 0;
    } else if (hasLongTaskInstability) {
      lowWindowStreak = 0;
      highWindowStreak = 0;
    } else {
      highWindowStreak += 1;
      lowWindowStreak = 0;
    }

    const nextMode = isLowPerformance
      ? lowWindowStreak >= lowWindowStreakLimit ? "lite" : null
      : !hasLongTaskInstability && highWindowStreak >= highWindowStreakLimit ? "high" : null;

    if (nextMode && nextMode !== currentMode && timestamp - lastModeChangeAt >= cooldownMs) {
      currentMode = nextMode;
      lastModeChangeAt = timestamp;
      onModeChange(nextMode);
    }
  };

  function handleFrame(timestamp: number) {
    frameId = null;
    if (!active) {
      return;
    }
    if (getVisibility() === "hidden") {
      resetWindow();
      return;
    }

    if (previousTimestamp !== null) {
      const interval = timestamp - previousTimestamp;
      if (interval > 0 && interval <= 1_000) {
        frameIntervals.push(interval);
      }
    }
    previousTimestamp = timestamp;

    if (frameIntervals.length >= measurementFrames) {
      evaluateWindow(timestamp);
      resetSamples();
      scheduleNextWindow();
      return;
    }

    scheduleFrame();
  }

  const handleVisibilityChange = () => {
    if (getVisibility() === "hidden") {
      clearScheduledWork();
      resetWindow();
      return;
    }
    scheduleFrame();
  };

  const startLongTaskObserver = () => {
    if (typeof window === "undefined" || typeof window.PerformanceObserver !== "function") {
      return;
    }
    if (!window.PerformanceObserver.supportedEntryTypes?.includes("longtask")) {
      return;
    }

    try {
      longTaskObserver = new window.PerformanceObserver((list) => {
        longTaskCount += list.getEntries().length;
      });
      longTaskObserver.observe({ type: "longtask", buffered: false });
    } catch {
      longTaskObserver = null;
    }
  };

  const stopLongTaskObserver = () => {
    longTaskObserver?.disconnect();
    longTaskObserver = null;
  };

  return {
    start() {
      if (active) {
        return;
      }
      active = true;
      document.addEventListener("visibilitychange", handleVisibilityChange);
      startLongTaskObserver();
      scheduleFrame();
    },
    stop() {
      if (!active) {
        return;
      }
      active = false;
      clearScheduledWork();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopLongTaskObserver();
      resetWindow();
    },
  };
}

export function subscribePerformanceMode(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPerformanceSnapshot(): PerformanceState {
  return state;
}

export function getServerPerformanceSnapshot(): PerformanceState {
  return SERVER_STATE;
}

// Root Layout에서 한 번만 시작하는 전역 성능 측정 런타임
export function startPerformanceRuntime(options?: PerformanceMonitorOptions) {
  runtimeStarted = true;
  applyEffectiveMode(state.effectiveMode);
  startMonitor(options);
}

export function stopPerformanceRuntime() {
  runtimeStarted = false;
  monitor?.stop();
  monitor = null;
}

// Vitest 간 singleton 상태와 Browser 자원 초기화
export function resetPerformanceModeForTests() {
  stopPerformanceRuntime();
  state = INITIAL_STATE;
}
