# Cenarios de Teste - Criacao de Sessao

Data: 2026-03-24  
Escopo: tela `SessionsPage` + acao `addSession` no store

## CT-SESSION-001 - Botao desabilitado sem titulo

Given a tela de sessoes carregada  
When o campo "Titulo da Sessao" estiver vazio  
Then o botao "Criar Sessao" deve permanecer desabilitado

## CT-SESSION-002 - Habilita criacao com campos obrigatorios

Given a tela de sessoes carregada com data e hora padrao preenchidas  
When o usuario preencher um titulo valido  
Then o botao "Criar Sessao" deve ficar habilitado

## CT-SESSION-003 - Bloqueia titulo com apenas espacos

Given o usuario digitou somente espacos no titulo  
When o estado do formulario for avaliado  
Then o botao deve continuar desabilitado

## CT-SESSION-004 - Cria sessao com payload completo

Given titulo, data, hora, endereco, campanha e observacoes preenchidos  
When o usuario clicar em "Criar Sessao"  
Then a acao `addSession` deve ser chamada com:
- `title`
- `scheduledAtIso` (gerado de data + hora)
- `address`
- `campaignName`
- `notes`

## CT-SESSION-005 - Normaliza strings no store

Given os campos opcionais com espacos extras  
When `addSession` for processado pelo provider  
Then `title`, `address`, `campaignName` e `notes` devem ser salvos com `trim()`

## CT-SESSION-006 - Gera ISO valido para agendamento

Given data "2026-03-24" e hora "20:00"  
When a sessao for criada  
Then `scheduledAtIso` deve ser uma string ISO valida

## CT-SESSION-007 - Limpa campos apos criar

Given uma sessao criada com sucesso  
When a tela atualizar o formulario  
Then os campos `title`, `address` e `notes` devem ser limpos

## CT-SESSION-008 - Mantem campanha no formulario

Given o campo campanha preenchido  
When uma nova sessao for criada  
Then o valor de campanha deve permanecer no campo para agilizar proximas criacoes

## CT-SESSION-009 - Sessao aparece no historico

Given historico inicial sem a nova sessao  
When o usuario criar a sessao  
Then ela deve aparecer no card de "Historico de Sessoes"

## CT-SESSION-010 - Ordenacao do historico por data desc

Given multiplas sessoes com datas diferentes  
When o historico for renderizado  
Then a sessao mais recente deve aparecer primeiro

## CT-SESSION-011 - Formato brasileiro na exibicao

Given uma sessao criada com `scheduledAtIso` valido  
When o card for exibido  
Then data e hora devem aparecer no padrao `pt-BR` (`dd/mm/aaaa` e `HH:mm`)

## CT-SESSION-012 - Persistencia offline

Given indisponibilidade da nuvem (Supabase offline)  
When uma sessao for criada  
Then a sessao deve continuar salva localmente (`localStorage` + SQLite)

## CT-SESSION-013 - Integridade minima do registro

Given criacao de sessao valida  
When o registro for salvo  
Then deve conter `id`, `createdAtIso` e `scheduledAtIso` validos

## CT-SESSION-014 - Remocao nao afeta criacao futura

Given uma sessao criada e depois removida  
When o usuario criar nova sessao  
Then a criacao deve funcionar normalmente e sem erros de estado

