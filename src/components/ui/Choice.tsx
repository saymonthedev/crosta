"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/style";

export type ChoiceOption = { id: string; label: ReactNode; detail?: ReactNode; meta?: ReactNode; disabled?: boolean; disabledReason?: string };

type Props = {
  label: string;
  /** id do elemento que rotula o grupo (quando o título fica fora). */
  labelledBy?: string;
  options: ChoiceOption[];
  value: string | null;
  onChange: (id: string) => void;
  errorId?: string;
  invalid?: boolean;
  layout?: "row" | "grid" | "stack";
  tone?: "paper" | "thermal";
  name?: string;
};

/**
 * Grupo de escolha única sem nada pré-selecionado.
 * Teclado: setas movem e escolhem, como um radiogroup nativo; Tab entra e sai do grupo.
 */
export function Choice({ label, labelledBy, options, value, onChange, errorId, invalid, layout = "row", tone = "paper", name }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  const selectedIndex = options.findIndex((o) => o.id === value);
  const focusIndex = selectedIndex >= 0 ? selectedIndex : (enabled[0] ?? 0);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const pos = enabled.indexOf(index);
    let next = pos;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (pos + 1) % enabled.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (pos - 1 + enabled.length) % enabled.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = enabled.length - 1;
    const target = enabled[next];
    refs.current[target]?.focus();
    onChange(options[target].id);
  };

  return (
    <div
      role="radiogroup"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      aria-describedby={errorId}
      aria-invalid={invalid || undefined}
      data-name={name}
      className={cn(
        layout === "row" && "flex flex-wrap gap-2",
        layout === "grid" && "grid grid-cols-2 gap-2",
        layout === "stack" && "grid gap-2",
      )}
    >
      {options.map((option, index) => {
        const checked = option.id === value;
        return (
          <button
            key={option.id}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-disabled={option.disabled || undefined}
            tabIndex={index === focusIndex ? 0 : -1}
            onClick={() => !option.disabled && onChange(option.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
            title={option.disabled ? option.disabledReason : undefined}
            className={cn(
              "group relative flex min-h-11 items-center gap-3 border-2 px-3 py-2 text-left transition-[background-color,border-color,box-shadow,transform] duration-150",
              layout !== "row" && "w-full",
              checked
                ? "border-cobalto bg-cobalto text-papel shadow-[0_3px_0_#18191c]"
                : cn(
                    "border-grafite/80 text-grafite hover:border-grafite",
                    tone === "thermal" ? "bg-transparent hover:bg-grafite/5" : "bg-termico hover:bg-white",
                    invalid && "border-erro",
                  ),
              option.disabled && "cursor-not-allowed border-dashed opacity-50 hover:bg-transparent",
            )}
          >
            {/* marcador: um quadrado vazado que vira carimbo quando escolhido */}
            <span
              aria-hidden="true"
              className={cn(
                "grid size-4 shrink-0 place-items-center rounded-full border-2 transition-colors",
                checked ? "border-papel bg-papel" : "border-current",
              )}
            >
              <span className={cn("size-1.5 rounded-full transition-transform duration-150", checked ? "scale-100 bg-cobalto" : "scale-0")} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.9375rem] leading-tight font-semibold">{option.label}</span>
              {option.detail ? (
                <span className={cn("mt-0.5 block text-xs leading-snug", checked ? "text-papel/85" : "text-aco-escuro")}>{option.detail}</span>
              ) : null}
            </span>
            {option.meta ? <span className={cn("price shrink-0 text-xs", checked ? "text-papel" : "text-cobalto")}>{option.meta}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
