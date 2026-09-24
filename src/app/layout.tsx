import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { RegisterServiceWorker } from "./register-sw";
import { Nav } from "@/components/Nav";
import { SceneVilleFond } from "@/components/SceneVilleFond";
import { getLocale } from "@/lib/i18n";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui",
  display: "swap",
});
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-sign",
  display: "swap",
});

export const metadata: Metadata = {
  title: "jeu_miniville (nom provisoire)",
  description:
    "Jeu social multijoueur de stratégie légère : développe ta ville, fais vivre ton pays, pèse sur le monde.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="antialiased">
        <RegisterServiceWorker />
        <SceneVilleFond>
          <Nav />
          {children}
        </SceneVilleFond>
      </body>
    </html>
  );
}
