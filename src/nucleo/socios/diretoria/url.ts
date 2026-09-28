import type { FiltrosSociedades } from "../../contrato";

const PADRAO: Partial<FiltrosSociedades> = { pagina: 1, tamanhoPagina: 20, ordenarPor: "nome", ordem: "asc" };

/**
 * Monta a URL do painel preservando filtros. Valores padrão são omitidos para manter a URL curta
 * (e compartilhável entre diretores).
 */
export function urlDiretoria(
  base: string,
  filtros: Partial<FiltrosSociedades>,
  mudancas: Partial<FiltrosSociedades> & { sociedade?: string | null } = {},
): string {
  const tudo: Record<string, unknown> = { ...filtros, ...mudancas };
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(tudo)) {
    if (valor === undefined || valor === null || valor === "") continue;
    if (PADRAO[chave as keyof FiltrosSociedades] === valor) continue;
    params.set(chave, String(valor));
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
