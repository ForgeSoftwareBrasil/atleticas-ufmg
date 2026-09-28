import Link from "next/link";
import type { FiltrosSociedades, PaginaSociedades, SociedadeResumo } from "../../contrato";
import { competenciaDe, formatarCompetencia, hojeIso, idadeEm } from "../../formatos/datas";
import { formatarTelefone } from "../../formatos/telefone";
import { Selo } from "../../ui/Selo";
import { ROTULO_ESTADO, ROTULO_SITUACAO } from "../rotulos";
import estilosTabela from "../tabela.module.scss";
import estilos from "./diretoria.module.scss";
import { urlDiretoria } from "./url";

type Coluna = FiltrosSociedades["ordenarPor"];

function CabecalhoOrdenavel({
  coluna,
  rotulo,
  filtros,
  base,
  numero,
}: {
  coluna: Coluna;
  rotulo: string;
  filtros: FiltrosSociedades;
  base: string;
  numero?: boolean;
}) {
  const ativa = filtros.ordenarPor === coluna;
  const proximaOrdem = ativa && filtros.ordem === "asc" ? "desc" : "asc";
  return (
    <th
      scope="col"
      aria-sort={ativa ? (filtros.ordem === "asc" ? "ascending" : "descending") : undefined}
      className={numero ? estilosTabela.numero : undefined}
    >
      <Link
        href={urlDiretoria(base, filtros, { ordenarPor: coluna, ordem: proximaOrdem, pagina: 1 })}
        className={estilos.ordenar}
        scroll={false}
      >
        {rotulo}
        <span aria-hidden="true" className={ativa ? estilos.setaAtiva : estilos.seta}>
          {ativa && filtros.ordem === "desc" ? "▼" : "▲"}
        </span>
      </Link>
    </th>
  );
}

function Situacao({ s }: { s: SociedadeResumo }) {
  if (!s.situacao) return <span className={estilosTabela.suave}>—</span>;
  const rotulo = ROTULO_SITUACAO[s.situacao];
  return (
    <Selo tom={rotulo.tom}>
      {rotulo.texto}
      {s.mensalidadesEmAtraso > 0 && ` (${s.mensalidadesEmAtraso} ${s.mensalidadesEmAtraso === 1 ? "mês" : "meses"})`}
    </Selo>
  );
}

export function TabelaSocios({
  pagina,
  filtros,
  base,
}: {
  pagina: PaginaSociedades;
  filtros: FiltrosSociedades;
  base: string;
}) {
  const hoje = hojeIso();

  if (!pagina.itens.length) {
    return (
      <p className={estilosTabela.vazio}>
        Nenhum sócio encontrado com esses filtros. <Link href={base}>Ver todos os sócios</Link>
      </p>
    );
  }

  return (
    <div className={estilosTabela.rolagem}>
      <table className={`${estilosTabela.tabela} ${estilos.tabelaSocios}`}>
        <caption className="visualmente-oculto">
          Sócios da atlética. Selecione um nome para ver detalhes e registrar pagamentos.
        </caption>
        <thead>
          <tr>
            <CabecalhoOrdenavel coluna="nome" rotulo="Nome" filtros={filtros} base={base} />
            <th scope="col">CPF</th>
            <th scope="col">Email</th>
            <th scope="col">Celular</th>
            <th scope="col" className={estilosTabela.numero}>
              Idade
            </th>
            <th scope="col">Sociedade</th>
            <CabecalhoOrdenavel coluna="mensalidadesEmAtraso" rotulo="Situação" filtros={filtros} base={base} />
            <CabecalhoOrdenavel coluna="socioDesde" rotulo="Sócio desde" filtros={filtros} base={base} />
          </tr>
        </thead>
        <tbody>
          {pagina.itens.map((s) => (
            <tr key={s.id} className={s.situacao === "INADIMPLENTE" ? estilos.linhaInadimplente : undefined}>
              <th scope="row">
                <Link
                  href={urlDiretoria(base, filtros, { sociedade: s.id })}
                  scroll={false}
                  className={estilos.nomeSocio}
                >
                  {s.usuario.nomeCompleto}
                </Link>
              </th>
              <td className={estilosTabela.suave}>{s.usuario.cpfMascarado}</td>
              <td>{s.usuario.email}</td>
              <td>{formatarTelefone(s.usuario.telefone)}</td>
              <td className={estilosTabela.numero}>{idadeEm(s.usuario.dataNascimento, hoje)}</td>
              <td>
                <Selo tom={ROTULO_ESTADO[s.estado].tom}>{ROTULO_ESTADO[s.estado].texto}</Selo>
              </td>
              <td>
                <Situacao s={s} />
              </td>
              <td>{s.socioDesde ? formatarCompetencia(competenciaDe(s.socioDesde)) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Paginacao({
  pagina,
  filtros,
  base,
}: {
  pagina: PaginaSociedades;
  filtros: FiltrosSociedades;
  base: string;
}) {
  const inicio = (pagina.pagina - 1) * pagina.tamanhoPagina + 1;
  const fim = Math.min(pagina.pagina * pagina.tamanhoPagina, pagina.totalItens);
  if (!pagina.totalItens) return null;

  return (
    <nav className={estilos.paginacao} aria-label="Paginação">
      <p>
        {inicio}–{fim} de {pagina.totalItens} {pagina.totalItens === 1 ? "sócio" : "sócios"}
      </p>
      <div className={estilos.paginas}>
        {pagina.pagina > 1 ? (
          <Link href={urlDiretoria(base, filtros, { pagina: pagina.pagina - 1 })}>Anterior</Link>
        ) : (
          <span aria-disabled="true">Anterior</span>
        )}
        <span>
          Página {pagina.pagina} de {Math.max(pagina.totalPaginas, 1)}
        </span>
        {pagina.pagina < pagina.totalPaginas ? (
          <Link href={urlDiretoria(base, filtros, { pagina: pagina.pagina + 1 })}>Próxima</Link>
        ) : (
          <span aria-disabled="true">Próxima</span>
        )}
      </div>
    </nav>
  );
}
