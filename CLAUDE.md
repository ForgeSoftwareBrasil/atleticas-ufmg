@AGENTS.md

## Projeto

- Glossário do domínio em `CONTEXT.md`; use esses termos no código e nos textos (ex.: "sociedade", "situação", "diretor" — não "admin").
- `src/nucleo/` nunca importa de `src/atletica/` (ver `docs/adr/0002`). Tema e textos da atlética entram por props/variáveis CSS.
- O contrato da API vive em `src/nucleo/contrato/` (Zod) **e** em `docs/api/openapi.yaml`. Toda mudança de payload atualiza os dois, mais os mocks em `src/nucleo/mocks/`.
- O navegador nunca chama a API central; só o servidor Next (`src/nucleo/api`, marcado `server-only`).
