import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Hanken_Grotesk } from "next/font/google";
import "@/nucleo/ui/base.scss";
import "@/atletica/tema.scss";
import { identidade } from "@/atletica/config";
import { sair } from "@/nucleo/auth/acoes";
import { usuarioAtual } from "@/nucleo/auth/sessao";
import { Cabecalho } from "@/nucleo/ui/Cabecalho";
import { Rodape } from "./_componentes/Rodape";

const fonteTitulo = Big_Shoulders({
  subsets: ["latin"],
  variable: "--fonte-titulo",
  axes: ["opsz"],
  adjustFontFallback: false,
  display: "swap",
});

const fonteTexto = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--fonte-texto",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `Sócios da ${identidade.nome} | ${identidade.instituicao}`,
    template: `%s | ${identidade.nome} ${identidade.sigla}`,
  },
  description: `Área de sócios da ${identidade.nomeOficial}, da ${identidade.descricaoInstituicao}.`,
};

export const viewport: Viewport = {
  themeColor: "#0c1a3f",
};

export default async function LayoutRaiz({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioAtual();

  return (
    <html lang="pt-BR" className={`${fonteTitulo.variable} ${fonteTexto.variable}`}>
      <body>
        <a href="#conteudo" className="pular-para-conteudo">
          Pular para o conteúdo
        </a>
        <Cabecalho
          marca={identidade}
          usuario={
            usuario ? { primeiroNome: usuario.eu.nomeCompleto.split(" ")[0], ehDiretor: usuario.ehDiretor } : null
          }
          acaoSair={sair}
        />
        <main id="conteudo">{children}</main>
        <Rodape />
      </body>
    </html>
  );
}
