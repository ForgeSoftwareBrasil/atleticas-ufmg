"use client";

import { useActionState, useState } from "react";
import type { SociedadeResumo } from "../../contrato";
import { formatarData } from "../../formatos/datas";
import { formatarMoeda } from "../../formatos/moeda";
import { formatarTelefone } from "../../formatos/telefone";
import { Aviso } from "../../ui/Aviso";
import { Botao } from "../../ui/Botao";
import { Dialogo } from "../../ui/Dialogo";
import { ativarSociedade, recusarSociedade, type EstadoAcao } from "../acoes";
import { CamposPagamento } from "./CamposPagamento";
import estilos from "./diretoria.module.scss";

interface Props {
  pendentes: SociedadeResumo[];
  valorMensalidade: number;
}

/** Solicitações aguardando a diretoria — a tarefa mais urgente do painel, por isso fica no topo. */
export function ListaPendentes({ pendentes, valorMensalidade }: Props) {
  const [aviso, setAviso] = useState<string>();

  if (!pendentes.length && !aviso) return null;

  return (
    <section className={estilos.pendentes} aria-labelledby="titulo-pendentes">
      <h2 id="titulo-pendentes" className={estilos.tituloSecao}>
        {pendentes.length === 0
          ? "Nenhuma solicitação aguardando"
          : pendentes.length === 1
            ? "1 solicitação aguardando"
            : `${pendentes.length} solicitações aguardando`}
      </h2>
      <div role="status">{aviso && <Aviso tom="sucesso" titulo={aviso} />}</div>
      {pendentes.length > 0 && (
        <ul className={estilos.listaPendentes}>
          {pendentes.map((s) => (
            <ItemPendente key={s.id} sociedade={s} valorMensalidade={valorMensalidade} aoConcluir={setAviso} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ItemPendente({
  sociedade,
  valorMensalidade,
  aoConcluir,
}: {
  sociedade: SociedadeResumo;
  valorMensalidade: number;
  aoConcluir: (mensagem: string) => void;
}) {
  const [dialogo, setDialogo] = useState<"ativar" | "recusar" | null>(null);
  const u = sociedade.usuario;

  const [estadoAtivar, ativar, ativando] = useActionState<EstadoAcao, FormData>(async (anterior, formData) => {
    const r = await ativarSociedade(sociedade.id, anterior, formData);
    if (r.ok && r.mensagem) aoConcluir(r.mensagem);
    return r;
  }, {});

  const [estadoRecusar, recusar, recusando] = useActionState<EstadoAcao, FormData>(async (anterior) => {
    const r = await recusarSociedade(sociedade.id, anterior);
    if (r.ok && r.mensagem) aoConcluir(r.mensagem);
    return r;
  }, {});

  return (
    <li className={estilos.itemPendente}>
      <div className={estilos.pessoaPendente}>
        <strong>{u.nomeCompleto}</strong>
        <span>
          {u.email}, {formatarTelefone(u.telefone)}
        </span>
        <span>Pediu em {formatarData(sociedade.solicitadaEm)}</span>
      </div>
      <div className={estilos.acoesPendente}>
        <Botao pequeno onClick={() => setDialogo("ativar")}>
          Ativar
        </Botao>
        <Botao pequeno variante="secundario" onClick={() => setDialogo("recusar")}>
          Recusar
        </Botao>
      </div>

      <Dialogo aberto={dialogo === "ativar"} aoFechar={() => setDialogo(null)} titulo={`Ativar ${u.nomeCompleto}`}>
        <form action={ativar} className={estilos.formulario}>
          <p className={estilos.textoDialogo}>
            Confirme o pagamento da primeira mensalidade ({formatarMoeda(valorMensalidade)}). A sociedade passa a ser
            ativa a partir de hoje.
          </p>
          {estadoAtivar.erro && <Aviso tom="erro" titulo={estadoAtivar.erro} role="alert" />}
          <CamposPagamento prefixo={`ativar-${sociedade.id}`} campos={estadoAtivar.campos} />
          <div className={estilos.botoesDialogo}>
            <Botao variante="secundario" onClick={() => setDialogo(null)}>
              Cancelar
            </Botao>
            <Botao type="submit" disabled={ativando}>
              {ativando ? "Ativando…" : "Ativar sociedade"}
            </Botao>
          </div>
        </form>
      </Dialogo>

      <Dialogo aberto={dialogo === "recusar"} aoFechar={() => setDialogo(null)} titulo="Recusar solicitação?">
        <form action={recusar} className={estilos.formulario}>
          <p className={estilos.textoDialogo}>
            A solicitação de <strong>{u.nomeCompleto}</strong> será encerrada. A pessoa continua com conta e pode pedir
            de novo depois.
          </p>
          {estadoRecusar.erro && <Aviso tom="erro" titulo={estadoRecusar.erro} role="alert" />}
          <div className={estilos.botoesDialogo}>
            <Botao variante="secundario" onClick={() => setDialogo(null)}>
              Voltar
            </Botao>
            <Botao type="submit" variante="perigo" disabled={recusando}>
              {recusando ? "Recusando…" : "Recusar solicitação"}
            </Botao>
          </div>
        </form>
      </Dialogo>
    </li>
  );
}
