# Backend - Stack Recomendada (Fase Inicial)

Data: 2026-03-24  
Status: Recomendacao tecnica

## 1) Recomendacao

Para **A Taverna**, recomendo iniciar com:

1. `NestJS` (API HTTP)
2. `PostgreSQL` (fonte de verdade)
3. `Prisma` (acesso a dados e migrations)
4. `Zod` para contratos/validacao de payloads na fronteira
5. `Vitest` para testes unitarios e integracao rapida

## 2) Por que essa stack para aprender

- `NestJS` reforca organizacao por modulos e camadas
- Facilita aplicar DDD + Hexagonal sem improviso
- `Prisma` acelera produtividade sem esconder SQL importante
- `PostgreSQL` prepara para escala real e consultas robustas

## 3) Alternativas consideradas

### Fastify puro + Drizzle

Pros:

- Mais leve e direto
- Excelente performance

Contras:

- Exige mais disciplina manual para manter arquitetura
- Curva de organizacao maior no time, no inicio

### Express + Sequelize

Pros:

- Ecossistema amplo

Contras:

- Menos aderente ao que queremos aprender agora
- Maior chance de acoplamento em projeto que vai crescer

## 4) Decisao pratica para o projeto

Escolha inicial: **NestJS + PostgreSQL + Prisma**.

Motivo central: velocidade de entrega com estrutura forte para escalar modulo a modulo.

## 5) Escopo da primeira iteracao (sem big bang)

1. Subir `apps/api` com modulo `character`
2. Implementar apenas os endpoints de `combat-state` e `power-points`
3. Conectar frontend em feature flag (dual-write local + API)
4. Medir latencia e conflitos de revisao

## 6) Ferramentas de apoio recomendadas

- `Docker Compose` para Postgres local
- `OpenAPI` para documentar contratos automaticamente
- `Pino` para logs estruturados
- `eslint` + `prettier` padrao no backend

