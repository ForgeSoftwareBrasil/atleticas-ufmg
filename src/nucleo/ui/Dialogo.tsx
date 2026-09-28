"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import estilos from "./Dialogo.module.scss";

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  titulo: ReactNode;
  children: ReactNode;
  /** "centro" para confirmações; "lateral" para o painel de detalhes. */
  posicao?: "centro" | "lateral";
}

/**
 * Diálogo modal sobre <dialog> nativo: foco preso, Esc fecha e o foco volta
 * para quem abriu — sem biblioteca.
 */
export function Dialogo({ aberto, aoFechar, titulo, children, posicao = "centro" }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (aberto && !dialogo.open) dialogo.showModal();
    if (!aberto && dialogo.open) dialogo.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      className={`${estilos.dialogo} ${estilos[posicao]}`}
      aria-labelledby={idTitulo}
      onCancel={(e) => {
        e.preventDefault();
        aoFechar();
      }}
      onClick={(e) => {
        // Clique no fundo (fora da caixa) fecha.
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <div className={estilos.caixa}>
        <div className={estilos.topo}>
          <h2 id={idTitulo} className={estilos.titulo}>
            {titulo}
          </h2>
          <button type="button" className={estilos.fechar} onClick={aoFechar} aria-label="Fechar">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {aberto && children}
      </div>
    </dialog>
  );
}
