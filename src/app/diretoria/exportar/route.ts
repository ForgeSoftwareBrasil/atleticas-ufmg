import { api } from "@/nucleo/api/cliente";
import { usuarioAtual } from "@/nucleo/auth/sessao";
import { FiltrosSociedades } from "@/nucleo/contrato";

/**
 * Exportação CSV dos sócios (com CPF completo) respeitando os filtros da tela.
 * O BFF só repassa o arquivo gerado pela API central, depois de conferir o papel de diretor.
 */
export async function GET(request: Request) {
  const usuario = await usuarioAtual();
  if (!usuario) return new Response("Não autenticado", { status: 401 });
  if (!usuario.ehDiretor) return new Response("Apenas diretores podem exportar", { status: 403 });

  const {
    pagina: _,
    tamanhoPagina: __,
    ...filtros
  } = FiltrosSociedades.parse(Object.fromEntries(new URL(request.url).searchParams));
  const resposta = await api.exportarCsv(usuario.token, filtros);

  return new Response(resposta.body, {
    headers: {
      "Content-Type": resposta.headers.get("Content-Type") ?? "text/csv; charset=utf-8",
      "Content-Disposition": resposta.headers.get("Content-Disposition") ?? 'attachment; filename="socios.csv"',
      "Cache-Control": "no-store",
    },
  });
}
