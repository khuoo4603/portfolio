"use client";

import { MoreHorizontal } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./select.module.css";

export type DropdownMenuItem = {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
  separatorBefore?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

type DropdownMenuProps = {
  triggerLabel: string;
  items: readonly DropdownMenuItem[];
  triggerClassName?: string;
  disabled?: boolean;
};

type PopupPosition = { top: number; left: number; width: number };

// 작업 명령과 키보드 탐색을 제공하는 공통 Menu Popup
export default function DropdownMenu({ triggerLabel, items, triggerClassName, disabled = false }: DropdownMenuProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PopupPosition | null>(null);

  const closeMenu = () => setOpen(false);
  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = 176;
    const popupHeight = Math.min(Math.max(items.length * 40 + 12, 44), 280);
    setPosition({
      top: rect.bottom + 4 + popupHeight <= window.innerHeight ? rect.bottom + 4 : Math.max(8, rect.top - popupHeight - 4),
      left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
      width,
    });
  }, [items.length]);

  const selectItem = (item: DropdownMenuItem) => {
    if (item.disabled) return;
    closeMenu();
    item.onSelect();
    triggerRef.current?.focus();
  };

  // Menu 내부 Arrow Key 순환 이동
  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const enabledItems = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? []);
    const currentIndex = enabledItems.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      triggerRef.current?.focus();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + (event.key === "ArrowDown" ? 1 : -1) + enabledItems.length) % enabledItems.length;
      enabledItems[nextIndex]?.focus();
    }
  };

  useEffect(() => {
    if (!open) return undefined;
    updatePosition();
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (triggerRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return;
      closeMenu();
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

  const menu = open && typeof document !== "undefined" ? createPortal(
    <div ref={menuRef} className={`${styles.popupSurface} ${styles.menuPopup}`} id={menuId} role="menu" aria-label={triggerLabel} style={position ?? undefined} onKeyDown={handleMenuKeyDown}>
      {items.map((item) => (
        <div key={item.label}>
          {item.separatorBefore ? <div className={styles.menuSeparator} role="separator" /> : null}
          <button className={`${styles.menuItem} ${item.danger ? styles.menuItemDanger : ""}`} type="button" role="menuitem" disabled={item.disabled} onClick={() => selectItem(item)}>
            {item.leadingIcon}
            <span>{item.label}</span>
            {item.trailingIcon}
          </button>
        </div>
      ))}
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        className={`${styles.menuTrigger} ${triggerClassName ?? ""}`}
        type="button"
        aria-label={triggerLabel}
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") closeMenu();
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <MoreHorizontal aria-hidden="true" />
      </button>
      {menu}
    </>
  );
}
