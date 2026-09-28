import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { configApi } from "@/nucleo/api/config";
import { destinoSeguro, usuarioAtual } from "@/nucleo/auth/sessao";
import { SENHA_DEMO } from "@/nucleo/mocks/senha-demo";
import { FormularioEntrar } from "./FormularioEntrar";
import estilos from "../conta.module.scss";

export const metadata: Metadata = { title: "Entrar" };

const ACESSOS_DEMO = [
  { email: "socio.emdia@face.mock", descricao: "Sócio em dia" },
  { email: "socio.atrasado@face.mock", descricao: "Sócio com mensalidade atrasada" },
  { email: "diretor@face.mock", descricao: "Diretora (também sócia)" },
];

export default async function Entrar({ searchParams }: { searchParams: Promise<{ para?: string }> }) {
  const para = destinoSeguro((await searchParams).para);
  const usuario = await usuarioAtual();
  if (usuario) redirect(para ?? (usuario.ehDiretor ? "/diretoria" : "/minha-sociedade"));

  return (
    <div className={estilos.cartao}>
      <h1 className={estilos.titulo}>Entrar</h1>
      <p className={estilos.introducao}>Acesse sua sociedade com o email e a senha do cadastro.</p>

      <FormularioEntrar
        para={para ?? undefined}
        acessosDemo={configApi.mock ? ACESSOS_DEMO.map((a) => ({ ...a, senha: SENHA_DEMO })) : undefined}
      />

      <p className={estilos.rodapeFormulario}>
        Ainda não tem conta? <Link href="/cadastro">Cadastre-se</Link>
      </p>
    </div>
  );
}
