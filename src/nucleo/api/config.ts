import "server-only";

/**
 * Configuração da conexão com a API central. Só existe no servidor:
 * o navegador nunca conversa com a API diretamente (docs/adr/0001).
 */
export const configApi = {
  /** Quando true, as chamadas são respondidas em memória pelos handlers MSW de src/nucleo/mocks. */
  mock: process.env.API_MOCK === "true",
  urlBase: (process.env.API_URL ?? "https://api.mock.local").replace(/\/$/, ""),
  atleticaId: process.env.ATLETICA_ID ?? "hermes-face",
};
