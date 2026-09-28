import "server-only";
import { SignJWT, jwtVerify } from "jose";

/*
 * Tokens da API mock: JWT HS256 sem estado, para funcionarem mesmo que o Next carregue
 * o mock em processos/bundles diferentes. A API real define seu próprio formato — para o
 * front o token é opaco.
 */
const SEGREDO = new TextEncoder().encode("segredo-da-api-mock-somente-para-demonstracao");
const DURACAO_ACESSO_S = 15 * 60;
const DURACAO_RENOVACAO_S = 7 * 24 * 60 * 60;

export async function emitirTokens(usuarioId: string) {
  const agora = Math.floor(Date.now() / 1000);
  const tokenAcesso = await new SignJWT({ tipo: "acesso" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(usuarioId)
    .setIssuedAt(agora)
    .setExpirationTime(agora + DURACAO_ACESSO_S)
    .sign(SEGREDO);
  const tokenRenovacao = await new SignJWT({ tipo: "renovacao" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(usuarioId)
    .setJti(crypto.randomUUID())
    .setIssuedAt(agora)
    .setExpirationTime(agora + DURACAO_RENOVACAO_S)
    .sign(SEGREDO);
  return {
    tokenAcesso,
    tokenRenovacao,
    expiraEm: new Date((agora + DURACAO_ACESSO_S) * 1000).toISOString().replace("Z", "+00:00"),
  };
}

export async function verificarToken(token: string, tipo: "acesso" | "renovacao"): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, SEGREDO, { algorithms: ["HS256"] });
    return payload.tipo === tipo && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}
