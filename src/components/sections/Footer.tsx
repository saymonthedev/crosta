import { site } from "@/config/site";
import { Logo } from "../Logo";

export function Footer() {
  return (
    <footer className="on-ink bg-grafite px-5 pt-12 pb-28 text-papel sm:px-8 rail:pb-12">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <Logo />
          <p className="mt-4 max-w-[26rem] text-sm leading-relaxed text-papel/75">
            Projeto conceitual de portfólio. Marca, endereço, bairros, preços e campanha são fictícios; nenhum pedido é processado de verdade.
          </p>
        </div>
        <p className="text-sm text-papel/75">
          Design e código:{" "}
          <a href={site.author.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-papel underline decoration-chapa decoration-2 underline-offset-4">
            {site.author.name}
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        </p>
      </div>
    </footer>
  );
}
