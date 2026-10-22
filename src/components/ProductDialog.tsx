"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { productById, type Product } from "@/data/menu";
import { campaign } from "@/data/offers";
import { photos } from "@/data/photos";
import { formatBRL } from "@/lib/money";
import { emptyConfig, maxQty, meatGrams, stackLayers, unitPrice, validateConfig, type LineConfig } from "@/lib/order";
import { campaignActive } from "@/lib/pricing";
import { cn } from "@/lib/style";
import { BurgerStack } from "./BurgerStack";
import { Customizer } from "./Customizer";
import { useComanda } from "./providers/Comanda";
import { Dialog } from "./ui/Dialog";
import { Stepper } from "./ui/Stepper";

export function ProductDialog() {
  const { editing, closeProduct } = useComanda();
  const product = editing ? productById(editing.productId) : undefined;
  return (
    <Dialog open={!!product} onClose={closeProduct} labelledBy="produto-titulo" className={product?.ingredients ? "md:h-[min(90dvh,50rem)]" : undefined}>
      {product ? <ProductSheet key={`${product.id}-${editing?.lineId ?? "novo"}`} product={product} lineId={editing?.lineId} /> : null}
    </Dialog>
  );
}

function ProductSheet({ product, lineId }: { product: Product; lineId?: string }) {
  const { state, add, replace, closeProduct, campaignRoom, serviceWeekday } = useComanda();
  const line = lineId ? state.lines.find((l) => l.id === lineId) : undefined;
  const [config, setConfig] = useState<LineConfig>(() => (line ? structuredClone(line.config) : emptyConfig()));
  const [qty, setQty] = useState(line?.qty ?? 1);
  const [showErrors, setShowErrors] = useState(false);

  const isBurger = !!product.ingredients;
  const isCampaign = product.id === campaign.productId;
  const promo = isCampaign && campaignActive(serviceWeekday);
  const base = promo ? campaign.promoPrice : product.price;
  const unit = unitPrice(product, config, base);
  const listUnit = unitPrice(product, config);
  const errors = validateConfig(product, config);
  const room = isCampaign ? campaignRoom(lineId) : Infinity;
  const max = Math.min(maxQty(product), room);
  const blocked = max < 1;
  const photo = product.photo ? photos[product.photo] : undefined;
  const layers = isBurger ? stackLayers(product, config) : [];
  const stackLabel = `Desenho do ${product.name}, de baixo para cima: ${layers
    .filter((l) => !l.removed)
    .map((l) => l.label.toLowerCase())
    .join(", ")}.`;

  const submit = () => {
    if (Object.keys(errors).length) {
      setShowErrors(true);
      // Leva até o primeiro grupo que falta escolher.
      requestAnimationFrame(() => {
        const first = document.querySelector<HTMLElement>(`[data-group="${Object.keys(errors)[0]}"]`);
        first?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        first?.querySelector<HTMLElement>('[role="radio"]')?.focus({ preventScroll: true });
      });
      return;
    }
    if (line) replace(line.id, product.id, config, qty);
    else add(product.id, config, qty);
    closeProduct();
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-papel md:grid md:grid-cols-[minmax(0,44%)_minmax(0,1fr)] md:grid-rows-[auto_minmax(0,1fr)_auto]">
      <header className="flex items-start justify-between gap-4 border-b-2 border-grafite px-5 pt-4 pb-3 md:col-start-2 md:row-start-1 md:px-7 md:pt-6">
        <div className="min-w-0">
          <p className="mono text-[0.6875rem] text-aco-escuro">{line ? "Editando linha da comanda" : product.category === "combos" ? "Combo" : "Na chapa"}</p>
          <h2 id="produto-titulo" className="display mt-1 text-[clamp(2rem,6vw,3rem)] [font-stretch:72%]">
            {product.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={closeProduct}
          aria-label="Fechar sem adicionar"
          className="grid size-11 shrink-0 place-items-center border-2 border-grafite bg-termico transition-colors hover:bg-white"
        >
          <X aria-hidden="true" className="size-5" strokeWidth={2.5} />
        </button>
      </header>

      {/* Visual: ficha técnica do burger ou foto. No celular vira uma faixa fixa acima das opções. */}
      <aside
        className={cn(
          "relative shrink-0 border-b-2 border-grafite md:col-start-1 md:row-span-3 md:row-start-1 md:border-r-2 md:border-b-0",
          isBurger ? "steel-light" : "bg-cobalto",
          !isBurger && !photo && "hidden md:block",
        )}
      >
        {isBurger ? (
          <>
            <div className="flex h-36 items-center gap-4 px-5 md:hidden">
              <BurgerStack layers={layers} mode="compact" label={stackLabel} className="h-full w-auto shrink-0" />
              <div className="min-w-0">
                <p className="mono text-[0.6875rem] text-aco-escuro">{layers.filter((l) => !l.removed).length} camadas</p>
                <p className="price mt-1 text-2xl">{formatBRL(unit * qty)}</p>
                {meatGrams(product, config) ? <p className="mono mt-1 text-[0.6875rem] text-aco-escuro">{meatGrams(product, config)} g de carne</p> : null}
              </div>
            </div>
            <div className="hidden h-full flex-col px-6 pt-6 pb-4 md:flex">
              <div className="flex items-baseline justify-between">
                <p className="mono text-xs font-semibold">Ficha técnica</p>
                {meatGrams(product, config) ? <p className="mono text-xs text-aco-escuro">{meatGrams(product, config)} g de carne</p> : null}
              </div>
              <BurgerStack layers={layers} mode="exploded" label={stackLabel} className="mt-2 min-h-0 w-full flex-1" />
            </div>
          </>
        ) : photo ? (
          <div className="relative h-48 md:h-full">
            <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 768px) 28rem, 100vw" placeholder="blur" className="object-cover" style={{ objectPosition: photo.position }} />
          </div>
        ) : (
          <div className="flex h-full items-end p-7">
            <p aria-hidden="true" className="display text-[5rem] leading-[0.8] text-papel [font-stretch:50%]">
              {product.name}
            </p>
          </div>
        )}
      </aside>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 md:col-start-2 md:row-start-2 md:px-7">
        <p className="max-w-prose text-[0.9375rem] leading-relaxed text-pretty">{product.description}</p>
        {isCampaign ? (
          <p className="mt-3 border-l-4 border-chapa bg-chapa/10 px-3 py-2 text-sm">
            {promo
              ? `Preço de campanha aplicado: ${formatBRL(campaign.promoPrice)} em vez de ${formatBRL(product.price)}.`
              : `Sai por ${formatBRL(campaign.promoPrice)} em pedidos de ${campaign.daysLabel}. Hoje o preço é ${formatBRL(product.price)}.`}{" "}
            Até {campaign.maxPerOrder} por pedido.
          </p>
        ) : null}
        <div className="mt-6">
          <Customizer product={product} config={config} onChange={setConfig} errors={errors} showErrors={showErrors} idPrefix={`p-${product.id}`} />
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-grafite bg-termico px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:col-start-2 md:row-start-3 md:px-7">
        {blocked ? (
          <p className="text-sm font-semibold text-erro">Limite da campanha: {campaign.maxPerOrder} por pedido. Ajuste na comanda.</p>
        ) : (
          <>
            <Stepper size="sm" label="Quantidade" value={qty} min={1} max={max} onChange={setQty} maxReason={isCampaign ? `Até ${campaign.maxPerOrder} por pedido.` : "Até 10 por linha."} />
            <button type="button" onClick={submit} className="btn btn-chapa min-w-0 flex-1 justify-between gap-3 whitespace-nowrap sm:flex-none sm:min-w-[17rem]">
              <span>{line ? "Atualizar a linha" : "Pôr na comanda"}</span>
              <span className="price text-[0.9375rem]">
                {promo && listUnit !== unit ? <s className="mr-2 font-normal opacity-60">{formatBRL(listUnit * qty)}</s> : null}
                {formatBRL(unit * qty)}
              </span>
            </button>
          </>
        )}
      </footer>
    </div>
  );
}
