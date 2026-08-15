# Basic Project Rules.md

## Objetivo

Este documento define as regras gerais para qualquer projeto desenvolvido ou mantido com auxílio de Inteligência Artificial.

As regras aqui descritas são independentes de linguagem, framework, banco de dados, plataforma ou ferramenta de versionamento utilizada.

---

# Princípios Gerais

## Ordem de Decisão (Prioridade)

Quando houver conflito entre objetivos, utilizar a seguinte ordem de prioridade:

1. Segurança
2. Correção
3. Simplicidade
4. Manutenibilidade
5. Performance
6. Estética do código

## O que Evitar Explicitamente

- Dependências pesadas para resolver problemas simples.
- Arquiteturas excessivamente abstratas.
- Abstrações prematuras.
- Refatorações amplas sem necessidade comprovada.
- Alterações não relacionadas ao problema solicitado.
- Mudanças de comportamento não solicitadas.
- Alterações em projetos que não sejam o projeto atual, caso seja necessário alteração em outro projeto documente o que precisa e não sera vc a fazer.

---

# Estrutura de Contexto

Todo projeto deve possuir o diretório:

```text
/Contextos
```

Arquivos recomendados:

```text
/Contextos/Chat.log
/Contextos/Decisoes.md
/Contextos/Conhecimento.md
/Contextos/Ambientes.md
/Contextos/Convencoes.md
```

---

# Chat.log

O arquivo:

```text
/Contextos/Chat.log
```

é considerado parte da documentação oficial do projeto.

## Objetivo

Manter um histórico cronológico permanente das interações relevantes entre usuários e agentes de IA.

## Regras

- Append-only.
- Nunca apagar conteúdo existente.
- Nunca alterar registros anteriores.
- Nunca resumir registros antigos.
- Sempre acrescentar novos registros ao final do arquivo.
- Sempre registrar:
  - Data e hora.
  - Usuário.
  - Agente utilizado.
  - Conteúdo da interação.

## Formato sugerido

```text
================================================================================
DATA: 2026-06-22 17:15:42
USUÁRIO: nome-do-usuario
AGENTE: nome-do-agente
================================================================================

Usuário:
Texto original da interação.

Agente:
Texto original da resposta.
```

Sempre que um novo agente iniciar trabalho no projeto, o Chat.log deve ser consultado previamente.

---

# Decisões Arquiteturais

Decisões importantes devem ser registradas em:

```text
/Contextos/Decisoes.md
```

Cada decisão deve conter:

- Data.
- Decisão tomada.
- Motivo.
- Alternativas consideradas (quando aplicável).

---

# Conhecimento Descoberto

Informações relevantes descobertas durante o desenvolvimento devem ser registradas em:

```text
/Contextos/Conhecimento.md
```

Objetivo:

Evitar redescoberta futura de informações importantes sobre o sistema.

---

# Ambientes

Sempre identificar o ambiente afetado:

- Desenvolvimento
- Homologação
- Produção

Na dúvida, assumir que o ambiente pode ser Produção.

Informações específicas devem ser registradas em:

```text
/Contextos/Ambientes.md
```

---

# Convenções

Convenções específicas do projeto devem ser documentadas em:

```text
/Contextos/Convencoes.md
```

Exemplos:

- Padrões de nomenclatura.
- Convenções de código.
- Estrutura de diretórios.
- Ferramentas adotadas.
- Regras de documentação.

---

# Gestão de Tarefas

O projeto deve possuir, quando aplicável:

```text
/Notas/TODO.md
```

## Regras

- Utilizar checklist Markdown.
- Agrupar tarefas por categoria.
- Atualizar conforme tarefas forem concluídas.
- Utilizar como fonte principal do backlog técnico.

---

# Controle de Versão Interno

Todo projeto deve possuir um arquivo de versão compatível com a linguagem principal utilizada.

## Exemplos

```text
version.php
version.py
version.bas
version.js
```

## Formato

```text
X.Y.Z
```

## Regras

- O sistema inicia na versão 0.0.0.
- Quando atingir a primeira versão utilizável, passa para 1.0.0.
- Correção ou ajuste: incrementar Z.
- Nova funcionalidade: incrementar Y e zerar Z.
- Alteração estrutural importante: incrementar X e zerar Y e Z.
- O usuário pode determinar manualmente qualquer versão.

## Histórico

O arquivo deve manter histórico contendo:

- Data.
- Versão.
- Descrição resumida.

Esse histórico poderá ser utilizado para geração de mensagens de commit.

---

# Arquivos Proibidos no Repositório

Os seguintes itens não devem ser incluídos em sistemas de versionamento (Git, SVN ou similares):

- Arquivos de variáveis de ambiente.
- Configurações sensíveis.
- Chaves privadas.
- Certificados privados.
- Credenciais.
- Arquivos reais de banco de dados, inclusive bancos embarcados em arquivo.
- Uploads reais de usuários.
- Logs de aplicação.
- Logs de servidor.
- Arquivos de cache.
- Dumps de banco de dados.
- Backups de produção.

Esses itens devem constar explicitamente nos mecanismos de exclusão da ferramenta de versionamento utilizada.

---

# Regras de Alteração

A IA deve:

- Corrigir apenas o problema solicitado.
- Evitar alterações não relacionadas.
- Preservar comportamento existente sempre que possível.
- Manter compatibilidade com funcionalidades existentes.

## Processo recomendado

1. Identificar a causa do problema.
2. Explicar a causa.
3. Propor a solução.
4. Obter validação do usuário quando necessário.
5. Implementar.

---

# Operações que Exigem Confirmação

A IA nunca deve executar automaticamente:

- Commit.
- Push.
- Pull.
- Merge.
- Rebase.
- Acesso remoto.
- Alterações em banco de dados.
- Migrations.
- Exclusão de dados.
- Reinício de serviços.
- Instalação ou atualização de software.

Antes dessas operações deve haver autorização explícita do usuário.

---

# Exclusão de Arquivos

Arquivos não devem ser removidos automaticamente.

Sempre que possível:

- Mover para diretório de backup.
- Mover para diretório de obsoletos.

A exclusão definitiva exige autorização explícita.

---

# Banco de Dados

Nenhuma tabela, view, índice ou estrutura crítica deve ser:

- removida;
- recriada;
- renomeada;

sem autorização explícita.

Mudanças devem priorizar:

- Compatibilidade.
- Reversibilidade.
- Preservação de dados.

---

# Princípio Fundamental

Se uma informação necessária não estiver disponível:

- Não assumir.
- Perguntar.

Quando uma suposição for inevitável, ela deve ser declarada explicitamente.
