import type { Atletica, SociedadeDetalhe } from "../contrato";
import { formatarCompetenciaLonga } from "../formatos/datas";
import { formatarMoeda } from "../formatos/moeda";
import { LinkBotao } from "../ui/Botao";
import { CopiarTexto } from "../ui/CopiarTexto";
import { listarNatural } from "./rotulos";
import estilos from "./AvisoInadimplencia.module.scss";

/**
 * Aviso exibido ao sócio inadimplente. Substitui, por enquanto, a cobrança por email:
 * diz exatamente quais competências faltam, quanto é, e como regularizar.
 */
export function AvisoInadimplencia({ sociedade, atletica }: { sociedade: SociedadeDetalhe; atletica: Atletica }) {
  const atrasadas = sociedade.mensalidades
    .filter((m) => m.status === "ATRASADA")
    .sort((a, b) => a.competencia.localeCompare(b.competencia));
  const competencias = listarNatural(atrasadas.map((m) => formatarCompetenciaLonga(m.competencia)));
  const quantidade = atrasadas.length;

  const mensagemWhatsapp = encodeURIComponent(
    `Olá! Sou ${sociedade.usuario.nomeCompleto} e fiz o pagamento da mensalidade de ${competencias}. Segue o comprovante.`,
  );

  return (
    <section className={estilos.aviso} aria-labelledby="aviso-atraso-titulo">
      <h2 id="aviso-atraso-titulo" className={estilos.titulo}>
        {quantidade === 1 ? "Sua mensalidade está atrasada" : `Você tem ${quantidade} mensalidades atrasadas`}
      </h2>
      <p className={estilos.texto}>
        Falta pagar {competencias}, no total de <strong>{formatarMoeda(sociedade.valorEmAtraso)}</strong>. Faça um PIX
        para a atlética e mande o comprovante para a diretoria. Assim que o pagamento for registrado, este aviso some.
      </p>
      <div className={estilos.acoes}>
        <div className={estilos.pix}>
          <span className={estilos.rotuloPix}>Chave PIX</span>
          <code className={estilos.chave}>{atletica.chavePix}</code>
        </div>
        <CopiarTexto
          texto={atletica.chavePix}
          rotulo="Copiar chave PIX"
          rotuloCopiado="Chave copiada"
          variante="primario"
        />
        <LinkBotao
          variante="secundario"
          pequeno
          href={`https://wa.me/${atletica.whatsappDiretoria}?text=${mensagemWhatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Enviar comprovante pelo WhatsApp
        </LinkBotao>
      </div>
    </section>
  );
}
