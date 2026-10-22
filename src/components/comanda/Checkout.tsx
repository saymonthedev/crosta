"use client";

import { ArrowLeft, Check } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { campaign } from "@/data/offers";
import { neighborhoodById, store, whatsappNumber } from "@/data/store";
import { fieldLimits, fieldOrder, validateCheckout, type CheckoutErrors, type CheckoutField } from "@/lib/checkout";
import { localNow, relativeDay, scheduleDays } from "@/lib/hours";
import { formatBRL } from "@/lib/money";
import { buildOrderMessage, whatsappLink } from "@/lib/message";
import { campaignActive } from "@/lib/pricing";
import { cn } from "@/lib/style";
import { useComanda } from "../providers/Comanda";
import { Choice } from "../ui/Choice";
import { LineField } from "../ui/Field";
import { Listbox } from "../ui/Listbox";
import { Perf, Totals } from "./Ticket";

/** Para onde o foco vai quando o campo tem erro. */
const focusTarget: Record<CheckoutField, string> = {
  cart: "checkout-titulo",
  mode: "co-modo",
  neighborhood: "co-bairro",
  street: "co-rua",
  number: "co-numero",
  complement: "co-compl",
  reference: "co-ref",
  minimum: "co-minimo",
  when: "co-quando",
  payment: "co-pagamento",
  changeFor: "co-troco",
  name: "co-nome",
};

function Heading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="mb-3 text-[0.9375rem] font-bold">
      {children}
    </h3>
  );
}

function ErrorText({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="nudge mt-2 flex items-start gap-1.5 text-[0.8125rem] leading-snug font-semibold text-erro">
      <span aria-hidden="true" className="mt-[0.3rem] size-2 shrink-0 bg-erro" />
      {children}
    </p>
  );
}

export function Checkout() {
  const { state, totals, setDraft, setView, status, slot, now, serviceWeekday } = useComanda();
  const { draft } = state;
  const [tried, setTried] = useState(false);
  const [dayPick, setDayPick] = useState<string | null>(null);

  const days = useMemo(() => (now && draft.mode ? scheduleDays(now, draft.mode) : []), [now, draft.mode]);
  const today = now ? localNow(now).date : "";
  const activeDay = days.find((d) => d.serviceDate === (dayPick ?? slot?.serviceDate)) ?? days[0];
  const canNow = status?.state === "open" && status.acceptsNow;
  const hood = neighborhoodById(draft.neighborhoodId);
  const hasCampaignLine = totals.lines.some((l) => l.product.id === campaign.productId);

  // Depois da primeira tentativa, os erros acompanham o que a pessoa corrige.
  const live: CheckoutErrors = tried && status ? validateCheckout(draft, totals, status, slot) : {};
  const err = (f: CheckoutField) => live[f];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!status || !now) return;
    const found = validateCheckout(draft, totals, status, slot);
    setTried(true);
    const first = fieldOrder.find((f) => found[f]);
    if (first) {
      requestAnimationFrame(() => {
        const el = document.getElementById(focusTarget[first]);
        const focusable = el?.matches("button,input,textarea,[tabindex]") ? el : el?.querySelector<HTMLElement>('[tabindex="0"],button,input');
        el?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        focusable?.focus({ preventScroll: true });
      });
      return;
    }
    const number = whatsappNumber();
    if (number) {
      const message = buildOrderMessage({ reference: state.reference ?? "0000", totals, draft, slot, now });
      window.open(whatsappLink(number, message), "_blank", "noopener,noreferrer");
    }
    setView("enviado");
  };

  const count = fieldOrder.filter((f) => live[f]).length;

  return (
    <form onSubmit={submit} noValidate autoComplete="off" className="grid gap-7 pb-6" aria-labelledby="checkout-titulo">
      <div className="flex items-center justify-between gap-3">
        <h2 id="checkout-titulo" tabIndex={-1} className="display text-[1.5rem] [font-stretch:80%] outline-none">
          Fechar pedido
        </h2>
        <button type="button" onClick={() => setView("pedido")} className="mono inline-flex min-h-9 items-center gap-1.5 text-[0.75rem] font-semibold underline decoration-2 underline-offset-4">
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          itens
        </button>
      </div>

      {tried && count > 0 ? (
        <p role="alert" className="border-2 border-erro px-3 py-2 text-[0.8125rem] font-semibold text-erro">
          {count === 1 ? "Falta 1 informação" : `Faltam ${count} informações`} para enviar. Os campos estão marcados abaixo.
        </p>
      ) : null}

      {/* Entrega ou retirada */}
      <section aria-labelledby="h-modo">
        <Heading id="h-modo">Como você recebe?</Heading>
        <div id="co-modo">
          <Choice
            label="Como você recebe"
            labelledBy="h-modo"
            layout="stack"
            tone="thermal"
            value={draft.mode}
            invalid={!!err("mode")}
            errorId={err("mode") ? "e-modo" : undefined}
            onChange={(id) => {
              const mode = id as "entrega" | "retirada";
              setDraft({ mode, slotId: null });
              setDayPick(null);
            }}
            options={[
              { id: "entrega", label: "Entrega", detail: `Taxa por bairro. Mínimo de ${formatBRL(store.deliveryMinimum)} em itens.` },
              { id: "retirada", label: "Retirada no balcão", detail: `${store.address.street}, ${store.address.district}`, meta: "sem taxa" },
            ]}
          />
        </div>
        <ErrorText id="e-modo">{err("mode")}</ErrorText>
      </section>

      {draft.mode === "entrega" ? (
        <section aria-labelledby="h-endereco" className="grid gap-4">
          <Heading id="h-endereco">Endereço</Heading>
          <Listbox
            id="co-bairro"
            label="Bairro"
            placeholder="Escolha o bairro"
            value={draft.neighborhoodId}
            onChange={(id) => setDraft({ neighborhoodId: id })}
            error={err("neighborhood")}
            hint="Só entregamos nestes bairros. Fora deles, dá para retirar no balcão."
            options={store.neighborhoods.map((n) => ({ id: n.id, label: n.name, meta: formatBRL(n.fee), detail: `${n.eta[0]} a ${n.eta[1]} min` }))}
          />
          <LineField
            id="co-rua"
            name="crosta-via"
            label="Rua"
            value={draft.street}
            maxLength={fieldLimits.street}
            onChange={(e) => setDraft({ street: e.target.value })}
            error={err("street")}
          />
          <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-4">
            <LineField
              id="co-numero"
              name="crosta-num"
              label="Número"
              inputMode="text"
              value={draft.number}
              maxLength={fieldLimits.number}
              onChange={(e) => setDraft({ number: e.target.value })}
              error={err("number")}
            />
            <LineField
              id="co-compl"
              name="crosta-compl"
              label="Complemento"
              optional
              value={draft.complement}
              maxLength={fieldLimits.complement}
              onChange={(e) => setDraft({ complement: e.target.value })}
              error={err("complement")}
            />
          </div>
          <LineField
            id="co-ref"
            name="crosta-ponto-ref"
            label="Ponto de referência"
            optional
            value={draft.reference}
            maxLength={fieldLimits.reference}
            onChange={(e) => setDraft({ reference: e.target.value })}
            error={err("reference")}
          />
          {totals.minimumShortfall > 0 ? (
            <p id="co-minimo" tabIndex={-1} className={cn("border-l-4 px-3 py-2 text-[0.8125rem] leading-snug", err("minimum") ? "border-erro font-semibold text-erro" : "border-chapa bg-chapa/10")}>
              Entrega a partir de {formatBRL(store.deliveryMinimum)} em itens. Faltam {formatBRL(totals.minimumShortfall)}, ou escolha retirada.
            </p>
          ) : null}
        </section>
      ) : draft.mode === "retirada" ? (
        <p className="text-[0.8125rem] leading-relaxed text-aco-escuro">
          Retire no balcão da {store.address.street}, {store.address.district}. Fica pronto de {store.pickupReady[0]} a {store.pickupReady[1]} min depois que a loja confirmar.
        </p>
      ) : null}

      {/* Quando */}
      <section aria-labelledby="h-quando">
        <Heading id="h-quando">{draft.mode === "retirada" ? "Quando você retira?" : "Quando entregar?"}</Heading>
        <div id="co-quando">
          <Choice
            label="Quando"
            labelledBy="h-quando"
            layout="stack"
            tone="thermal"
            value={draft.when === "agora" && !canNow ? null : draft.when}
            invalid={!!err("when")}
            errorId={err("when") ? "e-quando" : undefined}
            onChange={(id) => setDraft({ when: id as "agora" | "agendado" })}
            options={[
              {
                id: "agora",
                label: "Assim que possível",
                disabled: !canNow,
                disabledReason: "A cozinha não está recebendo pedidos para agora.",
                detail: !canNow
                  ? "Indisponível: a cozinha não está recebendo pedidos agora."
                  : draft.mode === "retirada"
                    ? `Pronto em ${store.pickupReady[0]} a ${store.pickupReady[1]} min.`
                    : hood
                      ? `Chega em ${hood.eta[0]} a ${hood.eta[1]} min.`
                      : "O tempo depende do bairro.",
              },
              { id: "agendado", label: "Agendar um horário", detail: "A loja confirma o horário pelo WhatsApp." },
            ]}
          />
        </div>
        <ErrorText id="e-quando">{err("when")}</ErrorText>

        {draft.when === "agendado" ? (
          !draft.mode ? (
            <p className="mt-3 text-[0.8125rem] text-aco-escuro">Escolha entrega ou retirada para ver os horários.</p>
          ) : days.length && activeDay ? (
            <div className="mt-4">
              <div role="group" aria-label="Dia" className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                {days.map((d) => {
                  const on = d.serviceDate === activeDay.serviceDate;
                  return (
                    <button
                      key={d.serviceDate}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setDayPick(d.serviceDate)}
                      className={cn(
                        "mono min-h-10 shrink-0 border-2 px-2.5 text-[0.75rem] font-semibold transition-colors",
                        on ? "border-grafite bg-grafite text-papel" : "border-grafite/40 hover:border-grafite",
                      )}
                    >
                      {relativeDay(d.serviceDate, today)}
                      {campaignActive(d.weekday) && hasCampaignLine ? <span className="ml-1 text-chapa">*</span> : null}
                    </button>
                  );
                })}
              </div>
              <p id="h-horario" className="mt-3 mb-2 text-xs text-aco-escuro">
                {draft.mode === "retirada" ? "Horário para retirar no balcão:" : "Horário em que o pedido chega (janela de 15 min):"}
              </p>
              <Choice
                label="Horário"
                labelledBy="h-horario"
                layout="grid"
                tone="thermal"
                value={slot && slot.serviceDate === activeDay.serviceDate ? slot.id : null}
                onChange={(id) => setDraft({ slotId: id })}
                options={activeDay.slots.map((s) => ({ id: s.id, label: s.label, detail: s.minute >= 1440 ? "madrugada" : undefined }))}
              />
              {hasCampaignLine ? (
                <p className="mt-2 text-xs text-aco-escuro">
                  <span className="text-chapa">*</span> {campaign.name} sai a {formatBRL(campaign.promoPrice)} em {campaign.daysLabel}. O preço segue o dia do serviço.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-[0.8125rem] text-aco-escuro">Sem horários disponíveis nos próximos dias.</p>
          )
        ) : null}
      </section>

      {/* Pagamento */}
      <section aria-labelledby="h-pagamento">
        <Heading id="h-pagamento">Pagamento</Heading>
        <p className="-mt-2 mb-3 text-xs text-aco-escuro">Nada é cobrado pelo site. Você paga {draft.mode === "retirada" ? "na retirada" : "na entrega"}, ou via Pix depois da confirmação.</p>
        <div id="co-pagamento">
          <Choice
            label="Pagamento"
            labelledBy="h-pagamento"
            layout="stack"
            tone="thermal"
            value={draft.payment}
            invalid={!!err("payment")}
            errorId={err("payment") ? "e-pagamento" : undefined}
            onChange={(id) => setDraft({ payment: id as "pix" | "dinheiro" | "cartao" })}
            options={[
              { id: "pix", label: "Pix", detail: "A loja manda a chave na confirmação." },
              { id: "dinheiro", label: "Dinheiro", detail: draft.mode === "retirada" ? "No balcão." : "Para o entregador." },
              { id: "cartao", label: "Cartão", detail: `Crédito ou débito, ${draft.mode === "retirada" ? "na retirada" : "na entrega"}.` },
            ]}
          />
        </div>
        <ErrorText id="e-pagamento">{err("payment")}</ErrorText>

        {draft.payment === "dinheiro" ? (
          <div className="mt-4 grid gap-3">
            {!draft.noChange ? (
              <LineField
                id="co-troco"
                name="crosta-troco-valor"
                label="Troco para quanto?"
                inputMode="decimal"
                placeholder="Ex.: 100,00"
                value={draft.changeFor}
                maxLength={fieldLimits.changeFor}
                onChange={(e) => setDraft({ changeFor: e.target.value.replace(/[^\d,.]/g, "") })}
                hint={`Total do pedido: ${formatBRL(totals.total)}.`}
                error={err("changeFor")}
              />
            ) : null}
            <button
              type="button"
              role="checkbox"
              aria-checked={draft.noChange}
              onClick={() => setDraft({ noChange: !draft.noChange })}
              className="flex min-h-10 items-center gap-3 text-left text-sm font-semibold"
            >
              <span aria-hidden="true" className={cn("grid size-5 place-items-center border-2 border-grafite", draft.noChange && "bg-grafite text-papel")}>
                {draft.noChange ? <Check className="size-3.5" strokeWidth={3} /> : null}
              </span>
              Vou pagar o valor exato, sem troco
            </button>
          </div>
        ) : null}
      </section>

      <LineField
          id="co-nome"
          name="crosta-chamada"
          label="Como chamamos você?"
          value={draft.name}
          maxLength={fieldLimits.name}
          autoCapitalize="words"
          onChange={(e) => setDraft({ name: e.target.value })}
          error={err("name")}
          hint="É o nome que a cozinha escreve no pacote."
        />

      <div>
        <Perf />
        <Totals />
        {serviceWeekday !== null && hasCampaignLine && !campaignActive(serviceWeekday) ? (
          <p className="mt-2 text-xs text-aco-escuro">
            A {campaign.name} está no preço normal porque o pedido não sai em {campaign.daysLabel}.
          </p>
        ) : null}
        <button type="submit" className="btn btn-chapa mt-5 w-full justify-between" disabled={!status}>
          <span>{whatsappNumber() ? "Enviar pelo WhatsApp" : "Gerar mensagem do pedido"}</span>
          <span className="price">{formatBRL(totals.total)}</span>
        </button>
        <p className="mt-2 text-xs leading-snug text-aco-escuro">
          {whatsappNumber()
            ? "Abre o WhatsApp com a mensagem pronta. O pedido só vale depois que a loja responder."
            : "Este é um projeto de demonstração: em vez de abrir o WhatsApp, a mensagem aparece para você copiar."}
        </p>
      </div>
    </form>
  );
}
