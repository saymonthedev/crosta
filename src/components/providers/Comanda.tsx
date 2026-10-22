"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { productById } from "@/data/menu";
import { campaign } from "@/data/offers";
import { neighborhoodById } from "@/data/store";
import { emptyDraft, type CheckoutDraft } from "@/lib/checkout";
import { findSlot, storeStatus, type Slot, type StoreStatus } from "@/lib/hours";
import { maxQty, sameConfig, sanitizeConfig, type CartLine, type LineConfig } from "@/lib/order";
import { priceCart, type Totals } from "@/lib/pricing";
import { useNow } from "./clock";

const STORAGE_KEY = "crosta:comanda";
const VERSION = 1;

type State = {
  /** A comanda salva já foi lida do aparelho. */
  ready: boolean;
  lines: CartLine[];
  coupon: string | null;
  reference: string | null;
  draft: CheckoutDraft;
  /** Linha recém-impressa, para a animação de impressão. */
  printed: { id: string; at: number } | null;
};

type Action =
  | { type: "hydrate"; state: Partial<State> }
  | { type: "add"; line: CartLine }
  | { type: "replace"; id: string; productId: string; config: LineConfig; qty: number }
  | { type: "qty"; id: string; qty: number }
  | { type: "remove"; id: string }
  | { type: "clear" }
  | { type: "coupon"; code: string | null }
  | { type: "draft"; patch: Partial<CheckoutDraft> }
  | { type: "reference"; value: string };

const initial: State = { ready: false, lines: [], coupon: null, reference: null, draft: emptyDraft, printed: null };

/** Quantas unidades da campanha cabem ainda, fora a linha `exceptId`. */
function campaignRoom(lines: CartLine[], exceptId?: string) {
  const used = lines.filter((l) => l.productId === campaign.productId && l.id !== exceptId).reduce((s, l) => s + l.qty, 0);
  return campaign.maxPerOrder - used;
}

function clampQty(lines: CartLine[], productId: string, qty: number, exceptId?: string) {
  const product = productById(productId);
  if (!product) return 0;
  let max = maxQty(product);
  if (productId === campaign.productId) max = Math.min(max, campaignRoom(lines, exceptId));
  return Math.max(0, Math.min(qty, max));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.state, ready: true, printed: null };
    case "add": {
      const same = state.lines.find((l) => l.productId === action.line.productId && sameConfig(l.config, action.line.config));
      if (same) {
        const qty = clampQty(state.lines, same.productId, same.qty + action.line.qty, same.id);
        return { ...state, lines: state.lines.map((l) => (l.id === same.id ? { ...l, qty } : l)), printed: { id: same.id, at: Date.now() } };
      }
      const qty = clampQty(state.lines, action.line.productId, action.line.qty);
      if (!qty) return state;
      return { ...state, lines: [...state.lines, { ...action.line, qty }], printed: { id: action.line.id, at: Date.now() } };
    }
    case "replace": {
      const qty = clampQty(state.lines, action.productId, action.qty, action.id);
      return {
        ...state,
        lines: state.lines.map((l) => (l.id === action.id ? { ...l, config: action.config, qty: Math.max(1, qty) } : l)),
        printed: { id: action.id, at: Date.now() },
      };
    }
    case "qty": {
      const line = state.lines.find((l) => l.id === action.id);
      if (!line) return state;
      if (action.qty <= 0) return { ...state, lines: state.lines.filter((l) => l.id !== action.id) };
      const qty = clampQty(state.lines, line.productId, action.qty, line.id);
      return { ...state, lines: state.lines.map((l) => (l.id === action.id ? { ...l, qty: Math.max(1, qty) } : l)) };
    }
    case "remove":
      return { ...state, lines: state.lines.filter((l) => l.id !== action.id) };
    case "clear":
      return { ...initial, ready: true, draft: { ...emptyDraft, mode: state.draft.mode, neighborhoodId: state.draft.neighborhoodId } };
    case "coupon":
      return { ...state, coupon: action.code };
    case "draft":
      return { ...state, draft: { ...state.draft, ...action.patch } };
    case "reference":
      return { ...state, reference: action.value };
  }
}

/** Lê o que ficou salvo e descarta o que não existe mais no cardápio. Preço nunca é lido do storage. */
function load(): Partial<State> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.v !== VERSION || !Array.isArray(data.lines)) return null;
    const lines: CartLine[] = [];
    for (const l of data.lines) {
      const product = typeof l?.productId === "string" ? productById(l.productId) : undefined;
      if (!product || product.unavailable || typeof l.id !== "string") continue;
      const qty = clampQty(lines, product.id, Math.floor(Number(l.qty) || 0));
      if (qty > 0) lines.push({ id: l.id, productId: product.id, qty, config: sanitizeConfig(product, l.config) });
    }
    const mode = data.mode === "entrega" || data.mode === "retirada" ? data.mode : null;
    return {
      lines,
      coupon: typeof data.coupon === "string" ? data.coupon.slice(0, 20) : null,
      reference: typeof data.reference === "string" && /^\d{4}$/.test(data.reference) ? data.reference : null,
      draft: { ...emptyDraft, mode, neighborhoodId: neighborhoodById(data.neighborhoodId)?.id ?? null },
    };
  } catch {
    return null;
  }
}

function save(state: State) {
  try {
    // Endereço, nome e pagamento não ficam salvos no aparelho: só a comanda e a preferência de entrega.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        v: VERSION,
        lines: state.lines,
        coupon: state.coupon,
        reference: state.reference,
        mode: state.draft.mode,
        neighborhoodId: state.draft.neighborhoodId,
      }),
    );
  } catch {
    /* modo privado ou armazenamento cheio: a comanda segue funcionando na sessão */
  }
}

let counter = 0;
const newId = () => `l${Date.now().toString(36)}${(counter++).toString(36)}`;

export type View = "pedido" | "checkout" | "enviado";

type ComandaContext = {
  ready: boolean;
  state: State;
  totals: Totals;
  now: Date | null;
  status: StoreStatus | null;
  slot: Slot | null;
  /** Dia da semana do serviço usado na campanha (null = loja fechada e sem horário escolhido ainda). */
  serviceWeekday: number | null;
  view: View;
  setView: (view: View) => void;
  add: (productId: string, config: LineConfig, qty: number) => void;
  replace: (id: string, productId: string, config: LineConfig, qty: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  setCoupon: (code: string | null) => void;
  setDraft: (patch: Partial<CheckoutDraft>) => void;
  campaignRoom: (exceptId?: string) => number;
  /** Produto aberto no diálogo (lineId = editar uma linha existente). */
  editing: { productId: string; lineId?: string } | null;
  openProduct: (productId: string, lineId?: string) => void;
  closeProduct: () => void;
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
};

const Ctx = createContext<ComandaContext | null>(null);

export function ComandaProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const [view, setView] = useState<View>("pedido");
  const [editing, setEditing] = useState<ComandaContext["editing"]>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const now = useNow();
  const hydrated = useRef(false);

  useEffect(() => {
    dispatch({ type: "hydrate", state: load() ?? {} });
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (hydrated.current) save(state);
  }, [state]);

  // Outra aba mexeu na comanda: recarrega.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const saved = load();
      if (saved) dispatch({ type: "hydrate", state: saved });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const status = useMemo(() => (now ? storeStatus(now) : null), [now]);
  const slot = useMemo(
    () => (now && state.draft.mode && state.draft.when === "agendado" ? findSlot(now, state.draft.mode, state.draft.slotId) : null),
    [now, state.draft.mode, state.draft.when, state.draft.slotId],
  );
  const serviceWeekday = slot
    ? slot.weekday
    : status?.state === "open"
      ? status.service.weekday
      : status?.state === "closed"
        ? (status.next?.weekday ?? null)
        : null;

  const totals = useMemo(
    () =>
      priceCart(state.lines, {
        serviceWeekday,
        couponCode: state.coupon,
        mode: state.draft.mode,
        neighborhoodId: state.draft.neighborhoodId,
      }),
    [state.lines, state.coupon, state.draft.mode, state.draft.neighborhoodId, serviceWeekday],
  );

  const ensureReference = useCallback(() => {
    if (!state.reference) dispatch({ type: "reference", value: String(1000 + Math.floor(Math.random() * 9000)) });
  }, [state.reference]);

  const value: ComandaContext = {
    ready: state.ready,
    state,
    totals,
    now,
    status,
    slot,
    serviceWeekday,
    view,
    setView,
    add: (productId, config, qty) => {
      ensureReference();
      dispatch({ type: "add", line: { id: newId(), productId, config, qty } });
      setView((v) => (v === "enviado" ? "pedido" : v));
    },
    replace: (id, productId, config, qty) => dispatch({ type: "replace", id, productId, config, qty }),
    setQty: (id, qty) => dispatch({ type: "qty", id, qty }),
    remove: (id) => dispatch({ type: "remove", id }),
    clear: () => {
      dispatch({ type: "clear" });
      setView("pedido");
    },
    setCoupon: (code) => dispatch({ type: "coupon", code }),
    setDraft: (patch) => dispatch({ type: "draft", patch }),
    campaignRoom: (exceptId) => campaignRoom(state.lines, exceptId),
    editing,
    openProduct: (productId, lineId) => setEditing({ productId, lineId }),
    closeProduct: () => setEditing(null),
    sheetOpen,
    setSheetOpen,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useComanda() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useComanda fora do ComandaProvider");
  return ctx;
}
