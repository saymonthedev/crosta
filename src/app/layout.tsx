import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { fontVariables } from "@/config/fonts";
import { site, siteUrl } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: site.title,
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.author.name, url: site.author.url }],
  creator: site.author.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: site.name,
    title: site.title,
    description: site.description,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Crosta: Prensa. Chapa. Crosta." }],
  },
  twitter: { card: "summary_large_image", title: site.title, description: site.description, images: ["/og.jpg"] },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#1d3bd1",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
