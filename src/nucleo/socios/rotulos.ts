import type { EstadoSociedade, FormaPagamento, Situacao, StatusMensalidade } from "../contrato";
import type { TomSelo } from "../ui/Selo";

export const ROTULO_SITUACAO: Record<Situacao, { texto: string; tom: TomSelo }> = {
  EM_DIA: { texto: "Em dia", tom: "em-dia" },
  INADIMPLENTE: { texto: "Inadimplente", tom: "inadimplente" },
};

export const ROTULO_ESTADO: Record<EstadoSociedade, { texto: string; tom: TomSelo }> = {
  PENDENTE: { texto: "Pendente", tom: "pendente" },
  ATIVA: { texto: "Ativa", tom: "neutro" },
  ENCERRADA: { texto: "Encerrada", tom: "neutro" },
};

export const ROTULO_MENSALIDADE: Record<StatusMensalidade, { texto: string; tom: TomSelo }> = {
  PAGA: { texto: "Paga", tom: "em-dia" },
  EM_ABERTO: { texto: "Em aberto", tom: "neutro" },
  ATRASADA: { texto: "Atrasada", tom: "inadimplente" },
};

export const ROTULO_FORMA: Record<FormaPagamento, string> = {
  PIX: "PIX",
  DINHEIRO: "dinheiro",
};

/** ["jul/2026", "ago/2026"] → "jul/2026 e ago/2026" */
export function listarNatural(itens: string[]): string {
  if (itens.length <= 1) return itens.join("");
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}
