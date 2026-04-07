"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function isSameLocation(href: string) {
  try {
    const u = new URL(href, window.location.origin);
    const cur =
      window.location.pathname +
      window.location.search +
      window.location.hash;
    const next = u.pathname + u.search + u.hash;
    return cur === next;
  } catch {
    return false;
  }
}

function isInternalAppLink(a: HTMLAnchorElement) {
  if (a.target === "_blank" || a.hasAttribute("download")) return false;
  const href = a.getAttribute("href");
  if (!href || href.startsWith("#")) return false;
  try {
    const u = new URL(href, window.location.origin);
    return u.origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Thin top bar after 200ms when an internal navigation is in flight.
 * Dashboard shell stays mounted; this only signals slow route transitions.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const pathnameRef = useRef(pathname);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pathnameRef.current !== pathname) {
      pathnameRef.current = pathname;
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      setVisible(false);
    }
  }, [pathname]);

  useEffect(() => {
    function onPointerDownCapture(e: PointerEvent) {
      const raw = (e.target as Element | null)?.closest?.("a[href]");
      if (!raw || !(raw instanceof HTMLAnchorElement)) return;
      if (!isInternalAppLink(raw)) return;
      const href = raw.getAttribute("href");
      if (!href || isSameLocation(href)) return;

      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      showTimerRef.current = setTimeout(() => {
        showTimerRef.current = null;
        setVisible(true);
      }, 200);
    }

    document.addEventListener("pointerdown", onPointerDownCapture, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDownCapture, true);
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-0 z-[200] h-0.5 overflow-hidden bg-slate-200/90 dark:bg-slate-700/90"
      aria-hidden
    >
      <div className="h-full w-[38%] rounded-full bg-slate-900 dark:bg-slate-100 animate-navigation-route-bar" />
    </div>
  );
}
