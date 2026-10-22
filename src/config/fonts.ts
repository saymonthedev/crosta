import { Anybody, Archivo, Martian_Mono } from "next/font/google";

/** Display: o eixo de largura é a voz da marca (condensada = bola de carne, larga = prensada). */
const anybody = Anybody({ subsets: ["latin"], axes: ["wdth"], variable: "--font-anybody", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
/** Impressão térmica da comanda e preços. */
const martian = Martian_Mono({ subsets: ["latin"], axes: ["wdth"], variable: "--font-martian", display: "swap", preload: false });

export const fontVariables = `${anybody.variable} ${archivo.variable} ${martian.variable}`;
