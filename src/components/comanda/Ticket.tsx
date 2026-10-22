"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { campaign, coupon as couponRule } from "@/data/offers";
import { store } from "@/data/store";
import { formatClock, localNow, shortDate, statusLine, weekdayName } from "@/lib/hours";
import { formatBRL } from "@/lib/money";
import type { CartLine } from "@/lib/order";
import { normalizeCoupon, type PricedLine } from "@/lib/pricing";
import { cn } from "@/lib/style";
import { useComanda } from "../providers/Comanda";
import { noSuggest } from "../ui/Field";
import { Stepper } from "../ui/Stepper";
import { Checkout } from "./Checkout";
import { Sent } from "./Sent";

const stationLabel = { chapa: "Chapa", fritadeira: "Fritadeira", balcao: "Balcão" } as const;

/** Linha tracejada impressa: separa blocos da comanda. */
export function Perf({ double }: { double?: boolean }) {
  return <div aria-hidden="true" className={cn(double ? "perf-double" : "perf", "my-4")} />;
}

type Props = { variant: "rail" | "sheet"; onClose?: () => void };

/** A comanda: papel térmico com tudo que vai para a cozinha. */
export function Ticket({ variant, onClose }: Props) {
  const { ready, state, totals, view, now, status } = useComanda();
  const paper = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);

  // A impressora puxa o papel e a comanda rola até a linha impressa.
  useEffect(() => {
    if (!state.printed) return;
    const el = paper.current;
    if (el) {
      el.classList.remove("feeding");
      void el.offsetWidth;
      el.classList.add("feeding");
    }
    const row = scroller.current?.querySelector<HTMLElement>(`[data-line="${state.printed.id}"]`);
    row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [state.printed]);

  const local = now ? localNow(now) : null;
  const printedAt = local ? `${weekdayName(local.weekday).slice(0, 3)} ${shortDate(local.date)} ${formatClock(local.minutes)}` : "";

  return (
    <div ref={paper} className={cn("thermal serrated flex min-h-0 flex-col shadow-[0_18px_30px_-18px_rgb(24_25_28/0.55)]", variant === "rail" ? "max-h-full" : "h-full")}>
      <div ref={scroller} className="scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5">
        {/* Cabeçalho impresso */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="display text-[1.75rem] text-cobalto [font-stretch:140%]">Crosta</p>
            <p className="mono mt-1 text-[0.6875rem] text-aco-escuro">{state.reference ? `comanda ref. ${state.reference}` : "comanda nova"}</p>
          </div>
          <div className="flex items-start gap-2">
            <p className="mono pt-1 text-right text-[0.6875rem] text-aco-escuro" suppressHydrationWarning>
              {printedAt}
            </p>
            {onClose ? (
              <button type="button" onClick={onClose} aria-label="Fechar a comanda" className="grid size-10 place-items-center border-2 border-grafite hover:bg-grafite/5">
                <X aria-hidden="true" className="size-5" strokeWidth={2.5} />
              </button>
            ) : null}
          </div>
        </div>

        {status && now ? (
          <p className={cn("mono mt-3 flex items-center gap-2 text-[0.75rem]", status.state === "open" && status.acceptsNow ? "text-ok" : "text-grafite")}>
            <span aria-hidden="true" className={cn("size-2", status.state === "open" && status.acceptsNow ? "bg-ok" : "bg-chapa")} />
            {statusLine(status, now)}
          </p>
        ) : null}
        <Perf double />

        {!ready ? (
          <p className="mono py-6 text-center text-xs text-aco-escuro">Carregando a comanda...</p>
        ) : view === "checkout" && totals.lines.length ? (
          <Checkout />
        ) : view === "enviado" ? (
          <Sent />
        ) : totals.lines.length ? (
          <Order />
        ) : (
          <Empty onNavigate={onClose} />
        )}
      </div>
    </div>
  );
}

function Empty({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="pb-6">
      <p className="mono text-sm">Comanda em branco.</p>
      <p className="mt-2 text-sm leading-relaxed text-aco-escuro">
        Escolha um burger no cardápio ou monte o seu. Cada item é impresso aqui, com as escolhas e o preço, antes de ir para o WhatsApp.
      </p>
      <div className="mt-5 grid gap-2">
        <a href="#cardapio" onClick={onNavigate} className="btn btn-papel btn-sm justify-start">
          Ver o cardápio
        </a>
        <a href="#monte" onClick={onNavigate} className="btn btn-papel btn-sm justify-start">
          Montar do zero
        </a>
      </div>
    </div>
  );
}

function Order() {
  const { totals, state, setView, status } = useComanda();
  const [removed, setRemoved] = useState<CartLine | null>(null);

  useEffect(() => {
    if (!removed) return;
    const t = setTimeout(() => setRemoved(null), 6000);
    return () => clearTimeout(t);
  }, [removed]);

  return (
    <div>
      {totals.byStation.map((group) => (
        <section key={group.station} aria-label={`Estação ${stationLabel[group.station]}`} className="mb-4">
          <h3 className="mono mb-2 text-[0.6875rem] font-semibold tracking-[0.12em] text-cobalto uppercase">{stationLabel[group.station]}</h3>
          <ul className="grid gap-4">
            {group.lines.map((l) => (
              <LineItem key={l.line.id} priced={l} printing={state.printed?.id === l.line.id} printKey={state.printed?.at} onRemove={setRemoved} />
            ))}
          </ul>
        </section>
      ))}

      {removed ? <UndoRemove line={removed} onDone={() => setRemoved(null)} /> : null}

      <Perf />
      <CouponForm />
      <Perf />
      <Totals />

      {status?.state === "closed" ? (
        <p className="mt-4 border-l-4 border-chapa bg-chapa/10 px-3 py-2 text-[0.8125rem] leading-snug">
          A loja está fechada agora. Dá para fechar o pedido escolhendo um horário; a confirmação vem pelo WhatsApp.
        </p>
      ) : null}

      {/* O botão acompanha a rolagem do papel: o total nunca some de vista. */}
      <div className="thermal sticky bottom-0 -mx-5 mt-5 border-t-2 border-dashed border-grafite/30 px-5 pt-3 pb-4">
        <button type="button" onClick={() => setView("checkout")} className="btn btn-chapa w-full justify-between">
          <span>Fechar pedido</span>
          <span className="price">{formatBRL(totals.total)}</span>
        </button>
      </div>
    </div>
  );
}

function LineItem({ priced, printing, printKey, onRemove }: { priced: PricedLine; printing: boolean; printKey?: number; onRemove: (l: CartLine) => void }) {
  const { setQty, remove, openProduct, campaignRoom } = useComanda();
  const { line, product } = priced;
  const max = Math.min(store.maxQtyPerLine, product.maxPerOrder ?? Infinity, product.id === campaign.productId ? campaignRoom(line.id) : Infinity);
  return (
    <li data-line={line.id} key={printing ? printKey : undefined} className={cn(printing && "printing")}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 font-semibold leading-tight">
          <span className="mono text-sm">{line.qty}x</span> {product.name}
        </p>
        <p className="price text-sm">{formatBRL(priced.total)}</p>
      </div>
      {priced.promo ? (
        <p className="mono mt-0.5 text-[0.6875rem] text-cobalto">
          preço de campanha · de <s>{formatBRL(priced.listTotal)}</s>
        </p>
      ) : null}
      {priced.modifiers.length ? (
        <ul className="mono mt-1 grid gap-0.5 pl-4 text-[0.6875rem] leading-snug text-grafite/80">
          {priced.modifiers.map((m) => (
            <li key={m} className="break-words">
              {m}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stepper size="sm" label={`Quantidade de ${product.name}`} value={line.qty} min={1} max={max} onChange={(v) => setQty(line.id, v)} />
        <button
          type="button"
          onClick={() => openProduct(product.id, line.id)}
          aria-label={`Editar ${product.name}`}
          className="mono min-h-8 px-1 text-[0.75rem] font-semibold text-cobalto underline decoration-2 underline-offset-4 hover:text-cobalto-escuro"
        >
          editar
        </button>
        <button
          type="button"
          onClick={() => {
            onRemove(line);
            remove(line.id);
          }}
          className="mono min-h-8 px-1 text-[0.75rem] font-semibold text-erro underline decoration-2 underline-offset-4"
          aria-label={`Tirar ${product.name} da comanda`}
        >
          tirar
        </button>
      </div>
    </li>
  );
}

function UndoRemove({ line, onDone }: { line: CartLine; onDone: () => void }) {
  const { add } = useComanda();
  return (
    <div role="status" className="fade-in mb-2 flex items-center justify-between gap-3 border-2 border-dashed border-grafite/40 px-3 py-2 text-[0.8125rem]">
      <span>Linha tirada da comanda.</span>
      <button
        type="button"
        className="mono font-semibold text-cobalto underline decoration-2 underline-offset-4"
        onClick={() => {
          add(line.productId, line.config, line.qty);
          onDone();
        }}
      >
        desfazer
      </button>
    </div>
  );
}

function CouponForm() {
  const { state, totals, setCoupon } = useComanda();
  const [code, setCode] = useState("");
  const current = totals.coupon;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = normalizeCoupon(code);
    if (!value) return;
    setCoupon(value);
    setCode("");
  };

  if (state.coupon && current.status !== "none") {
    return (
      <div className="text-[0.8125rem]">
        <div className="flex items-center justify-between gap-3">
          <p className="mono font-semibold">cupom {current.code}</p>
          <button type="button" onClick={() => setCoupon(null)} className="mono min-h-8 text-[0.75rem] font-semibold underline decoration-2 underline-offset-4">
            remover
          </button>
        </div>
        {current.status === "applied" ? (
          <p className="mt-1 text-ok">
            {couponRule.percent}% nos itens fora da campanha, até {formatBRL(couponRule.maxDiscount)}.
          </p>
        ) : (
          <p role="alert" className="mt-1 font-semibold text-erro">
            {current.message}
            {current.status === "blocked" ? ` Faltam ${formatBRL(current.missing)}.` : ""}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} autoComplete="off" className="grid gap-1">
      <label htmlFor="cupom" className="text-sm font-semibold">
        Cupom
      </label>
      <div className="flex gap-2">
        <input
          id="cupom"
          name="crosta-codigo-promo"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 20))}
          placeholder="Digite o código"
          className="field mono uppercase"
          autoCapitalize="characters"
          {...noSuggest}
        />
        <button type="submit" className="btn btn-papel btn-sm shrink-0" disabled={!code.trim()}>
          Aplicar
        </button>
      </div>
      <p className="text-xs text-aco-escuro">
        Demonstração: <span className="mono font-semibold text-grafite">{couponRule.code}</span> dá {couponRule.percent}% a partir de {formatBRL(couponRule.minEligible)}, fora da campanha.
      </p>
    </form>
  );
}

export function Totals() {
  const { totals, state } = useComanda();
  const { draft } = state;
  return (
    <dl className="mono grid gap-1.5 text-[0.8125rem]">
      <div className="flex justify-between gap-3">
        <dt>Itens ({totals.count})</dt>
        <dd className="price font-medium">{formatBRL(totals.items)}</dd>
      </div>
      {totals.campaignSavings > 0 ? (
        <div className="flex justify-between gap-3 text-cobalto">
          <dt>Campanha já aplicada</dt>
          <dd className="price font-medium">−{formatBRL(totals.campaignSavings)}</dd>
        </div>
      ) : null}
      {totals.discount > 0 && totals.coupon.status === "applied" ? (
        <div className="flex justify-between gap-3 text-ok">
          <dt>Cupom {totals.coupon.code}</dt>
          <dd className="price font-medium">−{formatBRL(totals.discount)}</dd>
        </div>
      ) : null}
      <div className="flex justify-between gap-3">
        <dt>{draft.mode === "retirada" ? "Retirada no balcão" : "Entrega"}</dt>
        <dd className="price font-medium">{totals.deliveryFee === null ? "escolha o bairro" : formatBRL(totals.deliveryFee)}</dd>
      </div>
      <Perf double />
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-sm font-bold">Total</dt>
        <dd className="price text-xl font-bold" aria-live="polite">
          {formatBRL(totals.total)}
        </dd>
      </div>
      {totals.deliveryFee === null ? <p className="font-sans text-xs text-aco-escuro">A taxa de entrega entra quando você escolher o bairro.</p> : null}
    </dl>
  );
}
