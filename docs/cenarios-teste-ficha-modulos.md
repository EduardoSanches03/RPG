# Cenarios de Teste - Ficha de Personagem (Todos os Modulos)

Data: 2026-03-24  
Escopo: `CharacterSheetPage` + acoes de `RpgDataProvider`

## Fluxos gerais da ficha

### CT-SHEET-CORE-001 - Abre ficha por id valido
Given um personagem existente  
When o usuario acessa `/characters/:id`  
Then a ficha deve ser renderizada com os modulos do personagem

### CT-SHEET-CORE-002 - Redireciona quando id nao existe
Given um id de personagem inexistente  
When a pagina da ficha carregar  
Then deve navegar para `/characters`

### CT-SHEET-CORE-003 - Adiciona modulo pelo menu flutuante
Given a ficha aberta  
When o usuario clica em "Adicionar Modulo" e seleciona um modulo  
Then `addCharacterModule` deve ser chamado com `type` e `system` corretos

### CT-SHEET-CORE-004 - Remove modulo pela acao de lixeira
Given um modulo visivel na ficha  
When o usuario clica na acao "Remover modulo"  
Then `removeCharacterModule` deve remover o modulo da grade

### CT-SHEET-CORE-005 - Persiste notas gerais do modulo
Given um modulo com botao de notas  
When o usuario abre o modal, digita e fecha  
Then `module.notes` deve ser salvo via `updateCharacterModule`

### CT-SHEET-CORE-006 - Ordena modulos pela prioridade da grade
Given multiplos modulos com layout definido  
When a grade for renderizada  
Then a ordem visual deve respeitar `column`, `span` e `rowSpan`

## Modulo: COMBATE (`combat_stats`)

### CT-SHEET-COMBAT-001 - Exibe atributos de combate para Savage Pathfinder
Given personagem `savage_pathfinder`  
When o modulo combate for renderizado  
Then devem aparecer `MOVIMENTO`, `APARAR` e `RESISTENCIA`

### CT-SHEET-COMBAT-002 - Atualiza fadiga pela trilha de dano
Given modulo combate Savage aberto  
When o usuario marca `-1` ou `-2` na trilha de fadiga  
Then `stats.fatigue` deve ser atualizado no personagem

### CT-SHEET-COMBAT-003 - Atualiza ferimentos pela trilha de dano
Given modulo combate Savage aberto  
When o usuario marca `-1`, `-2` ou `-3` em ferimentos  
Then `stats.wounds` deve ser atualizado no personagem

### CT-SHEET-COMBAT-004 - Alterna estado incapacitado
Given modulo combate Savage aberto  
When o usuario clica em `INC`  
Then `stats.isIncapacitated` deve alternar entre `true` e `false`

### CT-SHEET-COMBAT-005 - Atualiza movimento/aparar/resistencia em modo edicao
Given painel de edicao do combate aberto  
When o usuario altera `pace`, `parry` e `toughness`  
Then os valores devem ser persistidos em `stats`

## Modulo: ATRIBUTOS (`attributes`)

### CT-SHEET-ATTR-001 - Exibe 5 atributos base
Given modulo atributos renderizado  
When a tela carregar  
Then devem aparecer `AGILIDADE`, `ASTUCIA`, `ESPIRITO`, `FORCA`, `VIGOR`

### CT-SHEET-ATTR-002 - Seleciona dado de atributo
Given atributo com dado atual  
When o usuario clica em um `DieShape` (d4, d6, d8, d10, d12)  
Then `updateCharacterAttributes` deve salvar o novo valor

### CT-SHEET-ATTR-003 - Mantem atributos nao alterados
Given alteracao de um atributo especifico  
When o update for aplicado  
Then os demais atributos devem permanecer com valor anterior

## Modulo: PERICIAS (`skills`)

### CT-SHEET-SKILL-001 - Adiciona pericia vazia
Given modulo pericias aberto  
When o usuario clica em "Adicionar Pericia"  
Then deve criar item com `id`, `name` vazio e `die` padrao

### CT-SHEET-SKILL-002 - Edita nome e dado da pericia
Given uma pericia existente  
When o usuario altera nome e dado  
Then os campos devem ser persistidos em `module.data.skills`

### CT-SHEET-SKILL-003 - Abre/salva nota da pericia
Given uma pericia existente  
When o usuario abre notas da pericia e salva texto  
Then `skill.notes` deve ser atualizado

### CT-SHEET-SKILL-004 - Remove pericia
Given uma pericia existente  
When o usuario clica em remover  
Then o item deve sair da lista

## Modulo: COMPLICACOES (`hindrances`)

### CT-SHEET-HIND-001 - Adiciona complicacao
Given modulo complicacoes aberto  
When o usuario clica em "Adicionar Complicacao"  
Then deve criar registro com `id` e `name`

### CT-SHEET-HIND-002 - Define tipo MENOR/MAIOR
Given uma complicacao existente  
When o usuario seleciona `MENOR` ou `MAIOR`  
Then `hindrance.type` deve ser persistido

### CT-SHEET-HIND-003 - Edita nome e nota da complicacao
Given uma complicacao existente  
When o usuario altera nome e salva notas  
Then `name` e `notes` devem ser persistidos

### CT-SHEET-HIND-004 - Migra modulo legado `text_block`
Given um modulo do tipo `text_block` com linhas de texto  
When o efeito de migracao executar  
Then o modulo deve virar `hindrances` com itens convertidos por linha

### CT-SHEET-HIND-005 - Remove complicacao
Given uma complicacao existente  
When o usuario remove  
Then o item deve sair da lista

## Modulo: HABILIDADES ANCESTRAIS (`ancestral_abilities`)

### CT-SHEET-ANCESTRAL-001 - Adiciona habilidade ancestral
Given modulo habilidades ancestrais aberto  
When o usuario clica em "Adicionar Habilidade"  
Then deve criar item com `id` e `name` vazio

### CT-SHEET-ANCESTRAL-002 - Edita nome da habilidade
Given habilidade existente  
When o usuario altera o campo nome  
Then a alteracao deve ser persistida

### CT-SHEET-ANCESTRAL-003 - Salva nota da habilidade
Given habilidade existente  
When o usuario salva nota individual  
Then `ability.notes` deve ser persistido

### CT-SHEET-ANCESTRAL-004 - Remove habilidade ancestral
Given habilidade existente  
When o usuario remove  
Then o item deve sair da lista

## Modulo: VANTAGENS E PROGRESSOS (`edges_advancements`)

### CT-SHEET-EDGE-001 - Adiciona vantagem
Given modulo vantagens aberto  
When o usuario clica em "Adicionar Vantagem"  
Then deve criar item em `module.data.edges`

### CT-SHEET-EDGE-002 - Edita nome da vantagem
Given vantagem existente  
When o usuario altera nome  
Then `edge.name` deve ser persistido

### CT-SHEET-EDGE-003 - Salva nota da vantagem
Given vantagem existente  
When o usuario salva nota individual  
Then `edge.notes` deve ser persistido

### CT-SHEET-EDGE-004 - Remove vantagem
Given vantagem existente  
When o usuario remove  
Then o item deve sair da lista

### CT-SHEET-ADV-001 - Edita progresso por slot
Given slots de progresso (`N1`..`L3`)  
When o usuario digita valor em um slot  
Then `advancements[slotId].value` deve ser atualizado

### CT-SHEET-ADV-002 - Salva nota por slot de progresso
Given um slot de progresso preenchido  
When o usuario salva nota do slot  
Then `advancements[slotId].notes` deve ser persistido

## Modulo: EQUIPAMENTO (`equipment`)

### CT-SHEET-EQP-001 - Define ouro inicial
Given modulo equipamento aberto  
When o usuario altera "Ouro Inicial"  
Then `module.data.baseGold` deve ser atualizado

### CT-SHEET-EQP-002 - Adiciona item de equipamento
Given modulo equipamento aberto  
When o usuario clica em "Adicionar Item"  
Then deve criar item com `name`, `cost`, `weight`

### CT-SHEET-EQP-003 - Edita nome/valor/peso do item
Given item existente  
When o usuario altera os campos  
Then os valores devem ser persistidos

### CT-SHEET-EQP-004 - Salva nota do item
Given item existente  
When o usuario salva nota individual  
Then `item.notes` deve ser persistido

### CT-SHEET-EQP-005 - Calcula peso total
Given itens com pesos diferentes  
When a lista for exibida  
Then "PESO TOTAL" deve ser a soma dos pesos

### CT-SHEET-EQP-006 - Calcula ouro restante
Given `baseGold` e custo total dos itens  
When a lista for exibida  
Then "OURO RESTANTE" deve ser `baseGold - totalCost`

### CT-SHEET-EQP-007 - Remove item de equipamento
Given item existente  
When o usuario remove  
Then o item deve sair da lista

## Modulo: PONTOS DE PODER (`power_points`)

### CT-SHEET-PP-001 - Exibe valor atual e maximo
Given modulo pontos de poder aberto  
When renderiza  
Then deve mostrar `current / max` e barra proporcional

### CT-SHEET-PP-002 - Incrementa e decrementa PP
Given valores atuais de PP  
When o usuario clica em `-` ou `+`  
Then `current` deve variar sem passar de `0..max`

### CT-SHEET-PP-003 - Reseta PP para maximo
Given `current < max`  
When o usuario clica no botao de reset  
Then `current` deve virar `max`

### CT-SHEET-PP-004 - Atualiza maximo de PP
Given campo `MAXIMO` visivel  
When o usuario altera o valor  
Then `module.data.max` deve ser persistido

## Modulo: PODERES (`powers`)

### CT-SHEET-POWER-001 - Adiciona poder
Given modulo poderes aberto  
When o usuario clica em "Adicionar Poder"  
Then deve criar item com `name`, `powerPoints`, `range`, `duration`, `effect`

### CT-SHEET-POWER-002 - Edita campos do poder
Given poder existente  
When o usuario altera nome, PP, alcance, duracao e efeito  
Then os campos devem ser persistidos

### CT-SHEET-POWER-003 - Gasta PP via poder
Given modulo `power_points` presente e poder com custo > 0  
When o usuario clica em gastar PP no poder  
Then `power_points.current` deve reduzir respeitando limite minimo 0

### CT-SHEET-POWER-004 - Desabilita gasto sem modulo PP
Given personagem sem modulo `power_points`  
When o modulo poderes renderiza  
Then o botao de gasto deve ficar desabilitado

### CT-SHEET-POWER-005 - Remove poder
Given poder existente  
When o usuario remove  
Then o item deve sair da lista

## Modulo: ARMAS (`weapons`)

### CT-SHEET-WPN-001 - Adiciona arma
Given modulo armas aberto  
When o usuario clica em "Adicionar Arma"  
Then deve criar item com `name`, `range`, `damage`, `ap`, `rof`, `weight`, `notes`

### CT-SHEET-WPN-002 - Edita campos principais da arma
Given arma existente  
When o usuario altera nome, distancia e dano  
Then os campos devem ser persistidos

### CT-SHEET-WPN-003 - Edita atributos numericos da arma
Given arma existente  
When o usuario altera `ap`, `rof` e `weight`  
Then os valores devem ser persistidos

### CT-SHEET-WPN-004 - Salva observacoes da arma
Given arma existente  
When o usuario altera textarea de observacoes  
Then `weapon.notes` deve ser persistido

### CT-SHEET-WPN-005 - Remove arma
Given arma existente  
When o usuario remove  
Then o item deve sair da lista

## Fluxo de menu de modulos

### CT-SHEET-MENU-001 - Mostra tag "Adicionado" para modulo existente
Given modulo ja presente na ficha  
When o menu de adicionar for aberto  
Then o item correspondente deve exibir tag "Adicionado"

### CT-SHEET-MENU-002 - Botao "Bloco de Texto (Em breve)" desabilitado
Given menu de modulos aberto  
When usuario visualizar secao "Generico"  
Then "Bloco de Texto (Em breve)" deve estar desabilitado

