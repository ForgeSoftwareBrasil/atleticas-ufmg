import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/nucleo/api/cliente";
import { abrirSessao, NOME_COOKIE, OPCOES_COOKIE, precisaRenovar, selarSessao } from "@/nucleo/auth/cookie-sessao";

const ROTAS_PROTEGIDAS = ["/minha-sociedade", "/diretoria"];

function politicaDeConteudo(nonce: string): string {
  const dev = process.env.NODE_ENV === "development";
  return `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    connect-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${dev ? "" : "upgrade-insecure-requests;"}
  `
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * 1. Gera o nonce do CSP da requisição.
 * 2. Renova de forma transparente o token de acesso da API quando está para vencer
 *    (Server Components não podem escrever cookies; o proxy pode).
 * 3. Barra rotas autenticadas sem sessão.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = politicaDeConteudo(nonce);

  const sessao = await abrirSessao(request.cookies.get(NOME_COOKIE)?.value);
  /** undefined = cookie inalterado; null = apagar; string = novo valor. */
  let novoCookie: string | null | undefined;
  if (request.cookies.has(NOME_COOKIE) && !sessao) novoCookie = null;
  if (sessao && precisaRenovar(sessao)) {
    try {
      novoCookie = await selarSessao(await api.renovar(sessao.tokenRenovacao));
    } catch {
      novoCookie = null;
    }
  }

  const protegida = ROTAS_PROTEGIDAS.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  if (protegida && (!sessao || novoCookie === null)) {
    const url = new URL("/entrar", request.url);
    url.searchParams.set("para", `${pathname}${search}`);
    const redirecionamento = NextResponse.redirect(url);
    redirecionamento.cookies.delete(NOME_COOKIE);
    return redirecionamento;
  }

  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  if (typeof novoCookie === "string") {
    // Faz a própria renderização desta requisição já enxergar o token renovado.
    request.cookies.set(NOME_COOKIE, novoCookie);
    headers.set("cookie", request.cookies.toString());
  }

  const resposta = NextResponse.next({ request: { headers } });
  resposta.headers.set("Content-Security-Policy", csp);
  if (typeof novoCookie === "string") resposta.cookies.set(NOME_COOKIE, novoCookie, OPCOES_COOKIE);
  if (novoCookie === null) resposta.cookies.delete(NOME_COOKIE);
  return resposta;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|icon.png|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
