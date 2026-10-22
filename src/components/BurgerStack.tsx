"use client";

import { useState, type ReactNode } from "react";
import type { LayerKind } from "@/data/menu";
import { formatDelta } from "@/lib/money";
import type { StackLayer } from "@/lib/order";

/**
 * Desenho do burger em camadas, de baixo para cima.
 * "exploded": vista explodida da ficha técnica, com legenda e preço por camada.
 * "compact": pilha encostada, sem legenda, para a faixa do celular.
 */

const W = 200;
const INK = "#18191c";

const heights: Record<LayerKind, number> = {
  brioche: 24,
  potato: 24,
  australian: 24,
  patty: 20,
  "patty-veg": 22,
  chicken: 26,
  cheddar: 7,
  prato: 7,
  bacon: 10,
  "onion-griddle": 9,
  "onion-caramel": 9,
  "onion-raw": 9,
  pickles: 9,
  lettuce: 11,
  arugula: 10,
  tomato: 11,
  pepper: 9,
  slaw: 13,
  "sauce-house": 6,
  "sauce-smoky": 6,
  mustard: 5,
  ketchup: 5,
  "mayo-garlic": 6,
  "mayo-pepper": 6,
};
const TOP_BUN = 58;

const bunColor: Partial<Record<LayerKind, { crust: string; light: string; crumb: string }>> = {
  brioche: { crust: "#d98a32", light: "#efb560", crumb: "#f4d79c" },
  potato: { crust: "#e7b45e", light: "#f5d08a", crumb: "#f8e2ae" },
  australian: { crust: "#5b2f22", light: "#7c4634", crumb: "#a2705a" },
};

const sauceColor: Partial<Record<LayerKind, string>> = {
  "sauce-house": "#ee9d7e",
  "sauce-smoky": "#a0583a",
  mustard: "#e3b100",
  ketchup: "#c2261b",
  "mayo-garlic": "#f1e6c6",
  "mayo-pepper": "#e36a3d",
};

/** Gerador determinístico: o mesmo ingrediente sempre tem o mesmo desenho. */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const f = (n: number) => Math.round(n * 10) / 10;
const poly = (pts: [number, number][]) => `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z`;

/** Borda rendada da carne prensada: é a crosta. */
function lacyPath(seed: string, x0: number, x1: number, h: number, lace = 9) {
  const r = rng(seed);
  const pts: [number, number][] = [];
  for (let x = x0; x <= x1; x += 7) pts.push([x, 1.5 + r() * 2.5]);
  for (let y = 3; y <= h - 3; y += 3.5) pts.push([x1 + 3 + r() * lace, y], [x1 + r() * 2, y + 1.7]);
  for (let x = x1; x >= x0; x -= 7) pts.push([x, h - r() * 2.5]);
  for (let y = h - 3; y >= 3; y -= 3.5) pts.push([x0 - 3 - r() * lace, y], [x0 - r() * 2, y - 1.7]);
  return poly(pts);
}

function wave(x0: number, x1: number, y: number, amp: number, period: number, phase = 0) {
  let d = `M${x0} ${y}`;
  for (let x = x0; x < x1; x += period / 2) {
    const dir = Math.round((x - x0) / (period / 2) + phase) % 2 === 0 ? -1 : 1;
    d += ` Q${f(x + period / 4)} ${f(y + amp * dir)} ${f(Math.min(x + period / 2, x1))} ${y}`;
  }
  return d;
}

function drawLayer(kind: LayerKind, key: string, top: boolean, removed: boolean): ReactNode {
  const h = top ? TOP_BUN : heights[kind];
  const stroke = removed ? "#575d67" : INK;
  const sw = 2;
  const ghost = removed ? { fill: "none", strokeDasharray: "4 3" } : {};
  const r = rng(key);

  if (bunColor[kind]) {
    const c = bunColor[kind]!;
    if (top) {
      const dome = `M4 ${h} C4 ${h * 0.3} 44 1 100 1 C156 1 196 ${h * 0.3} 196 ${h} Z`;
      const seeds =
        kind === "brioche" && !removed
          ? Array.from({ length: 16 }, (_, i) => {
              const x = 30 + r() * 140;
              const yTop = h - (h - 4) * Math.sqrt(Math.max(0, 1 - ((x - 100) / 98) ** 2));
              const y = yTop + 6 + r() * 14;
              return <ellipse key={i} cx={f(x)} cy={f(y)} rx="2.6" ry="1.4" transform={`rotate(${f(r() * 60 - 30)} ${f(x)} ${f(y)})`} fill="#f7ebcb" />;
            })
          : null;
      return (
        <>
          <path d={dome} fill={c.crust} stroke={stroke} strokeWidth={sw} {...ghost} />
          {!removed && <path d={`M30 ${h * 0.42} C46 ${h * 0.16} 74 ${h * 0.08} 104 ${h * 0.1}`} fill="none" stroke={c.light} strokeWidth="5" strokeLinecap="round" />}
          {!removed && <rect x="6" y={h - 5} width="188" height="4" fill={c.crumb} />}
          {seeds}
        </>
      );
    }
    return (
      <>
        <path d={`M3 0 H197 V${h - 8} Q197 ${h} 189 ${h} H11 Q3 ${h} 3 ${h - 8} Z`} fill={c.crust} stroke={stroke} strokeWidth={sw} {...ghost} />
        {!removed && <rect x="4.5" y="1" width="191" height="5" fill={c.crumb} />}
      </>
    );
  }

  switch (kind) {
    case "patty":
    case "patty-veg": {
      const body = kind === "patty" ? "#5e3420" : "#8c6b3e";
      const speck = kind === "patty" ? "#b5582a" : "#5e8c3a";
      return (
        <>
          <path d={lacyPath(key, -2, W + 2, h, kind === "patty" ? 9 : 3)} fill={body} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" {...ghost} />
          {!removed &&
            Array.from({ length: 14 }, (_, i) => <circle key={i} cx={f(8 + r() * (W - 16))} cy={f(4 + r() * (h - 8))} r={f(0.8 + r() * 1.4)} fill={speck} />)}
        </>
      );
    }
    case "chicken": {
      const pts: [number, number][] = [];
      for (let x = -4; x <= W + 4; x += 9) pts.push([x, 2 + r() * 5]);
      for (let x = W + 4; x >= -4; x -= 9) pts.push([x, h - r() * 5]);
      return (
        <>
          <path d={poly(pts)} fill="#d2913d" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" {...ghost} />
          {!removed &&
            Array.from({ length: 18 }, (_, i) => <circle key={i} cx={f(6 + r() * (W - 12))} cy={f(6 + r() * (h - 12))} r={f(1 + r() * 1.8)} fill="#a9671f" />)}
        </>
      );
    }
    case "cheddar":
    case "prato": {
      const fill = kind === "cheddar" ? "#f4a91c" : "#f2d27c";
      let d = `M-3 0 H${W + 3} V${h}`;
      for (let x = W + 3; x > -3; ) {
        const step = 12 + r() * 16;
        if (r() > 0.45) {
          const len = 5 + r() * 10;
          d += ` L${f(x - 2)} ${h} Q${f(x - 5)} ${f(h + len)} ${f(x - 8)} ${h}`;
        }
        x -= step;
        d += ` L${f(Math.max(x, -3))} ${h}`;
      }
      d += " Z";
      return <path d={d} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" {...ghost} />;
    }
    case "bacon":
      return (
        <>
          <path d={`${wave(-2, W + 2, 2, 2.5, 26)} L${W + 2} ${h - 2} L-2 ${h - 2} Z`} fill="#b23f2b" stroke={stroke} strokeWidth={sw} {...ghost} />
          {!removed && <path d={wave(4, W - 4, h / 2, 2, 26)} fill="none" stroke="#efa48f" strokeWidth="2" strokeLinecap="round" />}
        </>
      );
    case "onion-griddle":
    case "onion-caramel": {
      const color = kind === "onion-griddle" ? "#9a5a22" : "#6e3412";
      if (removed) return <rect x="4" y="1" width={W - 8} height={h - 2} rx="4" fill="none" stroke={stroke} strokeWidth={sw} strokeDasharray="4 3" />;
      return (
        <>
          {kind === "onion-caramel" && <path d={`${wave(2, W - 2, 3, 2, 20)} L${W - 2} ${h - 1} H2 Z`} fill="#8a4a1c" stroke={stroke} strokeWidth={sw} />}
          {Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={wave(4 + i * 21, 26 + i * 21, 3 + r() * (h - 6), 2, 9)} fill="none" stroke={kind === "onion-griddle" ? color : "#c27a3c"} strokeWidth="3" strokeLinecap="round" />
          ))}
        </>
      );
    }
    case "onion-raw":
      return removed ? (
        <rect x="6" y="1" width={W - 12} height={h - 2} fill="none" stroke={stroke} strokeWidth={sw} strokeDasharray="4 3" />
      ) : (
        <>
          {Array.from({ length: 22 }, (_, i) => (
            <rect key={i} x={f(4 + r() * (W - 12))} y={f(1 + r() * (h - 6))} width="6" height="5" rx="1" fill="#f3eef5" stroke="#8b77a6" strokeWidth="1.2" />
          ))}
        </>
      );
    case "pickles":
      return (
        <>
          {[18, 58, 98, 138, 180].map((cx, i) => (
            <g key={i}>
              <ellipse cx={cx + (r() * 6 - 3)} cy={h / 2} rx="19" ry={h / 2} fill={removed ? "none" : "#8ea43a"} stroke={stroke} strokeWidth={sw} strokeDasharray={removed ? "4 3" : undefined} />
              {!removed && <ellipse cx={cx} cy={h / 2} rx="11" ry={h / 2 - 2.5} fill="none" stroke="#c4d478" strokeWidth="1.5" strokeDasharray="2 2" />}
            </g>
          ))}
        </>
      );
    case "lettuce":
    case "arugula": {
      const fill = kind === "lettuce" ? "#6fae45" : "#3e7b33";
      const pts: [number, number][] = [];
      for (let x = -8; x <= W + 8; x += kind === "lettuce" ? 6 : 5) pts.push([x, r() * 3]);
      for (let x = W + 8; x >= -8; x -= kind === "lettuce" ? 7 : 5) pts.push([x, h - 1 + (kind === "lettuce" ? r() * 4 : r() * 6 - 1)]);
      return <path d={poly(pts)} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" {...ghost} />;
    }
    case "tomato":
      return (
        <>
          <rect x="6" y="0" width={W - 12} height={h} rx="5" fill="#d9432e" stroke={stroke} strokeWidth={sw} {...ghost} />
          {!removed && [36, 76, 120, 162].map((x) => <ellipse key={x} cx={x} cy={h / 2} rx="4" ry="2.2" fill="#f6c1a0" />)}
        </>
      );
    case "pepper":
      return (
        <>
          {[4, 52, 102, 150].map((x, i) => (
            <rect key={i} x={x} y={f(r() * 2)} width="46" height={h - 2} rx="4" fill={removed ? "none" : "#c9301e"} stroke={stroke} strokeWidth={sw} strokeDasharray={removed ? "4 3" : undefined} />
          ))}
          {!removed && [20, 70, 118, 170].map((x) => <path key={x} d={`M${x} 3 l6 3`} stroke="#5a140b" strokeWidth="2" strokeLinecap="round" />)}
        </>
      );
    case "slaw":
      return (
        <>
          <path d={`${wave(-2, W + 2, 2, 2, 18)} L${W + 2} ${h} H-2 Z`} fill={removed ? "none" : "#f1eee6"} stroke={stroke} strokeWidth={sw} strokeDasharray={removed ? "4 3" : undefined} />
          {!removed &&
            Array.from({ length: 26 }, (_, i) => {
              const x = 4 + r() * (W - 14);
              const y = 4 + r() * (h - 7);
              return <path key={i} d={`M${f(x)} ${f(y)} l${f(6 + r() * 6)} ${f(r() * 2 - 1)}`} stroke={i % 3 === 0 ? "#8e4e9c" : i % 3 === 1 ? "#f08a3c" : "#c9c2ad"} strokeWidth="1.6" strokeLinecap="round" />;
            })}
        </>
      );
    default: {
      const color = sauceColor[kind] ?? "#ee9d7e";
      let d = `${wave(2, W - 2, 1, 1.5, 22)} L${W - 2} ${h - 1}`;
      for (let x = W - 2; x > 2; ) {
        const step = 18 + r() * 22;
        d += r() > 0.6 ? ` L${f(x - 3)} ${h - 1} Q${f(x - 6)} ${f(h + 6)} ${f(x - 9)} ${h - 1}` : "";
        x -= step;
        d += ` L${f(Math.max(x, 2))} ${h - 1}`;
      }
      return <path d={`${d} Z`} fill={removed ? "none" : color} stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeDasharray={removed ? "4 3" : undefined} />;
    }
  }
}

type Props = {
  layers: StackLayer[];
  mode?: "exploded" | "compact";
  className?: string;
  label: string;
};

export function BurgerStack({ layers, mode = "exploded", className, label }: Props) {
  // Camadas presentes no primeiro desenho não caem; as que entram depois, caem.
  const reactKey = (l: StackLayer) => (l.ghost ? `${l.key}~vazio` : l.key);
  const [initial] = useState(() => new Set(layers.map(reactKey)));
  const exploded = mode === "exploded";
  const VW = exploded ? 480 : 240;
  const VH = exploded ? 500 : 230;
  const cx = exploded ? 138 : 120;
  const margin = { top: exploded ? 16 : 10, bottom: exploded ? 22 : 10 };

  const hs = layers.map((l) => (l.key === "pao-topo" ? TOP_BUN : heights[l.kind]));
  const sum = hs.reduce((a, b) => a + b, 0);
  const free = VH - margin.top - margin.bottom - sum;
  const gap = layers.length > 1 ? Math.max(exploded ? 3 : -2, Math.min(exploded ? 15 : 0, free / (layers.length - 1))) : 0;
  const stackHeight = sum + gap * Math.max(0, layers.length - 1);
  const scale = Math.min(1, (VH - margin.top - margin.bottom) / stackHeight);

  // Posições de baixo para cima.
  const ys: number[] = [];
  let cursor = VH - margin.bottom;
  layers.forEach((_, i) => {
    cursor -= hs[i] * scale;
    ys.push(cursor);
    cursor -= gap * scale;
  });

  // Legendas: centro de cada camada, empurradas para não se sobreporem.
  const labelRows: { key: string; y: number; layerY: number; text: string; delta?: number; removed?: boolean; ghost?: boolean }[] = [];
  if (exploded) {
    let prev = Infinity;
    layers.forEach((l, i) => {
      if (l.key === "pao-base") return;
      const center = ys[i] + (hs[i] * scale) / 2;
      const y = Math.min(center, prev - 15);
      prev = y;
      labelRows.push({ key: l.key, y, layerY: center, text: l.label, delta: l.delta, removed: l.removed, ghost: l.ghost });
    });
  }

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label={label} className={className} preserveAspectRatio="xMidYMax meet">
      {/* chapa: a base onde tudo assenta */}
      {exploded && <path d={`M${cx - 120} ${VH - 10} H${cx + 120}`} stroke={INK} strokeWidth="2" strokeDasharray="2 5" opacity="0.35" />}
      {layers.map((l, i) => {
        const top = l.key === "pao-topo";
        return (
          <g
            key={reactKey(l)}
            style={{
              transform: `translate(${cx - (W / 2) * scale}px, ${ys[i]}px) scale(${scale})`,
              transition: "transform 380ms var(--ease-drop)",
            }}
          >
            <g className={initial.has(reactKey(l)) ? undefined : "layer-in"} opacity={l.removed || l.ghost ? 0.75 : 1}>
              {drawLayer(l.kind, l.key, top, !!(l.removed || l.ghost))}
            </g>
          </g>
        );
      })}
      {labelRows.map((row) => (
        <g key={row.key} style={{ transition: "transform 380ms var(--ease-drop)", transform: `translateY(${row.y}px)` }} aria-hidden="true">
          <path
            d={`M${cx + 104 * scale + 6} ${row.layerY - row.y} L${cx + 118} ${row.layerY - row.y} L${cx + 128} 0 H${cx + 136}`}
            fill="none"
            stroke={INK}
            strokeWidth="1"
            opacity="0.5"
          />
          <text
            x={cx + 142}
            y="0"
            dominantBaseline="middle"
            fontFamily="var(--font-martian), monospace"
            fontSize="10.5"
            fill={row.removed || row.ghost ? "#575d67" : INK}
            textDecoration={row.removed ? "line-through" : undefined}
          >
            {row.text.toLowerCase()}
            {row.delta ? (
              <tspan dx="7" fill="#1d3bd1" fontWeight="600">
                {formatDelta(row.delta)}
              </tspan>
            ) : null}
          </text>
        </g>
      ))}
    </svg>
  );
}
