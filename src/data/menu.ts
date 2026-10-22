import type { Cents } from "../lib/money.ts";

/** Camadas que o desenho do burger sabe desenhar. */
export type LayerKind =
  | "brioche"
  | "potato"
  | "australian"
  | "patty"
  | "patty-veg"
  | "chicken"
  | "cheddar"
  | "prato"
  | "bacon"
  | "onion-griddle"
  | "onion-caramel"
  | "onion-raw"
  | "pickles"
  | "lettuce"
  | "arugula"
  | "tomato"
  | "pepper"
  | "slaw"
  | "sauce-house"
  | "sauce-smoky"
  | "mustard"
  | "ketchup"
  | "mayo-garlic"
  | "mayo-pepper";

export type CategoryId = "burgers" | "combos" | "acompanhamentos" | "bebidas" | "sobremesas";
/** Estação da cozinha: é assim que a comanda agrupa os itens. */
export type Station = "chapa" | "fritadeira" | "balcao";

export type Ingredient = {
  id: string;
  label: string;
  layer: LayerKind;
  /** Quantas camadas iguais (ex.: duas carnes). */
  count?: number;
  removable: boolean;
};

export type OptionGroup = {
  id: string;
  label: string;
  hint?: string;
  min: number;
  max: number;
  options: { id: string; label: string; delta?: Cents; detail?: string; layer?: LayerKind }[];
};

export type ExtraId = keyof typeof extrasCatalog;

export type Product = {
  id: string;
  category: CategoryId;
  station: Station;
  name: string;
  description: string;
  price: Cents;
  photo?: string;
  ingredients?: Ingredient[];
  extras?: { id: ExtraId; max: number }[];
  /** Limite somado entre extras (ex.: até 2 molhos). */
  extraLimits?: { ids: ExtraId[]; max: number; label: string }[];
  groups?: OptionGroup[];
  maxPerOrder?: number;
  /** Motivo, quando o item não pode ser pedido. */
  unavailable?: string;
  note?: string;
};

export const extrasCatalog = {
  smash: { label: "Carne smash 90 g", price: 900, layer: "patty" },
  cheddar: { label: "Cheddar", price: 400, layer: "cheddar" },
  prato: { label: "Queijo prato", price: 400, layer: "prato" },
  bacon: { label: "Bacon", price: 600, layer: "bacon" },
  "cebola-chapa": { label: "Cebola na chapa", price: 300, layer: "onion-griddle" },
  "cebola-caramelizada": { label: "Cebola caramelizada", price: 400, layer: "onion-caramel" },
  "cebola-crua": { label: "Cebola crua", price: 200, layer: "onion-raw" },
  picles: { label: "Picles", price: 200, layer: "pickles" },
  alface: { label: "Alface", price: 200, layer: "lettuce" },
  tomate: { label: "Tomate", price: 200, layer: "tomato" },
  "molho-casa": { label: "Molho da casa", price: 300, layer: "sauce-house" },
  "maionese-defumada": { label: "Maionese defumada", price: 300, layer: "sauce-smoky" },
  mostarda: { label: "Mostarda", price: 0, layer: "mustard" },
  ketchup: { label: "Ketchup", price: 0, layer: "ketchup" },
} as const satisfies Record<string, { label: string; price: Cents; layer: LayerKind }>;

const ponto: OptionGroup = {
  id: "ponto",
  label: "Ponto da carne",
  hint: "Smash é fina: ao ponto sai rosada só no miolo.",
  min: 1,
  max: 1,
  options: [
    { id: "ao-ponto", label: "Ao ponto" },
    { id: "bem-passado", label: "Bem passado" },
  ],
};

const flavors = [
  { id: "cola", label: "Cola" },
  { id: "cola-zero", label: "Cola sem açúcar" },
  { id: "guarana", label: "Guaraná" },
  { id: "tonica", label: "Tônica" },
];

export const categories: { id: CategoryId; label: string; blurb: string }[] = [
  { id: "burgers", label: "Burgers", blurb: "Carne moída na casa, bola de 90 g, prensada na chapa até a borda rendar." },
  { id: "combos", label: "Combos", blurb: "Bandeja montada: burger, batata e bebida por menos do que separados." },
  { id: "acompanhamentos", label: "Acompanhamentos", blurb: "Tudo frito em óleo trocado todo dia." },
  { id: "bebidas", label: "Bebidas", blurb: "Gelada de verdade." },
  { id: "sobremesas", label: "Sobremesas", blurb: "Para fechar a comanda." },
];

export const products: Product[] = [
  {
    id: "crosta",
    category: "burgers",
    station: "chapa",
    name: "Crosta",
    description: "O da casa. Duas carnes prensadas até a borda rendar, cheddar duplo, cebola na chapa, picles e molho da casa no brioche com gergelim.",
    price: 3600,
    photo: "crosta",
    ingredients: [
      { id: "pao", label: "Brioche com gergelim", layer: "brioche", removable: false },
      { id: "carne", label: "Carne smash 90 g", layer: "patty", count: 2, removable: false },
      { id: "cheddar", label: "Cheddar", layer: "cheddar", count: 2, removable: true },
      { id: "cebola-chapa", label: "Cebola na chapa", layer: "onion-griddle", removable: true },
      { id: "picles", label: "Picles", layer: "pickles", removable: true },
      { id: "molho-casa", label: "Molho da casa", layer: "sauce-house", removable: true },
    ],
    extras: [
      { id: "smash", max: 2 },
      { id: "cheddar", max: 2 },
      { id: "bacon", max: 2 },
      { id: "cebola-caramelizada", max: 1 },
      { id: "picles", max: 1 },
      { id: "molho-casa", max: 1 },
    ],
    groups: [ponto],
  },
  {
    id: "prensado",
    category: "burgers",
    station: "chapa",
    name: "Prensado",
    description: "Uma carne, queijo prato, picles, cebola crua picada, mostarda e ketchup no pão de batata. O burger de balcão, sem enfeite.",
    price: 2400,
    photo: "prensado",
    ingredients: [
      { id: "pao", label: "Pão de batata", layer: "potato", removable: false },
      { id: "carne", label: "Carne smash 90 g", layer: "patty", removable: false },
      { id: "prato", label: "Queijo prato", layer: "prato", removable: true },
      { id: "picles", label: "Picles", layer: "pickles", removable: true },
      { id: "cebola-crua", label: "Cebola crua", layer: "onion-raw", removable: true },
      { id: "mostarda", label: "Mostarda", layer: "mustard", removable: true },
      { id: "ketchup", label: "Ketchup", layer: "ketchup", removable: true },
    ],
    extras: [
      { id: "smash", max: 3 },
      { id: "prato", max: 2 },
      { id: "bacon", max: 2 },
      { id: "picles", max: 1 },
    ],
    groups: [ponto],
  },
  {
    id: "defumado",
    category: "burgers",
    station: "chapa",
    name: "Defumado",
    description: "Duas carnes, cheddar, bacon em tiras, cebola caramelizada devagar e maionese defumada no brioche.",
    price: 3900,
    photo: "defumado",
    ingredients: [
      { id: "pao", label: "Brioche com gergelim", layer: "brioche", removable: false },
      { id: "carne", label: "Carne smash 90 g", layer: "patty", count: 2, removable: false },
      { id: "cheddar", label: "Cheddar", layer: "cheddar", count: 2, removable: true },
      { id: "bacon", label: "Bacon", layer: "bacon", removable: true },
      { id: "cebola-caramelizada", label: "Cebola caramelizada", layer: "onion-caramel", removable: true },
      { id: "maionese-defumada", label: "Maionese defumada", layer: "sauce-smoky", removable: true },
    ],
    extras: [
      { id: "smash", max: 2 },
      { id: "cheddar", max: 2 },
      { id: "bacon", max: 1 },
      { id: "maionese-defumada", max: 1 },
    ],
    groups: [ponto],
  },
  {
    id: "torre",
    category: "burgers",
    station: "chapa",
    name: "Torre",
    description: "Três carnes, três fatias de cheddar, picles e molho da casa. São 270 g de carne em um pão só.",
    price: 4400,
    photo: "torre",
    ingredients: [
      { id: "pao", label: "Brioche com gergelim", layer: "brioche", removable: false },
      { id: "carne", label: "Carne smash 90 g", layer: "patty", count: 3, removable: false },
      { id: "cheddar", label: "Cheddar", layer: "cheddar", count: 3, removable: true },
      { id: "picles", label: "Picles", layer: "pickles", removable: true },
      { id: "molho-casa", label: "Molho da casa", layer: "sauce-house", removable: true },
    ],
    extras: [
      { id: "smash", max: 1 },
      { id: "bacon", max: 2 },
      { id: "cebola-chapa", max: 1 },
    ],
    groups: [ponto],
    note: "Limite da casa: quatro carnes por pão.",
  },
  {
    id: "horta",
    category: "burgers",
    station: "chapa",
    name: "Horta na Chapa",
    description: "Burger de grão-de-bico e cogumelo selado na chapa, rúcula, pimentão assado e maionese de alho no brioche.",
    price: 3200,
    photo: "horta",
    ingredients: [
      { id: "pao", label: "Brioche com gergelim", layer: "brioche", removable: false },
      { id: "rucula", label: "Rúcula", layer: "arugula", removable: true },
      { id: "burger-veg", label: "Grão-de-bico e cogumelo", layer: "patty-veg", removable: false },
      { id: "pimentao", label: "Pimentão assado", layer: "pepper", removable: true },
      { id: "maionese-alho", label: "Maionese de alho", layer: "mayo-garlic", removable: true },
    ],
    extras: [
      { id: "prato", max: 2 },
      { id: "cebola-caramelizada", max: 1 },
      { id: "picles", max: 1 },
    ],
    note: "Sem carne, mas é feito na mesma chapa dos burgers bovinos.",
  },
  {
    id: "frango",
    category: "burgers",
    station: "chapa",
    name: "Frango Crocante",
    description: "Sobrecoxa empanada na hora, repolho com limão, picles e maionese de pimenta no pão de batata.",
    price: 3300,
    photo: "frango",
    ingredients: [
      { id: "pao", label: "Pão de batata", layer: "potato", removable: false },
      { id: "picles", label: "Picles", layer: "pickles", removable: true },
      { id: "sobrecoxa", label: "Sobrecoxa empanada", layer: "chicken", removable: false },
      { id: "repolho", label: "Repolho com limão", layer: "slaw", removable: true },
      { id: "maionese-pimenta", label: "Maionese de pimenta", layer: "mayo-pepper", removable: true },
    ],
    extras: [
      { id: "cheddar", max: 2 },
      { id: "bacon", max: 2 },
      { id: "picles", max: 1 },
    ],
  },
  {
    id: "combo-balcao",
    category: "combos",
    station: "chapa",
    name: "Combo Balcão",
    description: "Um burger, batata da chapa pequena e uma lata. Sai R$ 9 mais barato do que pedir os três separados.",
    price: 3600,
    photo: "bandeja",
    groups: [
      {
        id: "burger",
        label: "Burger da bandeja",
        min: 1,
        max: 1,
        options: [
          { id: "prensado", label: "Prensado", detail: "1 carne, queijo prato" },
          { id: "crosta", label: "Crosta", delta: 1200, detail: "2 carnes, cheddar duplo" },
          { id: "defumado", label: "Defumado", delta: 1500, detail: "2 carnes, bacon" },
        ],
      },
      ponto,
      { id: "bebida", label: "Lata da bandeja", min: 1, max: 1, options: flavors },
    ],
    note: "Para tirar ou trocar ingredientes do burger, peça avulso.",
  },
  {
    id: "dupla",
    category: "combos",
    station: "chapa",
    name: "Dupla da Chapa",
    description: "Dois Prensados e uma batata da chapa grande para dividir.",
    price: 6400,
    photo: "prensado",
    groups: [{ ...ponto, label: "Ponto das duas carnes", hint: "Os dois saem no mesmo ponto." }],
    maxPerOrder: 2,
  },
  {
    id: "batata",
    category: "acompanhamentos",
    station: "fritadeira",
    name: "Batata da Chapa",
    description: "Palito com casca, frita duas vezes, sal e páprica defumada.",
    price: 1400,
    groups: [
      {
        id: "tamanho",
        label: "Tamanho",
        min: 1,
        max: 1,
        options: [
          { id: "pequena", label: "Pequena", detail: "150 g" },
          { id: "grande", label: "Grande", detail: "300 g", delta: 500 },
        ],
      },
    ],
  },
  {
    id: "batata-cheddar",
    category: "acompanhamentos",
    station: "fritadeira",
    name: "Batata Cheddar e Bacon",
    description: "A batata grande coberta de cheddar cremoso e bacon picado. Dá para dois.",
    price: 2600,
    photo: "batata-cheddar",
  },
  {
    id: "aneis",
    category: "acompanhamentos",
    station: "fritadeira",
    name: "Anéis de Cebola",
    description: "Rodelas grossas empanadas na massa de cerveja, com um molho à escolha.",
    price: 2200,
    photo: "aneis",
    groups: [
      {
        id: "molho",
        label: "Molho do pote",
        min: 1,
        max: 1,
        options: [
          { id: "molho-casa", label: "Molho da casa" },
          { id: "maionese-defumada", label: "Maionese defumada" },
          { id: "maionese-alho", label: "Maionese de alho" },
          { id: "maionese-pimenta", label: "Maionese de pimenta" },
        ],
      },
    ],
  },
  {
    id: "lata",
    category: "bebidas",
    station: "balcao",
    name: "Refrigerante lata",
    description: "350 ml.",
    price: 700,
    groups: [{ id: "sabor", label: "Sabor", min: 1, max: 1, options: flavors }],
  },
  {
    id: "agua",
    category: "bebidas",
    station: "balcao",
    name: "Água mineral",
    description: "500 ml.",
    price: 500,
    groups: [
      {
        id: "tipo",
        label: "Tipo",
        min: 1,
        max: 1,
        options: [
          { id: "sem-gas", label: "Sem gás" },
          { id: "com-gas", label: "Com gás" },
        ],
      },
    ],
  },
  {
    id: "limonada",
    category: "bebidas",
    station: "balcao",
    name: "Limonada da casa",
    description: "500 ml, limão espremido na hora.",
    price: 1200,
    unavailable: "Acabou o limão de hoje.",
    groups: [
      {
        id: "acucar",
        label: "Açúcar",
        min: 1,
        max: 1,
        options: [
          { id: "com", label: "Com açúcar" },
          { id: "sem", label: "Sem açúcar" },
        ],
      },
    ],
  },
  {
    id: "brownie",
    category: "sobremesas",
    station: "balcao",
    name: "Brownie na Chapa",
    description: "Aquecido na chapa até criar casquinha, com calda de chocolate meio amargo e flor de sal.",
    price: 1400,
    photo: "brownie",
  },
  {
    id: "milkshake",
    category: "sobremesas",
    station: "balcao",
    name: "Shake de baunilha e bacon",
    description: "400 ml no copo de inox. Sorvete de baunilha, chantilly e uma lasca de bacon caramelizado por cima.",
    price: 2200,
    photo: "milkshake",
  },
];

/** Produto do "Monte seu smash": pão e uma carne na base, o resto você escolhe. */
export const customBurger: Product = {
  id: "do-seu-jeito",
  category: "burgers",
  station: "chapa",
  name: "Do seu jeito",
  description: "Pão e uma carne smash na base. O resto é com você.",
  price: 1800,
  ingredients: [{ id: "carne", label: "Carne smash 90 g", layer: "patty", removable: false }],
  groups: [
    {
      id: "pao",
      label: "Pão",
      min: 1,
      max: 1,
      options: [
        { id: "brioche", label: "Brioche com gergelim", layer: "brioche" },
        { id: "batata", label: "Pão de batata", layer: "potato" },
        { id: "australiano", label: "Australiano", layer: "australian", delta: 200 },
      ],
    },
    ponto,
  ],
  extras: [
    { id: "smash", max: 3 },
    { id: "cheddar", max: 4 },
    { id: "prato", max: 4 },
    { id: "bacon", max: 2 },
    { id: "cebola-chapa", max: 1 },
    { id: "cebola-caramelizada", max: 1 },
    { id: "cebola-crua", max: 1 },
    { id: "picles", max: 1 },
    { id: "alface", max: 1 },
    { id: "tomate", max: 1 },
    { id: "molho-casa", max: 1 },
    { id: "maionese-defumada", max: 1 },
    { id: "mostarda", max: 1 },
    { id: "ketchup", max: 1 },
  ],
  extraLimits: [
    { ids: ["molho-casa", "maionese-defumada", "mostarda", "ketchup"], max: 2, label: "Até dois molhos, para o pão não desmanchar." },
    { ids: ["cheddar", "prato"], max: 4, label: "Até quatro fatias de queijo." },
  ],
};

export const allProducts = [...products, customBurger];

export function productById(id: string): Product | undefined {
  return allProducts.find((p) => p.id === id);
}
