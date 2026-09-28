/** Fuso de referência para vencimentos e competências. */
export const FUSO = "America/Sao_Paulo";

/** Data de hoje (YYYY-MM-DD) no fuso de São Paulo. */
export function hojeIso(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}

/** Competência (YYYY-MM) de uma data ISO. */
export function competenciaDe(dataIso: string): string {
  return dataIso.slice(0, 7);
}

/** Soma meses a uma competência: ("2026-01", -2) → "2025-11". */
export function somarMeses(competencia: string, meses: number): string {
  const [ano, mes] = competencia.split("-").map(Number);
  const total = ano * 12 + (mes - 1) + meses;
  const novoAno = Math.floor(total / 12);
  const novoMes = (total % 12) + 1;
  return `${novoAno}-${String(novoMes).padStart(2, "0")}`;
}

const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_LONGOS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** "2026-08" → "ago/2026" */
export function formatarCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split("-").map(Number);
  return `${MESES_CURTOS[mes - 1]}/${ano}`;
}

/** "2026-08" → "agosto de 2026" */
export function formatarCompetenciaLonga(competencia: string): string {
  const [ano, mes] = competencia.split("-").map(Number);
  return `${MESES_LONGOS[mes - 1]} de ${ano}`;
}

/** "2026-08-10" → "10/08/2026" */
export function formatarData(dataIso: string): string {
  const [ano, mes, dia] = dataIso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

/** "2026-09-27T14:03:00-03:00" → "27/09/2026 às 14:03" */
export function formatarDataHora(dataHoraIso: string): string {
  const data = new Date(dataHoraIso);
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(data);
  const p = Object.fromEntries(partes.map((x) => [x.type, x.value]));
  return `${p.day}/${p.month}/${p.year} às ${p.hour}:${p.minute}`;
}

/** Idade completa em anos numa data de referência (ambas ISO). */
export function idadeEm(dataNascimento: string, referencia: string): number {
  const [an, mn, dn] = dataNascimento.split("-").map(Number);
  const [ar, mr, dr] = referencia.split("-").map(Number);
  let idade = ar - an;
  if (mr < mn || (mr === mn && dr < dn)) idade -= 1;
  return idade;
}
