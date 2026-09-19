"use client";

import { CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./notification.module.css";

type NotificationType = "success" | "info" | "error";

type NotificationInput = {
  type: NotificationType;
  title: string;
  message: string;
};

type NotificationItem = NotificationInput & {
  id: number;
  closing: boolean;
};

type NotificationContextValue = {
  notify: (notification: NotificationInput) => void;
  isProviderMounted: boolean;
};

const NotificationContext = createContext<NotificationContextValue>({ notify: () => undefined, isProviderMounted: false });
const NOTIFICATION_DURATION: Record<NotificationType, number> = {
  success: 10_000,
  info: 10_000,
  error: 30_000,
};
const NOTIFICATION_EXIT_DURATION = 180;
const MAX_NOTIFICATIONS = 4;

// 공통 Notification Context 접근
export function useNotification() {
  return useContext(NotificationContext);
}

// Notification Stack 렌더링
function NotificationCenter({
  notifications,
  onClose,
}: {
  notifications: NotificationItem[];
  onClose: (id: number) => void;
}) {
  return (
    <div className={styles.notificationCenter} aria-label="알림">
      {notifications.map((notification) => (
        <section
          className={`${styles.notification} ${styles[`notification${notification.type[0].toUpperCase()}${notification.type.slice(1)}`]}`}
          data-closing={notification.closing || undefined}
          key={notification.id}
          role={notification.type === "error" ? "alert" : "status"}
          aria-live={notification.type === "error" ? "assertive" : "polite"}
        >
          <div className={styles.notificationIcon} aria-hidden="true">
            {notification.type === "success" ? <CircleCheck /> : null}
            {notification.type === "info" ? <Info /> : null}
            {notification.type === "error" ? <TriangleAlert /> : null}
          </div>
          <div className={styles.notificationCopy}>
            <strong className="type-body">{notification.title}</strong>
            <p className="type-small">{notification.message}</p>
          </div>
          <button className={styles.notificationClose} type="button" aria-label={`${notification.title} 알림 닫기`} onClick={() => onClose(notification.id)}>
            <X aria-hidden="true" />
          </button>
        </section>
      ))}
    </div>
  );
}

// Admin·Tools에서 재사용하는 알림 상태와 Timer 정책
export function NotificationProvider({ children, topOffset }: { children: ReactNode; topOffset?: string }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const notificationId = useRef(0);
  const notificationTimers = useRef(new Map<number, number>());

  const beginExit = useCallback((id: number) => {
    const timer = notificationTimers.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      notificationTimers.current.delete(id);
    }

    notificationTimers.current.set(id, window.setTimeout(() => {
      notificationTimers.current.delete(id);
      setNotifications((current) => current.filter((notification) => notification.id !== id));
    }, NOTIFICATION_EXIT_DURATION));
  }, []);

  const closeNotification = useCallback((id: number) => {
    setNotifications((current) => current.map((notification) => (
      notification.id === id ? { ...notification, closing: true } : notification
    )));
    beginExit(id);
  }, [beginExit]);

  const notify = useCallback((notification: NotificationInput) => {
    const id = notificationId.current + 1;
    notificationId.current = id;
    setNotifications((current) => {
      const active = current.filter((item) => !item.closing);
      const oldestActive = active.length >= MAX_NOTIFICATIONS ? active[0] : null;
      if (oldestActive) beginExit(oldestActive.id);
      return [
        ...current.map((item) => item.id === oldestActive?.id ? { ...item, closing: true } : item),
        { ...notification, id, closing: false },
      ];
    });
    notificationTimers.current.set(id, window.setTimeout(() => closeNotification(id), NOTIFICATION_DURATION[notification.type]));
  }, [beginExit, closeNotification]);

  useEffect(() => () => {
    notificationTimers.current.forEach((timer) => window.clearTimeout(timer));
    notificationTimers.current.clear();
  }, []);

  return (
    <NotificationContext.Provider value={{ notify, isProviderMounted: true }}>
      <div style={topOffset ? { "--notification-top-offset": topOffset } as CSSProperties : undefined}>
      {children}
      <NotificationCenter notifications={notifications} onClose={closeNotification} />
      </div>
    </NotificationContext.Provider>
  );
}

export type { NotificationInput, NotificationType };
