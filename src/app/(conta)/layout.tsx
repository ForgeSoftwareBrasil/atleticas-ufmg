import Image from "next/image";
import { identidade } from "@/atletica/config";
import estilos from "./conta.module.scss";

/** Layout de entrada e cadastro: escudo à esquerda, formulário à direita. */
export default function LayoutConta({ children }: { children: React.ReactNode }) {
  return (
    <div className={estilos.moldura}>
      <aside className={estilos.lateral} aria-hidden="true">
        <Image
          src={identidade.escudo}
          alt=""
          className={estilos.escudo}
          sizes="(max-width: 52rem) 40vw, 30vw"
          priority
        />
      </aside>
      <div className={estilos.conteudo}>{children}</div>
    </div>
  );
}
