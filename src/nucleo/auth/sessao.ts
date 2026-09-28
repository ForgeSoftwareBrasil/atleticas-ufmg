import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Eu, Tokens } from "../contrato";
import { api, ErroDaApi } from "../api/cliente";
import { configApi } from "../api/config";
import { abrirSessao, NOME_COOKIE, OPCOES_COOKIE, selarSessao, type Sessao } from "./cookie-sessao";

export async function obterSessao(): Promise<Sessao | null> {
  const jar = await cookies();
  return abrirSessao(jar.get(NOME_COOKIE)?.value);
}

/** Só em Server Actions / Route Handlers (onde é permitido escrever cookies). */
export async function gravarSessao(tokens: Tokens) {
  const jar = await cookies();
  jar.set(NOME_COOKIE, await selarSessao(tokens), OPCOES_COOKIE);
}

export async function apagarSessao() {
  const jar = await cookies();
  jar.delete(NOME_COOKIE);
}

export interface UsuarioLogado {
  token: string;
  eu: Eu;
  ehDiretor: boolean;
}

/** Usuário da requisição atual, ou null. Memoizado por requisição. */
export const usuarioAtual = cache(async (): Promise<UsuarioLogado | null> => {
  const sessao = await obterSessao();
  if (!sessao) return null;
  try {
    const eu = await api.eu(sessao.tokenAcesso);
    return {
      token: sessao.tokenAcesso,
      eu,
      ehDiretor: eu.papeis.some((p) => p.atleticaId === configApi.atleticaId && p.papel === "DIRETOR"),
    };
  } catch (e) {
    if (e instanceof ErroDaApi && e.status === 401) return null;
    throw e;
  }
});

export async function exigirUsuario(destino: string): Promise<UsuarioLogado> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect(`/entrar?para=${encodeURIComponent(destino)}`);
  return usuario;
}

export async function exigirDiretor(destino: string): Promise<UsuarioLogado> {
  const usuario = await exigirUsuario(destino);
  if (!usuario.ehDiretor) redirect("/minha-sociedade");
  return usuario;
}

/** Aceita apenas caminhos internos, evitando open redirect via ?para=. */
export function destinoSeguro(para: unknown): string | null {
  if (typeof para !== "string" || !para.startsWith("/") || para.startsWith("//") || para.startsWith("/\\")) return null;
  return para;
}
