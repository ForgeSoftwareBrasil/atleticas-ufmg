import "server-only";
import { randomUUID } from "node:crypto";
import { delay, http, HttpResponse, type DefaultBodyType, type HttpResponseResolver } from "msw";
import type { z } from "zod";
import {
  Ativacao,
  Credenciais,
  Encerramento,
  FiltrosSociedades,
  NovoUsuario,
  PedidoRenovacao,
  RegistroPagamento,
  type CodigoErro,
  type Eu,
} from "../contrato";
import { configApi } from "../api/config";
import { formatarCpf, somenteDigitos } from "../formatos/cpf";
import { formatarData, hojeIso } from "../formatos/datas";
import { formatarTelefone } from "../formatos/telefone";
import {
  banco,
  hashSenha,
  mensalidadesDa,
  paraDetalhe,
  paraResumo,
  semSenha,
  statusMensalidade,
  type Banco,
  type SociedadeDb,
  type UsuarioDb,
} from "./banco";
import { emitirTokens, verificarToken } from "./tokens";

const base = `${configApi.urlBase}/v1`;
const LATENCIA_MS = 150;

// ---------------------------------------------------------------- utilitários

function erro(status: number, codigo: CodigoErro, mensagem: string, campos?: Record<string, string>) {
  return HttpResponse.json({ codigo, mensagem, ...(campos ? { campos } : {}) }, { status });
}

function agoraIso(): string {
  const d = new Date();
  const local = new Date(d.getTime() - 3 * 60 * 60 * 1000); // America/Sao_Paulo (sem horário de verão)
  return `${local.toISOString().slice(0, 19)}-03:00`;
}

async function lerCorpo<T extends z.ZodType>(request: Request, schema: T) {
  const json = await request.json().catch(() => undefined);
  const r = schema.safeParse(json ?? {});
  if (r.success) return { dados: r.data as z.infer<T> };
  const campos: Record<string, string> = {};
  for (const issue of r.error.issues) {
    const campo = String(issue.path[0] ?? "_");
    campos[campo] ??= issue.message;
  }
  return { resposta: erro(422, "DADOS_INVALIDOS", "Há campos inválidos", campos) };
}

async function autenticar(request: Request): Promise<{ db: Banco; usuario: UsuarioDb } | { resposta: Response }> {
  const token = request.headers.get("Authorization")?.replace(/^Bearer /, "");
  const usuarioId = token ? await verificarToken(token, "acesso") : null;
  const db = banco();
  const usuario = usuarioId ? db.usuarios.find((u) => u.id === usuarioId) : undefined;
  if (!usuario) return { resposta: erro(401, "NAO_AUTENTICADO", "Token ausente, inválido ou expirado") };
  return { db, usuario };
}

function ehDiretor(db: Banco, usuarioId: string, atleticaId: string) {
  return db.papeis.some((p) => p.usuarioId === usuarioId && p.atleticaId === atleticaId && p.papel === "DIRETOR");
}

type Params = { atleticaId: string; sociedadeId?: string; mensalidadeId?: string };

/** Envolve handlers da diretoria: autentica, checa papel e localiza a sociedade (se houver no path). */
function daDiretoria(
  fn: (ctx: {
    db: Banco;
    usuario: UsuarioDb;
    sociedade?: SociedadeDb;
    request: Request;
    params: Params;
  }) => Promise<Response> | Response,
): HttpResponseResolver<Params, DefaultBodyType, undefined> {
  return async ({ request, params }) => {
    await delay(LATENCIA_MS);
    const auth = await autenticar(request);
    if ("resposta" in auth) return auth.resposta;
    if (!ehDiretor(auth.db, auth.usuario.id, params.atleticaId)) {
      return erro(403, "SEM_PERMISSAO", "Apenas diretores desta atlética podem fazer isso");
    }
    let sociedade: SociedadeDb | undefined;
    if (params.sociedadeId) {
      sociedade = auth.db.sociedades.find((s) => s.id === params.sociedadeId && s.atleticaId === params.atleticaId);
      if (!sociedade) return erro(404, "NAO_ENCONTRADO", "Sociedade não encontrada");
    }
    return fn({ ...auth, sociedade, request, params });
  };
}

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function filtrarEOrdenar(db: Banco, atleticaId: string, f: FiltrosSociedades) {
  const hoje = hojeIso();
  let itens = db.sociedades.filter((s) => s.atleticaId === atleticaId).map((s) => paraResumo(db, s, hoje));

  if (f.busca) {
    const termo = normalizar(f.busca);
    const digitos = somenteDigitos(f.busca);
    itens = itens.filter((s) => {
      const u = db.usuarios.find((x) => x.id === s.usuario.id)!;
      return (
        normalizar(u.nomeCompleto).includes(termo) ||
        u.email.includes(termo) ||
        (digitos.length >= 3 && u.cpf.includes(digitos))
      );
    });
  }
  if (f.estado) itens = itens.filter((s) => s.estado === f.estado);
  if (f.situacao) itens = itens.filter((s) => s.situacao === f.situacao);

  const direcao = f.ordem === "desc" ? -1 : 1;
  const comparar = {
    nome: (a: (typeof itens)[0], b: (typeof itens)[0]) =>
      a.usuario.nomeCompleto.localeCompare(b.usuario.nomeCompleto, "pt-BR"),
    socioDesde: (a: (typeof itens)[0], b: (typeof itens)[0]) =>
      (a.socioDesde ?? "9999").localeCompare(b.socioDesde ?? "9999"),
    mensalidadesEmAtraso: (a: (typeof itens)[0], b: (typeof itens)[0]) =>
      a.mensalidadesEmAtraso - b.mensalidadesEmAtraso,
    solicitadaEm: (a: (typeof itens)[0], b: (typeof itens)[0]) => a.solicitadaEm.localeCompare(b.solicitadaEm),
  }[f.ordenarPor];
  itens.sort(
    (a, b) => comparar(a, b) * direcao || a.usuario.nomeCompleto.localeCompare(b.usuario.nomeCompleto, "pt-BR"),
  );
  return itens;
}

function filtrosDaUrl(request: Request): FiltrosSociedades {
  return FiltrosSociedades.parse(Object.fromEntries(new URL(request.url).searchParams));
}

// ---------------------------------------------------------------- handlers

const JANELA_TENTATIVAS_MS = 15 * 60 * 1000;
const MAX_TENTATIVAS = 5;

export const handlers = [
  // --- Autenticação
  http.post(`${base}/auth/sessoes`, async ({ request }) => {
    await delay(LATENCIA_MS);
    const corpo = await lerCorpo(request, Credenciais);
    if (corpo.resposta) return corpo.resposta;
    const db = banco();
    const { email, senha } = corpo.dados;

    const agora = Date.now();
    const recentes = (db.tentativasLogin.get(email) ?? []).filter((t) => agora - t < JANELA_TENTATIVAS_MS);
    if (recentes.length >= MAX_TENTATIVAS) {
      return erro(429, "MUITAS_TENTATIVAS", "Muitas tentativas de login. Tente novamente em alguns minutos.");
    }
    const usuario = db.usuarios.find((u) => u.email === email);
    if (!usuario || usuario.senhaHash !== hashSenha(senha)) {
      db.tentativasLogin.set(email, [...recentes, agora]);
      return erro(401, "CREDENCIAIS_INVALIDAS", "Email ou senha inválidos");
    }
    db.tentativasLogin.delete(email);
    return HttpResponse.json(await emitirTokens(usuario.id));
  }),

  http.post(`${base}/auth/renovacoes`, async ({ request }) => {
    const corpo = await lerCorpo(request, PedidoRenovacao);
    if (corpo.resposta) return corpo.resposta;
    const usuarioId = await verificarToken(corpo.dados.tokenRenovacao, "renovacao");
    if (!usuarioId) return erro(401, "NAO_AUTENTICADO", "Token de renovação inválido ou expirado");
    return HttpResponse.json(await emitirTokens(usuarioId));
  }),

  http.delete(`${base}/auth/sessoes`, async ({ request }) => {
    const auth = await autenticar(request);
    if ("resposta" in auth) return auth.resposta;
    return new HttpResponse(null, { status: 204 });
  }),

  // --- Usuários
  http.post(`${base}/usuarios`, async ({ request }) => {
    await delay(LATENCIA_MS);
    const corpo = await lerCorpo(request, NovoUsuario);
    if (corpo.resposta) return corpo.resposta;
    const db = banco();
    const { senha, aceiteTermos: _, ...dados } = corpo.dados;
    if (db.usuarios.some((u) => u.cpf === dados.cpf)) {
      return erro(409, "CPF_JA_CADASTRADO", "Já existe uma conta com este CPF");
    }
    if (db.usuarios.some((u) => u.email === dados.email)) {
      return erro(409, "EMAIL_JA_CADASTRADO", "Já existe uma conta com este email");
    }
    const usuario: UsuarioDb = { id: randomUUID(), ...dados, criadoEm: agoraIso(), senhaHash: hashSenha(senha) };
    db.usuarios.push(usuario);
    return HttpResponse.json(semSenha(usuario), { status: 201 });
  }),

  http.get(`${base}/usuarios/eu`, async ({ request }) => {
    await delay(LATENCIA_MS);
    const auth = await autenticar(request);
    if ("resposta" in auth) return auth.resposta;
    const eu: Eu = {
      ...semSenha(auth.usuario),
      papeis: auth.db.papeis
        .filter((p) => p.usuarioId === auth.usuario.id)
        .map(({ atleticaId, papel }) => ({ atleticaId, papel })),
    };
    return HttpResponse.json(eu);
  }),

  // --- Atlética
  http.get<Params>(`${base}/atleticas/:atleticaId`, async ({ params }) => {
    const atletica = banco().atleticas.find((a) => a.id === params.atleticaId);
    return atletica ? HttpResponse.json(atletica) : erro(404, "NAO_ENCONTRADO", "Atlética não encontrada");
  }),

  // --- Sócio (rotas literais antes de /:sociedadeId)
  http.get<Params>(`${base}/atleticas/:atleticaId/sociedades/minha`, async ({ request, params }) => {
    await delay(LATENCIA_MS);
    const auth = await autenticar(request);
    if ("resposta" in auth) return auth.resposta;
    const minhas = auth.db.sociedades
      .filter((s) => s.usuarioId === auth.usuario.id && s.atleticaId === params.atleticaId)
      .sort((a, b) => b.solicitadaEm.localeCompare(a.solicitadaEm));
    if (!minhas[0]) return erro(404, "NAO_ENCONTRADO", "Você não possui sociedade com esta atlética");
    return HttpResponse.json(paraDetalhe(auth.db, minhas[0]));
  }),

  http.post<Params>(`${base}/atleticas/:atleticaId/sociedades`, async ({ request, params }) => {
    await delay(LATENCIA_MS);
    const auth = await autenticar(request);
    if ("resposta" in auth) return auth.resposta;
    const { db, usuario } = auth;
    const vigente = db.sociedades.find(
      (s) => s.usuarioId === usuario.id && s.atleticaId === params.atleticaId && s.estado !== "ENCERRADA",
    );
    if (vigente) return erro(409, "SOCIEDADE_JA_EXISTE", "Você já possui uma sociedade pendente ou ativa");
    const sociedade: SociedadeDb = {
      id: randomUUID(),
      atleticaId: params.atleticaId,
      usuarioId: usuario.id,
      estado: "PENDENTE",
      solicitadaEm: agoraIso(),
      socioDesde: null,
      encerradaEm: null,
    };
    db.sociedades.push(sociedade);
    return HttpResponse.json(paraDetalhe(db, sociedade), { status: 201 });
  }),

  // --- Diretoria
  http.get<Params>(
    `${base}/atleticas/:atleticaId/sociedades/resumo`,
    daDiretoria(({ db, params }) => {
      const itens = db.sociedades.filter((s) => s.atleticaId === params.atleticaId).map((s) => paraResumo(db, s));
      const ativas = itens.filter((s) => s.estado === "ATIVA");
      return HttpResponse.json({
        ativas: ativas.length,
        emDia: ativas.filter((s) => s.situacao === "EM_DIA").length,
        inadimplentes: ativas.filter((s) => s.situacao === "INADIMPLENTE").length,
        pendentes: itens.filter((s) => s.estado === "PENDENTE").length,
        valorEmAtraso: ativas.reduce((t, s) => t + s.valorEmAtraso, 0),
      });
    }),
  ),

  http.get<Params>(
    `${base}/atleticas/:atleticaId/sociedades/exportacao`,
    daDiretoria(({ db, request, params }) => {
      const itens = filtrarEOrdenar(db, params.atleticaId, filtrosDaUrl(request));
      const celula = (v: string | number | null) => {
        const t = v === null ? "" : String(v);
        return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
      };
      const rotulosEstado = { PENDENTE: "Pendente", ATIVA: "Ativa", ENCERRADA: "Encerrada" };
      const rotulosSituacao = { EM_DIA: "Em dia", INADIMPLENTE: "Inadimplente" };
      const linhas = [
        [
          "Nome completo",
          "CPF",
          "Email",
          "Telefone",
          "Data de nascimento",
          "Sociedade",
          "Situação",
          "Sócio desde",
          "Mensalidades em atraso",
          "Valor em atraso (R$)",
        ],
        ...itens.map((s) => {
          const u = db.usuarios.find((x) => x.id === s.usuario.id)!;
          return [
            u.nomeCompleto,
            formatarCpf(u.cpf),
            u.email,
            formatarTelefone(u.telefone),
            formatarData(u.dataNascimento),
            rotulosEstado[s.estado],
            s.situacao ? rotulosSituacao[s.situacao] : "",
            s.socioDesde ? formatarData(s.socioDesde) : "",
            s.mensalidadesEmAtraso,
            (s.valorEmAtraso / 100).toFixed(2).replace(".", ","),
          ];
        }),
      ];
      // BOM + ";" para abrir corretamente no Excel em pt-BR.
      const csv = "﻿" + linhas.map((l) => l.map(celula).join(";")).join("\r\n");
      return new HttpResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="socios-${params.atleticaId}-${hojeIso()}.csv"`,
        },
      });
    }),
  ),

  http.get<Params>(
    `${base}/atleticas/:atleticaId/sociedades`,
    daDiretoria(({ db, request, params }) => {
      const f = filtrosDaUrl(request);
      const itens = filtrarEOrdenar(db, params.atleticaId, f);
      const totalPaginas = Math.ceil(itens.length / f.tamanhoPagina);
      const inicio = (f.pagina - 1) * f.tamanhoPagina;
      return HttpResponse.json({
        itens: itens.slice(inicio, inicio + f.tamanhoPagina),
        pagina: f.pagina,
        tamanhoPagina: f.tamanhoPagina,
        totalItens: itens.length,
        totalPaginas,
      });
    }),
  ),

  http.get<Params>(
    `${base}/atleticas/:atleticaId/sociedades/:sociedadeId`,
    daDiretoria(({ db, sociedade }) => HttpResponse.json(paraDetalhe(db, sociedade!))),
  ),

  http.post<Params>(
    `${base}/atleticas/:atleticaId/sociedades/:sociedadeId/ativacao`,
    daDiretoria(async ({ db, usuario, sociedade, request }) => {
      const corpo = await lerCorpo(request, Ativacao);
      if (corpo.resposta) return corpo.resposta;
      const s = sociedade!;
      if (s.estado !== "PENDENTE") return erro(409, "TRANSICAO_INVALIDA", "Só sociedades pendentes podem ser ativadas");
      s.estado = "ATIVA";
      s.socioDesde = hojeIso();
      banco(); // gera a mensalidade da competência atual
      const primeira = mensalidadesDa(db, s.id)[0];
      primeira.pagamento = {
        dataPagamento: corpo.dados.dataPagamento,
        formaPagamento: corpo.dados.formaPagamento,
        observacao: corpo.dados.observacao || null,
        registradoPor: { id: usuario.id, nomeCompleto: usuario.nomeCompleto },
        registradoEm: agoraIso(),
      };
      return HttpResponse.json(paraDetalhe(db, s));
    }),
  ),

  http.post<Params>(
    `${base}/atleticas/:atleticaId/sociedades/:sociedadeId/recusa`,
    daDiretoria(({ db, sociedade }) => {
      const s = sociedade!;
      if (s.estado !== "PENDENTE")
        return erro(409, "TRANSICAO_INVALIDA", "Só sociedades pendentes podem ser recusadas");
      s.estado = "ENCERRADA";
      s.encerradaEm = agoraIso();
      return HttpResponse.json(paraDetalhe(db, s));
    }),
  ),

  http.post<Params>(
    `${base}/atleticas/:atleticaId/sociedades/:sociedadeId/encerramento`,
    daDiretoria(async ({ db, sociedade, request }) => {
      const corpo = await lerCorpo(request, Encerramento);
      if (corpo.resposta) return corpo.resposta;
      const s = sociedade!;
      if (s.estado !== "ATIVA") return erro(409, "TRANSICAO_INVALIDA", "Só sociedades ativas podem ser encerradas");
      s.estado = "ENCERRADA";
      s.encerradaEm = agoraIso();
      return HttpResponse.json(paraDetalhe(db, s));
    }),
  ),

  http.post<Params>(
    `${base}/atleticas/:atleticaId/sociedades/:sociedadeId/pagamentos`,
    daDiretoria(async ({ db, usuario, sociedade, request }) => {
      const corpo = await lerCorpo(request, RegistroPagamento);
      if (corpo.resposta) return corpo.resposta;
      const s = sociedade!;
      const daSociedade = mensalidadesDa(db, s.id);
      const alvo = corpo.dados.mensalidadeIds.map((id) => daSociedade.find((m) => m.id === id));
      if (alvo.some((m) => !m)) return erro(404, "NAO_ENCONTRADO", "Mensalidade não encontrada nesta sociedade");
      if (alvo.some((m) => statusMensalidade(m!) === "PAGA")) {
        return erro(409, "MENSALIDADE_JA_PAGA", "Uma das mensalidades selecionadas já está paga");
      }
      for (const m of alvo) {
        m!.pagamento = {
          dataPagamento: corpo.dados.dataPagamento,
          formaPagamento: corpo.dados.formaPagamento,
          observacao: corpo.dados.observacao || null,
          registradoPor: { id: usuario.id, nomeCompleto: usuario.nomeCompleto },
          registradoEm: agoraIso(),
        };
      }
      return HttpResponse.json(paraDetalhe(db, s));
    }),
  ),

  http.delete<Params>(
    `${base}/atleticas/:atleticaId/sociedades/:sociedadeId/mensalidades/:mensalidadeId/pagamento`,
    daDiretoria(({ db, sociedade, params }) => {
      const m = mensalidadesDa(db, sociedade!.id).find((x) => x.id === params.mensalidadeId);
      if (!m) return erro(404, "NAO_ENCONTRADO", "Mensalidade não encontrada nesta sociedade");
      if (!m.pagamento) return erro(409, "MENSALIDADE_NAO_PAGA", "Esta mensalidade não tem pagamento registrado");
      m.pagamento = null;
      return HttpResponse.json(paraDetalhe(db, sociedade!));
    }),
  ),
];
