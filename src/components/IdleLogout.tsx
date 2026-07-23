"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/actions/auth";

// Cierre de sesión por inactividad (privacidad en pantalla — §4.6-10).
export function IdleLogout({ minutes = 15 }: { minutes?: number }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        await logoutAction();
        router.push("/login");
      }, minutes * 60_000);
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (timer.current) clearTimeout(timer.current);
    };
  }, [minutes, router]);

  return null;
}
