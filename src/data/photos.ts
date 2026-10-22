import type { StaticImageData } from "next/image";
import aneis from "@/assets/photos/aneis.jpg";
import bandeja from "@/assets/photos/bandeja.jpg";
import batataCheddar from "@/assets/photos/batata-cheddar.jpg";
import brownie from "@/assets/photos/brownie.jpg";
import chapaQueijo from "@/assets/photos/chapa-queijo.jpg";
import chapeiro from "@/assets/photos/chapeiro.jpg";
import crosta from "@/assets/photos/crosta.jpg";
import defumado from "@/assets/photos/defumado.jpg";
import frango from "@/assets/photos/frango.jpg";
import hero from "@/assets/photos/hero.jpg";
import horta from "@/assets/photos/horta.jpg";
import milkshake from "@/assets/photos/milkshake.jpg";
import prensado from "@/assets/photos/prensado.jpg";
import torre from "@/assets/photos/torre.jpg";

type Photo = { src: StaticImageData; alt: string; position?: string };

/** Fotos com descrição do que de fato aparece na imagem. */
export const photos: Record<string, Photo> = {
  hero: { src: hero, alt: "Burger de duas carnes com cheddar escorrendo, sobre papel manteiga numa bancada de inox", position: "50% 40%" },
  crosta: { src: crosta, alt: "Crosta: brioche com gergelim, duas carnes, cheddar, picles e molho, sobre papel numa bancada de inox" },
  prensado: { src: prensado, alt: "Prensado: pão de batata, uma carne de borda rendada, queijo, picles e cebola picada" },
  defumado: { src: defumado, alt: "Defumado: duas carnes, cheddar derretido, tiras de bacon e cebola caramelizada no brioche" },
  torre: { src: torre, alt: "Torre: três carnes intercaladas com cheddar e picles no brioche" },
  horta: { src: horta, alt: "Horta na Chapa: burger vegetal com rúcula, pimentão assado e maionese no brioche com gergelim" },
  frango: { src: frango, alt: "Frango Crocante: sobrecoxa empanada com repolho e picles no pão de batata" },
  bandeja: { src: bandeja, alt: "Bandeja de inox com burger embrulhado em papel, batata frita e uma lata" },
  "batata-cheddar": { src: batataCheddar, alt: "Batata frita coberta de cheddar cremoso e bacon picado numa barca de papel" },
  aneis: { src: aneis, alt: "Anéis de cebola empanados empilhados ao lado de um potinho de molho" },
  milkshake: { src: milkshake, alt: "Milkshake num copo de inox com chantilly e uma lasca de bacon caramelizado" },
  brownie: { src: brownie, alt: "Fatias de brownie empilhadas recebendo um fio de calda de chocolate" },
  "chapa-queijo": { src: chapaQueijo, alt: "Espátula levantando carnes com queijo derretido de uma chapa escura" },
  chapeiro: { src: chapeiro, alt: "Chapeiro de luvas pretas prensando a carne numa chapa de inox" },
};
