import "server-only";
import { createHash, randomUUID } from "node:crypto";
import type {
  Atletica,
  EstadoSociedade,
  FormaPagamento,
  Mensalidade,
  Pagamento,
  Papel,
  SociedadeDetalhe,
  SociedadeResumo,
  StatusMensalidade,
  Usuario,
} from "../contrato";
import { mascararCpf } from "../formatos/cpf";
import { competenciaDe, hojeIso, somarMeses } from "../formatos/datas";
import { SENHA_DEMO } from "./senha-demo";

/*
 * "Banco" em memória da API mock. Reinicia a cada restart do servidor.
 * Fica em globalThis porque o Next pode carregar este módulo em mais de um bundle
 * (rotas, server actions, proxy) e todos precisam enxergar o mesmo estado.
 */

export interface UsuarioDb extends Usuario {
  /** Mock apenas: hash simples. A API real deve usar argon2id (ver docs/api/README.md). */
  senhaHash: string;
}

export interface SociedadeDb {
  id: string;
  atleticaId: string;
  usuarioId: string;
  estado: EstadoSociedade;
  solicitadaEm: string;
  socioDesde: string | null;
  encerradaEm: string | null;
}

export interface MensalidadeDb {
  id: string;
  sociedadeId: string;
  competencia: string;
  valor: number;
  vencimento: string;
  pagamento: Pagamento | null;
}

export interface Banco {
  atleticas: Atletica[];
  usuarios: UsuarioDb[];
  papeis: { usuarioId: string; atleticaId: string; papel: Papel }[];
  sociedades: SociedadeDb[];
  mensalidades: MensalidadeDb[];
  tentativasLogin: Map<string, number[]>;
}

export function hashSenha(senha: string): string {
  return createHash("sha256").update(`mock-sal:${senha}`).digest("hex");
}

// ---------------------------------------------------------------- regras

export function statusMensalidade(m: MensalidadeDb, hoje = hojeIso()): StatusMensalidade {
  if (m.pagamento) return "PAGA";
  return hoje > m.vencimento ? "ATRASADA" : "EM_ABERTO";
}

function vencimentoDe(competencia: string, atletica: Atletica): string {
  return `${competencia}-${String(atletica.diaVencimento).padStart(2, "0")}`;
}

/** Garante uma mensalidade por competência, da ativação até `ate`, para a sociedade. */
function gerarMensalidades(db: Banco, sociedade: SociedadeDb, ate: string) {
  if (!sociedade.socioDesde) return;
  const atletica = db.atleticas.find((a) => a.id === sociedade.atleticaId)!;
  for (let c = competenciaDe(sociedade.socioDesde); c <= ate; c = somarMeses(c, 1)) {
    const existe = db.mensalidades.some((m) => m.sociedadeId === sociedade.id && m.competencia === c);
    if (!existe) {
      db.mensalidades.push({
        id: randomUUID(),
        sociedadeId: sociedade.id,
        competencia: c,
        valor: atletica.valorMensalidade,
        vencimento: vencimentoDe(c, atletica),
        pagamento: null,
      });
    }
  }
}

/** Simula o job mensal do back: toda sociedade ativa tem mensalidade até a competência atual. */
export function sincronizarMensalidades(db: Banco, hoje = hojeIso()) {
  for (const s of db.sociedades) {
    if (s.estado === "ATIVA") gerarMensalidades(db, s, competenciaDe(hoje));
  }
}

export function mensalidadesDa(db: Banco, sociedadeId: string): MensalidadeDb[] {
  return db.mensalidades
    .filter((m) => m.sociedadeId === sociedadeId)
    .sort((a, b) => b.competencia.localeCompare(a.competencia));
}

function camposCalculados(db: Banco, s: SociedadeDb, hoje: string) {
  const atrasadas = mensalidadesDa(db, s.id).filter((m) => statusMensalidade(m, hoje) === "ATRASADA");
  return {
    id: s.id,
    atleticaId: s.atleticaId,
    estado: s.estado,
    situacao: s.estado === "ATIVA" ? (atrasadas.length ? "INADIMPLENTE" : "EM_DIA") : null,
    solicitadaEm: s.solicitadaEm,
    socioDesde: s.socioDesde,
    encerradaEm: s.encerradaEm,
    mensalidadesEmAtraso: atrasadas.length,
    valorEmAtraso: atrasadas.reduce((t, m) => t + m.valor, 0),
  } as const;
}

function semSenha(u: UsuarioDb): Usuario {
  const { senhaHash: _, ...usuario } = u;
  return usuario;
}

export function paraResumo(db: Banco, s: SociedadeDb, hoje = hojeIso()): SociedadeResumo {
  const u = db.usuarios.find((x) => x.id === s.usuarioId)!;
  return {
    ...camposCalculados(db, s, hoje),
    usuario: {
      id: u.id,
      nomeCompleto: u.nomeCompleto,
      cpfMascarado: mascararCpf(u.cpf),
      email: u.email,
      telefone: u.telefone,
      dataNascimento: u.dataNascimento,
    },
  };
}

export function paraDetalhe(db: Banco, s: SociedadeDb, hoje = hojeIso()): SociedadeDetalhe {
  const u = db.usuarios.find((x) => x.id === s.usuarioId)!;
  return {
    ...camposCalculados(db, s, hoje),
    usuario: semSenha(u),
    mensalidades: mensalidadesDa(db, s.id).map((m): Mensalidade => ({
      id: m.id,
      competencia: m.competencia,
      valor: m.valor,
      vencimento: m.vencimento,
      status: statusMensalidade(m, hoje),
      pagamento: m.pagamento,
    })),
  };
}

export { semSenha };

// ---------------------------------------------------------------- semente

/** PRNG determinístico para que a demo seja sempre igual. */
function mulberry32(semente: number) {
  let a = semente;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function somarDias(dataIso: string, dias: number): string {
  const d = new Date(`${dataIso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

function gerarCpf(aleatorio: () => number): string {
  const base = Array.from({ length: 9 }, () => Math.floor(aleatorio() * 10));
  const dv = (digitos: number[]) => {
    const soma = digitos.reduce((acc, d, i) => acc + d * (digitos.length + 1 - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  base.push(dv(base));
  base.push(dv(base));
  return base.join("");
}

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

type Perfil =
  | { tipo: "emDia"; mesesComoSocio: number }
  | { tipo: "inadimplente"; mesesComoSocio: number; mesesEmAtraso: number }
  | { tipo: "pendente"; diasDesdeSolicitacao: number }
  | { tipo: "encerrada"; mesesComoSocio: number; encerradaHaMeses: number }
  | { tipo: "recusada"; diasDesdeSolicitacao: number };

interface Pessoa {
  nome: string;
  email?: string;
  perfil: Perfil;
  diretor?: boolean;
}

const PESSOAS: Pessoa[] = [
  // Acessos de demonstração
  { nome: "Ana Beatriz Moreira Lopes", email: "socio.emdia@face.mock", perfil: { tipo: "emDia", mesesComoSocio: 14 } },
  {
    nome: "Lucas Henrique Ferreira",
    email: "socio.atrasado@face.mock",
    perfil: { tipo: "inadimplente", mesesComoSocio: 8, mesesEmAtraso: 2 },
  },
  {
    nome: "Mariana Costa Albuquerque",
    email: "diretor@face.mock",
    perfil: { tipo: "emDia", mesesComoSocio: 26 },
    diretor: true,
  },
  // Demais sócios fictícios
  { nome: "Gabriel Augusto Nascimento", perfil: { tipo: "emDia", mesesComoSocio: 11 } },
  { nome: "Júlia Rezende Campos", perfil: { tipo: "emDia", mesesComoSocio: 20 } },
  { nome: "Pedro Vilela Diniz", perfil: { tipo: "inadimplente", mesesComoSocio: 16, mesesEmAtraso: 4 } },
  { nome: "Larissa Fonseca Prado", perfil: { tipo: "emDia", mesesComoSocio: 5 } },
  { nome: "Matheus Oliveira Guimarães", perfil: { tipo: "emDia", mesesComoSocio: 30 } },
  { nome: "Isabela Martins Teixeira", perfil: { tipo: "inadimplente", mesesComoSocio: 9, mesesEmAtraso: 1 } },
  { nome: "Rafael Souza Andrade", perfil: { tipo: "emDia", mesesComoSocio: 3 } },
  { nome: "Camila Duarte Ribeiro", perfil: { tipo: "pendente", diasDesdeSolicitacao: 1 } },
  { nome: "Thiago Barbosa Pimenta", perfil: { tipo: "emDia", mesesComoSocio: 18 } },
  { nome: "Letícia Carvalho Neves", perfil: { tipo: "inadimplente", mesesComoSocio: 12, mesesEmAtraso: 3 } },
  { nome: "Bruno César Almeida", perfil: { tipo: "emDia", mesesComoSocio: 7 } },
  { nome: "Fernanda Lacerda Quintão", perfil: { tipo: "encerrada", mesesComoSocio: 10, encerradaHaMeses: 4 } },
  { nome: "Vinícius Rocha Figueiredo", perfil: { tipo: "pendente", diasDesdeSolicitacao: 3 } },
  { nome: "Beatriz Antunes Salgado", perfil: { tipo: "emDia", mesesComoSocio: 22 } },
  { nome: "Gustavo Henrique Lima", perfil: { tipo: "inadimplente", mesesComoSocio: 6, mesesEmAtraso: 1 } },
  { nome: "Mariana Torres Veloso", perfil: { tipo: "emDia", mesesComoSocio: 13 } },
  { nome: "Felipe Assis Drummond", perfil: { tipo: "emDia", mesesComoSocio: 2 } },
  { nome: "Carolina Pires Bittencourt", perfil: { tipo: "pendente", diasDesdeSolicitacao: 6 } },
  { nome: "Eduardo Magalhães Coelho", perfil: { tipo: "inadimplente", mesesComoSocio: 24, mesesEmAtraso: 2 } },
  { nome: "Amanda Siqueira Braga", perfil: { tipo: "emDia", mesesComoSocio: 9 } },
  { nome: "João Victor Paiva", perfil: { tipo: "encerrada", mesesComoSocio: 6, encerradaHaMeses: 1 } },
  { nome: "Natália Freitas Horta", perfil: { tipo: "emDia", mesesComoSocio: 15 } },
  { nome: "Henrique Mourão Salles", perfil: { tipo: "recusada", diasDesdeSolicitacao: 20 } },
  { nome: "Sofia Guedes Tavares", perfil: { tipo: "emDia", mesesComoSocio: 4 } },
  { nome: "Daniel Arantes Viana", perfil: { tipo: "inadimplente", mesesComoSocio: 5, mesesEmAtraso: 1 } },
];

export const ATLETICA_HERMES: Atletica = {
  id: "hermes-face",
  nome: "Associação Atlética Acadêmica Hermes",
  apelido: "FACE",
  valorMensalidade: 6000,
  diaVencimento: 10,
  chavePix: "pix@hermes-face.exemplo.com.br",
  whatsappDiretoria: "5531900000000",
};

function semear(hoje: string): Banco {
  const aleatorio = mulberry32(20260927);
  const db: Banco = {
    atleticas: [ATLETICA_HERMES],
    usuarios: [],
    papeis: [],
    sociedades: [],
    mensalidades: [],
    tentativasLogin: new Map(),
  };
  const competenciaAtual = competenciaDe(hoje);
  const inteiro = (min: number, max: number) => min + Math.floor(aleatorio() * (max - min + 1));
  let diretoraId = "";

  const pendentesDePagamento: { sociedadeId: string; mesesEmAtraso: number }[] = [];

  for (const pessoa of PESSOAS) {
    const partes = semAcento(pessoa.nome).toLowerCase().split(" ");
    const idade = inteiro(17, 27);
    const usuario: UsuarioDb = {
      id: randomUUID(),
      nomeCompleto: pessoa.nome,
      cpf: gerarCpf(aleatorio),
      email: pessoa.email ?? `${partes[0]}.${partes[partes.length - 1]}@exemplo.com.br`,
      telefone: `31${9}${String(inteiro(10000000, 99999999))}`,
      dataNascimento: somarDias(hoje, -(idade * 365 + inteiro(0, 360))),
      criadoEm: "",
      senhaHash: hashSenha(pessoa.email ? SENHA_DEMO : randomUUID()),
    };
    db.usuarios.push(usuario);
    if (pessoa.diretor) {
      db.papeis.push({ usuarioId: usuario.id, atleticaId: ATLETICA_HERMES.id, papel: "DIRETOR" });
      diretoraId = usuario.id;
    }

    const p = pessoa.perfil;
    const sociedade: SociedadeDb = {
      id: randomUUID(),
      atleticaId: ATLETICA_HERMES.id,
      usuarioId: usuario.id,
      estado: "ATIVA",
      solicitadaEm: "",
      socioDesde: null,
      encerradaEm: null,
    };

    if (p.tipo === "pendente" || p.tipo === "recusada") {
      const solicitada = somarDias(hoje, -p.diasDesdeSolicitacao);
      sociedade.estado = p.tipo === "pendente" ? "PENDENTE" : "ENCERRADA";
      sociedade.solicitadaEm = `${solicitada}T${String(inteiro(8, 22)).padStart(2, "0")}:14:00-03:00`;
      if (p.tipo === "recusada") sociedade.encerradaEm = `${somarDias(solicitada, 7)}T10:00:00-03:00`;
    } else {
      const inicio = `${somarMeses(competenciaAtual, -(p.mesesComoSocio - 1))}-${String(inteiro(1, 25)).padStart(2, "0")}`;
      sociedade.socioDesde = inicio;
      sociedade.solicitadaEm = `${somarDias(inicio, -inteiro(1, 4))}T20:30:00-03:00`;
      if (p.tipo === "encerrada") {
        const fim = somarMeses(competenciaAtual, -p.encerradaHaMeses);
        gerarMensalidades(db, sociedade, fim);
        sociedade.estado = "ENCERRADA";
        sociedade.encerradaEm = `${fim}-15T18:00:00-03:00`;
      } else {
        gerarMensalidades(db, sociedade, competenciaAtual);
        if (p.tipo === "inadimplente")
          pendentesDePagamento.push({ sociedadeId: sociedade.id, mesesEmAtraso: p.mesesEmAtraso });
      }
    }
    usuario.criadoEm = sociedade.solicitadaEm;
    db.sociedades.push(sociedade);
  }

  const diretora = db.usuarios.find((u) => u.id === diretoraId)!;
  const formas: FormaPagamento[] = ["PIX", "PIX", "PIX", "DINHEIRO"];

  for (const s of db.sociedades) {
    const mensalidades = mensalidadesDa(db, s.id).reverse(); // mais antiga primeiro
    if (!mensalidades.length) continue;
    const vencidas = mensalidades.filter((m) => m.vencimento < hoje);
    const atraso = pendentesDePagamento.find((x) => x.sociedadeId === s.id)?.mesesEmAtraso ?? 0;
    const naoPagas = new Set(vencidas.slice(vencidas.length - atraso).map((m) => m.id));
    if (atraso > 0) {
      // Quem está atrasado também não pagou a competência corrente, se ela ainda não venceu.
      for (const m of mensalidades) if (m.vencimento >= hoje) naoPagas.add(m.id);
    }

    mensalidades.forEach((m, i) => {
      if (naoPagas.has(m.id)) return;
      if (m.vencimento >= hoje && aleatorio() < 0.4) return; // alguns ainda não pagaram o mês corrente
      const data = i === 0 ? s.socioDesde! : somarDias(m.vencimento, -inteiro(0, 6));
      const dataPagamento = data > hoje ? hoje : data < s.socioDesde! ? s.socioDesde! : data;
      m.pagamento = {
        dataPagamento,
        formaPagamento: formas[inteiro(0, formas.length - 1)],
        observacao: null,
        registradoPor: { id: diretora.id, nomeCompleto: diretora.nomeCompleto },
        registradoEm: `${somarDias(dataPagamento, inteiro(0, 2)) > hoje ? hoje : somarDias(dataPagamento, inteiro(0, 2))}T19:${String(inteiro(10, 59))}:00-03:00`,
      };
    });
  }

  return db;
}

const global = globalThis as typeof globalThis & { __bancoMock?: Banco };

export function banco(): Banco {
  global.__bancoMock ??= semear(hojeIso());
  sincronizarMensalidades(global.__bancoMock);
  return global.__bancoMock;
}
