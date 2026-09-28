import { z } from "zod";
import { Centavos, Id } from "./comum";

/** GET /v1/atleticas/{atleticaId} — configuração pública da atlética. */
export const Atletica = z.object({
  id: Id,
  nome: z.string(),
  apelido: z.string(),
  valorMensalidade: Centavos,
  /** Dia do mês em que vencem as mensalidades (1–28, para existir em todo mês). */
  diaVencimento: z.number().int().min(1).max(28),
  chavePix: z.string(),
  /** WhatsApp da diretoria, só dígitos com DDI: "5531999998888". */
  whatsappDiretoria: z.string().regex(/^\d{12,13}$/),
});
export type Atletica = z.infer<typeof Atletica>;
