import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-cobalto px-5 text-papel">
      <div className="max-w-md">
        <p className="mono text-xs">erro 404</p>
        <h1 className="display mt-4 text-[clamp(3rem,12vw,6rem)] [font-stretch:60%]">Essa comanda não existe.</h1>
        <Link href="/" className="btn btn-chapa mt-8">
          Voltar ao cardápio
        </Link>
      </div>
    </main>
  );
}
