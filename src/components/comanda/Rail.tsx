"use client";

import { useIsRail } from "../providers/media";
import { Ticket } from "./Ticket";

/** Desktop: a comanda pendurada no trilho de inox, sempre à vista enquanto se navega. */
export function Rail() {
  // O papel só é montado no desktop: no celular a mesma comanda vive na folha, sem ids duplicados.
  const isRail = useIsRail();
  return (
    <aside aria-label="Comanda" className="steel sticky top-0 hidden h-dvh flex-col border-l-2 border-grafite rail:flex">
      {/* trilho de comandas: a barra de inox onde o papel fica preso */}
      <div aria-hidden="true" className="relative z-10 mx-3 mt-5 h-5 rounded-[3px] border-2 border-grafite bg-[linear-gradient(180deg,#f4f6f8_0%,#b9bfc6_55%,#8e959e_100%)] shadow-[0_6px_10px_-4px_rgb(0_0_0/0.45)]">
        <span className="absolute inset-x-3 top-1/2 h-px bg-grafite/40" />
      </div>
      <div className="-mt-2 flex min-h-0 flex-1 flex-col px-6 pb-6">
        {isRail ? <Ticket variant="rail" /> : null}
      </div>
    </aside>
  );
}
