"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/style";

/**
 * Atributos que pedem ao navegador e aos gerenciadores de senha para não sugerir nada.
 * Navegadores podem ignorar `autocomplete="off"` em alguns casos; por isso os nomes dos campos
 * também não usam termos reconhecíveis (address, street, name).
 */
export const noSuggest = {
  autoComplete: "off",
  autoCorrect: "off",
  spellCheck: false,
  "aria-autocomplete": "none",
  "data-1p-ignore": "",
  "data-lpignore": "true",
  "data-form-type": "other",
  "data-bwignore": "",
} as const;

type FieldShellProps = {
  id: string;
  label: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  counter?: { value: number; max: number };
  children: ReactNode;
  className?: string;
};

export function FieldShell({ id, label, optional, hint, error, counter, children, className }: FieldShellProps) {
  return (
    <div className={cn("grid gap-1", className)}>
      <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-sm font-semibold">
        <span>
          {label}
          {optional ? <span className="ml-1.5 font-normal text-aco-escuro">opcional</span> : null}
        </span>
        {counter ? (
          <span className={cn("mono text-[0.6875rem] font-normal", counter.value > counter.max ? "text-erro" : "text-aco-escuro")} aria-hidden="true">
            {counter.value}/{counter.max}
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs leading-snug text-aco-escuro">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="nudge flex items-start gap-1.5 text-[0.8125rem] leading-snug font-semibold text-erro" role="alert">
          <span aria-hidden="true" className="mt-[0.3rem] size-2 shrink-0 bg-erro" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & FieldShellPropsBase;
type FieldShellPropsBase = { id: string; label: string; optional?: boolean; hint?: ReactNode; error?: string; showCounter?: boolean; shellClassName?: string };

export const LineField = forwardRef<HTMLInputElement, InputProps>(function LineField(
  { id, label, optional, hint, error, showCounter, shellClassName, className, maxLength, value, ...rest },
  ref,
) {
  const describedBy = [error ? `${id}-error` : null, hint && !error ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <FieldShell
      id={id}
      label={label}
      optional={optional}
      hint={hint}
      error={error}
      className={shellClassName}
      counter={showCounter && maxLength ? { value: String(value ?? "").length, max: maxLength } : undefined}
    >
      <input
        ref={ref}
        id={id}
        value={value}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn("field", className)}
        {...noSuggest}
        {...rest}
      />
    </FieldShell>
  );
});

type AreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & FieldShellPropsBase;

export const AreaField = forwardRef<HTMLTextAreaElement, AreaProps>(function AreaField(
  { id, label, optional, hint, error, shellClassName, className, maxLength, value, ...rest },
  ref,
) {
  const describedBy = [error ? `${id}-error` : null, hint && !error ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <FieldShell
      id={id}
      label={label}
      optional={optional}
      hint={hint}
      error={error}
      className={shellClassName}
      counter={maxLength ? { value: String(value ?? "").length, max: maxLength } : undefined}
    >
      <textarea
        ref={ref}
        id={id}
        value={value}
        maxLength={maxLength}
        rows={2}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn("field min-h-[4.5rem] resize-none leading-snug", className)}
        {...noSuggest}
        {...rest}
      />
    </FieldShell>
  );
});
