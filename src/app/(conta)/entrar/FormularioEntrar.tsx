"use client";

import { useActionState, useRef } from "react";
import { entrar, type EstadoFormulario } from "@/nucleo/auth/acoes";
import { Aviso } from "@/nucleo/ui/Aviso";
import { Botao } from "@/nucleo/ui/Botao";
import { Campo } from "@/nucleo/ui/Campo";
import estilos from "../conta.module.scss";

interface AcessoDemo {
  email: string;
  senha: string;
  descricao: string;
}

export function FormularioEntrar({ para, acessosDemo }: { para?: string; acessosDemo?: AcessoDemo[] }) {
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(entrar, {});
  const formulario = useRef<HTMLFormElement>(null);

  function usarAcesso(acesso: AcessoDemo) {
    const form = formulario.current;
    if (!form) return;
    (form.elements.namedItem("email") as HTMLInputElement).value = acesso.email;
    (form.elements.namedItem("senha") as HTMLInputElement).value = acesso.senha;
    form.requestSubmit();
  }

  return (
    <>
      <form ref={formulario} action={acao} className={estilos.formulario} noValidate>
        {estado.erro && <Aviso tom="erro" titulo={estado.erro} role="alert" />}
        {para && <input type="hidden" name="para" value={para} />}
        <Campo
          id="email"
          rotulo="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={estado.valores?.email}
          erro={estado.campos?.email}
        />
        <Campo
          id="senha"
          rotulo="Senha"
          type="password"
          autoComplete="current-password"
          required
          erro={estado.campos?.senha}
        />
        <Botao type="submit" largo disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </Botao>
      </form>

      {acessosDemo && (
        <section className={estilos.demo} aria-labelledby="demo-titulo">
          <p id="demo-titulo" className={estilos.demoTitulo}>
            Acessos de demonstração (senha {acessosDemo[0].senha})
          </p>
          <ul className={estilos.demoLista}>
            {acessosDemo.map((a) => (
              <li key={a.email}>
                <span>
                  {a.descricao}
                  <small>{a.email}</small>
                </span>
                <Botao variante="secundario" pequeno disabled={enviando} onClick={() => usarAcesso(a)}>
                  Entrar como este
                </Botao>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
