"use client";

import Image from "next/image";
import { productById } from "@/data/menu";
import { campaign } from "@/data/offers";
import { photos } from "@/data/photos";
import { addDays, localNow, relativeDay, serviceOn, shortDate, weekdayName, weekdayOf } from "@/lib/hours";
import { formatBRL } from "@/lib/money";
import { useComanda } from "../providers/Comanda";

/** Próximo dia de serviço em que a campanha vale (ou o atual). */
function nextCampaignDay(now: Date) {
  const today = localNow(now).date;
  for (let i = 0; i <= 7; i++) {
    const date = addDays(today, i);
    const s = serviceOn(date);
    if (s && (campaign.weekdays as readonly number[]).includes(s.weekday)) return date;
  }
  return null;
}

export function Campaign() {
  const { now, serviceWeekday, openProduct } = useComanda();
  const product = productById(campaign.productId)!;
  const photo = photos.prensado;
  const activeNow = serviceWeekday !== null && (campaign.weekdays as readonly number[]).includes(serviceWeekday);
  const next = now ? nextCampaignDay(now) : null;
  const today = now ? localNow(now).date : null;

  let when = `Toda ${campaign.daysLabel}.`;
  if (activeNow) when = "Vale para o pedido de hoje.";
  else if (next && today) {
    const rel = relativeDay(next, today);
    when = `Próxima: ${rel === "amanhã" ? "amanhã" : weekdayName(weekdayOf(next))}, ${shortDate(next)}.`;
  }

  return (
    <section id="campanha" aria-labelledby="campanha-titulo" className="relative overflow-hidden border-y-2 border-grafite bg-chapa text-grafite">
      <div className="grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="px-5 py-12 sm:px-8 lg:py-16">
          <p className="mono text-xs font-semibold">Campanha da semana · {campaign.daysLabel}</p>
          <h2 id="campanha-titulo" className="display mt-5 text-[clamp(3rem,9vw,6.5rem)] [font-stretch:62%]">
            {campaign.name}
          </h2>
          <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-3">
            <p className="display text-[clamp(4.5rem,13vw,8.5rem)] leading-[0.8] [font-stretch:120%]">
              <span className="sr-only">Por </span>
              {formatBRL(campaign.promoPrice).replace(",00", "")}
            </p>
            <p className="max-w-[16rem] pb-2 text-[0.9375rem] leading-snug font-medium">
              Dois Prensados e uma batata grande. Nos outros dias, o mesmo sai por <s>{formatBRL(product.price)}</s>.
            </p>
          </div>
          <ul className="mt-8 grid max-w-[34rem] gap-2 text-[0.9375rem] leading-snug">
            <li className="flex gap-3">
              <span aria-hidden="true" className="mt-2 size-2 shrink-0 bg-grafite" />
              Vale pelo dia em que o pedido sai da cozinha, inclusive depois da meia-noite de terça e quarta. Pedido agendado para esses dias também vale.
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="mt-2 size-2 shrink-0 bg-grafite" />
              Até {campaign.maxPerOrder} por pedido. Não soma com o cupom: o cupom vale só para o resto da comanda.
            </li>
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <button type="button" onClick={() => openProduct(product.id)} className="btn btn-papel">
              Pôr a Dupla na comanda
            </button>
            <p className="mono text-xs font-semibold" aria-live="polite">
              {now ? when : ""}
            </p>
          </div>
        </div>
        {/* Foto em tratamento de cartaz: preto e branco impresso sobre o laranja */}
        <div className="relative min-h-[20rem] border-t-2 border-grafite md:min-h-0 md:border-t-0 md:border-l-2">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(min-width: 1216px) 26vw, (min-width: 768px) 40vw, 100vw"
            className="object-cover mix-blend-multiply contrast-[1.35] grayscale"
          />
          <p aria-hidden="true" className="display absolute top-4 right-5 text-[clamp(5rem,12vw,9rem)] leading-none text-papel [font-stretch:50%]">
            2x
          </p>
        </div>
      </div>
    </section>
  );
}
