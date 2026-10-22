import { neighborhoodById, store } from "../data/store.ts";
import type { Mode, Slot, StoreStatus } from "./hours.ts";
import { formatBRL, parseBRL } from "./money.ts";
import type { Totals } from "./pricing.ts";

export type Payment = "pix" | "dinheiro" | "cartao";

export type CheckoutDraft = {
  mode: Mode | null;
  neighborhoodId: string | null;
  street: string;
  number: string;
  complement: string;
  reference: string;
  when: "agora" | "agendado" | null;
  slotId: string | null;
  payment: Payment | null;
  changeFor: string;
  noChange: boolean;
  name: string;
};

export type CheckoutField =
  | "cart"
  | "mode"
  | "neighborhood"
  | "street"
  | "number"
  | "complement"
  | "reference"
  | "minimum"
  | "when"
  | "payment"
  | "changeFor"
  | "name";

export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

export const emptyDraft: CheckoutDraft = {
  mode: null,
  neighborhoodId: null,
  street: "",
  number: "",
  complement: "",
  reference: "",
  when: null,
  slotId: null,
  payment: null,
  changeFor: "",
  noChange: false,
  name: "",
};

export const fieldLimits = { street: 80, number: 10, complement: 60, reference: 80, name: 40, changeFor: 12 } as const;

/** Ordem dos campos na tela: o primeiro erro recebe o foco. */
export const fieldOrder: CheckoutField[] = [
  "cart",
  "mode",
  "neighborhood",
  "street",
  "number",
  "complement",
  "reference",
  "minimum",
  "when",
  "payment",
  "changeFor",
  "name",
];

export function validateCheckout(
  draft: CheckoutDraft,
  totals: Totals,
  status: StoreStatus,
  slot: Slot | null,
): CheckoutErrors {
  const e: CheckoutErrors = {};
  if (!totals.lines.length) e.cart = "A comanda está vazia.";
  if (!draft.mode) e.mode = "Escolha entrega ou retirada no balcão.";

  if (draft.mode === "entrega") {
    if (!neighborhoodById(draft.neighborhoodId)) e.neighborhood = "Escolha o bairro. A taxa depende dele.";
    if (draft.street.trim().length < 3) e.street = "Informe a rua.";
    if (!draft.number.trim()) e.number = "Informe o número (ou s/n).";
    if (totals.minimumShortfall > 0) {
      e.minimum = `Entrega a partir de ${formatBRL(store.deliveryMinimum)} em itens. Faltam ${formatBRL(totals.minimumShortfall)}.`;
    }
  }
  for (const key of ["street", "number", "complement", "reference"] as const) {
    if (draft[key].length > fieldLimits[key]) e[key] = `Até ${fieldLimits[key]} caracteres.`;
  }

  if (!draft.when) e.when = "Escolha: assim que possível ou agendar.";
  else if (draft.when === "agora" && !(status.state === "open" && status.acceptsNow)) {
    e.when = "A cozinha não está aceitando pedidos para agora. Escolha um horário.";
  } else if (draft.when === "agendado" && !slot) {
    e.when = draft.slotId ? "Esse horário já passou. Escolha outro." : "Escolha o dia e o horário.";
  }

  if (!draft.payment) e.payment = "Escolha a forma de pagamento.";
  if (draft.payment === "dinheiro" && !draft.noChange) {
    const value = parseBRL(draft.changeFor);
    if (value === null) e.changeFor = "Diga para quanto é o troco, ou marque que não precisa.";
    else if (value < totals.total) e.changeFor = `O valor precisa cobrir o total de ${formatBRL(totals.total)}.`;
  }

  const name = draft.name.trim();
  if (name.length < 2) e.name = "Diga como chamamos você no balcão.";
  else if (name.length > fieldLimits.name) e.name = `Até ${fieldLimits.name} caracteres.`;
  return e;
}
