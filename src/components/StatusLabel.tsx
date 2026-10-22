"use client";

import { store } from "@/data/store";
import { formatClock, localNow, statusLine, weekdayName } from "@/lib/hours";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/style";
import { useComanda } from "./providers/Comanda";

/** Etiqueta térmica colada na foto: o estado da cozinha agora, no horário de Brasília. */
export function StatusLabel({ className }: { className?: string }) {
  const { now, status } = useComanda();
  const open = status?.state === "open" && status.acceptsNow;
  const local = now ? localNow(now) : null;
  return (
    <div className={cn("thermal serrated w-[min(19rem,calc(100vw-2.5rem))] border-2 border-b-0 border-grafite px-4 pt-3 shadow-[0_14px_24px_-12px_rgb(0_0_0/0.6)]", className)}>
      <p className="mono flex items-center justify-between gap-3 text-[0.6875rem] text-aco-escuro" suppressHydrationWarning>
        <span>{local ? `${weekdayName(local.weekday)}, ${formatClock(local.minutes)}` : "horário de Brasília"}</span>
        <span>cozinha</span>
      </p>
      <p className="mt-2 flex items-center gap-2 text-[0.9375rem] leading-tight font-bold" aria-live="polite">
        <span aria-hidden="true" className={cn("size-2.5 shrink-0", !status ? "bg-aco" : open ? "bg-ok" : "bg-chapa")} />
        {status && now ? statusLine(status, now) : "Consultando o horário..."}
      </p>
      <dl className="mono mt-3 grid gap-1 text-[0.6875rem]">
        <div className="flex justify-between gap-3">
          <dt className="text-aco-escuro">entrega</dt>
          <dd>25 a 65 min, por bairro</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-aco-escuro">retirada</dt>
          <dd>
            {store.pickupReady[0]} a {store.pickupReady[1]} min
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-aco-escuro">mínimo p/ entrega</dt>
          <dd>{formatBRL(store.deliveryMinimum)}</dd>
        </div>
      </dl>
    </div>
  );
}
