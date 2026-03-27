# A Taverna API (Backend Inicial)

Backend inicial em NestJS seguindo DDD + Hexagonal para o modulo `character`.

## Endpoints implementados (v1)

- `GET /api/v1/characters/:characterId`
- `PATCH /api/v1/characters/:characterId/combat-state`
- `GET /api/v1/rpg-data?userId=<id>`
- `PUT /api/v1/rpg-data?userId=<id>`

## Como rodar (quando dependencias forem instaladas em `apps/api`)

```bash
npm install
npm run dev
```

API sobe por padrao na porta `3333` (ou `API_PORT`).
