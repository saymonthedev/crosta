"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { whatsappNumber } from "@/data/store";
import { buildOrderMessage, whatsappLink } from "@/lib/message";
import { useComanda } from "../providers/Comanda";

/** Depois de enviar: a mensagem impressa, para conferir, copiar ou reabrir. */
export function Sent() {
  const { state, totals, slot, now, setView, clear } = useComanda();
  const [copied, setCopied] = useState<"ok" | "erro" | null>(null);
  const number = whatsappNumber();

  if (!now || !totals.lines.length) {
    return (
      <div className="pb-6">
        <p className="text-sm">A comanda foi zerada.</p>
        <button type="button" onClick={() => setView("pedido")} className="btn btn-papel btn-sm mt-4">
          Voltar
        </button>
      </div>
    );
  }

  const message = buildOrderMessage({ reference: state.reference ?? "0000", totals, draft: state.draft, slot, now });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied("ok");
    } catch {
      setCopied("erro");
    }
  };

  return (
    <div className="grid gap-5 pb-6">
      <div>
        <h2 className="display text-[1.5rem] [font-stretch:80%]">{number ? "Mensagem enviada ao WhatsApp" : "Mensagem pronta"}</h2>
        <p className="mt-2 text-[0.8125rem] leading-relaxed text-aco-escuro">
          {number
            ? "O WhatsApp abriu numa nova aba com o pedido. Ele só vale depois que a loja responder confirmando."
            : "Demonstração sem número de WhatsApp configurado. Com o número no ambiente (NEXT_PUBLIC_WHATSAPP_NUMBER), este botão abre a conversa com o texto abaixo."}
        </p>
      </div>

      <pre
        tabIndex={0}
        aria-label="Texto do pedido"
        className="mono max-h-[22rem] overflow-auto border-2 border-dashed border-grafite/40 bg-white/60 p-3 text-[0.6875rem] leading-relaxed whitespace-pre-wrap"
      >
        {message}
      </pre>

      <div className="grid gap-2">
        {number ? (
          <a href={whatsappLink(number, message)} target="_blank" rel="noopener noreferrer" className="btn btn-chapa w-full">
            Abrir o WhatsApp de novo
          </a>
        ) : null}
        <button type="button" onClick={copy} className="btn btn-papel w-full">
          {copied === "ok" ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
          {copied === "ok" ? "Copiado" : "Copiar mensagem"}
        </button>
        <p role="status" className="min-h-4 text-xs text-aco-escuro">
          {copied === "erro" ? "O navegador bloqueou a cópia. Selecione o texto acima e copie manualmente." : copied === "ok" ? "Texto copiado para a área de transferência." : ""}
        </p>
        <div className="flex flex-wrap justify-between gap-2">
          <button type="button" onClick={() => setView("checkout")} className="mono min-h-9 text-[0.75rem] font-semibold underline decoration-2 underline-offset-4">
            voltar e corrigir
          </button>
          <button type="button" onClick={clear} className="mono min-h-9 text-[0.75rem] font-semibold text-erro underline decoration-2 underline-offset-4">
            começar outra comanda
          </button>
        </div>
      </div>
    </div>
  );
}
