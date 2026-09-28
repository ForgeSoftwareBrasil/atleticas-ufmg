import { z } from "zod";
import { Data, DataHora, Id, Papel } from "./comum";
import { cpfValido, somenteDigitos } from "../formatos/cpf";
import { celularValido } from "../formatos/telefone";
import { hojeIso, idadeEm } from "../formatos/datas";

export const IDADE_MINIMA = 16;

/** POST /v1/usuarios — corpo. CPF e telefone trafegam só com dígitos. */
export const NovoUsuario = z.object({
  nomeCompleto: z
    .string()
    .trim()
    .min(5, "Informe seu nome completo")
    .max(120, "Use no máximo 120 caracteres")
    .refine((v) => v.split(/\s+/).length >= 2, "Informe nome e sobrenome"),
  cpf: z.string().transform(somenteDigitos).refine(cpfValido, "CPF inválido"),
  email: z.string().trim().toLowerCase().pipe(z.email("Email inválido")),
  telefone: z
    .string()
    .transform(somenteDigitos)
    .refine(celularValido, "Informe um celular com DDD, ex.: (31) 98765-4321"),
  dataNascimento: Data.refine((v) => v >= "1900-01-01" && v <= hojeIso(), "Data de nascimento inválida").refine(
    (v) => idadeEm(v, hojeIso()) >= IDADE_MINIMA,
    `É preciso ter pelo menos ${IDADE_MINIMA} anos`,
  ),
  senha: z
    .string()
    .min(8, "A senha precisa de pelo menos 8 caracteres")
    .max(72, "Use no máximo 72 caracteres")
    .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Use letras e números na senha"),
  aceiteTermos: z.literal(true, "É preciso aceitar os termos de uso e a política de privacidade"),
});
export type NovoUsuario = z.infer<typeof NovoUsuario>;

/** Usuário com dados completos. CPF e telefone só com dígitos. */
export const Usuario = z.object({
  id: Id,
  nomeCompleto: z.string(),
  cpf: z.string().regex(/^\d{11}$/),
  email: z.string(),
  telefone: z.string().regex(/^\d{10,11}$/),
  dataNascimento: Data,
  criadoEm: DataHora,
});
export type Usuario = z.infer<typeof Usuario>;

/** Usuário como aparece em listagens: CPF mascarado ("***.456.789-**"). */
export const UsuarioResumo = Usuario.omit({ cpf: true, criadoEm: true }).extend({
  cpfMascarado: z.string(),
});
export type UsuarioResumo = z.infer<typeof UsuarioResumo>;

/** GET /v1/usuarios/eu — usuário autenticado e seus papéis por atlética. */
export const Eu = Usuario.extend({
  papeis: z.array(z.object({ atleticaId: Id, papel: Papel })),
});
export type Eu = z.infer<typeof Eu>;
