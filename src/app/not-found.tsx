import { LinkBotao } from "@/nucleo/ui/Botao";

export default function NaoEncontrado() {
  return (
    <div className="pagina pagina-aviso">
      <h1>Página não encontrada</h1>
      <p>O endereço pode ter mudado ou estar incorreto.</p>
      <LinkBotao href="/">Voltar para o início</LinkBotao>
    </div>
  );
}
