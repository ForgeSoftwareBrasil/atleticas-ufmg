"use client";

import { Botao } from "@/nucleo/ui/Botao";

export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="pagina pagina-aviso">
      <h1>Não foi possível carregar esta página</h1>
      <p>O servidor da atlética não respondeu. Tente de novo em instantes.</p>
      <Botao onClick={reset}>Tentar de novo</Botao>
    </div>
  );
}
