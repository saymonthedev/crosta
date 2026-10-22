"use client";

import { extrasCatalog, type Product } from "@/data/menu";
import { store } from "@/data/store";
import { formatBRL, formatDelta } from "@/lib/money";
import { extraRoom, type LineConfig } from "@/lib/order";
import { cn } from "@/lib/style";
import { Choice } from "./ui/Choice";
import { AreaField } from "./ui/Field";
import { Stepper } from "./ui/Stepper";

type Props = {
  product: Product;
  config: LineConfig;
  onChange: (config: LineConfig) => void;
  errors: Record<string, string>;
  /** Mostrar erros só depois da primeira tentativa de adicionar. */
  showErrors: boolean;
  idPrefix: string;
  /** Esconde grupos tratados fora (ex.: o pão no Monte seu smash). */
  hideGroups?: string[];
  hideNotes?: boolean;
};

function SectionTitle({ id, children, aside }: { id?: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h3 id={id} className="text-[0.9375rem] font-bold">
        {children}
      </h3>
      {aside ? <span className="text-xs text-aco-escuro">{aside}</span> : null}
    </div>
  );
}

/** Formulário de escolhas de um produto: grupos obrigatórios, retirar, extras e observação. */
export function Customizer({ product, config, onChange, errors, showErrors, idPrefix, hideGroups = [], hideNotes }: Props) {
  const groups = (product.groups ?? []).filter((g) => !hideGroups.includes(g.id));
  const removable = (product.ingredients ?? []).filter((i) => i.removable);
  const limitErrors = Object.entries(errors).filter(([k]) => k.startsWith("limite:"));

  const setChoice = (groupId: string, optionId: string) => onChange({ ...config, choices: { ...config.choices, [groupId]: [optionId] } });
  const toggleRemoved = (id: string) =>
    onChange({ ...config, removed: config.removed.includes(id) ? config.removed.filter((x) => x !== id) : [...config.removed, id] });
  const setExtra = (id: string, n: number) => {
    const extras = { ...config.extras, [id]: n };
    if (!n) delete extras[id];
    onChange({ ...config, extras });
  };

  return (
    <div className="grid gap-8">
      {groups.map((group) => {
        const error = showErrors ? errors[group.id] : undefined;
        const errorId = `${idPrefix}-${group.id}-erro`;
        return (
          <section key={group.id} aria-labelledby={`${idPrefix}-${group.id}`} data-group={group.id}>
            <SectionTitle id={`${idPrefix}-${group.id}`} aside={group.min ? "obrigatório" : undefined}>
              {group.label}
            </SectionTitle>
            {group.hint ? <p className="-mt-2 mb-3 text-sm text-aco-escuro">{group.hint}</p> : null}
            <Choice
              label={group.label}
              labelledBy={`${idPrefix}-${group.id}`}
              value={config.choices[group.id]?.[0] ?? null}
              onChange={(id) => setChoice(group.id, id)}
              invalid={!!error}
              errorId={error ? errorId : undefined}
              layout={group.options.length > 3 ? "grid" : "row"}
              options={group.options.map((o) => ({ id: o.id, label: o.label, detail: o.detail, meta: o.delta ? formatDelta(o.delta) : undefined }))}
            />
            {error ? (
              <p id={errorId} role="alert" className="nudge mt-2 flex items-start gap-1.5 text-[0.8125rem] font-semibold text-erro">
                <span aria-hidden="true" className="mt-[0.3rem] size-2 shrink-0 bg-erro" />
                {error}
              </p>
            ) : null}
          </section>
        );
      })}

      {removable.length ? (
        <section aria-labelledby={`${idPrefix}-tirar`}>
          <SectionTitle id={`${idPrefix}-tirar`} aside="toque para tirar">
            Vai no pão
          </SectionTitle>
          <ul className="flex flex-wrap gap-2">
            {removable.map((ing) => {
              const out = config.removed.includes(ing.id);
              return (
                <li key={ing.id}>
                  <button
                    type="button"
                    aria-pressed={out}
                    onClick={() => toggleRemoved(ing.id)}
                    className={cn(
                      "flex min-h-10 items-center gap-2 border-2 px-3 text-sm font-semibold transition-colors duration-150",
                      out ? "border-dashed border-aco-escuro bg-transparent text-aco-escuro" : "border-grafite bg-termico hover:bg-white",
                    )}
                  >
                    <span className={cn(out && "line-through decoration-2")}>{ing.label}</span>
                    <span className={cn("mono text-[0.6875rem] font-semibold", out ? "text-erro" : "text-cobalto")}>{out ? "sem" : "tirar"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {product.extras?.length ? (
        <section aria-labelledby={`${idPrefix}-extras`}>
          <SectionTitle id={`${idPrefix}-extras`} aside="cobrado por unidade">
            Extras
          </SectionTitle>
          <ul className="grid">
            {product.extras.map((extra) => {
              const item = extrasCatalog[extra.id];
              const n = config.extras[extra.id] ?? 0;
              const room = extraRoom(product, config, extra.id);
              const limit = product.extraLimits?.find((l) => l.ids.includes(extra.id));
              return (
                <li key={extra.id} className="flex items-center justify-between gap-3 border-b border-dashed border-grafite/25 py-2 last:border-b-0">
                  <span className="min-w-0">
                    <span className="block text-[0.9375rem] font-semibold">{item.label}</span>
                    <span className="price text-xs font-medium text-aco-escuro">
                      {item.price ? formatBRL(item.price) : "sem custo"} · até {extra.max}
                    </span>
                  </span>
                  <Stepper
                    size="sm"
                    label={item.label}
                    value={n}
                    min={0}
                    max={n + room}
                    onChange={(v) => setExtra(extra.id, v)}
                    maxReason={room === 0 && limit && n < extra.max ? limit.label : `Até ${extra.max}.`}
                  />
                </li>
              );
            })}
          </ul>
          {product.extraLimits?.length ? (
            <ul className="mt-3 grid gap-1 text-xs text-aco-escuro">
              {product.extraLimits.map((l) => (
                <li key={l.label}>{l.label}</li>
              ))}
            </ul>
          ) : null}
          {product.note ? <p className="mt-3 text-xs text-aco-escuro">{product.note}</p> : null}
          {showErrors && limitErrors.length ? (
            <p role="alert" className="mt-2 text-[0.8125rem] font-semibold text-erro">
              {limitErrors.map(([, m]) => m).join(" ")}
            </p>
          ) : null}
        </section>
      ) : product.note ? (
        <p className="text-sm text-aco-escuro">{product.note}</p>
      ) : null}

      {!hideNotes ? (
        <AreaField
          id={`${idPrefix}-obs`}
          name={`${idPrefix}-obs-cozinha`}
          label="Observação para a cozinha"
          optional
          maxLength={store.notesMax}
          value={config.notes}
          onChange={(e) => onChange({ ...config, notes: e.target.value.slice(0, store.notesMax) })}
          placeholder="Ex.: cortar ao meio"
          hint="Pedidos de troca de ingrediente que não estão nas opções dependem da cozinha."
          error={showErrors ? errors.notes : undefined}
        />
      ) : null}
    </div>
  );
}
