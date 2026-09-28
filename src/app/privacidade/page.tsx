import type { Metadata } from "next";
import { identidade } from "@/atletica/config";
import estilos from "./page.module.scss";

export const metadata: Metadata = { title: "Política de privacidade" };

// Texto-base para o MVP. Deve ser revisado pela diretoria antes da publicação.
export default function Privacidade() {
  return (
    <article className={`pagina ${estilos.texto}`}>
      <h1>Política de privacidade</h1>
      <p>
        Esta política explica como a {identidade.nomeOficial} ({identidade.instituicao}) trata os dados pessoais de quem
        cria conta neste site, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
      </p>

      <h2>Quais dados coletamos</h2>
      <p>Nome completo, CPF, email, celular e data de nascimento, informados por você no cadastro.</p>

      <h2>Para que usamos</h2>
      <ul>
        <li>Identificar você como sócio e controlar suas mensalidades.</li>
        <li>Inscrever atletas em campeonatos e competições, quando exigido pela organização do evento.</li>
        <li>Entrar em contato sobre sua sociedade, pagamentos e atividades da atlética.</li>
      </ul>

      <h2>Quem tem acesso</h2>
      <p>
        Somente os diretores da atlética responsáveis pelo controle de sócios. Nas listagens o CPF aparece mascarado; o
        número completo só é exibido quando necessário. Não vendemos nem compartilhamos seus dados para fins comerciais.
      </p>

      <h2>Seus direitos</h2>
      <p>
        Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer momento, falando com a diretoria da
        atlética.
      </p>
    </article>
  );
}
