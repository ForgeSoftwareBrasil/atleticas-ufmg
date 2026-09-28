import { identidade } from "@/atletica/config";
import { api } from "@/nucleo/api/cliente";
import { formatarMoeda, formatarMoedaCurta } from "@/nucleo/formatos/moeda";
import { usuarioAtual } from "@/nucleo/auth/sessao";
import { LinkBotao } from "@/nucleo/ui/Botao";
import { Carteirinha } from "@/nucleo/socios/Carteirinha";
import estilos from "./page.module.scss";

export default async function Inicio() {
  const [atletica, usuario] = await Promise.all([api.atletica(), usuarioAtual()]);
  const valor = formatarMoedaCurta(atletica.valorMensalidade);

  return (
    <>
      <section className={estilos.capa} aria-labelledby="titulo-capa">
        <div className={estilos.capaInterno}>
          <div className={estilos.chamada}>
            <h1 id="titulo-capa" className={estilos.titulo}>
              Seja sócio da {identidade.nome}
            </h1>
            <p className={estilos.subtitulo}>
              Com {valor} por mês você treina em todas as modalidades da {identidade.sigla} e paga menos nos produtos da
              atlética.
            </p>
            <div className={estilos.botoes}>
              {usuario ? (
                <LinkBotao href="/minha-sociedade" variante="destaque">
                  Ver minha sociedade
                </LinkBotao>
              ) : (
                <>
                  <LinkBotao href="/cadastro" variante="destaque">
                    Quero ser sócio
                  </LinkBotao>
                  <LinkBotao href="/entrar" variante="claro">
                    Já sou sócio
                  </LinkBotao>
                </>
              )}
            </div>
          </div>

          <div className={estilos.vitrine}>
            <Carteirinha
              exemplo
              marca={identidade}
              nome="Seu nome aqui"
              dados={[
                { rotulo: "Mensalidade", valor: `${valor} por mês` },
                { rotulo: "Vencimento", valor: `todo dia ${atletica.diaVencimento}` },
              ]}
            />
          </div>
        </div>
      </section>

      <div className={estilos.detalhes}>
        <section aria-labelledby="titulo-inclui" className={estilos.bloco}>
          <h2 id="titulo-inclui" className={estilos.tituloBloco}>
            O que a sociedade inclui
          </h2>
          <dl className={estilos.beneficios}>
            <div>
              <dt>Todas as modalidades</dt>
              <dd>
                Treine e dispute campeonatos em qualquer modalidade oferecida pela {identidade.sigla}, sem taxa extra
                por modalidade.
              </dd>
            </div>
            <div>
              <dt>Desconto nos produtos</dt>
              <dd>Camisas, agasalhos e demais produtos da atlética saem mais baratos para sócios em dia.</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="titulo-como" className={estilos.bloco}>
          <h2 id="titulo-como" className={estilos.tituloBloco}>
            Como virar sócio
          </h2>
          <ol className={estilos.passos}>
            <li>
              <strong>Crie sua conta</strong>
              <span>Nome completo, CPF, email, telefone e data de nascimento.</span>
            </li>
            <li>
              <strong>Pague a primeira mensalidade</strong>
              <span>
                Um PIX de {formatarMoeda(atletica.valorMensalidade)} para a chave da atlética, que aparece depois do
                cadastro.
              </span>
            </li>
            <li>
              <strong>A diretoria confirma</strong>
              <span>Com o pagamento registrado, sua carteirinha fica ativa e você já pode treinar.</span>
            </li>
          </ol>
        </section>
      </div>
    </>
  );
}
