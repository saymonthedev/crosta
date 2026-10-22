"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/style";

/** Pilha de diálogos abertos: só o de cima responde ao Esc e ao Tab; a página destrava quando o último fecha. */
const stack: symbol[] = [];

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

type Props = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  /** "panel": painel central no desktop, folha inteira no celular. "sheet": sempre folha que sobe do rodapé. */
  variant?: "panel" | "sheet";
  className?: string;
};

/**
 * Diálogo modal próprio: Esc fecha, Tab fica preso dentro, o foco volta para quem abriu,
 * a página de trás não rola e fica inerte para leitores de tela.
 */
export function Dialog({ open, onClose, labelledBy, children, variant = "panel", className }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const id = Symbol("dialog");
    const opener = document.activeElement as HTMLElement | null;
    const root = document.getElementById("app");
    const html = document.documentElement;
    if (!stack.length) {
      const scrollbar = window.innerWidth - html.clientWidth;
      html.style.overflow = "hidden";
      html.style.paddingRight = scrollbar ? `${scrollbar}px` : "";
      root?.setAttribute("inert", "");
    }
    stack.push(id);

    const first = panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel.current)?.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => {
      if (stack.at(-1) !== id) return;
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel.current) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      stack.splice(stack.indexOf(id), 1);
      if (!stack.length) {
        html.style.overflow = "";
        html.style.paddingRight = "";
        root?.removeAttribute("inert");
      }
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <div aria-hidden="true" className="fade-in absolute inset-0 bg-grafite/70" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={cn(
          "sheet-up relative flex w-full flex-col overflow-hidden outline-none",
          variant === "panel" ? "h-[100dvh] md:h-auto md:max-h-[min(92dvh,56rem)] md:max-w-[64rem]" : "max-h-[94dvh]",
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
