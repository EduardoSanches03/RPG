# Arquitetura Alvo: DDD + Hexagonal (Ports and Adapters)

Este documento descreve o plano de evolucao do projeto **A Taverna** para backend escalavel, sem implementar tudo de uma vez.

## 1) Objetivo

Separar regras de negocio (RPG) da tecnologia (HTTP, banco, Supabase, SQLite), para que:

- o dominio continue estavel quando o storage mudar
- testes de regra sejam simples
- novos sistemas de RPG sejam adicionados sem acoplamento forte

## 2) Modelo Mental

Hexagonal = Dominio no centro.

- **Ports**: interfaces que o dominio usa ou expoe
- **Adapters**: implementacoes dessas interfaces

Exemplo:

- Porta de saida: `CharacterRepositoryPort`
- Adaptadores de saida: Postgres, Supabase, SQLite
- Porta de entrada: caso de uso `SpendPowerPointsUseCase`
- Adaptador de entrada: endpoint HTTP `POST /characters/:id/power-points/spend`

## 3) Camadas (por modulo)

Cada modulo de negocio (Character, Campaign, Session, Ruleset) segue:

1. `domain/`
- entidades
- value objects
- regras e eventos de dominio
- interfaces de repositorio (ports)

2. `application/`
- casos de uso
- comandos/queries
- orquestracao de transacao

3. `infrastructure/`
- controllers HTTP
- repositorios concretos
- mapeadores ORM
- integracoes externas

## 4) Estrutura Sugerida (alvo)

```text
apps/
  web/                    # frontend atual
  api/                    # novo backend
    src/
      modules/
        character/
          domain/
            entities/
            value-objects/
            events/
            ports/
          application/
            commands/
            queries/
            use-cases/
          infrastructure/
            http/
            persistence/
            mappers/
        campaign/
        session/
        ruleset/
      shared/
        domain/
        application/
        infrastructure/
packages/
  contracts/              # DTOs e schemas compartilhados
```

## 5) Exemplo Mini (Character)

### 5.1 Porta de repositorio (domain/ports)

```ts
export interface CharacterRepositoryPort {
  findById(id: string): Promise<Character | null>;
  save(character: Character): Promise<void>;
}
```

### 5.2 Caso de uso (application/use-cases)

```ts
type SpendPowerPointsInput = {
  characterId: string;
  amount: number;
};

export class SpendPowerPointsUseCase {
  constructor(private readonly characters: CharacterRepositoryPort) {}

  async execute(input: SpendPowerPointsInput) {
    const character = await this.characters.findById(input.characterId);
    if (!character) throw new Error("Character not found");

    character.spendPowerPoints(input.amount); // regra no dominio
    await this.characters.save(character);
  }
}
```

### 5.3 Entidade (domain/entities)

```ts
export class Character {
  constructor(
    public readonly id: string,
    private wounds: number,
    private fatigue: number,
    private powerPointsCurrent: number,
    private powerPointsMax: number,
  ) {}

  applyWound() {
    this.wounds = Math.min(3, this.wounds + 1);
  }

  recoverWound() {
    this.wounds = Math.max(0, this.wounds - 1);
  }

  spendPowerPoints(amount: number) {
    if (amount < 0) throw new Error("Invalid amount");
    this.powerPointsCurrent = Math.max(0, this.powerPointsCurrent - amount);
  }
}
```

## 6) Bounded Contexts iniciais

1. **Character**
- ficha
- ferimentos/fadiga
- pontos de poder
- atributos e modulos

2. **Campaign**
- campanha ativa
- relacao jogadores/personagens

3. **Session**
- agenda
- historico
- notas de sessao

4. **Ruleset**
- regras por sistema (`savage_pathfinder`, futuros sistemas)
- limites e calculos especificos

5. **Identity**
- autenticacao/autorizacao
- relacao user -> campaign

## 7) Roadmap Gradual (sem Big Bang)

Fase 1 (fundacao):

- criar backend com 1 modulo (`character`)
- expor endpoints de leitura/escrita de estado de combate:
  - `PATCH /characters/:id/combat-state` (wounds, fatigue, ppCurrent)
- manter frontend atual usando storage local

Fase 2 (dual-write controlado):

- frontend escreve local + API (feature flag)
- comparar respostas para validar consistencia

Fase 3 (fonte primaria no backend):

- backend vira source of truth
- SQLite/local fica como cache offline

Fase 4 (expansao):

- campaign/session/ruleset
- eventos de dominio + outbox

## 8) Regras de ouro

- Dominio nao importa framework, ORM, React ou Supabase
- Use case nao conhece HTTP
- Controller nao contem regra de negocio
- Mudanca de banco nao muda regra de RPG

