import { hojeIso } from "../../formatos/datas";
import { Campo, CampoSelecao, CampoTextoLongo } from "../../ui/Campo";
import estilos from "./diretoria.module.scss";

/** Campos comuns ao registro de pagamento e à ativação. */
export function CamposPagamento({ prefixo, campos }: { prefixo: string; campos?: Record<string, string> }) {
  return (
    <>
      <div className={estilos.linhaCampos}>
        <Campo
          id={`${prefixo}-dataPagamento`}
          name="dataPagamento"
          rotulo="Data do pagamento"
          type="date"
          max={hojeIso()}
          defaultValue={hojeIso()}
          required
          erro={campos?.dataPagamento}
        />
        <CampoSelecao
          id={`${prefixo}-formaPagamento`}
          name="formaPagamento"
          rotulo="Forma"
          defaultValue="PIX"
          erro={campos?.formaPagamento}
        >
          <option value="PIX">PIX</option>
          <option value="DINHEIRO">Dinheiro</option>
        </CampoSelecao>
      </div>
      <CampoTextoLongo
        id={`${prefixo}-observacao`}
        name="observacao"
        rotulo="Observação (opcional)"
        maxLength={280}
        rows={2}
        erro={campos?.observacao}
      />
    </>
  );
}
