"use client";

import { useSyncExternalStore } from "react";

/** Relógio compartilhado: um único intervalo para a página toda, atualizado a cada 30 s. */
let current: Date | null = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    current = new Date();
    timer = setInterval(() => {
      current = new Date();
      listeners.forEach((l) => l());
    }, 30_000);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot() {
  if (!current) current = new Date();
  return current;
}

/** null no servidor e na hidratação: o horário da loja só aparece com o relógio do aparelho. */
export function useNow(): Date | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
