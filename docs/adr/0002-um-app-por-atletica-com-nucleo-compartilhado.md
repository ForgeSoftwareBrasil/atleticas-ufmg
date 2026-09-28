# Um app por atlética com núcleo compartilhado (monorepo quando houver a 2ª atlética)

As atléticas têm demandas "macro" iguais (sócios, mensalidades, login, painel da diretoria) e demandas "micro" próprias (identidade visual, páginas e regras específicas). Decidimos que cada atlética terá seu próprio app front-end (domínio e deploy próprios) consumindo a mesma API central, e que o código comum será compartilhado — não copiado. Enquanto só existir a FACE, o projeto é um único app Next.js cujas pastas já espelham essa divisão: `src/nucleo/` (compartilhável) e `src/atletica/` (específico da FACE). Quando a segunda atlética for atendida, migra-se para um monorepo (pnpm workspaces + Turborepo): `src/nucleo/*` vira `packages/*` e a FACE vira `apps/face`.

## Considered Options

- **Um repositório por atlética**: simples no início, mas toda correção e mudança de contrato precisa ser replicada à mão em N repositórios; as versões divergem.
- **Um único app white-label configurado por variáveis de ambiente**: elimina duplicação, mas cada demanda "micro" vira condicional por atlética dentro do código de todas.
- **Monorepo desde já**: correto a longo prazo, mas é overhead enquanto houver uma única atlética.

## Consequences

- Nada em `src/nucleo/` pode importar de `src/atletica/`; o núcleo recebe tema, textos e configuração da atlética por parâmetro. Essa regra é o que torna a migração futura mecânica.
- O contrato da API (schemas Zod + OpenAPI) vive no núcleo e é a única fonte da verdade para todos os apps.
