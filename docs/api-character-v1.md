# API v1 - Character (Contrato Inicial)

Este documento define o contrato inicial de API para o modulo `character`.

Data: 2026-03-24  
Status: Aprovado para implementacao gradual no frontend

## 1) Objetivo

Cobrir primeiro o estado de combate e recursos usados no card:

- `wounds` (ferimentos)
- `fatigue` (fadiga)
- `powerPointsCurrent` (pontos de poder atuais)
- `powerPointsMax` (pontos de poder maximos)
- `isIncapacitated`

## 2) Convencoes Gerais

- Base path: `/api/v1`
- Auth: `Bearer token` (usuario autenticado)
- Timezone: ISO 8601 UTC no backend; formatacao local no frontend
- Content-Type: `application/json`
- Controle otimista: campo `revision` (inteiro)

## 3) Modelo Base (Response)

```json
{
  "id": "char_123",
  "campaignId": "camp_456",
  "name": "Thorg, Olho Quebrado",
  "system": "savage_pathfinder",
  "combatState": {
    "wounds": 1,
    "fatigue": 0,
    "isIncapacitated": false,
    "powerPointsCurrent": 8,
    "powerPointsMax": 10
  },
  "revision": 12,
  "updatedAt": "2026-03-24T12:30:00.000Z"
}
```

## 4) Endpoints v1

### 4.1 GET `/api/v1/characters/:characterId`

Retorna a ficha resumida necessaria para card e tela de personagem.

Resposta `200`:

```json
{
  "id": "char_123",
  "campaignId": "camp_456",
  "name": "Thorg, Olho Quebrado",
  "system": "savage_pathfinder",
  "combatState": {
    "wounds": 1,
    "fatigue": 0,
    "isIncapacitated": false,
    "powerPointsCurrent": 8,
    "powerPointsMax": 10
  },
  "revision": 12,
  "updatedAt": "2026-03-24T12:30:00.000Z"
}
```

### 4.2 PATCH `/api/v1/characters/:characterId/combat-state`

Atualiza estado de combate de forma atomica.

Request:

```json
{
  "wounds": 2,
  "fatigue": 1,
  "isIncapacitated": false,
  "powerPointsCurrent": 7,
  "revision": 12
}
```

Regras:

- `wounds` entre `0` e `3` para Savage Pathfinder
- `fatigue` entre `0` e `2` para Savage Pathfinder
- `powerPointsCurrent` entre `0` e `powerPointsMax`
- `revision` obrigatoria para evitar sobrescrita concorrente

Resposta `200`:

```json
{
  "id": "char_123",
  "combatState": {
    "wounds": 2,
    "fatigue": 1,
    "isIncapacitated": false,
    "powerPointsCurrent": 7,
    "powerPointsMax": 10
  },
  "revision": 13,
  "updatedAt": "2026-03-24T12:35:00.000Z"
}
```

### 4.3 POST `/api/v1/characters/:characterId/power-points/spend`

Operacao semantica para gasto de PP.

Request:

```json
{
  "amount": 2,
  "reason": "Lancar Rajada",
  "revision": 13
}
```

Resposta `200`:

```json
{
  "id": "char_123",
  "combatState": {
    "wounds": 2,
    "fatigue": 1,
    "isIncapacitated": false,
    "powerPointsCurrent": 5,
    "powerPointsMax": 10
  },
  "revision": 14,
  "updatedAt": "2026-03-24T12:36:10.000Z"
}
```

### 4.4 POST `/api/v1/characters/:characterId/wounds/apply`

Aplica `+1` ferimento respeitando limite do sistema.

Request:

```json
{
  "revision": 14
}
```

Resposta `200`: mesmo formato da secao 4.3.

### 4.5 POST `/api/v1/characters/:characterId/fatigue/apply`

Aplica `+1` fadiga respeitando limite do sistema.

Request:

```json
{
  "revision": 14
}
```

Resposta `200`: mesmo formato da secao 4.3.

## 5) Erros Padrao

Formato:

```json
{
  "error": {
    "code": "REVISION_CONFLICT",
    "message": "A ficha foi atualizada por outro cliente.",
    "details": {
      "currentRevision": 15
    }
  }
}
```

Codigos iniciais:

- `UNAUTHORIZED` (`401`)
- `FORBIDDEN` (`403`)
- `NOT_FOUND` (`404`)
- `VALIDATION_ERROR` (`422`)
- `REVISION_CONFLICT` (`409`)
- `INVARIANT_VIOLATION` (`422`)

## 6) Regras de Dominio (Savage Pathfinder)

- Ferimentos: `0..3`
- Fadiga: `0..2`
- Incapacitado: estado booleano explicito
- Pontos de poder:
  - `powerPointsMax >= 0`
  - `0 <= powerPointsCurrent <= powerPointsMax`

## 7) Evolucao Planejada (v1.x)

- Incluir endpoint de recuperacao:
  - `POST /characters/:id/wounds/recover`
  - `POST /characters/:id/fatigue/recover`
- Incluir trilha de eventos de combate para auditoria
- Incluir idempotency key para comandos criticos

## 8) Implementacao frontend (fase 4)

- Contrato validado em testes automatizados:
  - `src/services/characterApiV1.test.ts`
- Dual-write controlado por feature flag:
  - `VITE_FEATURE_CHARACTER_V1_DUAL_WRITE=true`
- Base URL da API v1 (opcional):
  - `VITE_CHARACTER_API_BASE_URL` (default: `/api/v1`)
- Testes de conflito de `revision` cobertos em:
  - `src/services/characterDualWrite.test.ts`
