import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { identidade } from "@/atletica/config";
import { usuarioAtual } from "@/nucleo/auth/sessao";
import { FormularioCadastro } from "./FormularioCadastro";
import estilos from "../conta.module.scss";

export const metadata: Metadata = { title: "Cadastro" };

export default async function Cadastro() {
  if (await usuarioAtual()) redirect("/minha-sociedade");

  return (
    <div className={estilos.cartao}>
      <h1 className={estilos.titulo}>Crie sua conta</h1>
      <p className={estilos.introducao}>
        Com a conta você acompanha sua sociedade com a {identidade.nome} e suas mensalidades.
      </p>
      <FormularioCadastro nomeAtletica={identidade.nome} />
      <p className={estilos.rodapeFormulario}>
        Já tem conta? <Link href="/entrar">Entrar</Link>
      </p>
    </div>
  );
}
