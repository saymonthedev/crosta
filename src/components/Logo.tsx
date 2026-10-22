import { cn } from "@/lib/style";

/** Marca: CROSTA larga e prensada, com a borda rendada desenhada embaixo. */
export function Logo({ className, tone = "papel" }: { className?: string; tone?: "papel" | "cobalto" }) {
  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <span className={cn("display text-[1.6rem] [font-stretch:150%] tracking-[-0.02em]", tone === "papel" ? "text-papel" : "text-cobalto")}>Crosta</span>
      <svg aria-hidden="true" viewBox="0 0 120 6" className="mt-[3px] h-[5px] w-full" preserveAspectRatio="none">
        <path d="M0 0H120V2L116 5L112 2.5L107 5.5L103 2L98 5L94 2.4L89 5.6L85 2L80 5L76 2.6L71 5.4L67 2L62 5L58 2.5L53 5.5L49 2L44 5L40 2.4L35 5.6L31 2L26 5L22 2.6L17 5.4L13 2L8 5L4 2.5L0 5Z" fill="#ff5a1f" />
      </svg>
    </span>
  );
}
