# Sócios Hermes · FACE UFMG

Site da **Associação Atlética Acadêmica Hermes** (FACE UFMG) para controle de sócios: cadastro e login, área do sócio com a situação das mensalidades e painel da diretoria com todos os sócios, quem está em dia e quem está inadimplente.

Este repositório é **só o front** (Next.js atuando como BFF). O backend é uma API central feita por outra equipe, e o contrato entre os dois está em [`docs/api/`](docs/api/). Enquanto a API não existe, o front roda com uma **API mock em memória** que segue exatamente esse contrato.

## Rodando

Requer Node 20.9 ou superior.

```bash
npm install
cp .env.example .env.local   # e preencha SESSION_SECRET (o comando para gerar está no arquivo)
npm run dev                  # http://localhost:3000
```

### Acessos de demonstração (API mock)

Todos usam a senha `Hermes123`. Com a API mock ligada, a tela de login também oferece botões para entrar como cada um.

| Email | Perfil |
| --- | --- |
| `socio.emdia@face.mock` | Sócia em dia |
| `socio.atrasado@face.mock` | Sócio com 2 mensalidades atrasadas (vê o aviso de inadimplência) |
| `diretor@face.mock` | Diretora (também sócia em dia), com acesso ao painel `/diretoria` |

Além desses, há cerca de 25 sócios fictícios: alguns em dia, alguns inadimplentes, 3 solicitações pendentes e algumas sociedades encerradas. Os dados ficam **em memória**: pagamentos registrados e cadastros novos valem até o servidor reiniciar. As datas são relativas ao dia de hoje, então a demonstração nunca "envelhece".

## Estrutura

```
src/
  app/                 Rotas do site da FACE (páginas, layout, rota de exportação CSV)
  atletica/            O que é específico da Hermes: escudo, tema de cores, textos
  nucleo/              O que é compartilhável entre atléticas (não importa nada de atletica/)
    contrato/          Schemas Zod do contrato da API: a fonte da verdade
    api/               Cliente da API central (só servidor) e transporte real/mock
    mocks/             API mock: handlers MSW + "banco" em memória
    auth/              Sessão em cookie cifrado, login, cadastro e logout
    socios/            Carteirinha, histórico, aviso de atraso e painel da diretoria
    ui/                Componentes base (botão, campo, selo, diálogo, cabeçalho)
    formatos/          CPF, telefone, datas (fuso de São Paulo) e moeda
  proxy.ts             CSP com nonce, renovação transparente da sessão e proteção de rotas
docs/
  api/openapi.yaml     Contrato formal para o time do back
  api/README.md        Regras de negócio, segurança e erros
  adr/                 Decisões de arquitetura
CONTEXT.md             Glossário do domínio (sócio, sociedade, mensalidade, situação…)
```

## Decisões

- [ADR 0001](docs/adr/0001-nextjs-como-bff.md): o Next.js atua como **BFF**. O navegador só conversa com o próprio site, e os tokens da API ficam cifrados em um cookie `HttpOnly`.
- [ADR 0002](docs/adr/0002-um-app-por-atletica-com-nucleo-compartilhado.md): **um app por atlética** com núcleo compartilhado. Quando chegar a segunda atlética, `src/nucleo/*` vira `packages/*` em um monorepo.

## Trocar para a API real

No `.env.local` (ou nas variáveis de ambiente do deploy):

```
API_MOCK=false
API_URL=https://url-da-api-central   # sem /v1
ATLETICA_ID=hermes-face
```

O front valida toda resposta contra os schemas de `src/nucleo/contrato`. Se a API divergir do contrato, o erro aparece na hora e aponta o campo com problema.

## Deploy (Vercel)

O site precisa de runtime de servidor (BFF), mas o plano gratuito da Vercel atende. Configure `API_MOCK`, `API_URL`, `ATLETICA_ID` e um `SESSION_SECRET` novo nas variáveis de ambiente do projeto. Com a API mock em um ambiente serverless, cada instância tem sua própria memória: os dados de demonstração podem voltar ao estado inicial entre acessos.

## Segurança

- Sessão em cookie `__Host-sessao` (`HttpOnly`, `Secure`, `SameSite=Lax`) cifrado com AES-256-GCM (JWE).
- Token de acesso curto, renovado de forma transparente no `proxy.ts`.
- Content Security Policy com nonce por requisição (`script-src 'strict-dynamic'`), HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` e `Permissions-Policy`.
- Server Actions com a verificação de origem do Next (proteção contra CSRF) e checagem de papel no servidor em toda ação da diretoria.
- CPF mascarado nas listagens. O CPF completo só aparece no detalhe e na exportação.
- Redirecionamento pós-login (`?para=`) restrito a caminhos internos (sem open redirect).
