import { z } from "zod";
import { DataHora } from "./comum";

/** POST /v1/auth/sessoes — corpo. */
export const Credenciais = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Email inválido")),
  senha: z.string().min(1, "Informe sua senha"),
});
export type Credenciais = z.infer<typeof Credenciais>;

/** POST /v1/auth/renovacoes — corpo. */
export const PedidoRenovacao = z.object({ tokenRenovacao: z.string().min(1) });

/**
 * Resposta de login e de renovação.
 * `tokenAcesso` é curto (~15 min); `tokenRenovacao` dura 7 dias e é rotacionado a cada renovação.
 */
export const Tokens = z.object({
  tokenAcesso: z.string(),
  tokenRenovacao: z.string(),
  expiraEm: DataHora,
});
export type Tokens = z.infer<typeof Tokens>;
