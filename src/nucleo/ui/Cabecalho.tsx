import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { LinkNavegacao } from "./LinkNavegacao";
import estilos from "./Cabecalho.module.scss";

export interface Marca {
  nome: string;
  instituicao: string;
  escudo: StaticImageData;
  escudoAlt: string;
}

interface Props {
  marca: Marca;
  usuario: { primeiroNome: string; ehDiretor: boolean } | null;
  acaoSair: () => Promise<void>;
}

export function Cabecalho({ marca, usuario, acaoSair }: Props) {
  return (
    <header className={estilos.cabecalho}>
      <div className={estilos.interno}>
        <Link href="/" className={estilos.marca}>
          <Image src={marca.escudo} alt="" width={44} height={40} priority />
          <span className={estilos.nome}>{marca.nome}</span>
          <span className={estilos.instituicao}>{marca.instituicao}</span>
          <span className="visualmente-oculto">, página inicial</span>
        </Link>

        <nav aria-label="Principal" className={estilos.navegacao}>
          {usuario ? (
            <>
              <LinkNavegacao href="/minha-sociedade" classe={estilos.link} classeAtiva={estilos.ativo}>
                Minha sociedade
              </LinkNavegacao>
              {usuario.ehDiretor && (
                <LinkNavegacao href="/diretoria" classe={estilos.link} classeAtiva={estilos.ativo}>
                  Diretoria
                </LinkNavegacao>
              )}
              <form action={acaoSair} className={estilos.sair}>
                <span className={estilos.usuario}>{usuario.primeiroNome}</span>
                <button type="submit" className={estilos.link}>
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <LinkNavegacao href="/entrar" classe={estilos.link} classeAtiva={estilos.ativo}>
                Entrar
              </LinkNavegacao>
              <Link href="/cadastro" className={estilos.chamada}>
                Quero ser sócio
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
