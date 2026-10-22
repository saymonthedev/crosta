/** Valores monetários sempre em centavos inteiros. Nada de float no caminho do preço. */
export type Cents = number;

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** "R$ 36,00" com espaço comum (o Intl usa espaço não separável, que atrapalha cópia e testes). */
export function formatBRL(value: Cents): string {
  return brl.format(value / 100).replace(/ /g, " ");
}

/** Variação de preço: "+R$ 6,00" / "−R$ 9,10". Zero vira string vazia. */
export function formatDelta(value: Cents): string {
  if (value === 0) return "";
  return `${value > 0 ? "+" : "−"}${formatBRL(Math.abs(value))}`;
}

/** Converte o que a pessoa digitou ("100", "100,50", "R$ 1.250,00") em centavos. Retorna null se não for valor. */
export function parseBRL(input: string): Cents | null {
  const clean = input.replace(/[^\d,.]/g, "");
  if (!clean) return null;
  // Formato brasileiro: ponto separa milhar, vírgula separa centavos.
  const normalized = clean.replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  const [int, frac = ""] = normalized.split(".");
  return Number(int) * 100 + Number(frac.padEnd(2, "0"));
}

/** Porcentagem arredondada para o centavo mais próximo. */
export function percentOf(value: Cents, percent: number): Cents {
  return Math.round((value * percent) / 100);
}
