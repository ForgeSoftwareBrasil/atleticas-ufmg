import Link from "next/link";
import type { ResumoDiretoria } from "../../contrato";
import { formatarMoeda } from "../../formatos/moeda";
import estilos from "./diretoria.module.scss";

/** Faixa de números da atlética. Cada número leva à lista filtrada correspondente. */
export function Resumo({ resumo, base }: { resumo: ResumoDiretoria; base: string }) {
  return (
    <dl className={estilos.resumo}>
      <div>
        <dt>Sócios ativos</dt>
        <dd>
          <Link href={`${base}?estado=ATIVA`}>{resumo.ativas}</Link>
        </dd>
      </div>
      <div>
        <dt>Em dia</dt>
        <dd className={estilos.numeroEmDia}>
          <Link href={`${base}?situacao=EM_DIA`}>{resumo.emDia}</Link>
        </dd>
      </div>
      <div>
        <dt>Inadimplentes</dt>
        <dd className={estilos.numeroInadimplente}>
          <Link href={`${base}?situacao=INADIMPLENTE`}>{resumo.inadimplentes}</Link>
        </dd>
      </div>
      <div>
        <dt>Total em atraso</dt>
        <dd>{formatarMoeda(resumo.valorEmAtraso)}</dd>
      </div>
    </dl>
  );
}
