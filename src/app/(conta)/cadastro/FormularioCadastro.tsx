"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { cadastrar, type EstadoFormulario } from "@/nucleo/auth/acoes";
import { NovoUsuario } from "@/nucleo/contrato";
import { mascaraDigitacaoCpf } from "@/nucleo/formatos/cpf";
import { hojeIso } from "@/nucleo/formatos/datas";
import { mascaraDigitacaoTelefone } from "@/nucleo/formatos/telefone";
import { Aviso } from "@/nucleo/ui/Aviso";
import { Botao } from "@/nucleo/ui/Botao";
import { Campo, Escolha } from "@/nucleo/ui/Campo";
import estilos from "../conta.module.scss";

type CampoValidavel = "nomeCompleto" | "cpf" | "email" | "telefone" | "dataNascimento" | "senha";

/** Valida um campo isolado com o mesmo schema do contrato, ao sair do campo. */
function validarCampo(campo: CampoValidavel, valor: string): string | undefined {
  const r = NovoUsuario.shape[campo].safeParse(valor);
  return r.success ? undefined : r.error.issues[0]?.message;
}

export function FormularioCadastro({ nomeAtletica }: { nomeAtletica: string }) {
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(cadastrar, {});
  const [errosLocais, setErrosLocais] = useState<Record<string, string | undefined>>({});
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [ultimoEstado, setUltimoEstado] = useState(estado);

  // Quando o servidor responde, os erros dele passam a valer e os valores voltam aos campos mascarados.
  if (estado !== ultimoEstado) {
    setUltimoEstado(estado);
    setErrosLocais({});
    if (estado.valores?.cpf !== undefined) setCpf(mascaraDigitacaoCpf(estado.valores.cpf));
    if (estado.valores?.telefone !== undefined) setTelefone(mascaraDigitacaoTelefone(estado.valores.telefone));
  }

  const erro = (campo: string) => errosLocais[campo] ?? estado.campos?.[campo];
  const aoSair = (campo: CampoValidavel) => (e: React.FocusEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    setErrosLocais((atual) => ({ ...atual, [campo]: validarCampo(campo, e.target.value) }));
  };
  const v = estado.valores;

  return (
    <form action={acao} className={estilos.formulario} noValidate>
      {estado.erro && <Aviso tom="erro" titulo={estado.erro} role="alert" />}
      {estado.campos && Object.keys(estado.campos).length > 0 && (
        <Aviso tom="erro" titulo="Revise os campos destacados abaixo." role="alert" />
      )}

      <Campo
        id="nomeCompleto"
        rotulo="Nome completo"
        autoComplete="name"
        required
        defaultValue={v?.nomeCompleto}
        erro={erro("nomeCompleto")}
        onBlur={aoSair("nomeCompleto")}
      />
      <div className={estilos.linha}>
        <Campo
          id="cpf"
          rotulo="CPF"
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
          required
          value={cpf}
          onChange={(e) => setCpf(mascaraDigitacaoCpf(e.target.value))}
          erro={erro("cpf")}
          onBlur={aoSair("cpf")}
        />
        <Campo
          id="dataNascimento"
          rotulo="Data de nascimento"
          type="date"
          autoComplete="bday"
          max={hojeIso()}
          required
          defaultValue={v?.dataNascimento}
          erro={erro("dataNascimento")}
          onBlur={aoSair("dataNascimento")}
        />
      </div>
      <div className={estilos.linha}>
        <Campo
          id="email"
          rotulo="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={v?.email}
          erro={erro("email")}
          onBlur={aoSair("email")}
        />
        <Campo
          id="telefone"
          rotulo="Celular"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(31) 98765-4321"
          required
          value={telefone}
          onChange={(e) => setTelefone(mascaraDigitacaoTelefone(e.target.value))}
          erro={erro("telefone")}
          onBlur={aoSair("telefone")}
        />
      </div>
      <div className={estilos.linha}>
        <Campo
          id="senha"
          rotulo="Senha"
          type="password"
          autoComplete="new-password"
          dica="Mínimo de 8 caracteres, com letras e números."
          required
          erro={erro("senha")}
          onBlur={aoSair("senha")}
        />
        <Campo
          id="confirmacaoSenha"
          rotulo="Confirme a senha"
          type="password"
          autoComplete="new-password"
          required
          erro={erro("confirmacaoSenha")}
        />
      </div>

      <div className={estilos.opcoes}>
        <Escolha
          id="querSerSocio"
          rotulo={
            <>
              <strong>Quero ser sócio da {nomeAtletica}.</strong> Sua sociedade fica pendente até a diretoria confirmar
              o pagamento da primeira mensalidade.
            </>
          }
          defaultChecked={v ? v.querSerSocio === "on" : true}
        />
        <Escolha
          id="aceiteTermos"
          rotulo={
            <>
              Li e aceito a{" "}
              <Link href="/privacidade" target="_blank">
                política de privacidade
              </Link>{" "}
              e o uso dos meus dados pela diretoria da atlética.
            </>
          }
          required
          erro={estado.campos?.aceiteTermos}
        />
      </div>

      <Botao type="submit" largo disabled={enviando}>
        {enviando ? "Criando conta…" : "Criar conta"}
      </Botao>
    </form>
  );
}
