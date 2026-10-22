"use client";

import { useEffect, useState } from "react";
import { formatBRL } from "@/lib/money";
import { useComanda } from "../providers/Comanda";
import { useIsRail } from "../providers/media";
import { Dialog } from "../ui/Dialog";
import { Ticket } from "./Ticket";

/** Celular e tablet: a comanda vira uma tira presa no rodapé e abre como folha. */
export function MobileBar() {
  const { totals, state, sheetOpen, setSheetOpen, ready } = useComanda();
  const [dismissed, setDismissed] = useState<number | null>(null);
  const isRail = useIsRail();
  const printedLine = state.printed ? totals.lines.find((l) => l.line.id === state.printed?.id) : undefined;
  const slip = state.printed && printedLine && dismissed !== state.printed.at ? { text: `${printedLine.line.qty}x ${printedLine.product.name}`, at: state.printed.at } : null;

  // A tira de aviso some sozinha depois de um instante.
  useEffect(() => {
    if (!state.printed) return;
    const at = state.printed.at;
    const t = setTimeout(() => setDismissed(at), 1900);
    return () => clearTimeout(t);
  }, [state.printed]);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 rail:hidden">
        {slip ? (
          <div key={slip.at} aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-full overflow-hidden">
            <p className="slip thermal mono mx-auto w-fit border-2 border-b-0 border-grafite px-4 py-2 text-[0.75rem]">
              impresso: <span className="font-semibold">{slip.text}</span>
            </p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          className="thermal serrated-top flex w-full items-center gap-3 border-t-0 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-left shadow-[0_-10px_24px_-12px_rgb(24_25_28/0.5)]"
        >
          <span className="min-w-0 flex-1">
            <span className="mono block text-[0.6875rem] text-aco-escuro">comanda</span>
            <span className="block font-bold">{!ready ? "..." : totals.count ? `${totals.count} ${totals.count === 1 ? "item" : "itens"}` : "vazia"}</span>
          </span>
          {totals.count ? <span className="price text-lg">{formatBRL(totals.total)}</span> : null}
          <span className="btn btn-tinta btn-sm pointer-events-none">{totals.count ? "Ver e fechar" : "Abrir"}</span>
        </button>
      </div>
      <Dialog open={sheetOpen && !isRail} onClose={() => setSheetOpen(false)} labelledBy="comanda-folha" variant="sheet" className="h-[94dvh] md:h-[90dvh] md:max-w-[30rem]">
        <h2 id="comanda-folha" className="sr-only">
          Comanda
        </h2>
        <div className="steel flex min-h-0 flex-1 flex-col px-3 pt-3">
          <Ticket variant="sheet" onClose={() => setSheetOpen(false)} />
        </div>
      </Dialog>
    </>
  );
}

/** Anuncia para leitores de tela cada item impresso na comanda. */
export function Announcer() {
  const { state, totals } = useComanda();
  const line = state.printed ? totals.lines.find((l) => l.line.id === state.printed?.id) : undefined;
  return (
    <p aria-live="polite" className="sr-only">
      {line ? `${line.line.qty}x ${line.product.name} na comanda.` : ""}
    </p>
  );
}
