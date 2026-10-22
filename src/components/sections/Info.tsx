"use client";

import { coupon } from "@/data/offers";
import { campaign } from "@/data/offers";
import { store } from "@/data/store";
import { hoursTable } from "@/lib/hours";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/style";
import { useComanda } from "../providers/Comanda";

/** Balcão: onde fica, quando abre, até onde entrega e as regras, tudo à vista. */
export function Info() {
  const { status } = useComanda();
  const rows = hoursTable();
  const serviceDay = status?.state === "open" ? status.service.weekday : null;
  return (
    <section id="balcao" aria-labelledby="balcao-titulo" className="steel-light border-t-2 border-grafite px-5 py-14 sm:px-8 lg:py-20">
      <h2 id="balcao-titulo" className="display text-[clamp(3rem,8vw,5.25rem)] [font-stretch:58%]">
        Balcão e entrega
      </h2>
      <div className="mt-10 grid gap-10 md:grid-cols-2 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="grid content-start gap-6">
          <div>
            <h3 className="mono text-xs font-semibold text-cobalto">Retirada</h3>
            <address className="mt-2 text-lg leading-snug font-semibold not-italic">
              {store.address.street}
              <br />
              {store.address.district}
            </address>
            <p className="mt-1 text-xs text-aco-escuro">Endereço fictício: a Crosta é um projeto de portfólio.</p>
          </div>
          <div>
            <h3 className="mono text-xs font-semibold text-cobalto">Pagamento</h3>
            <p className="mt-2 text-[0.9375rem] leading-relaxed">
              Pix, dinheiro ou cartão, sempre na entrega ou na retirada. O site monta o pedido; quem confirma é a loja, pelo WhatsApp.
            </p>
          </div>
        </div>

        <div>
          <h3 className="mono text-xs font-semibold text-cobalto">Horário (Brasília)</h3>
          <table className="mt-3 w-full text-[0.9375rem]">
            <caption className="sr-only">Horário de funcionamento</caption>
            <tbody>
              {rows.map((r) => {
                const current = serviceDay !== null && r.weekdays.includes(serviceDay);
                return (
                  <tr key={r.days} className={cn("border-b border-dashed border-grafite/30", current && "font-bold")}>
                    <th scope="row" className="py-2 pr-4 text-left font-semibold">
                      {r.days}
                      {current ? <span className="mono ml-2 bg-cobalto px-1.5 py-0.5 text-[0.625rem] text-papel">agora</span> : null}
                    </th>
                    <td className={cn("price py-2 text-right font-medium", r.hours === "Fechado" && "text-aco-escuro")}>{r.hours}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-xs leading-snug text-aco-escuro">
            Pedidos para agora até {store.lastCallMinutes} min antes de fechar. Depois disso, ou com a loja fechada, dá para agendar.
          </p>
        </div>

        <div className="md:col-span-2 xl:col-span-1">
          <h3 className="mono text-xs font-semibold text-cobalto">Bairros atendidos</h3>
          <table className="mt-3 w-full text-[0.9375rem]">
            <caption className="sr-only">Taxa e tempo estimado de entrega por bairro</caption>
            <thead>
              <tr className="mono text-left text-[0.6875rem] text-aco-escuro">
                <th scope="col" className="pb-1 font-normal">bairro</th>
                <th scope="col" className="pb-1 text-right font-normal">tempo</th>
                <th scope="col" className="pb-1 text-right font-normal">taxa</th>
              </tr>
            </thead>
            <tbody>
              {store.neighborhoods.map((n) => (
                <tr key={n.id} className="border-b border-dashed border-grafite/30">
                  <th scope="row" className="py-2 pr-3 text-left font-semibold">
                    {n.name}
                  </th>
                  <td className="mono py-2 text-right text-[0.75rem] whitespace-nowrap">
                    {n.eta[0]}–{n.eta[1]} min
                  </td>
                  <td className="price py-2 pl-3 text-right">{formatBRL(n.fee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="mt-4 grid gap-1.5 text-xs leading-snug text-aco-escuro">
            <li>Entrega a partir de {formatBRL(store.deliveryMinimum)} em itens, antes de cupom e taxa.</li>
            <li>
              {campaign.name}: {formatBRL(campaign.promoPrice)} em {campaign.daysLabel}, até {campaign.maxPerOrder} por pedido.
            </li>
            <li>
              Cupom {coupon.code}: {coupon.percent}% nos itens fora da campanha, a partir de {formatBRL(coupon.minEligible)}, desconto máximo de {formatBRL(coupon.maxDiscount)}.
            </li>
            <li>Tempos estimados. O tempo real vem na confirmação.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
