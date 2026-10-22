import Image from "next/image";
import { photos } from "@/data/photos";

const steps = [
  { title: "Bola", text: "90 g de acém e peito moídos na casa, em bola, direto da geladeira para a chapa." },
  { title: "Prensa", text: "Espátula pesada por dez segundos. A carne abre fina e a borda fica rendada." },
  { title: "Crosta", text: "Uma virada só. O queijo vai por cima enquanto o fundo termina de tostar." },
];

/** Como a crosta acontece: três tempos, em sequência real. */
export function Process() {
  return (
    <section aria-labelledby="processo-titulo" className="border-t-2 border-grafite px-5 py-14 sm:px-8 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
        <div>
          <h2 id="processo-titulo" className="display text-[clamp(3rem,8vw,5.25rem)] [font-stretch:58%]">
            Como a crosta acontece
          </h2>
          <ol className="mt-8 grid gap-6">
            {steps.map((s, i) => (
              <li key={s.title} className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-4 border-t-2 border-grafite pt-4">
                <span aria-hidden="true" className="display text-[2.75rem] text-cobalto [font-stretch:50%]">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-bold">{s.title}</h3>
                  <p className="mt-1 text-[0.9375rem] leading-relaxed text-pretty">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="grid grid-cols-5 gap-3 self-start">
          <figure className="relative col-span-5 aspect-[3/2] border-2 border-grafite sm:col-span-3 sm:aspect-[4/5]">
            <Image src={photos.chapeiro.src} alt={photos.chapeiro.alt} fill placeholder="blur" sizes="(min-width: 1216px) 20vw, (min-width: 640px) 55vw, 100vw" className="object-cover" style={{ objectPosition: "62% 50%" }} />
          </figure>
          <figure className="relative col-span-5 aspect-[3/2] border-2 border-grafite sm:col-span-2 sm:mt-24 sm:aspect-[3/4]">
            <Image src={photos["chapa-queijo"].src} alt={photos["chapa-queijo"].alt} fill placeholder="blur" sizes="(min-width: 1216px) 14vw, (min-width: 640px) 38vw, 100vw" className="object-cover" style={{ objectPosition: "40% 50%" }} />
          </figure>
        </div>
      </div>
    </section>
  );
}
