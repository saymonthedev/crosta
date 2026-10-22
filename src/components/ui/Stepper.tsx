"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/style";

type Props = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Nome do que está sendo contado, para leitores de tela ("Quantidade de bacon"). */
  label: string;
  size?: "sm" | "md";
  /** Por que não dá para aumentar (aparece como dica no botão +). */
  maxReason?: string;
  tone?: "paper" | "ink";
};

/** Contador de chapa: dois botões quadrados e o número no meio, em mono. */
export function Stepper({ value, min, max, onChange, label, size = "md", maxReason, tone = "paper" }: Props) {
  const box = size === "sm" ? "size-8" : "size-10";
  const btn = cn(
    "grid place-items-center border-2 transition-[background-color,transform] duration-100 active:translate-y-px disabled:opacity-35",
    box,
    tone === "paper" ? "border-grafite bg-termico hover:enabled:bg-aco-claro" : "border-papel/70 text-papel hover:enabled:bg-papel/10",
  );
  return (
    <div role="group" aria-label={label} className="inline-flex items-center">
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Menos ${label.toLowerCase()}`}>
        <Minus aria-hidden="true" className="size-4" strokeWidth={2.5} />
      </button>
      <output aria-live="polite" className={cn("price grid place-items-center tabular-nums", size === "sm" ? "w-8 text-sm" : "w-11 text-base")}>
        {value}
      </output>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`Mais ${label.toLowerCase()}`}
        title={value >= max ? maxReason : undefined}
      >
        <Plus aria-hidden="true" className="size-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}
