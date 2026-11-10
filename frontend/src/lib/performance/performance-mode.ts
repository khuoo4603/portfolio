export type EffectivePerformanceMode = "high" | "lite";

export type PerformanceState = {
  effectiveMode: EffectivePerformanceMode;
};

export type PerformanceTransitionReason =
  | "low-fps"
  | "frame-delay-distribution"
  | "interactive-frame-delay"
  | "long-task-with-frame-delay"
  | "healthy-recovery";

export type PerformanceDiagnostics = {
  effectiveMode: EffectivePerformanceMode;
  fps: number | null;
  averageFrameInterval: number | null;
  p95FrameInterval: number | null;
  maxFrameInterval: number | null;
  frameCount: number;
  longFrameCount: number;
  longFrameRatio: number;
  longTaskCount: number;
  longTaskDuration: number;
  activityObserved: boolean;
  lowWindowStreak: number;
  highWindowStreak: number;
  lastWindowAt: number | null;
  lastModeChangeAt: number | null;
  lastModeChangeReason: PerformanceTransitionReason | null;
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
  windowGapMs?: number;
};

type PerformanceMonitor = {
  start: () => void;
  stop: () => void;
  getDiagnostics: () => PerformanceDiagnostics;
};

export const PERFORMANCE_MEASUREMENT_FRAMES = 30;
export const PERFORMANCE_LOW_FPS = 35;
export const PERFORMANCE_LOW_WINDOW_STREAK = 2;
export const PERFORMANCE_HIGH_WINDOW_STREAK = 3;
export const PERFORMANCE_COOLDOWN_MS = 2_000;
export const PERFORMANCE_WINDOW_GAP_MS = 500;

const INITIAL_STATE: PerformanceState = { effectiveMode: "high" };
const SERVER_STATE: PerformanceState = { effectiveMode: "high" };
const LONG_TASK_COUNT_THRESHOLD = 2;
const LONG_FRAME_INTERVAL_MS = 32;
const LONG_FRAME_COUNT_THRESHOLD = 2;
const LONG_FRAME_RATIO_THRESHOLD = 0.1;

const INITIAL_DIAGNOSTICS: PerformanceDiagnostics = {
  effectiveMode: "high",
  fps: null,
  averageFrameInterval: null,
  p95FrameInterval: null,
  maxFrameInterval: null,
  frameCount: 0,
  longFrameCount: 0,
  longFrameRatio: 0,
  longTaskCount: 0,
  longTaskDuration: 0,
  activityObserved: false,
  lowWindowStreak: 0,
  highWindowStreak: 0,
  lastWindowAt: null,
  lastModeChangeAt: null,
  lastModeChangeReason: null,
};

declare global {
  interface Window {
    __PORTFOLIO_PERFORMANCE__?: {
      getSnapshot: typeof getPerformanceSnapshot;
      getDiagnostics: typeof getPerformanceDiagnostics;
    };
  }
}

let state = INITIAL_STATE;
let runtimeStarted = false;
let monitor: PerformanceMonitor | null = null;
let diagnostics = INITIAL_DIAGNOSTICS;
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
  diagnostics = { ...diagnostics, effectiveMode: mode };
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
  const modeCooldownMs = options.cooldownMs ?? PERFORMANCE_COOLDOWN_MS;
  const windowGapMs = options.windowGapMs ?? PERFORMANCE_WINDOW_GAP_MS;

  let active = false;
  let frameId: number | null = null;
  let cooldownId: number | null = null;
  let previousTimestamp: number | null = null;
  let frameIntervals: number[] = [];
  let lowWindowStreak = 0;
  let highWindowStreak = 0;
  let longTaskCount = 0;
  let longTaskDuration = 0;
  let activityObserved = false;
  let lastModeChangeAt = Number.NEGATIVE_INFINITY;
  let lastModeChangeReason: PerformanceTransitionReason | null = null;
  let currentMode: EffectivePerformanceMode = state.effectiveMode;
  let longTaskObserver: PerformanceObserver | null = null;
  let latestDiagnostics = INITIAL_DIAGNOSTICS;

  const resetSamples = () => {
    previousTimestamp = null;
    frameIntervals = [];
    longTaskCount = 0;
    longTaskDuration = 0;
    activityObserved = false;
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
    if (windowGapMs <= 0) {
      scheduleFrame();
      return;
    }
    cooldownId = window.setTimeout(() => {
      cooldownId = null;
      scheduleFrame();
    }, windowGapMs);
  };

  const evaluateWindow = (timestamp: number) => {
    const sortedIntervals = [...frameIntervals].sort((left, right) => left - right);
    const averageInterval = sortedIntervals.reduce((sum, interval) => sum + interval, 0) / sortedIntervals.length;
    const fps = 1_000 / averageInterval;
    const longFrameCount = sortedIntervals.filter((interval) => interval >= LONG_FRAME_INTERVAL_MS).length;
    const longFrameRatio = longFrameCount / sortedIntervals.length;
    const p95FrameInterval = sortedIntervals[Math.min(sortedIntervals.length - 1, Math.ceil(sortedIntervals.length * 0.95) - 1)];
    const maxFrameInterval = sortedIntervals[sortedIntervals.length - 1];
    const hasLongTaskInstability = longTaskCount >= LONG_TASK_COUNT_THRESHOLD;
    const hasFrameDelayDistribution = longFrameCount >= LONG_FRAME_COUNT_THRESHOLD
      && longFrameRatio >= LONG_FRAME_RATIO_THRESHOLD;
    const hasInteractiveFrameDelay = activityObserved && longFrameCount >= 1;
    const hasLongTaskFrameDelay = hasLongTaskInstability
      && (averageInterval >= 24 || longFrameCount >= 1);
    const isLowPerformance = fps < PERFORMANCE_LOW_FPS
      || hasFrameDelayDistribution
      || hasInteractiveFrameDelay
      || hasLongTaskFrameDelay;
    const degradationReason: PerformanceTransitionReason = fps < PERFORMANCE_LOW_FPS
      ? "low-fps"
      : hasInteractiveFrameDelay
        ? "interactive-frame-delay"
        : hasFrameDelayDistribution
          ? "frame-delay-distribution"
          : "long-task-with-frame-delay";

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

    const shouldChangeMode = nextMode
      && nextMode !== currentMode
      && timestamp - lastModeChangeAt >= modeCooldownMs;
    if (shouldChangeMode) {
      currentMode = nextMode;
      lastModeChangeAt = timestamp;
      lastModeChangeReason = nextMode === "high" ? "healthy-recovery" : degradationReason;
      onModeChange(nextMode);
    }

    latestDiagnostics = {
      effectiveMode: currentMode,
      fps,
      averageFrameInterval: averageInterval,
      p95FrameInterval,
      maxFrameInterval,
      frameCount: sortedIntervals.length,
      longFrameCount,
      longFrameRatio,
      longTaskCount,
      longTaskDuration,
      activityObserved,
      lowWindowStreak,
      highWindowStreak,
      lastWindowAt: timestamp,
      lastModeChangeAt: Number.isFinite(lastModeChangeAt) ? lastModeChangeAt : null,
      lastModeChangeReason,
    };
    diagnostics = latestDiagnostics;
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

  const markActivity = () => {
    activityObserved = true;
  };
  const activityListenerOptions: AddEventListenerOptions = { passive: true };
  const activityEvents: Array<keyof DocumentEventMap> = ["scroll", "pointerdown", "keydown", "touchstart"];

  const startLongTaskObserver = () => {
    if (typeof window === "undefined" || typeof window.PerformanceObserver !== "function") {
      return;
    }
    if (!window.PerformanceObserver.supportedEntryTypes?.includes("longtask")) {
      return;
    }

    try {
      longTaskObserver = new window.PerformanceObserver((list) => {
        const entries = list.getEntries();
        longTaskCount += entries.length;
        longTaskDuration += entries.reduce((sum, entry) => sum + entry.duration, 0);
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
      for (const eventName of activityEvents) {
        document.addEventListener(eventName, markActivity, activityListenerOptions);
      }
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
      for (const eventName of activityEvents) {
        document.removeEventListener(eventName, markActivity, activityListenerOptions);
      }
      stopLongTaskObserver();
      resetWindow();
    },
    getDiagnostics() {
      return latestDiagnostics;
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

export function getPerformanceDiagnostics(): PerformanceDiagnostics {
  return diagnostics;
}

export function getServerPerformanceSnapshot(): PerformanceState {
  return SERVER_STATE;
}

// Root Layout에서 한 번만 시작하는 전역 성능 측정 런타임
export function startPerformanceRuntime(options?: PerformanceMonitorOptions) {
  runtimeStarted = true;
  applyEffectiveMode(state.effectiveMode);
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    window.__PORTFOLIO_PERFORMANCE__ = {
      getSnapshot: getPerformanceSnapshot,
      getDiagnostics: getPerformanceDiagnostics,
    };
  }
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
  diagnostics = INITIAL_DIAGNOSTICS;
}
