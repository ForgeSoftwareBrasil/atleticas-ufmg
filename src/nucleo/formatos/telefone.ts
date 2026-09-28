import { somenteDigitos } from "./cpf";

/** Celular brasileiro: DDD (11–99) + 9 + 8 dígitos, só dígitos. */
export function celularValido(telefone: string): boolean {
  return /^[1-9][1-9]9\d{8}$/.test(telefone);
}

/** 31987654321 → (31) 98765-4321 */
export function formatarTelefone(telefone: string): string {
  const d = somenteDigitos(telefone);
  if (d.length !== 11) return telefone;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function mascaraDigitacaoTelefone(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
