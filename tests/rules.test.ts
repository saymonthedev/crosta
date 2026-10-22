import { test } from "node:test";
import assert from "node:assert/strict";
import { productById } from "../src/data/menu.ts";
import { formatBRL, parseBRL } from "../src/lib/money.ts";
import { storeStatus, scheduleDays, localNow, findSlot } from "../src/lib/hours.ts";
import { emptyConfig, stackLayers, unitPrice, validateConfig, sanitizeConfig, extraRoom, type CartLine } from "../src/lib/order.ts";
import { priceCart } from "../src/lib/pricing.ts";
import { validateCheckout, emptyDraft } from "../src/lib/checkout.ts";
import { buildOrderMessage, whatsappLink } from "../src/lib/message.ts";

// Horário de Brasília = UTC-3 (sem horário de verão desde 2019).
const sp = (iso: string) => new Date(`${iso}-03:00`);
const line = (productId: string, qty: number, config = emptyConfig(), id = productId): CartLine => ({ id, productId, qty, config });

test("dinheiro em centavos", () => {
  assert.equal(formatBRL(3600), "R$ 36,00");
  assert.equal(formatBRL(123456), "R$ 1.234,56");
  assert.equal(parseBRL("100"), 10000);
  assert.equal(parseBRL("R$ 1.250,5"), 125050);
  assert.equal(parseBRL("abc"), null);
  assert.equal(parseBRL("10,999"), null);
});

test("horário: aberto, último pedido, depois da meia-noite e segunda fechada", () => {
  // Quinta 22/10/2026, 19:42
  const s1 = storeStatus(sp("2026-10-22T19:42"));
  assert.equal(s1.state, "open");
  // Sexta 00:20 ainda é o serviço de quinta (fecha 00:30), mas passou do último pedido (00:15)
  const s2 = storeStatus(sp("2026-10-23T00:20"));
  assert.ok(s2.state === "open" && !s2.acceptsNow && s2.service.weekday === 4);
  // Sábado 01:30 = serviço de sexta (fecha 02:00)
  const s3 = storeStatus(sp("2026-10-24T01:30"));
  assert.ok(s3.state === "open" && s3.service.weekday === 5 && s3.acceptsNow);
  // Segunda 20:00: fechado, abre terça
  const s4 = storeStatus(sp("2026-10-26T20:00"));
  assert.ok(s4.state === "closed" && s4.next?.weekday === 2);
  // Domingo 23:40: fechado (fecha 23:30)
  assert.equal(storeStatus(sp("2026-10-25T23:40")).state, "closed");
  assert.equal(localNow(sp("2026-10-22T19:42")).minutes, 19 * 60 + 42);
});

test("agenda: antecedência por modo e horários depois da meia-noite", () => {
  const at = sp("2026-10-22T19:42");
  const pickup = scheduleDays(at, "retirada");
  const delivery = scheduleDays(at, "entrega");
  assert.equal(pickup[0].slots[0].label, "20:15"); // 19:42 + 20 = 20:02 → 20:15
  assert.equal(delivery[0].slots[0].label, "20:30"); // 19:42 + 45 = 20:27 → 20:30
  const last = pickup[0].slots.at(-1)!;
  assert.equal(last.label, "00:30");
  assert.equal(last.calendarDate, "2026-10-23");
  // Segunda não aparece
  assert.ok(!pickup.some((d) => d.weekday === 1));
  assert.equal(findSlot(at, "retirada", "2026-10-22@1200"), null);
});

test("preço: extras, opções e campanha só em terça/quarta", () => {
  const crosta = productById("crosta")!;
  const cfg = { ...emptyConfig(), extras: { bacon: 1, smash: 1 } };
  assert.equal(unitPrice(crosta, cfg), 3600 + 600 + 900);
  const combo = productById("combo-balcao")!;
  assert.equal(unitPrice(combo, { ...emptyConfig(), choices: { burger: ["defumado"] } }), 5100);
  const cart = [line("dupla", 1), line("batata", 1, { ...emptyConfig(), choices: { tamanho: ["grande"] } })];
  const tuesday = priceCart(cart, { serviceWeekday: 2, couponCode: null, mode: null, neighborhoodId: null });
  const thursday = priceCart(cart, { serviceWeekday: 4, couponCode: null, mode: null, neighborhoodId: null });
  assert.equal(tuesday.items, 4900 + 1900);
  assert.equal(tuesday.campaignSavings, 1500);
  assert.equal(thursday.items, 6400 + 1900);
});

test("cupom: inválido, mínimo fora da campanha, teto de desconto", () => {
  const base = { serviceWeekday: 2, mode: null, neighborhoodId: null } as const;
  const small = [line("crosta", 1), line("dupla", 2)];
  const t1 = priceCart(small, { ...base, couponCode: "balcao10" });
  assert.equal(t1.coupon.status, "blocked");
  assert.equal(t1.coupon.status === "blocked" && t1.coupon.missing, 3400);
  assert.equal(priceCart(small, { ...base, couponCode: "XYZ" }).coupon.status, "invalid");
  const mid = [line("crosta", 2)];
  const t2 = priceCart(mid, { ...base, couponCode: " balcao10 " });
  assert.equal(t2.discount, 720);
  assert.equal(t2.total, 7200 - 720);
  const big = [line("torre", 5)];
  assert.equal(priceCart(big, { ...base, couponCode: "BALCAO10" }).discount, 1500);
});

test("entrega: taxa do bairro e pedido mínimo", () => {
  const t = priceCart([line("prensado", 1)], { serviceWeekday: 4, couponCode: null, mode: "entrega", neighborhoodId: "vila-nova" });
  assert.equal(t.deliveryFee, 700);
  assert.equal(t.minimumShortfall, 1600);
  assert.equal(t.total, 3100);
  const r = priceCart([line("prensado", 1)], { serviceWeekday: 4, couponCode: null, mode: "retirada", neighborhoodId: null });
  assert.equal(r.deliveryFee, 0);
  assert.equal(r.minimumShortfall, 0);
});

test("configuração: obrigatórios sem pré-seleção, limites e saneamento", () => {
  const crosta = productById("crosta")!;
  assert.ok(validateConfig(crosta, emptyConfig()).ponto);
  const custom = productById("do-seu-jeito")!;
  const sauces = { ...emptyConfig(), choices: { pao: ["brioche"], ponto: ["ao-ponto"] }, extras: { "molho-casa": 1, mostarda: 1 } };
  assert.equal(extraRoom(custom, sauces, "ketchup"), 0);
  assert.deepEqual(validateConfig(custom, sauces), {});
  const dirty = sanitizeConfig(crosta, { choices: { ponto: ["cru", "ao-ponto"] }, removed: ["carne", "picles"], extras: { smash: 9, inexistente: 2 }, notes: "x".repeat(300) } as never);
  assert.deepEqual(dirty.choices, { ponto: ["ao-ponto"] });
  assert.deepEqual(dirty.removed, ["picles"]);
  assert.deepEqual(dirty.extras, { smash: 2 });
  assert.equal(dirty.notes.length, 140);
});

test("camadas: queijo sobre a carne, pão nas pontas", () => {
  const layers = stackLayers(productById("crosta")!, { ...emptyConfig(), extras: { smash: 1 } });
  const kinds = layers.map((l) => l.kind);
  assert.equal(kinds[0], "brioche");
  assert.equal(kinds.at(-1), "brioche");
  assert.equal(kinds.filter((k) => k === "patty").length, 3);
  assert.equal(kinds[kinds.lastIndexOf("patty") + 1], "cheddar");
});

test("checkout e mensagem do WhatsApp", () => {
  const at = sp("2026-10-22T19:42");
  const status = storeStatus(at);
  const cart = [line("crosta", 2, { ...emptyConfig(), choices: { ponto: ["ao-ponto"] }, removed: ["picles"], extras: { bacon: 1 }, notes: "cortar ao meio" })];
  const ctx = { serviceWeekday: 4, couponCode: null, mode: "entrega" as const, neighborhoodId: "centro" };
  const totals = priceCart(cart, ctx);
  const empty = validateCheckout({ ...emptyDraft, mode: "entrega" }, totals, status, null);
  assert.ok(empty.neighborhood && empty.street && empty.number && empty.when && empty.payment && empty.name);
  const draft = { ...emptyDraft, mode: "entrega" as const, neighborhoodId: "centro", street: "Rua das Flores", number: "12", when: "agora" as const, payment: "dinheiro" as const, changeFor: "50", name: "Ana" };
  assert.ok(validateCheckout(draft, totals, status, null).changeFor);
  const ok = { ...draft, changeFor: "100" };
  assert.deepEqual(validateCheckout(ok, totals, status, null), {});
  const msg = buildOrderMessage({ reference: "0427", totals, draft: ok, slot: null, now: at });
  assert.match(msg, /2x Crosta — R\$ 84,00/);
  assert.match(msg, /sem picles/);
  assert.match(msg, /troco para R\$ 100,00 \(devolver R\$ 10,00\)/);
  assert.match(msg, /Entrega \(Centro\): R\$ 6,00/);
  const url = whatsappLink("5500000000000", msg);
  assert.ok(url.startsWith("https://wa.me/5500000000000?text="));
  assert.equal(decodeURIComponent(url.split("text=")[1]), msg);
  // Loja fechada: "agora" não vale
  const closed = storeStatus(sp("2026-10-26T20:00"));
  assert.ok(validateCheckout(ok, totals, closed, null).when);
});
