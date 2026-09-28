import type { SociedadeDetalhe } from "../../contrato";
import { formatarCpf } from "../../formatos/cpf";
import {
  competenciaDe,
  formatarCompetencia,
  formatarCompetenciaLonga,
  formatarData,
  formatarDataHora,
  hojeIso,
  idadeEm,
} from "../../formatos/datas";
import { formatarMoeda } from "../../formatos/moeda";
import { formatarTelefone } from "../../formatos/telefone";
import { Selo } from "../../ui/Selo";
import { ROTULO_ESTADO, ROTULO_FORMA, ROTULO_SITUACAO } from "../rotulos";
import { BotaoDesfazer } from "./BotaoDesfazer";
import { FormRegistroPagamento } from "./FormRegistroPagamento";
import estilos from "./diretoria.module.scss";

/** Conteúdo do painel lateral: dados completos (CPF inclusive), pagamentos e histórico. */
export function DetalheSocio({ sociedade }: { sociedade: SociedadeDetalhe }) {
  const u = sociedade.usuario;
  const emAberto = sociedade.mensalidades
    .filter((m) => m.status !== "PAGA")
    .sort((a, b) => a.competencia.localeCompare(b.competencia));
  const pagas = sociedade.mensalidades.filter((m) => m.status === "PAGA");

  return (
    <div className={estilos.detalhe}>
      <div className={estilos.selos}>
        <Selo tom={ROTULO_ESTADO[sociedade.estado].tom}>
          Sociedade {ROTULO_ESTADO[sociedade.estado].texto.toLowerCase()}
        </Selo>
        {sociedade.situacao && (
          <Selo tom={ROTULO_SITUACAO[sociedade.situacao].tom}>{ROTULO_SITUACAO[sociedade.situacao].texto}</Selo>
        )}
        {sociedade.valorEmAtraso > 0 && (
          <span className={estilos.emAtraso}>{formatarMoeda(sociedade.valorEmAtraso)} em atraso</span>
        )}
      </div>

      <dl className={estilos.dadosSocio}>
        <div>
          <dt>CPF</dt>
          <dd>{formatarCpf(u.cpf)}</dd>
        </div>
        <div>
          <dt>Data de nascimento</dt>
          <dd>
            {formatarData(u.dataNascimento)} ({idadeEm(u.dataNascimento, hojeIso())} anos)
          </dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>
            <a href={`mailto:${u.email}`}>{u.email}</a>
          </dd>
        </div>
        <div>
          <dt>Celular</dt>
          <dd>
            <a href={`https://wa.me/55${u.telefone}`} target="_blank" rel="noopener noreferrer">
              {formatarTelefone(u.telefone)}
            </a>
          </dd>
        </div>
        <div>
          <dt>Pediu a sociedade em</dt>
          <dd>{formatarDataHora(sociedade.solicitadaEm)}</dd>
        </div>
        <div>
          <dt>Sócio desde</dt>
          <dd>{sociedade.socioDesde ? formatarData(sociedade.socioDesde) : "—"}</dd>
        </div>
        {sociedade.encerradaEm && (
          <div>
            <dt>Encerrada em</dt>
            <dd>{formatarData(sociedade.encerradaEm)}</dd>
          </div>
        )}
      </dl>

      {sociedade.estado === "PENDENTE" && (
        <p className={estilos.nota}>
          Esta solicitação aguarda ativação. Ative ou recuse na lista de solicitações do painel.
        </p>
      )}

      {sociedade.estado === "ATIVA" && (
        <section aria-labelledby="titulo-registrar" className={estilos.secaoDetalhe}>
          <h3 id="titulo-registrar" className={estilos.tituloDetalhe}>
            Registrar pagamento
          </h3>
          <FormRegistroPagamento sociedadeId={sociedade.id} emAberto={emAberto} />
        </section>
      )}

      {pagas.length > 0 && (
        <section aria-labelledby="titulo-pagas" className={estilos.secaoDetalhe}>
          <h3 id="titulo-pagas" className={estilos.tituloDetalhe}>
            Mensalidades pagas
          </h3>
          <ul className={estilos.listaPagas}>
            {pagas.map((m) => (
              <li key={m.id}>
                <div>
                  <strong title={formatarCompetenciaLonga(m.competencia)}>{formatarCompetencia(m.competencia)}</strong>
                  <span>
                    {formatarMoeda(m.valor)} em {formatarData(m.pagamento!.dataPagamento)} via{" "}
                    {ROTULO_FORMA[m.pagamento!.formaPagamento]}
                  </span>
                  <small>
                    Registrado por {m.pagamento!.registradoPor.nomeCompleto} em{" "}
                    {formatarDataHora(m.pagamento!.registradoEm)}
                    {m.pagamento!.observacao ? `. ${m.pagamento!.observacao}` : ""}
                  </small>
                </div>
                <BotaoDesfazer sociedadeId={sociedade.id} mensalidadeId={m.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {sociedade.estado !== "PENDENTE" && !sociedade.mensalidades.length && (
        <p className={estilos.nota}>
          Sem mensalidades registradas
          {sociedade.socioDesde ? ` desde ${formatarCompetencia(competenciaDe(sociedade.socioDesde))}` : ""}.
        </p>
      )}
    </div>
  );
}
