# ADR 0001 - Arquitetura Backend Inicial

Data: 2026-03-24  
Status: Accepted

## Contexto

O projeto **A Taverna** nasceu como frontend-first com persistencia local/offline e sincronizacao opcional com Supabase.

Com o crescimento esperado da aplicacao, precisamos:

- reduzir acoplamento entre regra de RPG e tecnologia
- suportar escalabilidade sem reescrever tudo
- permitir evolucao por modulos e sem Big Bang

## Decisao

Adotar no backend:

1. **Monolito modular**
2. **DDD estrategico e tatico**
3. **Arquitetura Hexagonal (Ports and Adapters)**
4. **CQRS leve** (separacao de comandos e consultas onde fizer sentido)

Stack base escolhida:

- `NestJS`
- `PostgreSQL`
- `Prisma`

## Consequencias

Positivas:

- Regras de dominio desacopladas de banco e HTTP
- Melhor testabilidade dos casos de uso
- Caminho claro para adicionar novos sistemas de RPG
- Base mais segura para extracao futura de servicos, se necessario

Negativas:

- Mais estrutura inicial
- Curva de aprendizado em DDD/Hexagonal
- Overhead moderado para funcionalidades pequenas

## Riscos e mitigacoes

Risco: implementar "DDD de pasta" sem regra real no dominio.  
Mitigacao: validar em code review que regras fiquem em entidades/use cases.

Risco: migracao interromper fluxo offline atual.  
Mitigacao: fase de dual-write com feature flag e rollback simples.

Risco: excesso de abstracao precoce.  
Mitigacao: comecar com modulo `character` e expandir por necessidade.

## Plano de adocao

1. Criar `apps/api` com modulo `character`
2. Implementar contrato `combat-state` v1
3. Integrar frontend em dual-write controlado
4. Expandir para `campaign` e `session`

## Referencias

- `docs/arquitetura-hexagonal-ddd.md`
- `docs/api-character-v1.md`
- `docs/backend-stack-recomendado.md`

