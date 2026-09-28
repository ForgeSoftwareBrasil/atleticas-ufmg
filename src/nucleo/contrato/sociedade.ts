import { z } from "zod";
import {
  Centavos,
  Competencia,
  Data,
  DataHora,
  EstadoSociedade,
  FormaPagamento,
  Id,
  Situacao,
  StatusMensalidade,
  paginado,
} from "./comum";
import { Usuario, UsuarioResumo } from "./usuario";
import { hojeIso } from "../formatos/datas";

export const Pagamento = z.object({
  dataPagamento: Data,
  formaPagamento: FormaPagamento,
  observacao: z.string().nullable(),
  registradoPor: z.object({ id: Id, nomeCompleto: z.string() }),
  registradoEm: DataHora,
});
export type Pagamento = z.infer<typeof Pagamento>;

/**
 * `status` é calculado pela API: PAGA se há pagamento; senão ATRASADA se hoje (America/Sao_Paulo)
 * é posterior ao vencimento; senão EM_ABERTO.
 */
export const Mensalidade = z.object({
  id: Id,
  competencia: Competencia,
  valor: Centavos,
  vencimento: Data,
  status: StatusMensalidade,
  pagamento: Pagamento.nullable(),
});
export type Mensalidade = z.infer<typeof Mensalidade>;

const camposSociedade = {
  id: Id,
  atleticaId: Id,
  estado: EstadoSociedade,
  /** Só existe para sociedades ATIVAS; null nos demais estados. */
  situacao: Situacao.nullable(),
  solicitadaEm: DataHora,
  /** Data da ativação; null enquanto PENDENTE ou se recusada. */
  socioDesde: Data.nullable(),
  encerradaEm: DataHora.nullable(),
  /** Quantidade de mensalidades com status ATRASADA. */
  mensalidadesEmAtraso: z.number().int().nonnegative(),
  /** Soma dos valores das mensalidades ATRASADAS. */
  valorEmAtraso: Centavos,
};

/** Item da listagem da diretoria. */
export const SociedadeResumo = z.object({ ...camposSociedade, usuario: UsuarioResumo });
export type SociedadeResumo = z.infer<typeof SociedadeResumo>;

/** Detalhe da sociedade (para o próprio sócio ou para a diretoria), com mensalidades da mais recente para a mais antiga. */
export const SociedadeDetalhe = z.object({
  ...camposSociedade,
  usuario: Usuario,
  mensalidades: z.array(Mensalidade),
});
export type SociedadeDetalhe = z.infer<typeof SociedadeDetalhe>;

export const PaginaSociedades = paginado(SociedadeResumo);
export type PaginaSociedades = z.infer<typeof PaginaSociedades>;

/** GET /v1/atleticas/{atleticaId}/sociedades/resumo */
export const ResumoDiretoria = z.object({
  ativas: z.number().int().nonnegative(),
  emDia: z.number().int().nonnegative(),
  inadimplentes: z.number().int().nonnegative(),
  pendentes: z.number().int().nonnegative(),
  valorEmAtraso: Centavos,
});
export type ResumoDiretoria = z.infer<typeof ResumoDiretoria>;

export const OrdenarSociedadesPor = z.enum(["nome", "socioDesde", "mensalidadesEmAtraso", "solicitadaEm"]);

/** Query string de GET /v1/atleticas/{atleticaId}/sociedades (e da exportação CSV). */
export const FiltrosSociedades = z.object({
  pagina: z.coerce.number().int().min(1).catch(1),
  tamanhoPagina: z.coerce.number().int().min(1).max(100).catch(20),
  /** Busca por nome, CPF (só dígitos ou formatado) ou email. */
  busca: z.string().trim().max(100).optional().catch(undefined),
  estado: EstadoSociedade.optional().catch(undefined),
  situacao: Situacao.optional().catch(undefined),
  ordenarPor: OrdenarSociedadesPor.catch("nome"),
  ordem: z.enum(["asc", "desc"]).catch("asc"),
});
export type FiltrosSociedades = z.infer<typeof FiltrosSociedades>;

const dadosPagamento = {
  dataPagamento: Data.refine((v) => v <= hojeIso(), "A data do pagamento não pode ser futura"),
  formaPagamento: FormaPagamento,
  observacao: z.string().trim().max(280, "Use no máximo 280 caracteres").optional(),
};

/** POST .../sociedades/{sociedadeId}/pagamentos — registra pagamento de uma ou mais mensalidades. */
export const RegistroPagamento = z.object({
  mensalidadeIds: z.array(Id).min(1, "Selecione ao menos uma mensalidade"),
  ...dadosPagamento,
});
export type RegistroPagamento = z.infer<typeof RegistroPagamento>;

/** POST .../sociedades/{sociedadeId}/ativacao — ativa a sociedade e registra o pagamento da 1ª mensalidade. */
export const Ativacao = z.object(dadosPagamento);
export type Ativacao = z.infer<typeof Ativacao>;

/** POST .../sociedades/{sociedadeId}/encerramento */
export const Encerramento = z.object({
  motivo: z.string().trim().max(280).optional(),
});
export type Encerramento = z.infer<typeof Encerramento>;
