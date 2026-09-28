import Image from "next/image";
import Link from "next/link";
import { identidade } from "@/atletica/config";
import estilos from "./Rodape.module.scss";

export function Rodape() {
  return (
    <footer className={estilos.rodape}>
      <div className={estilos.interno}>
        <Image src={identidade.escudo} alt="" width={36} height={32} />
        <div>
          <p className={estilos.nome}>{identidade.nomeOficial}</p>
          <p>{identidade.descricaoInstituicao}</p>
        </div>
        <Link href="/privacidade" className={estilos.link}>
          Política de privacidade
        </Link>
      </div>
    </footer>
  );
}
