# Gestão de Sócios de Atléticas

Controle de quem são os sócios de uma atlética universitária e se estão em dia com suas mensalidades. Uma API geral atende várias atléticas; cada atlética tem seu próprio site.

## Language

### Organização

**Atlética**:
Associação esportiva estudantil de um curso ou faculdade (ex.: Hermes, conhecida como FACE, da Faculdade de Ciências Econômicas da UFMG). É o dono de sócios, mensalidades e diretores.
_Avoid_: Tenant, organização, clube

**Diretor**:
Papel de um usuário em uma atlética específica, que lhe permite administrar os sócios dela. Independe de o usuário ser sócio.
_Avoid_: Admin, administrador, gestor

### Pessoas e vínculo

**Usuário**:
Pessoa com conta na plataforma (nome completo, CPF, email, telefone, data de nascimento). É único na plataforma inteira, identificado pelo CPF, e pode se relacionar com várias atléticas. Ter conta não implica ser sócio.
_Avoid_: Conta, cliente, membro

**Sócio**:
Usuário que possui uma sociedade ativa com a atlética; paga mensalidade e tem direito a todas as modalidades e a desconto nos produtos da atlética.
_Avoid_: Atleta sócio, associado, membro

**Sociedade**:
O vínculo entre um usuário e uma atlética que o torna sócio. Está sempre em exatamente um estado: pendente, ativa ou encerrada.
_Avoid_: Assinatura, plano, matrícula

**Sociedade pendente**:
Sociedade solicitada pelo usuário que aguarda um diretor confirmar o primeiro pagamento.
_Avoid_: Pré-cadastro, aguardando aprovação

**Ativação**:
Ato de um diretor tornar ativa uma sociedade pendente, registrando junto o pagamento da primeira mensalidade.
_Avoid_: Aprovação, aceite

**Recusa**:
Ato de um diretor encerrar uma sociedade pendente que não será ativada.
_Avoid_: Rejeição, exclusão

**Sociedade ativa**:
Sociedade vigente; gera uma mensalidade a cada competência.
_Avoid_: Sócio ativo (ambíguo com "em dia")

**Sociedade encerrada**:
Sociedade que deixou de vigorar; não gera mais mensalidades, mas seu histórico é mantido.
_Avoid_: Cancelada, inativa, excluída

### Cobrança

**Mensalidade**:
A cobrança de um sócio referente a uma competência, com valor e data de vencimento.
_Avoid_: Fatura, boleto, cobrança

**Valor da mensalidade**:
Quantia única cobrada de todos os sócios de uma atlética por competência (ex.: R$60).
_Avoid_: Preço, taxa

**Dia de vencimento**:
Dia fixo do mês, definido por atlética, em que vencem as mensalidades (ex.: dia 10). Não há tolerância após ele.
_Avoid_: Prazo, data limite

**Registro de pagamento**:
Ato de um diretor declarar uma mensalidade como paga, após o sócio pagar fora do sistema (ex.: PIX para a chave da atlética).
_Avoid_: Baixa, quitação, confirmação

**Competência**:
O mês de referência de uma mensalidade (ex.: 2026-09).
_Avoid_: Mês de referência, período

**Em dia**:
Situação do sócio que não possui nenhuma mensalidade vencida e não paga. Sempre derivada das mensalidades, nunca definida manualmente.
_Avoid_: Adimplente, regular, ativo

**Inadimplente**:
Situação do sócio que possui ao menos uma mensalidade vencida e não paga. Sempre derivada das mensalidades.
_Avoid_: Atrasado, devedor, irregular

**Situação**:
Classificação derivada de um sócio com sociedade ativa: em dia ou inadimplente. Não se aplica a sociedades pendentes ou encerradas.
_Avoid_: Status (ambíguo com o estado da sociedade)
