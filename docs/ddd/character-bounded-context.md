# Character Bounded Context (Backend)

## Ubiquitous Language (RPG)

- `Personagem`: protagonista controlado por jogador dentro de uma campanha.
- `Estado de Combate`: estado operacional usado em cena (ferimentos, fadiga, incapacitado, pontos de poder).
- `Ferimentos`: trilha de dano fisico (`0..3` em Savage Pathfinder).
- `Fadiga`: trilha de exaustao (`0..2` em Savage Pathfinder).
- `Pontos de Poder`: recurso de conjuracao (`current <= max`).
- `Revisao`: versao otimista do agregado para evitar sobrescrita concorrente.
- `Conflito de Revisao`: tentativa de atualizar com revisao antiga.
- `Snapshot`: representacao serializavel do agregado para persistencia/transporte.

## Modelo de Dominio (Mermaid)

```mermaid
classDiagram
  class CharacterAggregate {
    -CharacterProfile profile
    -CombatState combatState
    -Revision revision
    -Date updatedAt
    -DomainEvent[] pendingEvents
    +reconstitute(snapshot)
    +patchCombatState(commandRevision, nextCombatState, now)
    +toSnapshot()
    +pullDomainEvents()
  }

  class CharacterProfile {
    -CharacterId id
    -string campaignId
    -string name
    -string system
  }

  class CharacterId {
    -string value
    +create(raw)
    +toString()
  }

  class Revision {
    -number value
    +create(value)
    +equals(other)
    +next()
    +toNumber()
  }

  class CombatState {
    -number wounds
    -number fatigue
    -boolean isIncapacitated
    -number powerPointsCurrent
    -number powerPointsMax
    +create(input)
    +toPrimitives()
  }

  class CombatStatePolicy {
    +validate(system, combatState)
  }

  class CharacterCombatStatePatchedEvent {
    +characterId
    +revision
    +occurredAt
  }

  CharacterAggregate --> CharacterProfile
  CharacterAggregate --> CombatState
  CharacterAggregate --> Revision
  CharacterAggregate --> CharacterCombatStatePatchedEvent
  CharacterAggregate ..> CombatStatePolicy
  CharacterProfile --> CharacterId
```

## Invariantes protegidos

- Revisao deve ser inteiro nao-negativo.
- Patch de combate so aceita revisao igual a revisao atual do agregado.
- `powerPointsCurrent` deve ser inteiro nao-negativo e `<= powerPointsMax`.
- Em `savage_pathfinder`: `wounds` em `0..3` e `fatigue` em `0..2`.
