import type { Product, Station } from "../data/menu.ts";
import { campaign, coupon } from "../data/offers.ts";
import { neighborhoodById, store } from "../data/store.ts";
import type { Mode } from "./hours.ts";
import { percentOf, type Cents } from "./money.ts";
import { describeConfig, productOf, unitPrice, type CartLine } from "./order.ts";

export type PricedLine = {
  line: CartLine;
  product: Product;
  unit: Cents;
  total: Cents;
  /** Preço de tabela da linha, para mostrar a diferença da campanha. */
  listTotal: Cents;
  promo: boolean;
  modifiers: string[];
};

export type CouponState =
  | { status: "none" }
  | { status: "applied"; code: string; discount: Cents }
  | { status: "invalid"; code: string; message: string }
  | { status: "blocked"; code: string; message: string; missing: Cents };

export type Totals = {
  lines: PricedLine[];
  byStation: { station: Station; lines: PricedLine[] }[];
  count: number;
  /** Soma dos itens, já com o preço de campanha. */
  items: Cents;
  campaignSavings: Cents;
  coupon: CouponState;
  discount: Cents;
  deliveryFee: Cents | null;
  total: Cents;
  /** Quanto falta em itens para o pedido mínimo de entrega (0 = ok). */
  minimumShortfall: Cents;
};

export type PricingContext = {
  /** Dia da semana do serviço em que o pedido sai. null = ainda não dá para saber. */
  serviceWeekday: number | null;
  couponCode: string | null;
  mode: Mode | null;
  neighborhoodId: string | null;
};

export function campaignActive(weekday: number | null) {
  return weekday !== null && (campaign.weekdays as readonly number[]).includes(weekday);
}

export function normalizeCoupon(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

const stations: Station[] = ["chapa", "fritadeira", "balcao"];

export function priceCart(cart: CartLine[], ctx: PricingContext): Totals {
  const promoDay = campaignActive(ctx.serviceWeekday);
  const lines: PricedLine[] = [];
  for (const line of cart) {
    const product = productOf(line);
    if (!product) continue;
    const promo = promoDay && product.id === campaign.productId;
    const unit = unitPrice(product, line.config, promo ? campaign.promoPrice : product.price);
    const listUnit = unitPrice(product, line.config);
    lines.push({
      line,
      product,
      unit,
      total: unit * line.qty,
      listTotal: listUnit * line.qty,
      promo,
      modifiers: describeConfig(product, line.config),
    });
  }

  const items = lines.reduce((s, l) => s + l.total, 0);
  const campaignSavings = lines.reduce((s, l) => s + (l.listTotal - l.total), 0);
  const eligible = lines.filter((l) => !l.promo).reduce((s, l) => s + l.total, 0);

  let couponState: CouponState = { status: "none" };
  if (ctx.couponCode) {
    const code = normalizeCoupon(ctx.couponCode);
    if (code !== coupon.code) {
      couponState = { status: "invalid", code, message: "Cupom não encontrado. Confira as letras." };
    } else if (eligible < coupon.minEligible) {
      const missing = coupon.minEligible - eligible;
      couponState = {
        status: "blocked",
        code,
        missing,
        message: lines.some((l) => l.promo)
          ? "Vale a partir de R$ 70,00 em itens fora da campanha."
          : "Vale a partir de R$ 70,00 em itens.",
      };
    } else {
      couponState = { status: "applied", code, discount: Math.min(percentOf(eligible, coupon.percent), coupon.maxDiscount) };
    }
  }
  const discount = couponState.status === "applied" ? couponState.discount : 0;

  const hood = ctx.mode === "entrega" ? neighborhoodById(ctx.neighborhoodId) : null;
  const deliveryFee = ctx.mode === "retirada" ? 0 : hood ? hood.fee : null;
  const minimumShortfall = ctx.mode === "entrega" ? Math.max(0, store.deliveryMinimum - items) : 0;

  return {
    lines,
    byStation: stations.map((station) => ({ station, lines: lines.filter((l) => l.product.station === station) })).filter((g) => g.lines.length),
    count: lines.reduce((s, l) => s + l.line.qty, 0),
    items,
    campaignSavings,
    coupon: couponState,
    discount,
    deliveryFee,
    total: items - discount + (deliveryFee ?? 0),
    minimumShortfall,
  };
}
