const formatador = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Valores trafegam em centavos (inteiro). 6000 → "R$ 60,00" */
export function formatarMoeda(centavos: number): string {
  return formatador.format(centavos / 100);
}

/** 6000 → "R$ 60" quando não há centavos; útil em textos corridos. */
export function formatarMoedaCurta(centavos: number): string {
  if (centavos % 100 !== 0) return formatarMoeda(centavos);
  return `R$ ${(centavos / 100).toLocaleString("pt-BR")}`;
}
