import type { ReactNode } from "react";
import estilos from "./Selo.module.scss";

export type TomSelo = "em-dia" | "inadimplente" | "pendente" | "neutro";

/** Pequena etiqueta de estado. O ponto colorido nunca é a única pista: sempre há texto. */
export function Selo({ tom, children }: { tom: TomSelo; children: ReactNode }) {
  return (
    <span className={`${estilos.selo} ${estilos[tom]}`}>
      <span className={estilos.ponto} aria-hidden="true" />
      {children}
    </span>
  );
}
