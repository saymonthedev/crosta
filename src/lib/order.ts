import { extrasCatalog, productById, type ExtraId, type LayerKind, type Product } from "../data/menu.ts";
import { store } from "../data/store.ts";
import { formatBRL, type Cents } from "./money.ts";

/** Escolhas de uma linha da comanda. Nada vem pré-selecionado: tudo começa vazio. */
export type LineConfig = {
  /** groupId → ids das opções escolhidas. */
  choices: Record<string, string[]>;
  /** ids de ingredientes retirados. */
  removed: string[];
  /** extraId → quantidade. */
  extras: Record<string, number>;
  notes: string;
};

export type CartLine = { id: string; productId: string; qty: number; config: LineConfig };

export function emptyConfig(): LineConfig {
  return { choices: {}, removed: [], extras: {}, notes: "" };
}

export function maxQty(product: Product) {
  return Math.min(store.maxQtyPerLine, product.maxPerOrder ?? Infinity);
}

/** Remove o que não existe mais no cardápio e corta valores fora dos limites (dados vindos do localStorage). */
export function sanitizeConfig(product: Product, raw: Partial<LineConfig> | undefined): LineConfig {
  const config = emptyConfig();
  if (!raw || typeof raw !== "object") return config;
  for (const group of product.groups ?? []) {
    const picked = Array.isArray(raw.choices?.[group.id]) ? raw.choices![group.id] : [];
    const valid = picked.filter((id) => group.options.some((o) => o.id === id)).slice(0, group.max);
    if (valid.length) config.choices[group.id] = valid;
  }
  const removable = new Set((product.ingredients ?? []).filter((i) => i.removable).map((i) => i.id));
  config.removed = Array.isArray(raw.removed) ? [...new Set(raw.removed.filter((id) => removable.has(id)))] : [];
  for (const extra of product.extras ?? []) {
    const n = Math.floor(Number(raw.extras?.[extra.id] ?? 0));
    if (n > 0) config.extras[extra.id] = Math.min(n, extra.max);
  }
  config.notes = typeof raw.notes === "string" ? raw.notes.slice(0, store.notesMax) : "";
  return config;
}

/** Erros por grupo/limite. Vazio = pode ir para a comanda. */
export function validateConfig(product: Product, config: LineConfig): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const group of product.groups ?? []) {
    const n = config.choices[group.id]?.length ?? 0;
    if (n < group.min) errors[group.id] = group.min === 1 && group.max === 1 ? `Escolha: ${group.label.toLowerCase()}.` : `Escolha pelo menos ${group.min}.`;
    if (n > group.max) errors[group.id] = `No máximo ${group.max}.`;
  }
  for (const limit of product.extraLimits ?? []) {
    const total = limit.ids.reduce((sum, id) => sum + (config.extras[id] ?? 0), 0);
    if (total > limit.max) errors[`limite:${limit.ids.join(",")}`] = limit.label;
  }
  if (config.notes.length > store.notesMax) errors.notes = `Observação com até ${store.notesMax} caracteres.`;
  return errors;
}

/** Quanto ainda cabe de um extra, considerando o máximo dele e os limites somados. */
export function extraRoom(product: Product, config: LineConfig, id: ExtraId): number {
  const own = product.extras?.find((e) => e.id === id);
  if (!own) return 0;
  let room = own.max - (config.extras[id] ?? 0);
  for (const limit of product.extraLimits ?? []) {
    if (!limit.ids.includes(id)) continue;
    const total = limit.ids.reduce((sum, x) => sum + (config.extras[x] ?? 0), 0);
    room = Math.min(room, limit.max - total);
  }
  return Math.max(0, room);
}

export function optionsDelta(product: Product, config: LineConfig): Cents {
  let sum = 0;
  for (const group of product.groups ?? []) {
    for (const id of config.choices[group.id] ?? []) sum += group.options.find((o) => o.id === id)?.delta ?? 0;
  }
  return sum;
}

export function extrasTotal(product: Product, config: LineConfig): Cents {
  let sum = 0;
  for (const extra of product.extras ?? []) sum += (config.extras[extra.id] ?? 0) * extrasCatalog[extra.id].price;
  return sum;
}

/** Preço unitário. `base` permite trocar o preço de tabela pelo da campanha. */
export function unitPrice(product: Product, config: LineConfig, base: Cents = product.price): Cents {
  return base + optionsDelta(product, config) + extrasTotal(product, config);
}

/** Modificadores legíveis, na ordem em que a cozinha lê: escolhas, retiradas, extras, observação. */
export function describeConfig(product: Product, config: LineConfig): string[] {
  const out: string[] = [];
  for (const group of product.groups ?? []) {
    const labels = (config.choices[group.id] ?? []).map((id) => group.options.find((o) => o.id === id)?.label).filter(Boolean);
    if (labels.length) out.push(`${group.label.toLowerCase()}: ${labels.join(", ").toLowerCase()}`);
  }
  for (const id of config.removed) {
    const ing = product.ingredients?.find((i) => i.id === id);
    if (ing) out.push(`sem ${ing.label.toLowerCase()}`);
  }
  for (const extra of product.extras ?? []) {
    const n = config.extras[extra.id] ?? 0;
    if (!n) continue;
    const item = extrasCatalog[extra.id];
    out.push(`+ ${n}x ${item.label.toLowerCase()}${item.price ? ` (${formatBRL(item.price * n)})` : ""}`);
  }
  if (config.notes.trim()) out.push(`obs.: ${config.notes.trim()}`);
  return out;
}

function canonical(config: LineConfig) {
  const choices = Object.keys(config.choices)
    .sort()
    .map((k) => `${k}=${[...config.choices[k]].sort().join("+")}`);
  const extras = Object.keys(config.extras)
    .filter((k) => config.extras[k] > 0)
    .sort()
    .map((k) => `${k}=${config.extras[k]}`);
  return JSON.stringify([choices, [...config.removed].sort(), extras, config.notes.trim()]);
}

export function sameConfig(a: LineConfig, b: LineConfig) {
  return canonical(a) === canonical(b);
}

/* ---------- Camadas para o desenho do burger ---------- */

export type StackLayer = {
  key: string;
  kind: LayerKind;
  label: string;
  /** Preço que a camada acrescenta (extras). */
  delta?: Cents;
  /** Ingrediente retirado: desenhado só como contorno. */
  removed?: boolean;
  /** Lugar reservado (ex.: pão ainda não escolhido): contorno tracejado, sem riscar. */
  ghost?: boolean;
  extra?: boolean;
};

const buns: LayerKind[] = ["brioche", "potato", "australian"];
const proteins: LayerKind[] = ["patty", "patty-veg", "chicken"];
const cheeses: LayerKind[] = ["cheddar", "prato"];
/** Ordem de montagem de baixo para cima (fora pão, carne e queijo, que têm regra própria). */
const order: LayerKind[] = [
  "arugula",
  "lettuce",
  "tomato",
  "bacon",
  "onion-griddle",
  "onion-caramel",
  "pepper",
  "slaw",
  "pickles",
  "onion-raw",
  "mustard",
  "ketchup",
  "mayo-garlic",
  "mayo-pepper",
  "sauce-smoky",
  "sauce-house",
];
const belowProtein: LayerKind[] = ["arugula", "lettuce", "tomato", "pickles"];

/**
 * Converte produto + escolhas em camadas, de baixo para cima.
 * Queijo vai sempre sobre a carne (uma fatia por carne, de cima para baixo); o que sobra empilha na carne de cima.
 */
export function stackLayers(product: Product, config: LineConfig): StackLayer[] {
  const removed = new Set(config.removed);
  const items: StackLayer[] = [];
  for (const ing of product.ingredients ?? []) {
    for (let i = 0; i < (ing.count ?? 1); i++) {
      items.push({ key: `${ing.id}-${i}`, kind: ing.layer, label: ing.label, removed: removed.has(ing.id) });
    }
  }
  for (const group of product.groups ?? []) {
    for (const id of config.choices[group.id] ?? []) {
      const opt = group.options.find((o) => o.id === id);
      if (opt?.layer) items.push({ key: `${group.id}-${id}`, kind: opt.layer, label: opt.label, delta: opt.delta });
    }
  }
  for (const extra of product.extras ?? []) {
    const item = extrasCatalog[extra.id];
    for (let i = 0; i < (config.extras[extra.id] ?? 0); i++) {
      items.push({ key: `extra-${extra.id}-${i}`, kind: item.layer, label: item.label, delta: item.price, extra: true });
    }
  }

  const bun = items.find((l) => buns.includes(l.kind));
  const proteinLayers = items.filter((l) => proteins.includes(l.kind));
  const cheeseLayers = items.filter((l) => cheeses.includes(l.kind));
  const rest = items.filter((l) => !buns.includes(l.kind) && !proteins.includes(l.kind) && !cheeses.includes(l.kind));
  const rank = (l: StackLayer) => order.indexOf(l.kind);

  // Ingredientes de baixo só ficam embaixo quando a receita os põe ali (ex.: rúcula do Horta, picles do Frango).
  const recipeBelow = new Set<string>();
  let seenProtein = false;
  for (const ing of product.ingredients ?? []) {
    if (proteins.includes(ing.layer)) seenProtein = true;
    else if (!seenProtein && belowProtein.includes(ing.layer)) recipeBelow.add(ing.layer);
  }
  const below = rest.filter((l) => recipeBelow.has(l.kind)).sort((a, b) => rank(a) - rank(b));
  const above = rest.filter((l) => !recipeBelow.has(l.kind)).sort((a, b) => rank(a) - rank(b));

  // Distribui queijos: um por carne, começando pela de cima.
  const perPatty: StackLayer[][] = proteinLayers.map(() => []);
  cheeseLayers.forEach((c, i) => {
    const target = proteinLayers.length ? Math.max(0, proteinLayers.length - 1 - (i % proteinLayers.length)) : 0;
    (perPatty[target] ??= []).push(c);
  });

  const stack: StackLayer[] = [];
  if (bun) stack.push({ ...bun, key: "pao-base", label: bun.label });
  stack.push(...below);
  proteinLayers.forEach((p, i) => stack.push(p, ...(perPatty[i] ?? [])));
  if (!proteinLayers.length) stack.push(...cheeseLayers);
  stack.push(...above);
  if (bun) stack.push({ ...bun, key: "pao-topo", label: bun.label, delta: undefined });
  return stack;
}

/** Peso de carne, para a ficha técnica. */
export function meatGrams(product: Product, config: LineConfig): number {
  const base = (product.ingredients ?? []).filter((i) => i.layer === "patty").reduce((s, i) => s + (i.count ?? 1), 0);
  return (base + (config.extras.smash ?? 0)) * 90;
}

export function productOf(line: CartLine): Product | undefined {
  return productById(line.productId);
}
