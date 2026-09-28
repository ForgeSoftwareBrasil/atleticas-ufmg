import Link from "next/link";
import type { ComponentProps } from "react";
import estilos from "./Botao.module.scss";

type Variante = "primario" | "destaque" | "secundario" | "claro" | "perigo" | "fantasma";

interface Aparencia {
  variante?: Variante;
  pequeno?: boolean;
  largo?: boolean;
}

export function classesBotao({ variante = "primario", pequeno, largo }: Aparencia, extra?: string) {
  return [estilos.botao, estilos[variante], pequeno && estilos.pequeno, largo && estilos.largo, extra]
    .filter(Boolean)
    .join(" ");
}

export function Botao({
  variante,
  pequeno,
  largo,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & Aparencia) {
  return <button type={type} className={classesBotao({ variante, pequeno, largo }, className)} {...props} />;
}

export function LinkBotao({ variante, pequeno, largo, className, ...props }: ComponentProps<typeof Link> & Aparencia) {
  return <Link className={classesBotao({ variante, pequeno, largo }, className)} {...props} />;
}
