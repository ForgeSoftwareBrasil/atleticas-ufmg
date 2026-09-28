import type { Metadata } from "next";
import { identidade } from "@/atletica/config";
import { api } from "@/nucleo/api/cliente";
import { exigirUsuario } from "@/nucleo/auth/sessao";
import type { Atletica, SociedadeDetalhe } from "@/nucleo/contrato";
import { formatarCpf } from "@/nucleo/formatos/cpf";
import {
  formatarCompetencia,
  formatarCompetenciaLonga,
  formatarData,
  hojeIso,
  competenciaDe,
  somarMeses,
} from "@/nucleo/formatos/datas";
import { formatarMoeda } from "@/nucleo/formatos/moeda";
import { formatarTelefone } from "@/nucleo/formatos/telefone";
import { solicitarSociedade } from "@/nucleo/socios/acoes";
import { AvisoInadimplencia } from "@/nucleo/socios/AvisoInadimplencia";
import { Carteirinha, type Carimbo } from "@/nucleo/socios/Carteirinha";
import { HistoricoMensalidades } from "@/nucleo/socios/HistoricoMensalidades";
import { Botao, LinkBotao } from "@/nucleo/ui/Botao";
import { CopiarTexto } from "@/nucleo/ui/CopiarTexto";
import estilos from "./page.module.scss";

export const metadata: Metadata = { title: "Minha sociedade" };

function carimboDe(s: SociedadeDetalhe): Carimbo | undefined {
  if (s.estado === "PENDENTE") return { texto: "Aguardando confirmação", tom: "pendente" };
  if (s.estado === "ENCERRADA") return { texto: "Sociedade encerrada", tom: "neutro" };
  if (s.situacao === "INADIMPLENTE") return { texto: "Mensalidade em atraso", tom: "inadimplente" };
  return undefined;
}

function dadosDaCarteirinha(s: SociedadeDetalhe) {
  if (s.estado === "PENDENTE") return [{ rotulo: "Solicitada em", valor: formatarData(s.solicitadaEm) }];
  const desde = { rotulo: "Sócio desde", valor: s.socioDesde ? formatarCompetencia(competenciaDe(s.socioDesde)) : "—" };
  if (s.estado === "ENCERRADA") return [desde];
  return [desde, { rotulo: "Situação", valor: s.situacao === "EM_DIA" ? "Em dia" : "Inadimplente" }];
}

export default async function MinhaSociedade() {
  const { token, eu } = await exigirUsuario("/minha-sociedade");
  const [sociedade, atletica] = await Promise.all([api.minhaSociedade(token), api.atletica()]);
  const primeiroNome = eu.nomeCompleto.split(" ")[0];

  return (
    <div className={`pagina ${estilos.pagina}`}>
      {sociedade?.situacao === "INADIMPLENTE" && <AvisoInadimplencia sociedade={sociedade} atletica={atletica} />}

      <header className={estilos.cabeca}>
        <h1 className={estilos.titulo}>Minha sociedade</h1>
        <p className={estilos.saudacao}>Olá, {primeiroNome}.</p>
      </header>

      {!sociedade ? (
        <SemSociedade atletica={atletica} />
      ) : (
        <>
          <div className={estilos.destaque}>
            <Carteirinha
              animada
              marca={identidade}
              nome={sociedade.usuario.nomeCompleto}
              dados={dadosDaCarteirinha(sociedade)}
              carimbo={carimboDe(sociedade)}
            />
            <PainelLateral sociedade={sociedade} atletica={atletica} />
          </div>

          {sociedade.estado !== "PENDENTE" && (
            <section aria-labelledby="titulo-historico" className={estilos.secao}>
              <h2 id="titulo-historico" className={estilos.subtitulo}>
                Histórico de mensalidades
              </h2>
              <HistoricoMensalidades mensalidades={sociedade.mensalidades} />
            </section>
          )}
        </>
      )}

      <section aria-labelledby="titulo-dados" className={estilos.secao}>
        <h2 id="titulo-dados" className={estilos.subtitulo}>
          Meus dados
        </h2>
        <dl className={estilos.dados}>
          <div>
            <dt>Nome completo</dt>
            <dd>{eu.nomeCompleto}</dd>
          </div>
          <div>
            <dt>CPF</dt>
            <dd>{formatarCpf(eu.cpf)}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{eu.email}</dd>
          </div>
          <div>
            <dt>Celular</dt>
            <dd>{formatarTelefone(eu.telefone)}</dd>
          </div>
          <div>
            <dt>Data de nascimento</dt>
            <dd>{formatarData(eu.dataNascimento)}</dd>
          </div>
        </dl>
        <p className={estilos.nota}>Para corrigir algum dado, fale com a diretoria.</p>
      </section>
    </div>
  );
}

function SemSociedade({ atletica }: { atletica: Atletica }) {
  return (
    <section className={estilos.vazio}>
      <h2 className={estilos.subtitulo}>Você ainda não é sócio da {identidade.nome}</h2>
      <p>
        Por {formatarMoeda(atletica.valorMensalidade)} por mês você treina em todas as modalidades e tem desconto nos
        produtos da atlética. Peça sua sociedade e pague a primeira mensalidade para a diretoria confirmar.
      </p>
      <form action={solicitarSociedade}>
        <Botao type="submit">Quero ser sócio</Botao>
      </form>
    </section>
  );
}

function PainelLateral({ sociedade, atletica }: { sociedade: SociedadeDetalhe; atletica: Atletica }) {
  const pix = (
    <div className={estilos.pix}>
      <div>
        <span className={estilos.rotulo}>Chave PIX da atlética</span>
        <code className={estilos.chave}>{atletica.chavePix}</code>
      </div>
      <CopiarTexto texto={atletica.chavePix} rotulo="Copiar chave PIX" rotuloCopiado="Chave copiada" />
    </div>
  );

  if (sociedade.estado === "PENDENTE") {
    return (
      <section className={estilos.painel} aria-labelledby="titulo-painel">
        <h2 id="titulo-painel" className={estilos.painelTitulo}>
          Falta pouco
        </h2>
        <p>
          Faça um PIX de <strong>{formatarMoeda(atletica.valorMensalidade)}</strong> referente à primeira mensalidade e
          envie o comprovante para a diretoria. Quando o pagamento for confirmado, sua sociedade fica ativa.
        </p>
        {pix}
        <LinkBotao
          variante="secundario"
          pequeno
          href={`https://wa.me/${atletica.whatsappDiretoria}?text=${encodeURIComponent(`Olá! Sou ${sociedade.usuario.nomeCompleto}, pedi minha sociedade pelo site e segue o comprovante da primeira mensalidade.`)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Enviar comprovante pelo WhatsApp
        </LinkBotao>
      </section>
    );
  }

  if (sociedade.estado === "ENCERRADA") {
    return (
      <section className={estilos.painel} aria-labelledby="titulo-painel">
        <h2 id="titulo-painel" className={estilos.painelTitulo}>
          Sua sociedade foi encerrada
        </h2>
        <p>
          {sociedade.encerradaEm ? `Ela deixou de valer em ${formatarData(sociedade.encerradaEm)}. ` : ""}
          Se quiser voltar, peça uma nova sociedade. Ela começa pendente até a diretoria confirmar o primeiro pagamento.
        </p>
        <form action={solicitarSociedade}>
          <Botao type="submit">Pedir nova sociedade</Botao>
        </form>
      </section>
    );
  }

  const proximaEmAberto = sociedade.mensalidades
    .filter((m) => m.status === "EM_ABERTO")
    .sort((a, b) => a.competencia.localeCompare(b.competencia))[0];
  const ultima = sociedade.mensalidades[0];
  const proximaCompetencia = ultima ? somarMeses(ultima.competencia, 1) : competenciaDe(hojeIso());
  const vencimentoFuturo = `${proximaCompetencia}-${String(atletica.diaVencimento).padStart(2, "0")}`;

  if (sociedade.situacao === "INADIMPLENTE") {
    return (
      <section className={estilos.painel} aria-labelledby="titulo-painel">
        <h2 id="titulo-painel" className={estilos.painelTitulo}>
          Para ficar em dia
        </h2>
        <p className={estilos.proxima}>
          <span className={estilos.valorGrande}>{formatarMoeda(sociedade.valorEmAtraso)}</span>
          <span>
            {sociedade.mensalidadesEmAtraso === 1
              ? "1 mensalidade atrasada"
              : `${sociedade.mensalidadesEmAtraso} mensalidades atrasadas`}
            {proximaEmAberto
              ? `, mais ${formatarMoeda(proximaEmAberto.valor)} que vence em ${formatarData(proximaEmAberto.vencimento)}`
              : ""}
          </span>
        </p>
        {pix}
      </section>
    );
  }

  return (
    <section className={estilos.painel} aria-labelledby="titulo-painel">
      <h2 id="titulo-painel" className={estilos.painelTitulo}>
        Próxima mensalidade
      </h2>
      {proximaEmAberto ? (
        <p className={estilos.proxima}>
          <span className={estilos.valorGrande}>{formatarMoeda(proximaEmAberto.valor)}</span>
          <span>
            {formatarCompetenciaLonga(proximaEmAberto.competencia)}, vence em {formatarData(proximaEmAberto.vencimento)}
          </span>
        </p>
      ) : (
        <p className={estilos.proxima}>
          <span className={estilos.valorGrande}>{formatarMoeda(atletica.valorMensalidade)}</span>
          <span>
            {formatarCompetenciaLonga(proximaCompetencia)}, vence em {formatarData(vencimentoFuturo)}. Tudo pago até
            aqui.
          </span>
        </p>
      )}
      {pix}
    </section>
  );
}
