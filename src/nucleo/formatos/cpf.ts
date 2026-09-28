export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

/** Valida os dígitos verificadores de um CPF (recebe só dígitos). */
export function cpfValido(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digitos = cpf.split("").map(Number);
  const verificador = (quantidade: number) => {
    const soma = digitos.slice(0, quantidade).reduce((acc, d, i) => acc + d * (quantidade + 1 - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return verificador(9) === digitos[9] && verificador(10) === digitos[10];
}

/** 12345678901 → 123.456.789-01 */
export function formatarCpf(cpf: string): string {
  const d = somenteDigitos(cpf);
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** 12345678901 → ***.456.789-** */
export function mascararCpf(cpf: string): string {
  const d = somenteDigitos(cpf);
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}

/** Aplica a máscara de CPF enquanto o usuário digita. */
export function mascaraDigitacaoCpf(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}
