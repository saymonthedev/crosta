import type { Cents } from "../lib/money.ts";

/** Campanha da semana: preço fechado para um produto em dias específicos. */
export const campaign = {
  id: "dupla-da-chapa",
  productId: "dupla",
  name: "Dupla da Chapa",
  promoPrice: 4900 as Cents,
  /** Dias de serviço (0 = domingo). Vale pelo dia em que o pedido sai da cozinha, mesmo depois da meia-noite. */
  weekdays: [2, 3],
  daysLabel: "terça e quarta",
  maxPerOrder: 2,
} as const;

/** Cupom de demonstração. Funciona de verdade, com as regras abaixo. */
export const coupon = {
  code: "BALCAO10",
  percent: 10,
  /** Mínimo em itens fora da campanha. */
  minEligible: 7000 as Cents,
  maxDiscount: 1500 as Cents,
} as const;
