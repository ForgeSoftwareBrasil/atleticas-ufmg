import Image from "next/image";
import type { Marca } from "../ui/Cabecalho";
import estilos from "./Carteirinha.module.scss";

export interface Carimbo {
  texto: string;
  tom: "inadimplente" | "pendente" | "neutro";
}

interface Props {
  marca: Marca;
  nome: string;
  dados: { rotulo: string; valor: string }[];
  carimbo?: Carimbo;
  /** Anima a entrada (usado uma única vez, na área do sócio). */
  animada?: boolean;
  /** Versão de exemplo, como na página inicial. */
  exemplo?: boolean;
}

/**
 * A carteirinha de sócio desenhada como um cartão físico (proporção ID-1, 85,6 × 54 mm).
 * É o elemento de identidade do sistema: a situação do sócio aparece nela como um carimbo.
 */
export function Carteirinha({ marca, nome, dados, carimbo, animada, exemplo }: Props) {
  return (
    <figure
      className={estilos.moldura}
      aria-label={`Carteirinha de sócio de ${nome}${carimbo ? `: ${carimbo.texto}` : ""}`}
    >
      <div
        className={[estilos.carteirinha, animada && estilos.animada, exemplo && estilos.exemplo]
          .filter(Boolean)
          .join(" ")}
      >
        <div className={estilos.disco} aria-hidden="true" />
        <Image src={marca.escudo} alt="" className={estilos.escudo} sizes="(max-width: 40rem) 60vw, 280px" />

        <div className={estilos.topo}>
          <span className={estilos.atletica}>{marca.nome}</span>
          <span className={estilos.instituicao}>{marca.instituicao}</span>
        </div>

        <div className={estilos.corpo}>
          <span className={estilos.tipo}>Sócio</span>
          <span className={estilos.nome}>{nome}</span>
        </div>

        <dl className={estilos.dados}>
          {dados.map((d) => (
            <div key={d.rotulo}>
              <dt>{d.rotulo}</dt>
              <dd>{d.valor}</dd>
            </div>
          ))}
        </dl>

        {carimbo && (
          <span className={`${estilos.carimbo} ${estilos[carimbo.tom]}`} aria-hidden="true">
            {carimbo.texto}
          </span>
        )}
      </div>
    </figure>
  );
}
