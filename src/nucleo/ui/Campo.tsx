import type { ComponentProps, ReactNode } from "react";
import estilos from "./Campo.module.scss";

export { estilos as estilosCampo };

interface Base {
  id: string;
  rotulo: ReactNode;
  erro?: string;
  dica?: ReactNode;
}

function descritores(id: string, erro?: string, dica?: ReactNode) {
  return [erro && `${id}-erro`, dica && `${id}-dica`].filter(Boolean).join(" ") || undefined;
}

function Rodape({ id, erro, dica }: Pick<Base, "id" | "erro" | "dica">) {
  return (
    <>
      {dica && !erro && (
        <span id={`${id}-dica`} className={estilos.dica}>
          {dica}
        </span>
      )}
      {erro && (
        <span id={`${id}-erro`} className={estilos.erro}>
          {erro}
        </span>
      )}
    </>
  );
}

export function Campo({ id, rotulo, erro, dica, className, ...input }: Base & ComponentProps<"input">) {
  return (
    <div className={[estilos.campo, className].filter(Boolean).join(" ")}>
      <label htmlFor={id} className={estilos.rotulo}>
        {rotulo}
      </label>
      <input
        id={id}
        name={id}
        className={estilos.controle}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descritores(id, erro, dica)}
        {...input}
      />
      <Rodape id={id} erro={erro} dica={dica} />
    </div>
  );
}

export function CampoSelecao({
  id,
  rotulo,
  erro,
  dica,
  className,
  children,
  ...select
}: Base & ComponentProps<"select">) {
  return (
    <div className={[estilos.campo, className].filter(Boolean).join(" ")}>
      <label htmlFor={id} className={estilos.rotulo}>
        {rotulo}
      </label>
      <select
        id={id}
        name={id}
        className={estilos.controle}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descritores(id, erro, dica)}
        {...select}
      >
        {children}
      </select>
      <Rodape id={id} erro={erro} dica={dica} />
    </div>
  );
}

export function CampoTextoLongo({ id, rotulo, erro, dica, className, ...textarea }: Base & ComponentProps<"textarea">) {
  return (
    <div className={[estilos.campo, className].filter(Boolean).join(" ")}>
      <label htmlFor={id} className={estilos.rotulo}>
        {rotulo}
      </label>
      <textarea
        id={id}
        name={id}
        className={estilos.controle}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descritores(id, erro, dica)}
        {...textarea}
      />
      <Rodape id={id} erro={erro} dica={dica} />
    </div>
  );
}

export function Escolha({ id, rotulo, erro, className, ...input }: Omit<Base, "dica"> & ComponentProps<"input">) {
  return (
    <div className={[estilos.campo, className].filter(Boolean).join(" ")}>
      <label htmlFor={id} className={estilos.escolha}>
        <input
          type="checkbox"
          id={id}
          name={id}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? `${id}-erro` : undefined}
          {...input}
        />
        <span>{rotulo}</span>
      </label>
      <Rodape id={id} erro={erro} />
    </div>
  );
}
