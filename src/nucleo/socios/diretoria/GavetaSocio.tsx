"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Dialogo } from "../../ui/Dialogo";

/** Painel lateral controlado pela URL (?sociedade=...): pode ser aberto por link e compartilhado. */
export function GavetaSocio({
  titulo,
  urlFechar,
  children,
}: {
  titulo: string;
  urlFechar: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <Dialogo aberto posicao="lateral" titulo={titulo} aoFechar={() => router.push(urlFechar, { scroll: false })}>
      {children}
    </Dialogo>
  );
}
