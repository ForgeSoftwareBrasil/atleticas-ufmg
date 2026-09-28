# Front em Next.js atuando como BFF, com sessão em cookie HttpOnly

Cada atlética tem seu próprio site (domínio próprio), e todas consomem uma única API central em outro domínio. Um cookie de sessão gravado pela API seria cookie de terceiros e é bloqueado pelos navegadores; um JWT guardado no JavaScript fica exposto a XSS. Por isso, o front é um app Next.js cujo servidor é o único a falar com a API central: o navegador conversa só com o próprio domínio, a sessão fica num cookie `HttpOnly; Secure; SameSite=Lax`, e o token da API nunca chega ao navegador.

## Considered Options

- **SPA (React + Vite) + cookie da API central**: inviável com domínios distintos por atlética (cookie de terceiros).
- **SPA + JWT em memória/localStorage**: funciona, mas expõe o token a XSS.

## Consequences

- Cada site de atlética precisa de runtime de servidor (não é hospedagem estática).
- O contrato documentado para o time do back é o da **API central** (servidor Next → API). As rotas internas do Next (navegador → Next) são detalhe do front.
- Os mocks (MSW) rodam no servidor Next, interceptando as chamadas à API central, para que o mock siga exatamente o contrato documentado.
