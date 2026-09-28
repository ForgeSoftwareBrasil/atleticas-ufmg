"use client";

import { useActionState, useState } from "react";
import type { Mensalidade } from "../../contrato";
import { formatarCompetenciaLonga, formatarData } from "../../formatos/datas";
import { formatarMoeda } from "../../formatos/moeda";
import { Aviso } from "../../ui/Aviso";
import { Botao } from "../../ui/Botao";
import { Selo } from "../../ui/Selo";
import { registrarPagamento, type EstadoAcao } from "../acoes";
import { ROTULO_MENSALIDADE } from "../rotulos";
import { CamposPagamento } from "./CamposPagamento";
import estilos from "./diretoria.module.scss";

/** Registro de pagamento de uma ou mais mensalidades em aberto/atrasadas. As atrasadas já vêm marcadas. */
export function FormRegistroPagamento({ sociedadeId, emAberto }: { sociedadeId: string; emAberto: Mensalidade[] }) {
  const [estado, acao, enviando] = useActionState<EstadoAcao, FormData>(registrarPagamento.bind(null, sociedadeId), {});
  const [selecionadas, setSelecionadas] = useState(
    () => new Set(emAberto.filter((m) => m.status === "ATRASADA").map((m) => m.id)),
  );
  const [listaAnterior, setListaAnterior] = useState(emAberto);

  // Após um registro, a lista muda: recomeça a seleção a partir das atrasadas restantes.
  if (listaAnterior !== emAberto) {
    setListaAnterior(emAberto);
    setSelecionadas(new Set(emAberto.filter((m) => m.status === "ATRASADA").map((m) => m.id)));
  }

  const total = emAberto.filter((m) => selecionadas.has(m.id)).reduce((t, m) => t + m.valor, 0);

  function alternar(id: string) {
    setSelecionadas((atual) => {
      const nova = new Set(atual);
      if (nova.has(id)) nova.delete(id);
      else nova.add(id);
      return nova;
    });
  }

  return (
    <form action={acao} className={estilos.formulario}>
      <div role="status">{estado.ok && estado.mensagem && <Aviso tom="sucesso" titulo={estado.mensagem} />}</div>
      {estado.erro && <Aviso tom="erro" titulo={estado.erro} role="alert" />}

      {emAberto.length === 0 ? (
        <p className={estilos.textoDialogo}>Nenhuma mensalidade em aberto. Este sócio está com tudo pago.</p>
      ) : (
        <>
          <fieldset className={estilos.grupoMensalidades}>
            <legend>Mensalidades pagas pelo sócio</legend>
            {emAberto.map((m) => (
              <label key={m.id} className={estilos.opcaoMensalidade}>
                <input
                  type="checkbox"
                  name="mensalidadeIds"
                  value={m.id}
                  checked={selecionadas.has(m.id)}
                  onChange={() => alternar(m.id)}
                />
                <span className={estilos.competencia}>{formatarCompetenciaLonga(m.competencia)}</span>
                <span className={estilos.vencimento}>vence {formatarData(m.vencimento)}</span>
                <Selo tom={ROTULO_MENSALIDADE[m.status].tom}>{ROTULO_MENSALIDADE[m.status].texto}</Selo>
                <span className={estilos.valor}>{formatarMoeda(m.valor)}</span>
              </label>
            ))}
            {estado.campos?.mensalidadeIds && <p className={estilos.erroGrupo}>{estado.campos.mensalidadeIds}</p>}
          </fieldset>

          <CamposPagamento prefixo={`pagamento-${sociedadeId}`} campos={estado.campos} />

          <div className={estilos.enviarPagamento}>
            <p>
              Total <strong>{formatarMoeda(total)}</strong>
            </p>
            <Botao type="submit" disabled={enviando || selecionadas.size === 0}>
              {enviando
                ? "Registrando…"
                : selecionadas.size > 1
                  ? `Registrar ${selecionadas.size} pagamentos`
                  : "Registrar pagamento"}
            </Botao>
          </div>
        </>
      )}
    </form>
  );
}
