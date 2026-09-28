import type { Mensalidade } from "../contrato";
import { formatarCompetencia, formatarData } from "../formatos/datas";
import { formatarMoeda } from "../formatos/moeda";
import { Selo } from "../ui/Selo";
import { ROTULO_FORMA, ROTULO_MENSALIDADE } from "./rotulos";
import estilos from "./tabela.module.scss";

export function HistoricoMensalidades({ mensalidades }: { mensalidades: Mensalidade[] }) {
  if (!mensalidades.length) {
    return (
      <p className={estilos.vazio}>As mensalidades aparecem aqui depois que a diretoria confirmar sua sociedade.</p>
    );
  }
  return (
    <div className={estilos.rolagem}>
      <table className={estilos.tabela}>
        <caption className="visualmente-oculto">Histórico de mensalidades, da mais recente para a mais antiga</caption>
        <thead>
          <tr>
            <th scope="col">Competência</th>
            <th scope="col">Vencimento</th>
            <th scope="col" className={estilos.numero}>
              Valor
            </th>
            <th scope="col">Situação</th>
            <th scope="col">Pagamento</th>
          </tr>
        </thead>
        <tbody>
          {mensalidades.map((m) => (
            <tr key={m.id}>
              <th scope="row">{formatarCompetencia(m.competencia)}</th>
              <td>{formatarData(m.vencimento)}</td>
              <td className={estilos.numero}>{formatarMoeda(m.valor)}</td>
              <td>
                <Selo tom={ROTULO_MENSALIDADE[m.status].tom}>{ROTULO_MENSALIDADE[m.status].texto}</Selo>
              </td>
              <td className={estilos.suave}>
                {m.pagamento
                  ? `${formatarData(m.pagamento.dataPagamento)} via ${ROTULO_FORMA[m.pagamento.formaPagamento]}`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
