"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function LinkNavegacao({
  href,
  classe,
  classeAtiva,
  children,
}: {
  href: string;
  classe: string;
  classeAtiva: string;
  children: ReactNode;
}) {
  const atual = usePathname();
  const ativo = atual === href || atual.startsWith(`${href}/`);
  return (
    <Link href={href} className={ativo ? `${classe} ${classeAtiva}` : classe} aria-current={ativo ? "page" : undefined}>
      {children}
    </Link>
  );
}
