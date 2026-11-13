import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SortableList, { moveItem } from "./sortable-list";

describe("관리자 정렬 목록", () => {
  afterEach(() => cleanup());

  it("moveItem은 원본을 바꾸지 않고 경계 밖 이동을 무시", () => {
    const source = ["a", "b", "c"];
    expect(moveItem(source, 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveItem(source, -1, 1)).toBe(source);
    expect(source).toEqual(["a", "b", "c"]);
  });

  it("1-based 인덱스와 위·아래 이동을 제공", () => {
    const onChange = vi.fn();
    render(<SortableList items={[{ id: 7, title: "First" }, { id: 9, title: "Second" }]} getKey={(item) => item.id} getTitle={(item) => item.title} onChange={onChange} />);
    expect(screen.getByLabelText("1번째")).toBeInTheDocument();
    expect(screen.getByLabelText("2번째")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Second 위로" }));
    expect(onChange).toHaveBeenCalledWith([{ id: 9, title: "Second" }, { id: 7, title: "First" }]);
  });

  it("handle 키보드 화살표 이동을 제공", () => {
    const onChange = vi.fn();
    render(<SortableList items={[{ id: 7, title: "First" }, { id: 9, title: "Second" }]} getKey={(item) => item.id} getTitle={(item) => item.title} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("button", { name: "Second 순서 이동" }), { key: "ArrowUp" });
    expect(onChange).toHaveBeenCalledWith([{ id: 9, title: "Second" }, { id: 7, title: "First" }]);
  });

  it("컴팩트 행의 추가 컨트롤과 이동 버튼을 하나의 오른쪽 그룹으로 배치", () => {
    render(
      <SortableList
        items={[{ id: 7, title: "Java" }, { id: 9, title: "Spring Boot" }]}
        getKey={(item) => item.id}
        getTitle={(item) => item.title}
        renderActions={(item, _index, controls) => (
          <>
            <button type="button" aria-label={`${item.title} 상태`}>ON</button>
            {controls.moveUp}
            {controls.moveDown}
            <button type="button" aria-label={`${item.title} 삭제`}>X</button>
          </>
        )}
        onChange={vi.fn()}
      />,
    );

    const row = screen.getByRole("listitem", { name: /Java/ });
    expect(within(row).getAllByRole("button").map((button) => button.getAttribute("aria-label"))).toEqual([
      "Java 순서 이동",
      "Java 상태",
      "Java 위로",
      "Java 아래로",
      "Java 삭제",
    ]);
  });

  it("다른 SortableList의 Touch Row를 Drop 대상으로 사용하지 않음", () => {
    const referenceChange = vi.fn();
    const servicesChange = vi.fn();
    const originalElementFromPoint = document.elementFromPoint;
    const setPointerCapture = HTMLElement.prototype.setPointerCapture;
    Object.defineProperty(document, "elementFromPoint", { configurable: true, value: vi.fn() });
    Object.defineProperty(HTMLElement.prototype, "setPointerCapture", { configurable: true, value: vi.fn() });
    render(
      <>
        <SortableList
          items={[{ id: 1, title: "Reference One" }, { id: 2, title: "Reference Two" }]}
          getKey={(item) => item.id}
          getTitle={(item) => item.title}
          onChange={referenceChange}
        />
        <SortableList
          items={[{ id: 3, title: "Service One" }, { id: 4, title: "Service Two" }]}
          getKey={(item) => item.id}
          getTitle={(item) => item.title}
          onChange={servicesChange}
        />
      </>,
    );

    const referenceRow = screen.getByRole("listitem", { name: "Reference One" });
    const serviceRow = screen.getByRole("listitem", { name: "Service Two" });
    vi.mocked(document.elementFromPoint).mockReturnValue(serviceRow);
    fireEvent.pointerDown(referenceRow, { pointerType: "touch", pointerId: 1 });
    fireEvent.pointerMove(referenceRow, { pointerType: "touch", pointerId: 1, clientX: 10, clientY: 10 });
    expect(referenceChange).not.toHaveBeenCalled();
    expect(servicesChange).not.toHaveBeenCalled();
    fireEvent.pointerUp(referenceRow, { pointerType: "touch", pointerId: 1 });

    Object.defineProperty(document, "elementFromPoint", { configurable: true, value: originalElementFromPoint });
    Object.defineProperty(HTMLElement.prototype, "setPointerCapture", { configurable: true, value: setPointerCapture });
  });
});
