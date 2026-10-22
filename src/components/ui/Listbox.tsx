"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/style";

export type ListboxOption = { id: string; label: string; meta?: ReactNode; detail?: ReactNode };

type Props = {
  id: string;
  label: string;
  placeholder: string;
  options: ListboxOption[];
  value: string | null;
  onChange: (id: string) => void;
  error?: string;
  hint?: ReactNode;
};

/**
 * Seletor próprio: a lista abre logo abaixo, dentro do fluxo (não fica cortada dentro da comanda).
 * Teclado: Enter/Espaço/setas abrem; setas navegam; Enter escolhe; Esc fecha e devolve o foco.
 */
export function Listbox({ id, label, placeholder, options, value, onChange, error, hint }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.id === value) ?? null;

  // A lista recebe o foco assim que aparece, para as setas funcionarem de imediato.
  useEffect(() => {
    if (open) list.current?.focus();
  }, [open]);

  const openList = () => {
    setActive(Math.max(0, options.findIndex((o) => o.id === value)));
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    button.current?.focus();
  };
  const choose = (index: number) => {
    onChange(options[index].id);
    close();
  };

  const onButtonKey = (event: KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      openList();
    }
  };

  const onListKey = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown") setActive((a) => Math.min(options.length - 1, a + 1));
    else if (event.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
    else if (event.key === "Home") setActive(0);
    else if (event.key === "End") setActive(options.length - 1);
    else if (event.key === "Enter" || event.key === " ") choose(active);
    else if (event.key === "Escape") {
      event.stopPropagation();
      close();
    } else if (event.key === "Tab") setOpen(false);
    else return;
    event.preventDefault();
  };

  const describedBy = [error ? `${id}-error` : null, hint && !error ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="grid gap-1">
      <span id={`${id}-label`} className="text-sm font-semibold">
        {label}
      </span>
      <button
        ref={button}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={`${id}-label ${id}`}
        aria-describedby={describedBy}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onButtonKey}
        className={cn(
          "field flex items-center justify-between gap-3 text-left",
          !selected && "text-aco-escuro",
        )}
      >
        <span className="min-w-0 truncate">{selected ? selected.label : placeholder}</span>
        <span className="flex shrink-0 items-center gap-2">
          {selected?.meta ? <span className="price text-sm text-grafite">{selected.meta}</span> : null}
          <ChevronDown aria-hidden="true" className={cn("size-4 transition-transform duration-200", open && "rotate-180")} />
        </span>
      </button>
      {open ? (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={`${id}-label`}
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onListKey}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node) && e.relatedTarget !== button.current) setOpen(false);
          }}
          className="fade-in mt-1 border-2 border-grafite bg-termico shadow-[0_4px_0_#18191c] outline-none focus-visible:outline-3 focus-visible:outline-cobalto"
        >
          {options.map((option, index) => (
            <li
              key={option.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option.id === value}
              onMouseMove={() => active !== index && setActive(index)}
              onClick={() => choose(index)}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 border-b border-dashed border-grafite/25 px-3 py-2.5 last:border-b-0",
                index === active && "bg-cobalto text-papel",
              )}
            >
              <span className="min-w-0">
                <span className="block text-[0.9375rem] font-semibold">{option.label}</span>
                {option.detail ? <span className={cn("block text-xs", index === active ? "text-papel/85" : "text-aco-escuro")}>{option.detail}</span> : null}
              </span>
              {option.meta ? <span className="price text-sm">{option.meta}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs leading-snug text-aco-escuro">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="nudge flex items-start gap-1.5 text-[0.8125rem] leading-snug font-semibold text-erro">
          <span aria-hidden="true" className="mt-[0.3rem] size-2 shrink-0 bg-erro" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
