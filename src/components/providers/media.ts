"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 76rem)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** true quando a comanda fica no trilho lateral (mesmo breakpoint "rail" do CSS). */
export function useIsRail() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
