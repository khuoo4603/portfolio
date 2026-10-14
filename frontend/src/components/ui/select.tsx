"use client";

import { Check, ChevronDown } from "lucide-react";
import { type KeyboardEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./select.module.css";

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

type PopupPosition = { top: number; left: number; width: number };

// 값 선택과 키보드 탐색을 제공하는 공통 Listbox Select
export default function Select({
  value,
  onValueChange,
  options,
  placeholder = "선택",
  disabled = false,
  className,
  id,
  name,
  required = false,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: SelectProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [position, setPosition] = useState<PopupPosition | null>(null);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const firstEnabledIndex = () => options.findIndex((option) => !option.disabled);
  const findEnabledIndex = (startIndex: number, direction: 1 | -1) => {
    if (options.length === 0) return -1;
    for (let offset = 1; offset <= options.length; offset += 1) {
      const nextIndex = (startIndex + direction * offset + options.length) % options.length;
      if (!options[nextIndex].disabled) return nextIndex;
    }
    return -1;
  };

  // Trigger 기준 Viewport 내부 Popup 좌표 계산
  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const popupHeight = 280;
    const width = Math.max(rect.width, 160);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    const top = rect.bottom + 4 + popupHeight <= window.innerHeight
      ? rect.bottom + 4
      : Math.max(8, rect.top - popupHeight - 4);
    setPosition({ top, left, width });
  }, []);

  const activeOptionIndex = activeIndex !== null && !options[activeIndex]?.disabled
    ? activeIndex
    : selectedIndex >= 0 && !options[selectedIndex]?.disabled ? selectedIndex : firstEnabledIndex();

  const openListbox = (index = selectedIndex >= 0 && !options[selectedIndex].disabled ? selectedIndex : firstEnabledIndex()) => {
    if (disabled) return;
    setActiveIndex(index >= 0 ? index : null);
    setOpen(true);
  };

  const closeListbox = () => {
    setOpen(false);
    setActiveIndex(null);
  };

  const chooseOption = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    onValueChange(option.value);
    closeListbox();
    triggerRef.current?.focus();
  };

  // Select Trigger 키보드 조작
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const baseIndex = activeOptionIndex;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = findEnabledIndex(baseIndex >= 0 ? baseIndex : event.key === "ArrowDown" ? -1 : 0, event.key === "ArrowDown" ? 1 : -1);
      if (!open) openListbox(nextIndex);
      else setActiveIndex(nextIndex >= 0 ? nextIndex : null);
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const indexes = event.key === "Home" ? options.map((_, index) => index) : options.map((_, index) => options.length - index - 1);
      const nextIndex = indexes.find((index) => !options[index].disabled) ?? -1;
      if (!open) openListbox(nextIndex);
      else setActiveIndex(nextIndex >= 0 ? nextIndex : null);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open && activeOptionIndex >= 0) chooseOption(activeOptionIndex);
      else openListbox();
      return;
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      closeListbox();
    }
  };

  useEffect(() => {
    if (!open) return undefined;
    updatePosition();

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (triggerRef.current?.contains(event.target) || popupRef.current?.contains(event.target)) return;
      closeListbox();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  const popup = open && typeof document !== "undefined" ? createPortal(
    <div
      ref={popupRef}
      className={`${styles.popupSurface} ${styles.selectPopup}`}
      role="listbox"
      id={listboxId}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      style={position ?? undefined}
    >
      {options.length === 0 ? <p className={`${styles.emptyOption} type-small`}>선택할 항목이 없습니다.</p> : options.map((option, index) => (
        <button
          key={option.value}
          id={`${listboxId}-${index}`}
          className={`${styles.selectOption} ${option.value === value ? styles.selectOptionSelected : ""} ${activeOptionIndex === index ? styles.selectOptionActive : ""}`}
          type="button"
          role="option"
          aria-selected={option.value === value}
          aria-disabled={option.disabled || undefined}
          data-active={activeOptionIndex === index || undefined}
          disabled={option.disabled}
          onMouseEnter={() => !option.disabled && setActiveIndex(index)}
          onClick={() => chooseOption(index)}
        >
          <span><span>{option.label}</span>{option.description ? <small>{option.description}</small> : null}</span>
          {option.value === value ? <Check aria-hidden="true" /> : null}
        </button>
      ))}
    </div>,
    document.body,
  ) : null;

  return (
    <span className={`${styles.selectRoot} ${className ?? ""}`}>
      {name ? <input type="hidden" name={name} value={value} required={required} disabled={disabled} /> : null}
      <button
        ref={triggerRef}
        id={id}
        className={`${styles.selectTrigger} type-body`}
        type="button"
        role="combobox"
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-activedescendant={open && activeOptionIndex >= 0 ? `${listboxId}-${activeOptionIndex}` : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        onClick={() => open ? closeListbox() : openListbox()}
        onKeyDown={handleKeyDown}
      >
        <span className={selectedOption ? styles.selectedValue : styles.placeholder}>{selectedOption?.label ?? placeholder}</span>
        <ChevronDown className={open ? styles.chevronOpen : undefined} aria-hidden="true" />
      </button>
      {popup}
    </span>
  );
}
