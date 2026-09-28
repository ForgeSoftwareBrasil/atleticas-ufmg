import escudo from "./escudo.png";

/**
 * O que é específico da Hermes (FACE UFMG): identidade e textos.
 * Valores de negócio (mensalidade, vencimento, PIX) vêm da API — ver GET /atleticas/{id}.
 */
export const identidade = {
  nome: "Hermes",
  sigla: "FACE",
  instituicao: "FACE UFMG",
  nomeOficial: "Associação Atlética Acadêmica Hermes",
  descricaoInstituicao: "Faculdade de Ciências Econômicas da UFMG",
  escudo,
  escudoAlt: "Escudo da Associação Atlética Acadêmica Hermes, FACE UFMG: Hermes de perfil com elmo alado e caduceu",
};
