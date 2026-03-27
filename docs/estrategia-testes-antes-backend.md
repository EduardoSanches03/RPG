# Estrategia de Testes (Antes do Backend)

Data: 2026-03-24  
Status: Em andamento

## Objetivo

Cobrir funcionalidades atuais para reduzir regressao durante migracao para backend.

## Fase 0 - Fundacao (concluida)

- Setup Vitest + Testing Library
- Scripts de teste no `package.json`
- Ambiente `jsdom` configurado no `vite.config.ts`

## Fase 1 - Dominio e Persistencia (iniciada)

- [x] `src/domain/savagePathfinder.test.ts`
- [x] `src/store/rpgStorage.test.ts`
- [x] `src/app/routes.test.ts`

## Fase 2 - Estado e Regras de Personagem

- [x] `RpgDataProvider` (acoes de update e invariantes em `src/store/RpgDataProvider.test.tsx`)
- [x] fluxo de ferimentos/fadiga/pp em componentes (`src/pages/CharacterSheetPage.test.tsx`)
- [x] fallback local quando nuvem indisponivel (`src/store/RpgDataProvider.test.tsx`)

## Fase 3 - Telas Principais

- [x] Dashboard
- [x] Lista de personagens (`src/pages/CharactersPage.test.tsx`)
- [x] Cenarios da ficha por modulo definidos (`docs/cenarios-teste-ficha-modulos.md`)
- [x] Ficha de personagem (primeira leva automatizada em `src/pages/CharacterSheetPage.test.tsx`)
- [x] Sessoes (primeira leva automatizada em `src/pages/SessionsPage.test.tsx`)
- [x] Notas

## Fase 4 - Integracao Frontend + API (quando backend iniciar)

- [x] contratos v1 de `character` (`src/services/characterApiV1.ts` + `src/services/characterApiV1.test.ts`)
- [x] dual-write controlado por feature flag (`src/services/featureFlags.ts` + `src/store/RpgDataProvider.tsx`)
- [x] testes de conflito de `revision` (`src/services/characterDualWrite.test.ts`)

## Criterio para iniciar backend

Minimo recomendado:

1. Suite de dominio/storage verde no CI
2. Cobertura dos fluxos criticos de personagem
3. Contratos v1 aprovados (`docs/api-character-v1.md`)
