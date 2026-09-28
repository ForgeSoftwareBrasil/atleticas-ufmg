"use client";

import { useState } from "react";
import { Botao } from "./Botao";

/** Botão que copia um texto para a área de transferência e confirma a ação. */
export function CopiarTexto({
  texto,
  rotulo,
  rotuloCopiado = "Copiado",
  variante = "secundario",
}: {
  texto: string;
  rotulo: string;
  rotuloCopiado?: string;
  variante?: "secundario" | "primario";
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      window.prompt("Copie o texto abaixo:", texto);
    }
  }

  return (
    <Botao variante={variante} pequeno onClick={copiar}>
      {copiado ? rotuloCopiado : rotulo}
      <span className="visualmente-oculto" role="status">
        {copiado ? `${rotuloCopiado} para a área de transferência` : ""}
      </span>
    </Botao>
  );
}
