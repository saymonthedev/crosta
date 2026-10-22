import { MobileBar, Announcer } from "@/components/comanda/MobileBar";
import { Rail } from "@/components/comanda/Rail";
import { ProductDialog } from "@/components/ProductDialog";
import { ComandaProvider } from "@/components/providers/Comanda";
import { Campaign } from "@/components/sections/Campaign";
import { Footer } from "@/components/sections/Footer";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { Info } from "@/components/sections/Info";
import { Menu } from "@/components/sections/Menu";
import { Process } from "@/components/sections/Process";
import { site, siteUrl } from "@/config/site";
import { products } from "@/data/menu";
import { store } from "@/data/store";

/** Dados estruturados: restaurante fictício com cardápio, sem avaliação nem endereço real. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: site.name,
  description: site.description,
  url: siteUrl,
  servesCuisine: "Hambúrguer",
  priceRange: "R$ 5–64",
  acceptsReservations: false,
  hasMenu: {
    "@type": "Menu",
    hasMenuItem: products.map((p) => ({
      "@type": "MenuItem",
      name: p.name,
      description: p.description,
      offers: { "@type": "Offer", price: (p.price / 100).toFixed(2), priceCurrency: "BRL" },
    })),
  },
  openingHours: ["Tu-Th 18:00-00:30", "Fr-Sa 18:00-02:00", "Su 18:00-23:30"],
  address: { "@type": "PostalAddress", streetAddress: store.address.street, addressCountry: "BR" },
};

export default function Home() {
  return (
    <ComandaProvider>
      <a href="#cardapio" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-papel focus:px-4 focus:py-2 focus:font-bold focus:text-grafite">
        Pular para o cardápio
      </a>
      <div id="app" className="rail:grid rail:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="min-w-0">
          <Header />
          <main>
            <Hero />
            <Campaign />
            <Menu />
            <Process />
            <Info />
          </main>
          <Footer />
        </div>
        <Rail />
      </div>
      <MobileBar />
      <ProductDialog />
      <Announcer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </ComandaProvider>
  );
}
