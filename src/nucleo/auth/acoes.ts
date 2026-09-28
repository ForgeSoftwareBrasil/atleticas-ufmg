"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { Credenciais, NovoUsuario } from "../contrato";
import { api, ErroDaApi } from "../api/cliente";
import { configApi } from "../api/config";
import { apagarSessao, destinoSeguro, gravarSessao, obterSessao } from "./sessao";

export interface EstadoFormulario {
  erro?: string;
  campos?: Record<string, string>;
  /** Valores enviados (sem senha), para repreencher o formulário após erro. */
  valores?: Record<string, string>;
}

function errosDeCampo(error: z.ZodError): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const issue of error.issues) campos[String(issue.path[0])] ??= issue.message;
  return campos;
}

function mensagemDeErro(e: unknown): EstadoFormulario {
  if (e instanceof ErroDaApi) {
    return { erro: e.erro.mensagem, campos: e.erro.campos };
  }
  console.error(e);
  return { erro: "Não foi possível falar com o servidor. Tente novamente em instantes." };
}

async function destinoPadrao(token: string): Promise<string> {
  const eu = await api.eu(token);
  const diretor = eu.papeis.some((p) => p.atleticaId === configApi.atleticaId && p.papel === "DIRETOR");
  return diretor ? "/diretoria" : "/minha-sociedade";
}

export async function entrar(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const valores = { email: String(formData.get("email") ?? "") };
  const credenciais = Credenciais.safeParse({ email: formData.get("email"), senha: formData.get("senha") });
  if (!credenciais.success) return { campos: errosDeCampo(credenciais.error), valores };

  let destino: string;
  try {
    const tokens = await api.entrar(credenciais.data);
    await gravarSessao(tokens);
    destino = destinoSeguro(formData.get("para")) ?? (await destinoPadrao(tokens.tokenAcesso));
  } catch (e) {
    return { ...mensagemDeErro(e), valores };
  }
  redirect(destino);
}

export async function cadastrar(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const bruto = {
    nomeCompleto: String(formData.get("nomeCompleto") ?? ""),
    cpf: String(formData.get("cpf") ?? ""),
    email: String(formData.get("email") ?? ""),
    telefone: String(formData.get("telefone") ?? ""),
    dataNascimento: String(formData.get("dataNascimento") ?? ""),
  };
  const querSerSocio = formData.get("querSerSocio") === "on";
  const valores = { ...bruto, querSerSocio: querSerSocio ? "on" : "" };

  const senha = String(formData.get("senha") ?? "");
  const confirmacao = String(formData.get("confirmacaoSenha") ?? "");
  const novo = NovoUsuario.safeParse({ ...bruto, senha, aceiteTermos: formData.get("aceiteTermos") === "on" });

  const campos = novo.success ? {} : errosDeCampo(novo.error);
  if (senha !== confirmacao) campos.confirmacaoSenha = "As senhas não conferem";
  if (!novo.success || Object.keys(campos).length) return { campos, valores };

  try {
    await api.cadastrarUsuario(novo.data);
  } catch (e) {
    if (e instanceof ErroDaApi && e.erro.codigo === "CPF_JA_CADASTRADO") {
      return { campos: { cpf: "Este CPF já tem conta. Entre com seu email e senha." }, valores };
    }
    if (e instanceof ErroDaApi && e.erro.codigo === "EMAIL_JA_CADASTRADO") {
      return { campos: { email: "Este email já tem conta. Entre com ele e sua senha." }, valores };
    }
    return { ...mensagemDeErro(e), valores };
  }

  try {
    const tokens = await api.entrar({ email: novo.data.email, senha });
    await gravarSessao(tokens);
    if (querSerSocio) await api.solicitarSociedade(tokens.tokenAcesso);
  } catch (e) {
    // A conta foi criada; se algo falhar depois, o usuário ainda consegue entrar normalmente.
    console.error(e);
    redirect("/entrar");
  }
  redirect("/minha-sociedade");
}

export async function sair() {
  const sessao = await obterSessao();
  if (sessao) {
    // Revoga na API; se falhar, a sessão local é apagada mesmo assim.
    await api.sair(sessao.tokenAcesso).catch(() => undefined);
  }
  await apagarSessao();
  redirect("/");
}
