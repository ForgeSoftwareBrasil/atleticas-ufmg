import type { ReactNode } from "react";
import estilos from "./Aviso.module.scss";

interface Props {
  tom: "erro" | "info" | "sucesso";
  titulo?: ReactNode;
  children?: ReactNode;
  /** "alert" anuncia imediatamente para leitores de tela; use só para erros recém-surgidos. */
  role?: "alert" | "status";
}

export function Aviso({ tom, titulo, children, role }: Props) {
  return (
    <div className={`${estilos.aviso} ${estilos[tom]}`} role={role}>
      {titulo && <p className={estilos.titulo}>{titulo}</p>}
      {children && <div className={estilos.corpo}>{children}</div>}
    </div>
  );
}
