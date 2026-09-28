"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { Ativacao, RegistroPagamento } from "../contrato";
import { api, ErroDaApi } from "../api/cliente";
import { exigirDiretor, exigirUsuario } from "../auth/sessao";

export interface EstadoAcao {
  ok?: boolean;
  mensagem?: string;
  erro?: string;
  campos?: Record<string, string>;
}

function falha(e: unknown): EstadoAcao {
  if (e instanceof ErroDaApi) return { erro: e.erro.mensagem, campos: e.erro.campos };
  console.error(e);
  return { erro: "Não foi possível concluir. Tente novamente em instantes." };
}

function camposInvalidos(error: z.ZodError): EstadoAcao {
  const campos: Record<string, string> = {};
  for (const issue of error.issues) campos[String(issue.path[0])] ??= issue.message;
  return { campos };
}

function dadosPagamento(formData: FormData) {
  return {
    dataPagamento: formData.get("dataPagamento"),
    formaPagamento: formData.get("formaPagamento"),
    observacao: formData.get("observacao") || undefined,
  };
}

// ---------------------------------------------------------------- sócio

export async function solicitarSociedade(): Promise<void> {
  const { token } = await exigirUsuario("/minha-sociedade");
  try {
    await api.solicitarSociedade(token);
  } catch (e) {
    // Já existe sociedade vigente: basta recarregar para mostrá-la.
    if (!(e instanceof ErroDaApi && e.erro.codigo === "SOCIEDADE_JA_EXISTE")) throw e;
  }
  refresh();
}

// ---------------------------------------------------------------- diretoria

export async function ativarSociedade(sociedadeId: string, _: EstadoAcao, formData: FormData): Promise<EstadoAcao> {
  const { token } = await exigirDiretor("/diretoria");
  const dados = Ativacao.safeParse(dadosPagamento(formData));
  if (!dados.success) return camposInvalidos(dados.error);
  try {
    const s = await api.ativar(token, sociedadeId, dados.data);
    refresh();
    return { ok: true, mensagem: `Sociedade de ${s.usuario.nomeCompleto} ativada.` };
  } catch (e) {
    return falha(e);
  }
}

export async function recusarSociedade(sociedadeId: string, _: EstadoAcao): Promise<EstadoAcao> {
  const { token } = await exigirDiretor("/diretoria");
  try {
    const s = await api.recusar(token, sociedadeId);
    refresh();
    return { ok: true, mensagem: `Solicitação de ${s.usuario.nomeCompleto} recusada.` };
  } catch (e) {
    return falha(e);
  }
}

export async function registrarPagamento(sociedadeId: string, _: EstadoAcao, formData: FormData): Promise<EstadoAcao> {
  const { token } = await exigirDiretor("/diretoria");
  const dados = RegistroPagamento.safeParse({
    mensalidadeIds: formData.getAll("mensalidadeIds"),
    ...dadosPagamento(formData),
  });
  if (!dados.success) return camposInvalidos(dados.error);
  try {
    await api.registrarPagamento(token, sociedadeId, dados.data);
    refresh();
    const n = dados.data.mensalidadeIds.length;
    return { ok: true, mensagem: n === 1 ? "Pagamento registrado." : `${n} pagamentos registrados.` };
  } catch (e) {
    return falha(e);
  }
}

export async function desfazerPagamento(
  sociedadeId: string,
  mensalidadeId: string,
  _: EstadoAcao,
): Promise<EstadoAcao> {
  const { token } = await exigirDiretor("/diretoria");
  try {
    await api.desfazerPagamento(token, sociedadeId, mensalidadeId);
    refresh();
    return { ok: true, mensagem: "Registro de pagamento desfeito." };
  } catch (e) {
    return falha(e);
  }
}
