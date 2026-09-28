"use client";

import { useActionState, useState } from "react";
import { Botao } from "../../ui/Botao";
import { desfazerPagamento, type EstadoAcao } from "../acoes";
import estilos from "./diretoria.module.scss";

/** Desfazer em dois passos, para evitar clique acidental. */
export function BotaoDesfazer({ sociedadeId, mensalidadeId }: { sociedadeId: string; mensalidadeId: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [estado, acao, enviando] = useActionState<EstadoAcao, FormData>(
    desfazerPagamento.bind(null, sociedadeId, mensalidadeId),
    {},
  );

  if (!confirmando) {
    return (
      <Botao variante="fantasma" pequeno onClick={() => setConfirmando(true)}>
        Desfazer
      </Botao>
    );
  }

  return (
    <form action={acao} className={estilos.confirmarDesfazer}>
      <span>Desfazer o registro?</span>
      <Botao type="submit" variante="perigo" pequeno disabled={enviando}>
        {enviando ? "Desfazendo…" : "Sim, desfazer"}
      </Botao>
      <Botao variante="fantasma" pequeno onClick={() => setConfirmando(false)}>
        Manter
      </Botao>
      {estado.erro && (
        <span role="alert" className={estilos.erroGrupo}>
          {estado.erro}
        </span>
      )}
    </form>
  );
}
