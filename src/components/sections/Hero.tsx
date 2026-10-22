import Image from "next/image";
import { photos } from "@/data/photos";
import { StatusLabel } from "../StatusLabel";

/**
 * Título em três larguras do mesmo tipo: a bola de carne (condensada), a chapa,
 * e a crosta (prensada, larga). Cada linha ocupa a largura inteira da coluna.
 */
export function Hero() {
  const hero = photos.hero;
  return (
    <section id="topo" aria-labelledby="hero-titulo" className="on-ink relative bg-cobalto text-papel">
      <div className="grid lg:min-h-[44rem] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="flex flex-col justify-between gap-10 px-5 pt-4 pb-10 sm:px-8 lg:pt-6 lg:pb-24 rail:pb-12">
          <h1 id="hero-titulo" className="@container display">
            <span className="block text-[41.3cqw] leading-[0.8] [font-stretch:50%]">Prensa.</span>
            <span className="mt-[1.5cqw] block text-[25.8cqw] leading-[0.82] [font-stretch:100%] font-[850]">Chapa.</span>
            <span className="relative mt-[2cqw] block">
              <span aria-hidden="true" className="absolute inset-y-[6%] -left-5 -right-[3cqw] bg-chapa sm:-left-8" />
              <span className="relative block py-[1.2cqw] text-[14.8cqw] leading-[0.86] text-grafite [font-stretch:150%]">Crosta.</span>
            </span>
          </h1>
          <div>
            <p className="max-w-[36rem] text-lg leading-relaxed text-pretty text-papel/90">
              Bola de carne de 90 g, chapa a 230 °C e uma espátula pesada. A carne é prensada até a borda rendar e virar crosta. Entrega ou retirada no balcão, com o pedido fechado no WhatsApp.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
              <a href="#cardapio" className="btn btn-chapa">
                Montar meu pedido
              </a>
              <a href="#monte" className="link-tinta decoration-chapa hover:decoration-papel">
                ou montar um burger do zero
              </a>
            </div>
          </div>
        </div>
        <div className="relative min-h-[27rem] border-t-2 border-grafite sm:min-h-[34rem] lg:min-h-0 lg:border-t-0 lg:border-l-2">
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            priority
            placeholder="blur"
            quality={85}
            sizes="(min-width: 1216px) 30vw, (min-width: 1024px) 45vw, 100vw"
            className="object-cover"
            style={{ objectPosition: hero.position }}
          />
          <StatusLabel className="absolute bottom-5 left-5 -rotate-[1.5deg] lg:bottom-8 lg:left-8" />
        </div>
      </div>
    </section>
  );
}
