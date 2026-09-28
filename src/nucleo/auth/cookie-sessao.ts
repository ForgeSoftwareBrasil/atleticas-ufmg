import "server-only";
import { EncryptJWT, jwtDecrypt } from "jose";
import type { Tokens } from "../contrato";

/*
 * Sessão do BFF (docs/adr/0001): os tokens da API central ficam CIFRADOS (JWE A256GCM)
 * dentro de um cookie HttpOnly do próprio domínio do site. O navegador nunca vê os tokens.
 * Este módulo não depende de next/headers para poder ser usado também no proxy.
 */

export type Sessao = Tokens;

export const DURACAO_SESSAO_S = 7 * 24 * 60 * 60;

const producao = process.env.NODE_ENV === "production";

/** O prefixo __Host- obriga Secure, Path=/ e ausência de Domain (o cookie não vaza para subdomínios). */
export const NOME_COOKIE = producao ? "__Host-sessao" : "sessao";

export const OPCOES_COOKIE = {
  httpOnly: true,
  secure: producao,
  sameSite: "lax",
  path: "/",
  maxAge: DURACAO_SESSAO_S,
} as const;

let chaveCache: Uint8Array | undefined;

async function chave(): Promise<Uint8Array> {
  if (chaveCache) return chaveCache;
  const segredo = process.env.SESSION_SECRET;
  if (!segredo || segredo.length < 32) {
    throw new Error("Defina SESSION_SECRET com pelo menos 32 caracteres (veja .env.example).");
  }
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(segredo));
  chaveCache = new Uint8Array(hash);
  return chaveCache;
}

export async function selarSessao(sessao: Sessao): Promise<string> {
  return new EncryptJWT({ ...sessao })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${DURACAO_SESSAO_S}s`)
    .encrypt(await chave());
}

export async function abrirSessao(valor: string | undefined): Promise<Sessao | null> {
  if (!valor) return null;
  try {
    const { payload } = await jwtDecrypt(valor, await chave());
    const { tokenAcesso, tokenRenovacao, expiraEm } = payload as Partial<Sessao>;
    if (!tokenAcesso || !tokenRenovacao || !expiraEm) return null;
    return { tokenAcesso, tokenRenovacao, expiraEm };
  } catch {
    return null;
  }
}

/** Token de acesso vence em menos de 60 s? Então é hora de renovar. */
export function precisaRenovar(sessao: Sessao): boolean {
  return new Date(sessao.expiraEm).getTime() - Date.now() < 60_000;
}
