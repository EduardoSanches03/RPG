# AGENTS.md

## Objetivo
Garantir que toda implementacao mantenha a estabilidade do projeto, nao introduza regressao
e siga a arquitetura Domain-Driven Design definida para o projeto.

---

## Fluxo obrigatorio para qualquer implementacao

1. Ler a estrutura de `apps/api/src/modules/` e `apps/public/src/`
2. Identificar em qual modulo (Bounded Context) a feature pertence
3. Se nao existir um modulo adequado, propor a criacao antes de codar
4. Implementar seguindo a estrutura de camadas obrigatoria abaixo
5. Rodar os testes com `npm test`
6. Se algum teste falhar: corrigir e rodar `npm test` novamente
7. So fazer commit quando **todos** os testes estiverem passando

---

## Estrutura obrigatoria por modulo

Cada modulo em `apps/api/src/modules/[modulo]/` deve seguir:
```
[modulo]/
  domain/
    entities/          # classes com identidade e invariantes protegidos
    value-objects/     # objetos imutaveis sem identidade
    aggregates/        # aggregate roots
    repositories/      # interfaces apenas, sem implementacao
    events/            # domain events

  application/
    use-cases/         # um arquivo por caso de uso
    ports/             # input/output DTOs dos use cases

  infrastructure/
    repositories/      # implementacoes concretas (ex: Prisma)
    external/          # integracoes externas

  presentation/
    controllers/
    view-models/

  [modulo].module.ts
```

---

## Regras de arquitetura inviolaveis

- NUNCA colocar logica de negocio em controllers ou use cases
- NUNCA importar um modulo diretamente dentro de outro modulo
- NUNCA criar setters publicos em entidades — usar metodos de dominio
- NUNCA implementar repositorio na camada `domain/` (so interfaces)
- Comunicacao entre modulos: SOMENTE via Domain Events
- Repositorios recebem e retornam objetos de dominio, nunca entidades ORM
- Um Use Case = uma responsabilidade = um arquivo

---

## Regras de teste

- Nunca fazer commit com testes falhando
- Nunca quebrar testes existentes ao implementar algo novo
- Sempre que criar uma nova funcao, escrever testes para ela no mesmo ciclo
- Em alteracoes que impactem comportamento existente, atualizar os testes sem remover cobertura valida anterior

## Comando padrao de teste
`npm test`

---

## Regras de migration (Supabase)

- Sempre que houver arquivo novo/alterado em `supabase/migrations/`, aplicar as migrations no banco remoto antes de finalizar a tarefa
- Comando padrao para aplicar migration remota:
`npm run db:migrate:remote`
- Comando para validar status:
`npm run db:migrations:list`
- Se a migration falhar, corrigir o SQL e rodar novamente ate aplicar com sucesso
- Nunca considerar tarefa concluida com migration pendente quando houve mudanca em `supabase/migrations/`

---

## Checklist antes de cada commit

- [ ] A feature esta no modulo correto?
- [ ] Existe interface do repositorio em `domain/repositories/`?
- [ ] A implementacao esta em `infrastructure/repositories/`?
- [ ] O use case nao contem regra de negocio?
- [ ] A entidade protege seus invariantes?
- [ ] Nenhum modulo importa outro diretamente?
- [ ] Todos os testes passando com `npm test`?
