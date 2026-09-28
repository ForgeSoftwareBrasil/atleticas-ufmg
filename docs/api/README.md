# Contrato da API central (BFF)

Este guia é para o time que vai construir a **API central** usada pelos sites das atléticas. O contrato formal (rotas, payloads, códigos de resposta) está em [`openapi.yaml`](./openapi.yaml). Aqui ficam as **regras de negócio** que o OpenAPI não consegue expressar.

- O vocabulário do domínio (sócio, sociedade, mensalidade, competência, situação, etc.) está definido em [`/CONTEXT.md`](../../CONTEXT.md). A API usa esses mesmos termos.
- Existe uma **implementação de referência** da API rodando em memória no front: [`src/nucleo/mocks/handlers.ts`](../../src/nucleo/mocks/handlers.ts). Na dúvida sobre um comportamento, é ela que o front espera.
- Os schemas Zod em [`src/nucleo/contrato/`](../../src/nucleo/contrato/) são a fonte da verdade do lado do front. O front **valida toda resposta** contra eles: um campo com nome ou tipo diferente quebra a tela na hora, em vez de exibir dado errado.

## Arquitetura

```
Navegador ──(cookie HttpOnly, mesmo domínio)──▶ Site da atlética (Next.js, BFF) ──(Bearer)──▶ API central
                                                  hermesface.com.br                             api.…/v1
```

- **O navegador nunca chama a API central.** Só o servidor Next de cada atlética faz isso ([ADR 0001](../adr/0001-nextjs-como-bff.md)). Por isso a API **não precisa de CORS** para os fronts.
- Uma única API atende várias atléticas. Todo recurso de atlética fica sob `/atleticas/{atleticaId}/…`, e cada front é configurado com o seu `atleticaId` (ex.: `hermes-face`).
- O **usuário é global** na plataforma: CPF e email são únicos entre todas as atléticas. O vínculo com cada atlética é a **sociedade**. Os papéis (ex.: DIRETOR) também são por atlética.

## Convenções

| Item | Regra |
| --- | --- |
| Nomes de campos | Português, camelCase (`nomeCompleto`, `dataNascimento`). |
| Dinheiro | Inteiro em **centavos**. R$ 60,00 → `6000`. |
| Data | `AAAA-MM-DD`. |
| Data e hora | ISO 8601 **com fuso**: `2026-09-27T14:03:00-03:00`. |
| Competência | `AAAA-MM`. |
| CPF e telefone | Só dígitos. O front formata. |
| Fuso de referência | **America/Sao_Paulo**, para tudo o que é "hoje": vencimento, idade, competência atual, data de ativação. |
| Erros | Sempre `{ codigo, mensagem, campos? }`. `mensagem` é exibida ao usuário, então deve estar em português e ser clara. |

## Sociedade: estados e transições

```
             pedir (sócio)            ativar (diretor)
   (nada) ─────────────────▶ PENDENTE ─────────────────▶ ATIVA
                                 │                         │
                                 │ recusar (diretor)       │ encerrar (diretor)
                                 ▼                         ▼
                              ENCERRADA ◀──────────────────┘
```

| Transição | Rota | Pré-condição | Efeitos |
| --- | --- | --- | --- |
| Pedir | `POST /atleticas/{id}/sociedades` | Usuário sem sociedade PENDENTE ou ATIVA nessa atlética (senão 409 `SOCIEDADE_JA_EXISTE`) | Cria a sociedade PENDENTE com `solicitadaEm` = agora. |
| Ativar | `POST …/{sociedadeId}/ativacao` | PENDENTE (senão 409 `TRANSICAO_INVALIDA`) | Em uma transação: estado ATIVA, `socioDesde` = hoje, gera a mensalidade da competência atual e registra nela o pagamento enviado. |
| Recusar | `POST …/{sociedadeId}/recusa` | PENDENTE | Estado ENCERRADA, `encerradaEm` = agora. `socioDesde` continua `null`. |
| Encerrar | `POST …/{sociedadeId}/encerramento` | ATIVA | Estado ENCERRADA, `encerradaEm` = agora. As mensalidades existentes são mantidas. Ainda sem tela no MVP. |

- Uma sociedade ENCERRADA **nunca volta**. Se a pessoa quiser ser sócia de novo, pede uma **nova** sociedade, e o histórico da anterior é preservado.
- `GET …/sociedades/minha` devolve a sociedade **mais recente** do usuário naquela atlética, em qualquer estado.

## Mensalidades

### Geração

- Toda sociedade **ATIVA** tem exatamente **uma mensalidade por competência**, desde a competência de `socioDesde` até a competência atual.
- A API deve ter um processo (job) que gera a mensalidade da nova competência no início de cada mês. Esse job precisa ser **idempotente**: rodar duas vezes não pode duplicar mensalidades. Recomenda-se uma restrição única em `(sociedadeId, competencia)`.
- `valor` é o `valorMensalidade` da atlética **no momento da geração** (é uma cópia, não uma referência). Mudar o valor da atlética não altera mensalidades já geradas.
- `vencimento` = competência + `diaVencimento` da atlética (ex.: `2026-09` + dia 10 → `2026-09-10`). O `diaVencimento` vai de 1 a 28, então existe em todos os meses.
- Sociedades PENDENTES e ENCERRADAS não geram mensalidades.

### Status e situação

Estes campos são **sempre calculados**, nunca editáveis e nunca armazenados como verdade (no máximo como cache):

```
status da mensalidade
  PAGA       se existe pagamento registrado
  ATRASADA   senão, se hoje (America/Sao_Paulo) > vencimento
  EM_ABERTO  caso contrário (vence hoje ou no futuro)

situação da sociedade (só para ATIVA; null nos outros estados)
  INADIMPLENTE  se existe ao menos uma mensalidade ATRASADA
  EM_DIA        caso contrário

mensalidadesEmAtraso = quantidade de mensalidades ATRASADAS
valorEmAtraso        = soma dos valores das mensalidades ATRASADAS
```

- **Não há tolerância**: no dia seguinte ao vencimento, a mensalidade já é ATRASADA.
- No dia do vencimento, a mensalidade ainda está EM_ABERTO.
- Filtrar por `situacao` na listagem implica sociedades ATIVAS.

### Registro de pagamento

- O sócio paga **fora do sistema** (PIX para a chave da atlética, ou dinheiro), e um diretor registra o pagamento. No MVP não há gateway.
- Um registro pode cobrir **várias mensalidades** (`mensalidadeIds`), e todas recebem o mesmo pagamento. A operação é **atômica**: ou registra tudo, ou nada.
- Só é possível registrar pagamento de mensalidades **já geradas** (não existe pagamento adiantado no MVP).
- `dataPagamento` não pode ser futura. `registradoPor` é o usuário do token e `registradoEm` é o momento do registro.
- **Desfazer** (`DELETE …/mensalidades/{id}/pagamento`) remove o pagamento, e a mensalidade volta a ser EM_ABERTO ou ATRASADA. Recomenda-se guardar trilha de auditoria de quem desfez e quando, mesmo que o front ainda não exiba.

## Autorização

| Rota | Quem pode |
| --- | --- |
| `POST /auth/*`, `POST /usuarios`, `GET /atleticas/{id}` | Público |
| `GET /usuarios/eu`, `…/sociedades/minha`, `POST …/sociedades` | Qualquer usuário autenticado (sobre si mesmo) |
| Demais rotas de `…/sociedades…` | Apenas quem tem papel **DIRETOR** na atlética do path. Sem o papel, retorna **403** `SEM_PERMISSAO`. |

- Um diretor de uma atlética **não enxerga** nada de outra atlética. Uma `sociedadeId` que pertence a outra atlética retorna **404** (não 403), para não revelar que ela existe.
- No MVP, diretores são cadastrados direto na base pelo time do back. Não há rota para isso.

## Listagem da diretoria

- `busca` casa com nome e email, ignorando maiúsculas e acentos ("joao" encontra "João"). Se o termo tiver 3 ou mais dígitos, também casa com trechos do CPF.
- O desempate de ordenação é sempre por nome, em ordem ascendente.
- Na **listagem**, o CPF volta **mascarado** (`***.456.789-**`, campo `cpfMascarado`), para não trafegar à toa. O CPF completo só aparece no **detalhe** (`GET …/sociedades/{id}`) e na **exportação CSV**.
- A exportação CSV usa os mesmos filtros da listagem, sem paginação. O formato está descrito no OpenAPI (UTF-8 com BOM, separador `;`, CRLF) e abre direto no Excel em português.

## Autenticação e sessão

- `POST /auth/sessoes` devolve `tokenAcesso` (curto, recomendado **15 min**), `tokenRenovacao` (recomendado **7 dias**) e `expiraEm`.
- Por volta de 60 s antes de `expiraEm`, o BFF chama `POST /auth/renovacoes`. O token de renovação deve ser **rotacionado** a cada uso. Se um token de renovação já usado for reapresentado, trate como roubo e **revogue a sessão inteira**.
- `DELETE /auth/sessoes` revoga a sessão (logout).
- Os tokens ficam cifrados em um cookie HttpOnly no domínio do site. O formato do token é **opaco** para o front: pode ser JWT ou um identificador aleatório.

## Requisitos de segurança e LGPD

| Requisito | Detalhe |
| --- | --- |
| Senha | Hash com **argon2id** (ou bcrypt com custo ≥ 12). Nunca logar a senha nem o hash. O front limita a senha a 72 caracteres. |
| Mensagem de login | Sempre `CREDENCIAIS_INVALIDAS` com o texto "Email ou senha inválidos", exista o email ou não. |
| Limite de tentativas | Login limitado por email **e** por IP (a referência usa 5 falhas em 15 min por email). Ao estourar: 429 `MUITAS_TENTATIVAS`. Aplicar também ao cadastro. |
| Aceite de termos | `aceiteTermos` precisa ser `true`. Guardar data/hora do aceite e a versão da política aceita. |
| Minimização | CPF mascarado em listagens. CPF completo só no detalhe e na exportação. |
| Auditoria | Registrar quem ativou, recusou ou encerrou sociedades e quem registrou ou desfez pagamentos. |
| Transporte | Apenas HTTPS. Os sites chamam a API servidor-a-servidor. |

## Validações de cadastro (`NovoUsuario`)

O front já valida todos os campos com as mesmas regras, mas a API **precisa validar de novo**. Qualquer falha retorna 422 `DADOS_INVALIDOS` com `campos`.

| Campo | Regra |
| --- | --- |
| `nomeCompleto` | 5 a 120 caracteres após trim, com pelo menos duas palavras. |
| `cpf` | 11 dígitos, dígitos verificadores válidos, sem todos os dígitos iguais. Único na plataforma (409 `CPF_JA_CADASTRADO`). |
| `email` | Email válido, normalizado em minúsculas. Único (409 `EMAIL_JA_CADASTRADO`). |
| `telefone` | Celular brasileiro: DDD (11 a 99) + 9 + 8 dígitos. |
| `dataNascimento` | Data válida, não futura, e pessoa com **pelo menos 16 anos** hoje. |
| `senha` | 8 a 72 caracteres, com letras e números. |

## Códigos de erro

| HTTP | `codigo` | Quando |
| --- | --- | --- |
| 401 | `CREDENCIAIS_INVALIDAS` | Login com email ou senha errados. |
| 401 | `NAO_AUTENTICADO` | Token ausente, inválido ou expirado (inclusive na renovação). |
| 403 | `SEM_PERMISSAO` | Falta o papel DIRETOR na atlética do path. |
| 404 | `NAO_ENCONTRADO` | Recurso inexistente ou de outra atlética. |
| 409 | `CPF_JA_CADASTRADO`, `EMAIL_JA_CADASTRADO` | Cadastro duplicado. |
| 409 | `SOCIEDADE_JA_EXISTE` | Pedido de sociedade com outra PENDENTE ou ATIVA. |
| 409 | `TRANSICAO_INVALIDA` | Ativar, recusar ou encerrar fora do estado exigido. |
| 409 | `MENSALIDADE_JA_PAGA` / `MENSALIDADE_NAO_PAGA` | Registrar em mensalidade paga / desfazer em mensalidade sem pagamento. |
| 422 | `DADOS_INVALIDOS` | Corpo inválido. `campos` traz as mensagens por campo. |
| 429 | `MUITAS_TENTATIVAS` | Limite de tentativas atingido. |
| 5xx | `ERRO_INTERNO` | Falha inesperada. |

## Exemplo: detalhe de um sócio inadimplente

```json
{
  "id": "5b1f…",
  "atleticaId": "hermes-face",
  "estado": "ATIVA",
  "situacao": "INADIMPLENTE",
  "solicitadaEm": "2026-02-19T20:30:00-03:00",
  "socioDesde": "2026-02-20",
  "encerradaEm": null,
  "mensalidadesEmAtraso": 2,
  "valorEmAtraso": 12000,
  "usuario": {
    "id": "a41c…",
    "nomeCompleto": "Lucas Henrique Ferreira",
    "cpf": "22617310000",
    "email": "socio.atrasado@face.mock",
    "telefone": "31919241748",
    "dataNascimento": "2006-12-08",
    "criadoEm": "2026-02-19T20:30:00-03:00"
  },
  "mensalidades": [
    { "id": "m9…", "competencia": "2026-09", "valor": 6000, "vencimento": "2026-09-10", "status": "ATRASADA", "pagamento": null },
    { "id": "m8…", "competencia": "2026-08", "valor": 6000, "vencimento": "2026-08-10", "status": "ATRASADA", "pagamento": null },
    {
      "id": "m7…",
      "competencia": "2026-07",
      "valor": 6000,
      "vencimento": "2026-07-10",
      "status": "PAGA",
      "pagamento": {
        "dataPagamento": "2026-07-04",
        "formaPagamento": "PIX",
        "observacao": null,
        "registradoPor": { "id": "d1…", "nomeCompleto": "Mariana Costa Albuquerque" },
        "registradoEm": "2026-07-05T19:15:00-03:00"
      }
    }
  ]
}
```

## Integrar o front com a API real

No servidor do front (ver [`.env.example`](../../.env.example)):

```
API_MOCK=false
API_URL=https://api.exemplo.com.br   # sem /v1
ATLETICA_ID=hermes-face
```

Nenhuma outra mudança é necessária no front. Se a API seguir este contrato, as telas funcionam como na demonstração.
