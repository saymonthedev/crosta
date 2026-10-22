import { Logo } from "../Logo";

const nav = [
  { href: "#cardapio", label: "Cardápio" },
  { href: "#monte", label: "Monte o seu" },
  { href: "#campanha", label: "Campanha" },
  { href: "#balcao", label: "Horário e entrega" },
];

export function Header() {
  return (
    <header className="on-ink relative z-20 bg-cobalto text-papel">
      <div className="flex items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <a href="#topo" aria-label="Crosta, início" className="shrink-0">
          <Logo />
        </a>
        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="block px-3 py-2 text-sm font-semibold text-papel/90 underline-offset-[6px] transition-colors hover:text-papel hover:underline hover:decoration-chapa hover:decoration-2">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a href="#cardapio" className="btn btn-papel btn-sm md:hidden">
          Cardápio
        </a>
      </div>
    </header>
  );
}
