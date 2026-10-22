"use client";

import { useState } from "react";
import { customBurger, extrasCatalog, type ExtraId } from "@/data/menu";
import { formatBRL } from "@/lib/money";
import { emptyConfig, extraRoom, meatGrams, stackLayers, unitPrice, validateConfig, type LineConfig, type StackLayer } from "@/lib/order";
import { cn } from "@/lib/style";
import { BurgerStack } from "../BurgerStack";
import { useComanda } from "../providers/Comanda";
import { Choice } from "../ui/Choice";
import { Stepper } from "../ui/Stepper";

const shelves: { title: string; ids: ExtraId[] }[] = [
  { title: "Carne e queijo", ids: ["smash", "cheddar", "prato"] },
  { title: "Da chapa", ids: ["bacon", "cebola-chapa", "cebola-caramelizada"] },
  { title: "Frescos", ids: ["cebola-crua", "picles", "alface", "tomate"] },
  { title: "Molhos", ids: ["molho-casa", "maionese-defumada", "mostarda", "ketchup"] },
];

/**
 * Monte seu smash: a ficha técnica desenha cada camada que você escolhe.
 * Desktop: ficha fixa à esquerda, escolhas à direita.
 * Celular: a pilha encolhe numa faixa presa no topo enquanto você rola as escolhas.
 */
export function Builder() {
  const { add } = useComanda();
  const product = customBurger;
  const [config, setConfig] = useState<LineConfig>(emptyConfig);
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const chosen = stackLayers(product, config);
  // Sem pão escolhido, a ficha mostra o lugar dele tracejado.
  const layers: StackLayer[] = config.choices.pao
    ? chosen
    : [
        { key: "pao-base", kind: "brioche", label: "pão: escolha abaixo", ghost: true },
        ...chosen,
        { key: "pao-topo", kind: "brioche", label: "pão: escolha abaixo", ghost: true },
      ];
  const errors = validateConfig(product, config);
  const price = unitPrice(product, config);
  const grams = meatGrams(product, config);
  const bunGroup = product.groups!.find((g) => g.id === "pao")!;
  const pontoGroup = product.groups!.find((g) => g.id === "ponto")!;
  const label = `Desenho do seu burger, de baixo para cima: ${layers.map((l) => l.label.toLowerCase()).join(", ") || "só a carne"}.`;

  const setExtra = (id: ExtraId, n: number) => {
    const extras = { ...config.extras, [id]: n };
    if (!n) delete extras[id];
    setConfig({ ...config, extras });
    setDone(null);
  };

  const submit = () => {
    setTried(true);
    const missing = Object.keys(errors)[0];
    if (missing) {
      const el = document.querySelector<HTMLElement>(`[data-builder-group="${missing}"]`);
      el?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      el?.querySelector<HTMLElement>('[role="radio"]')?.focus({ preventScroll: true });
      return;
    }
    add(product.id, config, 1);
    setConfig(emptyConfig());
    setTried(false);
    setDone("Impresso na comanda. A ficha voltou para o começo, caso queira montar outro.");
  };

  const summary = (
    <dl className="mono grid grid-cols-3 gap-3 text-[0.6875rem]">
      <div>
        <dt className="text-aco-escuro">camadas</dt>
        <dd className="text-base font-semibold">{chosen.length}</dd>
      </div>
      <div>
        <dt className="text-aco-escuro">carne</dt>
        <dd className="text-base font-semibold">{grams} g</dd>
      </div>
      <div className="text-right">
        <dt className="text-aco-escuro">preço</dt>
        <dd className="price text-base">{formatBRL(price)}</dd>
      </div>
    </dl>
  );

  const addButton = (
    <button type="button" onClick={submit} className="btn btn-chapa w-full justify-between">
      <span>Pôr na comanda</span>
      <span className="price">{formatBRL(price)}</span>
    </button>
  );

  return (
    <section id="monte" aria-labelledby="monte-titulo" className="border-t-2 border-grafite bg-cobalto">
      <div className="on-ink px-5 pt-14 pb-8 text-papel sm:px-8 lg:pt-20">
        <p className="mono text-xs font-semibold text-papel/80">Ficha técnica · do seu jeito</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 id="monte-titulo" className="display text-[clamp(2.75rem,7.5vw,5.25rem)] [font-stretch:120%]">
            Monte seu smash
          </h2>
          <p className="max-w-[24rem] text-[0.9375rem] leading-snug text-papel/85 md:pb-2 md:text-right">
            Pão e uma carne de 90 g por {formatBRL(product.price)}. Cada camada que você soma aparece na ficha com o preço dela.
          </p>
        </div>
      </div>

      <div className="grid border-t-2 border-grafite bg-papel lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        {/* Celular: faixa presa no topo, logo abaixo das categorias */}
        <div className="steel-light sticky top-[3.6rem] z-20 flex items-center gap-4 border-b-2 border-grafite px-5 py-2 lg:hidden">
          <BurgerStack layers={layers} mode="compact" label={label} className="h-28 w-auto shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="price text-2xl">{formatBRL(price)}</p>
            <p className="mono mt-1 text-[0.6875rem] text-aco-escuro">
              {chosen.length} {chosen.length === 1 ? "camada" : "camadas"} · {grams} g de carne
            </p>
          </div>
        </div>

        {/* Desktop: ficha técnica com vista explodida */}
        <div className="steel-light hidden border-r-2 border-grafite lg:block">
          <div className="sticky top-[3.6rem] flex h-[calc(100dvh-3.6rem)] max-h-[46rem] flex-col gap-4 p-6">
            <BurgerStack layers={layers} mode="exploded" label={label} className="min-h-0 w-full flex-1" />
            <div className="thermal border-2 border-grafite p-4">
              {summary}
              <div className="mt-4">{addButton}</div>
              <p role="status" className="mt-2 min-h-4 text-xs text-ok">
                {done}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-9 px-5 py-8 sm:px-8 lg:py-10">
          <div data-builder-group="pao">
            <h3 id="b-pao" className="mb-3 flex items-baseline justify-between text-[0.9375rem] font-bold">
              Pão <span className="text-xs font-normal text-aco-escuro">obrigatório</span>
            </h3>
            <Choice
              label="Pão"
              labelledBy="b-pao"
              layout="stack"
              value={config.choices.pao?.[0] ?? null}
              invalid={tried && !!errors.pao}
              onChange={(id) => {
                setConfig({ ...config, choices: { ...config.choices, pao: [id] } });
                setDone(null);
              }}
              options={bunGroup.options.map((o) => ({ id: o.id, label: o.label, meta: o.delta ? `+${formatBRL(o.delta)}` : "incluso" }))}
            />
            {tried && errors.pao ? <p role="alert" className="mt-2 text-[0.8125rem] font-semibold text-erro">Escolha o pão.</p> : null}
          </div>

          <div data-builder-group="ponto">
            <h3 id="b-ponto" className="mb-1 flex items-baseline justify-between text-[0.9375rem] font-bold">
              Ponto da carne <span className="text-xs font-normal text-aco-escuro">obrigatório</span>
            </h3>
            <p className="mb-3 text-sm text-aco-escuro">{pontoGroup.hint}</p>
            <Choice
              label="Ponto da carne"
              labelledBy="b-ponto"
              value={config.choices.ponto?.[0] ?? null}
              invalid={tried && !!errors.ponto}
              onChange={(id) => setConfig({ ...config, choices: { ...config.choices, ponto: [id] } })}
              options={pontoGroup.options.map((o) => ({ id: o.id, label: o.label }))}
            />
            {tried && errors.ponto ? <p role="alert" className="mt-2 text-[0.8125rem] font-semibold text-erro">Escolha o ponto.</p> : null}
          </div>

          {shelves.map((shelf) => {
            const limit = product.extraLimits?.find((l) => shelf.ids.some((id) => l.ids.includes(id)));
            return (
              <div key={shelf.title}>
                <h3 className="mb-2 flex items-baseline justify-between gap-3 text-[0.9375rem] font-bold">
                  {shelf.title}
                  {limit ? <span className="text-right text-xs font-normal text-aco-escuro">{limit.label}</span> : null}
                </h3>
                <ul>
                  {shelf.ids.map((id) => {
                    const item = extrasCatalog[id];
                    const own = product.extras!.find((e) => e.id === id)!;
                    const n = config.extras[id] ?? 0;
                    const room = extraRoom(product, config, id);
                    return (
                      <li key={id} className={cn("flex items-center justify-between gap-3 border-b border-dashed border-grafite/30 py-2.5", n > 0 && "bg-cobalto-claro/50 -mx-2 px-2")}>
                        <span className="min-w-0">
                          <span className="block text-[0.9375rem] font-semibold">
                            {id === "smash" ? "Carne smash extra (90 g)" : item.label}
                          </span>
                          <span className="price text-xs font-medium text-aco-escuro">{item.price ? `+${formatBRL(item.price)} cada` : "sem custo"}</span>
                        </span>
                        <Stepper
                          size="sm"
                          label={item.label}
                          value={n}
                          min={0}
                          max={n + room}
                          onChange={(v) => setExtra(id, v)}
                          maxReason={room === 0 && n < own.max && limit ? limit.label : id === "smash" ? "Limite da casa: quatro carnes por pão." : `Até ${own.max}.`}
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          <div className="lg:hidden">
            {addButton}
            <p role="status" className="mt-2 min-h-4 text-xs text-ok">
              {done}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
