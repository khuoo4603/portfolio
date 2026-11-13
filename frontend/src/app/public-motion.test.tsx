import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AboutSequence, ScrollReveal, TypingText } from "./public-motion";

function motionMedia(matches: boolean) {
  return {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

function visualLines(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>("[data-typing-visual]"))
    .map((line) => line.textContent ?? "");
}

describe("Public text motion", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("입력형 이름을 두 줄 순서로 한 번만 완성", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", vi.fn(() => motionMedia(false)));

    const { container, rerender } = render(
      <TypingText
        lines={[
          { text: "KIM" },
          { text: "HYUNWOO", className: "hero-name-second" },
        ]}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(visualLines(container)).toEqual(["", ""]);

    act(() => {
      vi.advanceTimersByTime(149);
    });
    expect(visualLines(container)).toEqual(["", ""]);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(visualLines(container)[0]).toHaveLength(1);
    expect(visualLines(container)[1]).toBe("");

    act(() => {
      vi.runAllTimers();
    });
    const completed = visualLines(container);
    expect(completed).toEqual(["KIM", "HYUNWOO"]);
    expect(container.querySelector("[data-typing-cursor]")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(visualLines(container)).toEqual(completed);

    rerender(<TypingText lines={[{ text: "LEE" }, { text: "MINHO" }]} />);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(visualLines(container)).toEqual(["", ""]);
    act(() => {
      vi.runAllTimers();
    });
    expect(visualLines(container)).toEqual(["LEE", "MINHO"]);
  });

  it("Reduced Motion에서는 이름을 즉시 노출", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", vi.fn(() => motionMedia(true)));

    const { container } = render(
      <TypingText lines={[{ text: "KIM" }, { text: "HYUNWOO" }]} />,
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(visualLines(container)).toEqual(["KIM", "HYUNWOO"]);
    expect(container.querySelector("[data-typing-cursor]")).not.toBeInTheDocument();
  });

  it("Viewport 진입 시 About 문구를 시작하고 완료 callback을 한 번만 실행", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", vi.fn(() => motionMedia(false)));
    const callbacks: IntersectionObserverCallback[] = [];

    const observe = vi.fn();

    class FakeIntersectionObserver {
      constructor(nextCallback: IntersectionObserverCallback) {
        callbacks.push(nextCallback);
      }

      observe = observe;

      disconnect = vi.fn();
    }

    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    const onComplete = vi.fn();
    const { container } = render(
      <TypingText
        lines={[{ text: "많은 기술보다" }, { text: "문제에 맞는" }, { text: "기술 선택" }]}
        start="viewport"
        onComplete={onComplete}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(visualLines(container)).toEqual(["", "", ""]);
    expect(onComplete).not.toHaveBeenCalled();
    expect(container.querySelector(".typing-text")).toHaveClass("typing-text--viewport");
    expect(observe).toHaveBeenCalledWith(container.querySelector(".typing-text"));

    act(() => {
      callbacks[0]([{ isIntersecting: true } as IntersectionObserverEntry] as IntersectionObserverEntry[], {} as IntersectionObserver);
      vi.advanceTimersByTime(0);
    });
    act(() => {
      vi.runAllTimers();
    });

    expect(visualLines(container)).toEqual(["많은 기술보다", "문제에 맞는", "기술 선택"]);
    expect(onComplete).toHaveBeenCalledTimes(1);

    act(() => {
      callbacks[0]([{ isIntersecting: true } as IntersectionObserverEntry] as IntersectionObserverEntry[], {} as IntersectionObserver);
      vi.advanceTimersByTime(1000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("About 핵심 문구 완료 후 200ms 뒤 설명 그룹을 함께 노출", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", vi.fn(() => motionMedia(false)));
    const callbacks: IntersectionObserverCallback[] = [];

    class FakeIntersectionObserver {
      constructor(nextCallback: IntersectionObserverCallback) {
        callbacks.push(nextCallback);
      }

      observe = vi.fn();

      disconnect = vi.fn();
    }

    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    const statement = "많은 기술보다\n문제에 맞는\n기술 선택";
    const { container } = render(
      <AboutSequence
        statement={statement}
        position="BACKEND / INFRA DEVELOPER"
        description1="첫 번째 소개"
        description2="두 번째 소개"
      />,
    );
    const introduction = container.querySelector<HTMLElement>(".about-introduction")!;

    await act(async () => {
      await Promise.resolve();
    });
    expect(introduction).not.toHaveClass("is-visible");

    act(() => {
      callbacks[0]([{ isIntersecting: true } as IntersectionObserverEntry] as IntersectionObserverEntry[], {} as IntersectionObserver);
      vi.advanceTimersByTime(statement.replace(/\n/g, "").length * 129);
    });
    expect(container.querySelector("[data-typing-complete]")).toHaveAttribute("data-typing-complete", "false");
    expect(introduction).not.toHaveClass("is-visible");

    act(() => {
      vi.advanceTimersByTime(130);
    });
    expect(introduction).not.toHaveClass("is-visible");

    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(container.querySelector("[data-typing-complete]")).toHaveAttribute("data-typing-complete", "true");
    expect(introduction).toHaveClass("is-visible");
  });

  it("IntersectionObserver 진입·퇴장에 따라 Blur와 Opacity를 전환", async () => {
    const callbacks: IntersectionObserverCallback[] = [];
    const disconnect = vi.fn();

    const options: IntersectionObserverInit[] = [];

    class FakeIntersectionObserver {
      constructor(nextCallback: IntersectionObserverCallback, nextOptions: IntersectionObserverInit) {
        callbacks.push(nextCallback);
        options.push(nextOptions);
      }

      observe = vi.fn();

      disconnect = disconnect;
    }

    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    vi.stubGlobal("matchMedia", vi.fn(() => motionMedia(false)));

    const { container } = render(
      <>
        <ScrollReveal as="p" effect="blur">Heading</ScrollReveal>
        <ScrollReveal as="li" effect="opacity">Row</ScrollReveal>
      </>,
    );

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });
    const heading = container.querySelector<HTMLElement>("[data-motion-effect='blur']")!;
    const row = container.querySelector<HTMLElement>("[data-motion-effect='opacity']")!;
    expect(heading).not.toHaveClass("is-visible");
    expect(row).not.toHaveClass("is-visible");
    expect(options).toHaveLength(2);
    expect(options[0]).toMatchObject({
      rootMargin: "-10% 0px -20% 0px",
      threshold: 0.01,
    });
    expect(options[1]).toMatchObject({
      rootMargin: "-20% 0px -20% 0px",
      threshold: 0.01,
    });

    act(() => {
      callbacks.forEach((callback) => callback(
        [{ isIntersecting: true } as IntersectionObserverEntry] as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      ));
    });
    expect(heading).toHaveClass("is-visible");
    expect(row).toHaveClass("is-visible");

    act(() => {
      callbacks.forEach((callback) => callback(
        [{ isIntersecting: false } as IntersectionObserverEntry] as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      ));
    });
    expect(heading).not.toHaveClass("is-visible");
    expect(heading).toHaveClass("public-motion-reveal--exiting");
    expect(row).toHaveClass("is-visible");

    act(() => {
      callbacks.forEach((callback) => callback(
        [{ isIntersecting: true } as IntersectionObserverEntry] as IntersectionObserverEntry[],
        {} as IntersectionObserver,
      ));
    });
    expect(row).toHaveClass("is-visible");

    cleanup();
    expect(disconnect).toHaveBeenCalled();
  });

  it("Viewport Observer 초기화 실패 시 Typing 콘텐츠를 노출", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", vi.fn(() => motionMedia(false)));
    class FailingIntersectionObserver {
      constructor() {
        throw new Error("observer unavailable");
      }
    }

    vi.stubGlobal("IntersectionObserver", FailingIntersectionObserver);
    const { container } = render(
      <TypingText lines={[{ text: "ABOUT" }]} start="viewport" />,
    );

    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      vi.runAllTimers();
    });
    expect(visualLines(container)).toEqual(["ABOUT"]);
  });

  it("IntersectionObserver 미지원 환경에서는 콘텐츠를 완전히 노출", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => motionMedia(false)));

    const { container } = render(
      <ScrollReveal as="p" effect="blur">Content</ScrollReveal>,
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(container.querySelector("[data-motion-effect='blur']"))
      .toHaveClass("is-visible");
  });
});
