import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegisterServiceWorker } from "./register-sw";
import { Nav } from "@/components/Nav";
import { getLocale } from "@/lib/i18n";

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
    <html lang={locale}>
      <body className="antialiased">
        <RegisterServiceWorker />
        <Nav />
        {children}
      </body>
    </html>
  );
}
