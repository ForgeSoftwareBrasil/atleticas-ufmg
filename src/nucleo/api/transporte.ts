import "server-only";
import { getResponse } from "msw";
import { configApi } from "./config";

/**
 * Envia uma requisição à API central. Com API_MOCK=true, a mesma Request é resolvida
 * em processo pelos handlers MSW — que implementam o contrato documentado —, sem rede
 * e sem monkey-patch de fetch. Trocar para a API real é só desligar a flag.
 */
export async function enviar(requisicao: Request): Promise<Response> {
  if (!configApi.mock) {
    return fetch(requisicao, { cache: "no-store" });
  }
  const { handlers } = await import("../mocks/handlers");
  const resposta = await getResponse(handlers, requisicao);
  if (resposta) return resposta;
  return Response.json(
    {
      codigo: "ERRO_INTERNO",
      mensagem: `Mock sem handler para ${requisicao.method} ${new URL(requisicao.url).pathname}`,
    },
    { status: 501 },
  );
}
