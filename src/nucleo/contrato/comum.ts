import { z } from "zod";

/** Data sem horário, ISO 8601: "2026-09-10". */
export const Data = z.iso.date();

/** Data e hora ISO 8601 com fuso: "2026-09-27T14:03:00-03:00". */
export const DataHora = z.iso.datetime({ offset: true });

/** Mês de referência de uma mensalidade: "2026-09". */
export const Competencia = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Competência deve estar no formato AAAA-MM");

/** Valores monetários trafegam sempre em centavos, como inteiro. R$ 60,00 → 6000. */
export const Centavos = z.number().int().nonnegative();

export const Id = z.string().min(1);

export const EstadoSociedade = z.enum(["PENDENTE", "ATIVA", "ENCERRADA"]);
export type EstadoSociedade = z.infer<typeof EstadoSociedade>;

export const Situacao = z.enum(["EM_DIA", "INADIMPLENTE"]);
export type Situacao = z.infer<typeof Situacao>;

export const StatusMensalidade = z.enum(["PAGA", "EM_ABERTO", "ATRASADA"]);
export type StatusMensalidade = z.infer<typeof StatusMensalidade>;

export const FormaPagamento = z.enum(["PIX", "DINHEIRO"]);
export type FormaPagamento = z.infer<typeof FormaPagamento>;

export const Papel = z.enum(["DIRETOR"]);
export type Papel = z.infer<typeof Papel>;

/**
 * Corpo de toda resposta de erro (4xx/5xx).
 * `campos` só aparece em DADOS_INVALIDOS (422): nome do campo → mensagem.
 */
export const ErroApi = z.object({
  codigo: z.enum([
    "DADOS_INVALIDOS",
    "CREDENCIAIS_INVALIDAS",
    "NAO_AUTENTICADO",
    "SEM_PERMISSAO",
    "NAO_ENCONTRADO",
    "CPF_JA_CADASTRADO",
    "EMAIL_JA_CADASTRADO",
    "SOCIEDADE_JA_EXISTE",
    "TRANSICAO_INVALIDA",
    "MENSALIDADE_JA_PAGA",
    "MENSALIDADE_NAO_PAGA",
    "MUITAS_TENTATIVAS",
    "ERRO_INTERNO",
  ]),
  mensagem: z.string(),
  campos: z.record(z.string(), z.string()).optional(),
});
export type ErroApi = z.infer<typeof ErroApi>;
export type CodigoErro = ErroApi["codigo"];

export function paginado<T extends z.ZodType>(item: T) {
  return z.object({
    itens: z.array(item),
    pagina: z.number().int().min(1),
    tamanhoPagina: z.number().int().min(1),
    totalItens: z.number().int().nonnegative(),
    totalPaginas: z.number().int().nonnegative(),
  });
}
