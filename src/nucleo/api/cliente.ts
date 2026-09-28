import "server-only";
import { z } from "zod";
import {
  Atletica,
  ErroApi,
  Eu,
  PaginaSociedades,
  ResumoDiretoria,
  SociedadeDetalhe,
  Tokens,
  Usuario,
  type Ativacao,
  type Credenciais,
  type FiltrosSociedades,
  type NovoUsuario,
  type RegistroPagamento,
} from "../contrato";
import { configApi } from "./config";
import { enviar } from "./transporte";

export class ErroDaApi extends Error {
  constructor(
    readonly status: number,
    readonly erro: ErroApi,
  ) {
    super(`${status} ${erro.codigo}: ${erro.mensagem}`);
    this.name = "ErroDaApi";
  }
}

type Query = Record<string, string | number | undefined>;

interface Opcoes<T> {
  token?: string;
  corpo?: unknown;
  query?: Query;
  schema?: z.ZodType<T>;
}

function montarUrl(caminho: string, query?: Query): string {
  const url = new URL(`${configApi.urlBase}/v1${caminho}`);
  for (const [chave, valor] of Object.entries(query ?? {})) {
    if (valor !== undefined && valor !== "") url.searchParams.set(chave, String(valor));
  }
  return url.toString();
}

async function chamar(
  metodo: string,
  caminho: string,
  opcoes: Omit<Opcoes<unknown>, "schema"> = {},
): Promise<Response> {
  const headers = new Headers({ Accept: "application/json" });
  if (opcoes.token) headers.set("Authorization", `Bearer ${opcoes.token}`);
  if (opcoes.corpo !== undefined) headers.set("Content-Type", "application/json");

  const resposta = await enviar(
    new Request(montarUrl(caminho, opcoes.query), {
      method: metodo,
      headers,
      body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
    }),
  );

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null);
    const erro = ErroApi.safeParse(corpo);
    throw new ErroDaApi(
      resposta.status,
      erro.success ? erro.data : { codigo: "ERRO_INTERNO", mensagem: "Resposta de erro fora do contrato" },
    );
  }
  return resposta;
}

async function requisitar<T>(metodo: string, caminho: string, opcoes: Opcoes<T> = {}): Promise<T> {
  const resposta = await chamar(metodo, caminho, opcoes);
  if (resposta.status === 204 || !opcoes.schema) return undefined as T;
  const json = await resposta.json();
  const resultado = opcoes.schema.safeParse(json);
  if (!resultado.success) {
    // Divergência de contrato: falhar alto é melhor que renderizar dado errado.
    throw new Error(`Resposta de ${metodo} ${caminho} fora do contrato: ${z.prettifyError(resultado.error)}`);
  }
  return resultado.data;
}

const sociedades = (sufixo = "") => `/atleticas/${configApi.atleticaId}/sociedades${sufixo}`;

export const api = {
  // Autenticação
  entrar: (credenciais: Credenciais) => requisitar("POST", "/auth/sessoes", { corpo: credenciais, schema: Tokens }),
  renovar: (tokenRenovacao: string) =>
    requisitar("POST", "/auth/renovacoes", { corpo: { tokenRenovacao }, schema: Tokens }),
  sair: (token: string) => requisitar<void>("DELETE", "/auth/sessoes", { token }),

  // Usuários
  cadastrarUsuario: (novo: NovoUsuario) => requisitar("POST", "/usuarios", { corpo: novo, schema: Usuario }),
  eu: (token: string) => requisitar("GET", "/usuarios/eu", { token, schema: Eu }),

  // Atlética
  atletica: () => requisitar("GET", `/atleticas/${configApi.atleticaId}`, { schema: Atletica }),

  // Sócio
  minhaSociedade: async (token: string) => {
    try {
      return await requisitar("GET", sociedades("/minha"), { token, schema: SociedadeDetalhe });
    } catch (e) {
      if (e instanceof ErroDaApi && e.status === 404) return null;
      throw e;
    }
  },
  solicitarSociedade: (token: string) => requisitar("POST", sociedades(), { token, schema: SociedadeDetalhe }),

  // Diretoria
  listarSociedades: (token: string, filtros: FiltrosSociedades) =>
    requisitar("GET", sociedades(), { token, query: filtros, schema: PaginaSociedades }),
  resumoDiretoria: (token: string) => requisitar("GET", sociedades("/resumo"), { token, schema: ResumoDiretoria }),
  detalheSociedade: (token: string, id: string) =>
    requisitar("GET", sociedades(`/${id}`), { token, schema: SociedadeDetalhe }),
  ativar: (token: string, id: string, dados: Ativacao) =>
    requisitar("POST", sociedades(`/${id}/ativacao`), { token, corpo: dados, schema: SociedadeDetalhe }),
  recusar: (token: string, id: string) =>
    requisitar("POST", sociedades(`/${id}/recusa`), { token, schema: SociedadeDetalhe }),
  registrarPagamento: (token: string, id: string, dados: RegistroPagamento) =>
    requisitar("POST", sociedades(`/${id}/pagamentos`), { token, corpo: dados, schema: SociedadeDetalhe }),
  desfazerPagamento: (token: string, id: string, mensalidadeId: string) =>
    requisitar("DELETE", sociedades(`/${id}/mensalidades/${mensalidadeId}/pagamento`), {
      token,
      schema: SociedadeDetalhe,
    }),
  exportarCsv: (token: string, filtros: Partial<FiltrosSociedades>) =>
    chamar("GET", sociedades("/exportacao"), { token, query: filtros }),
};
