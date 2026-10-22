import type { Cents } from "../lib/money.ts";

/** "18:00" → minutos desde 00:00. Fechamento depois da meia-noite passa de 1440 (00:30 → 1470). */
export type ServiceWindow = { open: number; close: number };

const t = (hhmm: string, nextDay = false) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m + (nextDay ? 1440 : 0);
};

export type Neighborhood = { id: string; name: string; fee: Cents; eta: [number, number] };

export const store = {
  name: "Crosta",
  tagline: "smash burgers",
  /** Endereço fictício: a marca não existe. */
  address: { street: "Rua Sete de Setembro, 418", district: "Centro", city: "cidade fictícia" },
  timeZone: "America/Sao_Paulo",
  /** Índice = dia da semana (0 = domingo). null = fechado. */
  hours: [
    { open: t("18:00"), close: t("23:30") },
    null,
    { open: t("18:00"), close: t("00:30", true) },
    { open: t("18:00"), close: t("00:30", true) },
    { open: t("18:00"), close: t("00:30", true) },
    { open: t("18:00"), close: t("02:00", true) },
    { open: t("18:00"), close: t("02:00", true) },
  ] as (ServiceWindow | null)[],
  /** A cozinha para de aceitar pedidos "para agora" este tanto antes de fechar. */
  lastCallMinutes: 15,
  /** Antecedência mínima e janela dos horários agendáveis. */
  schedule: { stepMinutes: 15, pickupLead: 20, deliveryLead: 45, daysAhead: 6 },
  pickupReady: [15, 25] as [number, number],
  /** Pedido mínimo para entrega, em itens (antes de cupom e taxa). */
  deliveryMinimum: 4000 as Cents,
  maxQtyPerLine: 10,
  notesMax: 140,
  neighborhoods: [
    { id: "centro", name: "Centro", fee: 600, eta: [25, 40] },
    { id: "vila-nova", name: "Vila Nova", fee: 700, eta: [30, 45] },
    { id: "bela-vista", name: "Bela Vista", fee: 800, eta: [30, 45] },
    { id: "jardim-oficinas", name: "Jardim das Oficinas", fee: 900, eta: [35, 50] },
    { id: "agua-fria", name: "Água Fria", fee: 1000, eta: [35, 55] },
    { id: "parque-industrial", name: "Parque Industrial", fee: 1200, eta: [40, 60] },
    { id: "morro-do-sino", name: "Morro do Sino", fee: 1400, eta: [45, 65] },
  ] as Neighborhood[],
} as const;

/** Número do WhatsApp só com dígitos (DDI + DDD + número). Sem número configurado, o site mostra a mensagem para copiar. */
export function whatsappNumber(): string | null {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 12 ? digits : null;
}

export function neighborhoodById(id: string | null | undefined) {
  return store.neighborhoods.find((n) => n.id === id) ?? null;
}
