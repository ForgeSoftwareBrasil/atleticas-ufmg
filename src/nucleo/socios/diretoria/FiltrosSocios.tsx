"use client";

import Link from "next/link";
import type { FiltrosSociedades } from "../../contrato";
import { Botao } from "../../ui/Botao";
import { Campo, CampoSelecao } from "../../ui/Campo";
import estilos from "./diretoria.module.scss";

/**
 * Filtros como formulário GET: funcionam sem JavaScript e deixam a URL compartilhável.
 * Com JavaScript, trocar um filtro já aplica.
 */
export function FiltrosSocios({ filtros, base }: { filtros: FiltrosSociedades; base: string }) {
  const aplicar = (e: React.ChangeEvent<HTMLSelectElement>) => e.currentTarget.form?.requestSubmit();
  const temFiltro = Boolean(filtros.busca || filtros.estado || filtros.situacao);

  return (
    <form method="get" action={base} className={estilos.filtros} role="search" aria-label="Filtrar sócios">
      <Campo
        id="busca"
        rotulo="Buscar"
        type="search"
        placeholder="Nome, CPF ou email"
        defaultValue={filtros.busca}
        className={estilos.campoBusca}
      />
      <CampoSelecao id="situacao" rotulo="Situação" defaultValue={filtros.situacao ?? ""} onChange={aplicar}>
        <option value="">Todas</option>
        <option value="EM_DIA">Em dia</option>
        <option value="INADIMPLENTE">Inadimplente</option>
      </CampoSelecao>
      <CampoSelecao id="estado" rotulo="Sociedade" defaultValue={filtros.estado ?? ""} onChange={aplicar}>
        <option value="">Todas</option>
        <option value="ATIVA">Ativa</option>
        <option value="PENDENTE">Pendente</option>
        <option value="ENCERRADA">Encerrada</option>
      </CampoSelecao>
      {filtros.ordenarPor !== "nome" && <input type="hidden" name="ordenarPor" value={filtros.ordenarPor} />}
      {filtros.ordem !== "asc" && <input type="hidden" name="ordem" value={filtros.ordem} />}
      <div className={estilos.botoesFiltro}>
        <Botao type="submit" variante="secundario">
          Buscar
        </Botao>
        {temFiltro && (
          <Link href={base} className={estilos.limpar}>
            Limpar filtros
          </Link>
        )}
      </div>
    </form>
  );
}
