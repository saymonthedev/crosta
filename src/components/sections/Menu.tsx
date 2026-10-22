"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { categories, productById, products, type Product } from "@/data/menu";
import { campaign } from "@/data/offers";
import { photos } from "@/data/photos";
import { formatBRL } from "@/lib/money";
import { emptyConfig } from "@/lib/order";
import { campaignActive } from "@/lib/pricing";
import { cn } from "@/lib/style";
import { useComanda } from "../providers/Comanda";
import { Builder } from "./Builder";

const tabs = [
  { id: "burgers", label: "Burgers" },
  { id: "monte", label: "Monte o seu" },
  { id: "combos", label: "Combos" },
  { id: "acompanhamentos", label: "Acompanhamentos" },
  { id: "bebidas", label: "Bebidas e sobremesas" },
];

const byCategory = (id: string) => products.filter((p) => p.category === id);
const needsDialog = (p: Product) => !!(p.groups?.length || p.ingredients?.length || p.extras?.length);

function useOrder() {
  const { add, openProduct } = useComanda();
  return (p: Product) => (needsDialog(p) ? openProduct(p.id) : add(p.id, emptyConfig(), 1));
}

/** Barra de etiquetas de prateleira: fica presa no topo e marca onde você está. */
function CategoryBar() {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    // A categoria ativa é a última cujo topo já passou da barra.
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string | null = null;
      for (const t of tabs) {
        const el = document.getElementById(t.id);
        if (el && el.getBoundingClientRect().top <= 140) current = t.id;
      }
      const end = document.getElementById("bebidas");
      if (end && end.getBoundingClientRect().bottom < 140) current = null;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <nav aria-label="Categorias do cardápio" className="steel sticky top-0 z-30 border-y-2 border-grafite">
      <ul className="no-scrollbar flex gap-2 overflow-x-auto px-5 py-2.5 sm:px-8">
        {tabs.map((t) => (
          <li key={t.id} className="shrink-0">
            <a
              href={`#${t.id}`}
              aria-current={active === t.id ? "true" : undefined}
              className={cn(
                "block border-2 px-3 py-1.5 text-sm font-bold whitespace-nowrap transition-[background-color,color,box-shadow] duration-150",
                active === t.id ? "border-grafite bg-cobalto text-papel shadow-[0_3px_0_#18191c]" : "border-grafite/70 bg-termico hover:border-grafite",
              )}
            >
              {t.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function CategoryHead({ id, title, count, blurb, tone = "paper", stacked }: { id: string; title: string; count?: number; blurb: string; tone?: "paper" | "ink"; stacked?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-3", !stacked && "md:flex-row md:items-end md:justify-between")}>
      <h2 id={`${id}-titulo`} className="display text-[clamp(2.1rem,10.5vw,5.5rem)] [font-stretch:58%]">
        {title}
        {count ? <span className={cn("mono ml-3 align-top text-sm font-semibold tracking-normal normal-case", tone === "ink" ? "text-papel/70" : "text-aco-escuro")}>{count}</span> : null}
      </h2>
      <p className={cn("max-w-[22rem] text-[0.9375rem] leading-snug", !stacked && "md:pb-2 md:text-right", tone === "ink" ? "text-papel/80" : "text-aco-escuro")}>{blurb}</p>
    </div>
  );
}

function meatLine(p: Product) {
  const patties = (p.ingredients ?? []).filter((i) => i.layer === "patty").reduce((s, i) => s + (i.count ?? 1), 0);
  if (patties) return `${patties} ${patties === 1 ? "carne" : "carnes"} · ${patties * 90} g`;
  if (p.ingredients?.some((i) => i.layer === "patty-veg")) return "vegetariano";
  if (p.ingredients?.some((i) => i.layer === "chicken")) return "frango";
  return null;
}

function Burgers() {
  const order = useOrder();
  const [feature, ...rest] = byCategory("burgers");
  const cat = categories.find((c) => c.id === "burgers")!;
  const photo = photos[feature.photo!];
  return (
    <section id="burgers" aria-labelledby="burgers-titulo" className="px-5 pt-14 pb-6 sm:px-8 lg:pt-20">
      <CategoryHead id="burgers" title="Burgers" count={byCategory("burgers").length} blurb={cat.blurb} />

      {/* O da casa: destaque editorial */}
      <article aria-labelledby="crosta-nome" className="mt-10 grid gap-6 border-2 border-grafite bg-termico md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-0">
        <div className="relative aspect-square border-b-2 border-grafite md:border-r-2 md:border-b-0">
          <Image src={photo.src} alt={photo.alt} fill placeholder="blur" sizes="(min-width: 1216px) 32vw, (min-width: 768px) 48vw, 100vw" className="object-cover" />
          <p className="mono absolute top-0 left-0 bg-grafite px-3 py-1.5 text-[0.6875rem] font-semibold text-papel">o da casa</p>
        </div>
        <div className="@container flex flex-col justify-between gap-8 px-5 pb-6 md:p-8">
          <div>
            <h3 id="crosta-nome" className="display text-[15.4cqw] text-cobalto [font-stretch:150%]">
              {feature.name}
            </h3>
            <p className="mt-4 max-w-[28rem] text-[1.0625rem] leading-relaxed text-pretty">{feature.description}</p>
            <ol className="mono mt-6 grid gap-1 text-[0.75rem] text-grafite/80" aria-label="Montagem, de cima para baixo">
              {[...(feature.ingredients ?? [])].reverse().map((i) => (
                <li key={i.id} className="flex justify-between gap-3 border-b border-dashed border-grafite/25 pb-1">
                  <span>{i.label.toLowerCase()}</span>
                  <span className="text-aco-escuro">{i.count && i.count > 1 ? `x${i.count}` : ""}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="price text-3xl">{formatBRL(feature.price)}</p>
            <button type="button" onClick={() => order(feature)} className="btn btn-chapa" aria-label={`Escolher o ponto e pedir o ${feature.name}`}>
              Escolher o ponto e pedir
            </button>
          </div>
        </div>
      </article>

      {/* Os outros: linhas de cardápio, foto quadrada, preço à direita */}
      <ul className="mt-4">
        {rest.map((p) => {
          const ph = photos[p.photo!];
          const meat = meatLine(p);
          return (
            <li key={p.id} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 border-b-2 border-grafite py-5 sm:grid-cols-[9.5rem_minmax(0,1fr)_auto] sm:gap-x-6">
              <button
                type="button"
                onClick={() => order(p)}
                tabIndex={-1}
                aria-hidden="true"
                className="group relative aspect-square self-start overflow-hidden border-2 border-grafite"
              >
                <Image src={ph.src} alt="" fill placeholder="blur" sizes="(min-width: 640px) 9.5rem, 6.5rem" className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]" />
              </button>
              <div className="min-w-0">
                <h3 className="display text-[clamp(1.9rem,4.4vw,2.6rem)] [font-stretch:72%]">{p.name}</h3>
                <p className="mt-2 max-w-[34rem] text-[0.9375rem] leading-snug text-pretty">{p.description}</p>
                {meat ? <p className="mono mt-2 text-[0.6875rem] text-aco-escuro">{meat}</p> : null}
              </div>
              <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end sm:justify-start">
                <p className="price text-lg">{formatBRL(p.price)}</p>
                <button type="button" onClick={() => order(p)} className="btn btn-tinta btn-sm" aria-label={`Montar ${p.name}`}>
                  Montar
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Combos() {
  const order = useOrder();
  const { serviceWeekday } = useComanda();
  const [combo, dupla] = byCategory("combos");
  const cat = categories.find((c) => c.id === "combos")!;
  const photo = photos.bandeja;
  const batata = productById("batata")!;
  const lata = productById("lata")!;
  const prensado = productById("prensado")!;
  const separate = prensado.price + batata.price + lata.price;
  const promo = campaignActive(serviceWeekday);

  return (
    <section id="combos" aria-labelledby="combos-titulo" className="steel-light border-y-2 border-grafite px-5 py-14 sm:px-8 lg:py-20">
      <CategoryHead id="combos" title="Combos" count={2} blurb={cat.blurb} />
      <article aria-labelledby="combo-nome" className="mt-10 grid border-2 border-grafite bg-termico lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="relative aspect-[4/3] border-b-2 border-grafite lg:aspect-auto lg:min-h-[26rem] lg:border-r-2 lg:border-b-0">
          <Image src={photo.src} alt={photo.alt} fill placeholder="blur" sizes="(min-width: 1216px) 36vw, (min-width: 1024px) 55vw, 100vw" className="object-cover" />
        </div>
        <div className="flex flex-col gap-6 p-5 md:p-8">
          <div>
            <h3 id="combo-nome" className="display text-[clamp(2.5rem,6vw,3.75rem)] [font-stretch:80%]">
              {combo.name}
            </h3>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-pretty">{combo.description}</p>
          </div>
          <dl className="mono grid gap-1.5 text-[0.75rem] [&_dd]:whitespace-nowrap" aria-label="O que vem na bandeja">
            <div className="flex justify-between gap-3">
              <dt>burger da casa</dt>
              <dd className="text-right whitespace-normal! text-aco-escuro">Prensado, Crosta ou Defumado</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>batata da chapa pequena</dt>
              <dd>{formatBRL(batata.price)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>lata 350 ml</dt>
              <dd>{formatBRL(lata.price)}</dd>
            </div>
            <div aria-hidden="true" className="perf my-1" />
            <div className="flex justify-between gap-3 text-aco-escuro">
              <dt>separados, com Prensado</dt>
              <dd>
                <s>{formatBRL(separate)}</s>
              </dd>
            </div>
            <div className="flex justify-between gap-3 text-[0.9375rem] font-bold">
              <dt>na bandeja</dt>
              <dd>{formatBRL(combo.price)}</dd>
            </div>
          </dl>
          <p className="text-xs text-aco-escuro">Crosta na bandeja: +{formatBRL(1200)}. Defumado: +{formatBRL(1500)}.</p>
          <button type="button" onClick={() => order(combo)} className="btn btn-chapa self-start">
            Montar a bandeja
          </button>
        </div>
      </article>

      <article aria-labelledby="dupla-nome" className="mt-4 flex flex-col gap-4 border-2 border-grafite bg-chapa p-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <div>
          <h3 id="dupla-nome" className="display text-[2.25rem] [font-stretch:70%]">
            {dupla.name}
          </h3>
          <p className="mt-1 text-[0.9375rem]">
            {dupla.description}{" "}
            <a href="#campanha" className="font-semibold underline decoration-2 underline-offset-4">
              Regras da campanha
            </a>
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
          <p className="price text-lg sm:text-right">
            {promo ? (
              <>
                <s className="mr-2 text-sm font-normal">{formatBRL(dupla.price)}</s>
                {formatBRL(campaign.promoPrice)}
              </>
            ) : (
              <>
                {formatBRL(dupla.price)}
                <span className="block text-xs font-medium">{formatBRL(campaign.promoPrice)} em {campaign.daysLabel}</span>
              </>
            )}
          </p>
          <button type="button" onClick={() => order(dupla)} className="btn btn-papel btn-sm">
            Pedir
          </button>
        </div>
      </article>
    </section>
  );
}

/** Botões de opção direta: escolher o tamanho ou o sabor já põe na comanda. */
function QuickOptions({ product, tone = "paper" }: { product: Product; tone?: "paper" | "ink" }) {
  const { add } = useComanda();
  const group = product.groups![0];
  const priced = group.options.some((o) => o.delta);
  return (
    <ul className="flex flex-wrap gap-2" aria-label={`${product.name}: ${group.label.toLowerCase()}`}>
      {group.options.map((o) => (
        <li key={o.id}>
          <button
            type="button"
            disabled={!!product.unavailable}
            onClick={() => add(product.id, { ...emptyConfig(), choices: { [group.id]: [o.id] } }, 1)}
            className={cn(
              "group flex min-h-10 items-center gap-2 border-2 px-3 text-sm font-semibold transition-[background-color,color,transform] duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40",
              tone === "paper" ? "border-grafite bg-termico hover:enabled:bg-cobalto hover:enabled:text-papel" : "border-papel/70 text-papel hover:enabled:border-chapa hover:enabled:bg-chapa hover:enabled:text-grafite",
            )}
          >
            <span className="sr-only">Pôr na comanda {product.name}: </span>
            {o.label}
            {o.detail ? <span className="mono text-[0.6875rem] font-normal opacity-75">{o.detail}</span> : null}
            {priced ? <span className="price text-xs">{formatBRL(product.price + (o.delta ?? 0))}</span> : null}
            <Plus aria-hidden="true" className="size-4" strokeWidth={2.5} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function Sides() {
  const order = useOrder();
  const [batata, cheddar, aneis] = byCategory("acompanhamentos");
  const cat = categories.find((c) => c.id === "acompanhamentos")!;
  return (
    <section id="acompanhamentos" aria-labelledby="acompanhamentos-titulo" className="px-5 py-14 sm:px-8 lg:py-20">
      <CategoryHead id="acompanhamentos" title="Acompanhamentos" count={3} blurb={cat.blurb} />

      {/* Batata da chapa: só tipografia, o tamanho escolhido já vai para a comanda */}
      <article aria-labelledby="batata-nome" className="mt-10 border-y-2 border-grafite py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 id="batata-nome" className="display text-[clamp(2.75rem,8vw,5rem)] text-cobalto [font-stretch:135%]">
              {batata.name}
            </h3>
            <p className="mt-2 text-[0.9375rem]">{batata.description}</p>
          </div>
          <div className="lg:text-right">
            <p className="price mb-2 text-sm text-aco-escuro">a partir de {formatBRL(batata.price)}</p>
            <QuickOptions product={batata} />
          </div>
        </div>
      </article>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <article aria-labelledby="cheddar-nome" className="flex flex-col border-2 border-grafite bg-termico">
          <div className="relative aspect-[16/10] border-b-2 border-grafite">
            <Image src={photos[cheddar.photo!].src} alt={photos[cheddar.photo!].alt} fill placeholder="blur" sizes="(min-width: 1216px) 34vw, (min-width: 768px) 55vw, 100vw" className="object-cover" style={{ objectPosition: "50% 55%" }} />
          </div>
          <div className="flex flex-1 flex-col justify-between gap-5 p-5">
            <div>
              <h3 id="cheddar-nome" className="display text-[2.25rem] [font-stretch:65%]">
                {cheddar.name}
              </h3>
              <p className="mt-2 text-[0.9375rem] leading-snug">{cheddar.description}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="price text-lg">{formatBRL(cheddar.price)}</p>
              <button type="button" onClick={() => order(cheddar)} className="btn btn-tinta btn-sm">
                <Plus aria-hidden="true" className="size-4" strokeWidth={2.5} />
                Pôr na comanda
              </button>
            </div>
          </div>
        </article>

        <article aria-labelledby="aneis-nome" className="flex flex-col border-2 border-grafite bg-grafite text-papel">
          <div className="relative aspect-square border-b-2 border-grafite">
            <Image src={photos[aneis.photo!].src} alt={photos[aneis.photo!].alt} fill placeholder="blur" sizes="(min-width: 768px) 30vw, 100vw" className="object-cover" />
          </div>
          <div className="flex flex-1 flex-col justify-between gap-5 p-5">
            <div>
              <h3 id="aneis-nome" className="display text-[2.25rem] [font-stretch:65%]">
                {aneis.name}
              </h3>
              <p className="mt-2 text-[0.9375rem] leading-snug text-papel/85">{aneis.description}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="price text-lg">{formatBRL(aneis.price)}</p>
              <button type="button" onClick={() => order(aneis)} className="btn btn-chapa btn-sm">
                Escolher o molho
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

/** Bebidas e sobremesas: tabela densa na chapa grafite, como o quadro de preços do balcão. */
function Board() {
  const order = useOrder();
  const drinks = byCategory("bebidas");
  const desserts = byCategory("sobremesas");
  return (
    <section id="bebidas" aria-labelledby="bebidas-titulo" className="on-ink bg-grafite px-5 py-14 text-papel sm:px-8 lg:py-20">
      <div className="grid gap-14 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:gap-10">
        <div>
          <CategoryHead id="bebidas" title="Bebidas" blurb="Gelada de verdade. Escolha o sabor e ela já entra na comanda." tone="ink" stacked />
          <ul className="mt-8 border-t-2 border-papel/25">
            {drinks.map((p) => (
              <li key={p.id} className="border-b-2 border-papel/25 py-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-xl font-bold">
                    <span className={cn(p.unavailable && "text-papel/50 line-through")}>{p.name}</span>{" "}
                    <span className="mono text-xs font-normal text-papel/60">{p.description}</span>
                  </h3>
                  <p className={cn("price", p.unavailable && "text-papel/50")}>{formatBRL(p.price)}</p>
                </div>
                {p.unavailable ? (
                  <p className="mono mt-2 text-[0.75rem] text-chapa">Indisponível: {p.unavailable.toLowerCase()}</p>
                ) : (
                  <div className="mt-3">
                    <QuickOptions product={p} tone="ink" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
        <section id="sobremesas" aria-labelledby="sobremesas-titulo">
          <CategoryHead id="sobremesas" title="Sobremesas" blurb="Para fechar a comanda." tone="ink" stacked />
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {desserts.map((p) => {
              const ph = photos[p.photo!];
              return (
                <li key={p.id} className="flex flex-col border-2 border-papel/25">
                  <div className="relative aspect-[4/5]">
                    <Image src={ph.src} alt={ph.alt} fill placeholder="blur" sizes="(min-width: 1280px) 16vw, (min-width: 640px) 45vw, 100vw" className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between gap-4 p-4">
                    <div>
                      <h3 className="text-lg leading-tight font-bold">{p.name}</h3>
                      <p className="mt-1.5 text-sm leading-snug text-papel/80">{p.description}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="price">{formatBRL(p.price)}</p>
                      <button type="button" onClick={() => order(p)} className="btn btn-chapa btn-sm" aria-label={`Pôr na comanda: ${p.name}`}>
                        <Plus aria-hidden="true" className="size-4" strokeWidth={2.5} />
                        Pôr
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </section>
  );
}

export function Menu() {
  return (
    <div id="cardapio" aria-label="Cardápio" role="region">
      <CategoryBar />
      <Burgers />
      <Builder />
      <Combos />
      <Sides />
      <Board />
    </div>
  );
}
