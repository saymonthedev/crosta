import { campaign } from "../data/offers.ts";
import { neighborhoodById, store } from "../data/store.ts";
import type { CheckoutDraft } from "./checkout.ts";
import { localNow, relativeDay, shortDate, weekdayName, type Slot } from "./hours.ts";
import { formatBRL, parseBRL } from "./money.ts";
import type { Totals } from "./pricing.ts";

const stationTitle = { chapa: "Chapa", fritadeira: "Fritadeira", balcao: "Balcão" } as const;
const paymentLabel = { pix: "Pix (a loja envia a chave na confirmação)", dinheiro: "dinheiro", cartao: "cartão" } as const;

export type MessageInput = {
  reference: string;
  totals: Totals;
  draft: CheckoutDraft;
  slot: Slot | null;
  now: Date;
};

/** Mensagem legível no WhatsApp: *negrito* do próprio app, sem emoji, uma informação por linha. */
export function buildOrderMessage({ reference, totals, draft, slot, now }: MessageInput): string {
  const out: string[] = [];
  out.push(`*${store.name.toUpperCase()} · ${store.tagline}*`);
  out.push(`Pedido ref. ${reference}`);
  out.push("");

  for (const group of totals.byStation) {
    out.push(`*${stationTitle[group.station]}*`);
    for (const l of group.lines) {
      const promo = l.promo ? ` (preço de campanha, de ${formatBRL(l.listTotal)})` : "";
      out.push(`${l.line.qty}x ${l.product.name} — ${formatBRL(l.total)}${promo}`);
      for (const m of l.modifiers) out.push(`   ${m}`);
    }
    out.push("");
  }

  out.push(`Itens: ${formatBRL(totals.items)}`);
  if (totals.coupon.status === "applied") out.push(`Cupom ${totals.coupon.code}: −${formatBRL(totals.discount)}`);
  const hood = neighborhoodById(draft.neighborhoodId);
  if (draft.mode === "entrega" && hood) out.push(`Entrega (${hood.name}): ${formatBRL(hood.fee)}`);
  out.push(`*Total: ${formatBRL(totals.total)}*`);
  out.push("");

  if (draft.mode === "entrega" && hood) {
    out.push("*Entrega*");
    const complement = draft.complement.trim() ? `, ${draft.complement.trim()}` : "";
    out.push(`${draft.street.trim()}, ${draft.number.trim()}${complement}`);
    out.push(`Bairro: ${hood.name}`);
    if (draft.reference.trim()) out.push(`Referência: ${draft.reference.trim()}`);
  } else {
    out.push("*Retirada no balcão*");
    out.push(`${store.address.street}, ${store.address.district}`);
  }
  out.push("");

  out.push(`*Quando:* ${whenText(draft, slot, now)}`);
  out.push(`*Pagamento:* ${paymentText(draft, totals.total)}`);
  out.push(`*Nome:* ${draft.name.trim()}`);
  if (draft.when === "agendado") {
    out.push("");
    out.push("Horário agendado: aguardo a confirmação de vocês.");
  }
  if (totals.lines.some((l) => l.promo)) {
    out.push(`${campaign.name}: preço de ${campaign.daysLabel}.`);
  }
  return out.join("\n");
}

function whenText(draft: CheckoutDraft, slot: Slot | null, now: Date) {
  if (draft.when === "agendado" && slot) {
    const today = localNow(now).date;
    const rel = relativeDay(slot.calendarDate, today);
    const day = rel === "hoje" || rel === "amanhã" ? `${rel} (${weekdayName(slotWeekday(slot))}, ${shortDate(slot.calendarDate)})` : `${weekdayName(slotWeekday(slot))}, ${shortDate(slot.calendarDate)}`;
    return draft.mode === "entrega" ? `entregar por volta das ${slot.label} de ${day}` : `retirar às ${slot.label} de ${day}`;
  }
  if (draft.mode === "entrega") {
    const hood = neighborhoodById(draft.neighborhoodId);
    return hood ? `assim que possível (estimativa de ${hood.eta[0]} a ${hood.eta[1]} min)` : "assim que possível";
  }
  return `assim que possível (pronto em ${store.pickupReady[0]} a ${store.pickupReady[1]} min)`;
}

function slotWeekday(slot: Slot) {
  return slot.calendarDate === slot.serviceDate ? slot.weekday : (slot.weekday + 1) % 7;
}

function paymentText(draft: CheckoutDraft, total: number) {
  if (!draft.payment) return "";
  const where = draft.mode === "entrega" ? "na entrega" : "na retirada";
  if (draft.payment === "pix") return paymentLabel.pix;
  if (draft.payment === "cartao") return `cartão ${where}`;
  if (draft.noChange) return `dinheiro ${where}, sem troco`;
  const value = parseBRL(draft.changeFor) ?? total;
  const change = value - total;
  return change > 0
    ? `dinheiro ${where}, troco para ${formatBRL(value)} (devolver ${formatBRL(change)})`
    : `dinheiro ${where}, valor exato`;
}

export function whatsappLink(number: string, message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
