import type { Metadata } from "next";
import { api, ErroDaApi } from "@/nucleo/api/cliente";
import { exigirDiretor } from "@/nucleo/auth/sessao";
import { FiltrosSociedades } from "@/nucleo/contrato";
import { DetalheSocio } from "@/nucleo/socios/diretoria/DetalheSocio";
import { FiltrosSocios } from "@/nucleo/socios/diretoria/FiltrosSocios";
import { GavetaSocio } from "@/nucleo/socios/diretoria/GavetaSocio";
import { ListaPendentes } from "@/nucleo/socios/diretoria/ListaPendentes";
import { Resumo } from "@/nucleo/socios/diretoria/Resumo";
import { Paginacao, TabelaSocios } from "@/nucleo/socios/diretoria/TabelaSocios";
import { urlDiretoria } from "@/nucleo/socios/diretoria/url";
import { classesBotao } from "@/nucleo/ui/Botao";
import estilos from "./page.module.scss";

export const metadata: Metadata = { title: "Diretoria" };

const BASE = "/diretoria";

type Busca = Record<string, string | string[] | undefined>;

export default async function Diretoria({ searchParams }: { searchParams: Promise<Busca> }) {
  const busca = await searchParams;
  const { token } = await exigirDiretor(BASE);
  const filtros = FiltrosSociedades.parse(
    Object.fromEntries(Object.entries(busca).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])),
  );
  const sociedadeAberta = typeof busca.sociedade === "string" ? busca.sociedade : undefined;

  const [atletica, resumo, pagina, pendentes, detalhe] = await Promise.all([
    api.atletica(),
    api.resumoDiretoria(token),
    api.listarSociedades(token, filtros),
    api.listarSociedades(token, {
      pagina: 1,
      tamanhoPagina: 50,
      estado: "PENDENTE",
      ordenarPor: "solicitadaEm",
      ordem: "asc",
    }),
    sociedadeAberta
      ? api.detalheSociedade(token, sociedadeAberta).catch((e) => {
          if (e instanceof ErroDaApi && e.status === 404) return null;
          throw e;
        })
      : null,
  ]);

  const { pagina: _, tamanhoPagina: __, ...filtrosExportacao } = filtros;
  const urlExportar = urlDiretoria(`${BASE}/exportar`, filtrosExportacao);

  return (
    <div className={`pagina ${estilos.pagina}`}>
      <header className={estilos.cabeca}>
        <div>
          <h1 className={estilos.titulo}>Diretoria</h1>
          <p className={estilos.descricao}>Sócios da {atletica.apelido} e a situação de cada um com as mensalidades.</p>
        </div>
        <a href={urlExportar} className={classesBotao({ variante: "secundario" })} download>
          Exportar CSV
        </a>
      </header>

      <Resumo resumo={resumo} base={BASE} />

      <ListaPendentes pendentes={pendentes.itens} valorMensalidade={atletica.valorMensalidade} />

      <section aria-labelledby="titulo-socios" className={estilos.secao}>
        <h2 id="titulo-socios" className={estilos.subtitulo}>
          Sócios
        </h2>
        <FiltrosSocios filtros={filtros} base={BASE} />
        <TabelaSocios pagina={pagina} filtros={filtros} base={BASE} />
        <Paginacao pagina={pagina} filtros={filtros} base={BASE} />
      </section>

      {detalhe && (
        <GavetaSocio key={detalhe.id} titulo={detalhe.usuario.nomeCompleto} urlFechar={urlDiretoria(BASE, filtros)}>
          <DetalheSocio sociedade={detalhe} />
        </GavetaSocio>
      )}
    </div>
  );
}
