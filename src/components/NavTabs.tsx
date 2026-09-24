"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/dictionaries";
import { traduire } from "@/lib/i18n/dictionaries";

const ONGLETS = [
  { href: "/ville", cle: "nav.maVille" as const },
  { href: "/villes", cle: "nav.villes" as const },
  { href: "/jumelages", cle: "nav.jumelages" as const },
  { href: "/classement", cle: "nav.classement" as const },
];

export function NavTabs({ locale, className, tabClassName }: { locale: Locale; className: string; tabClassName: string }) {
  const pathname = usePathname();
  return (
    <nav className={className} aria-label={traduire(locale, "nav.maVille")}>
      {ONGLETS.map((o) => (
        <Link
          key={o.href}
          href={o.href}
          className={tabClassName}
          aria-current={pathname === o.href ? "page" : undefined}
        >
          {traduire(locale, o.cle)}
        </Link>
      ))}
    </nav>
  );
}
