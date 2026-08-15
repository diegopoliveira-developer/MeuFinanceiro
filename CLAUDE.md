# MeuFinanceiro

**Antes de qualquer tarefa neste repositório, leia [`Contextos/LEIA-PRIMEIRO.md`](Contextos/LEIA-PRIMEIRO.md).**

Este projeto segue [`Contextos/Basic AI Project Rules.md`](Contextos/Basic%20AI%20Project%20Rules.md)
como norma de **prioridade máxima**. Em conflito com qualquer convenção deste repositório,
aquele documento vence.

**Todo o contexto necessário está em `Contextos/`.** Não há nada a consultar fora do
repositório — nenhuma pasta externa deve ser lida.

## Contexto do projeto — o que ler e QUANDO

Leia sob demanda, não tudo de uma vez. A coluna "Quando" existe para economizar contexto.

### Sempre (início de sessão)

| Arquivo | O que é |
| --- | --- |
| [`Contextos/Basic AI Project Rules.md`](Contextos/Basic%20AI%20Project%20Rules.md) | **Norma de prioridade máxima.** |
| [`Contextos/LEIA-PRIMEIRO.md`](Contextos/LEIA-PRIMEIRO.md) | Ordem de leitura e fluxo obrigatório de trabalho. |
| [`Contextos/Projeto.md`](Contextos/Projeto.md) | **O que é específico deste projeto** — identidade, escopo, domínio, stack, estado atual. |
| [`Contextos/Chat.log`](Contextos/Chat.log) | Histórico append-only — só o log ativo, não o `Historico/`. |

### Sob demanda, conforme a tarefa

| Arquivo | Ler quando |
| --- | --- |
| [`Contextos/Convencoes.md`](Contextos/Convencoes.md) | **Antes de escrever/alterar qualquer código.** Normativo. |
| [`Contextos/Ambientes.md`](Contextos/Ambientes.md) | Antes de rodar build ou testar. |
| [`Contextos/Conhecimento.md`](Contextos/Conhecimento.md) | Ao debugar, ou antes de criar algo parecido com o que já existe. |
| [`Contextos/Decisoes.md`](Contextos/Decisoes.md) | Antes de mudar algo já decidido, ou para entender um "porquê". |
| [`Notas/TODO.md`](Notas/TODO.md) | Ao escolher o que fazer em seguida. |

### ⚠️ NÃO leia por padrão — só se o usuário pedir explicitamente

`Contextos/Historico/` — specs originais, arquivos obsoletos e logs arquivados. **Não são
normativos.** Ler "por segurança" é desperdício puro de contexto.

Onde `Convencoes.md`/`Decisoes.md` contradizem material histórico, **eles vencem**.

## Regras que nunca podem ser esquecidas

Das regras gerais:
- **Não alterar outros projetos** — documente o que precisa, não faça.
- **Não apagar arquivos** — mover para histórico; exclusão exige autorização.
- **Nunca** commit/push/pull/merge/rebase/migrations/alterações em banco sem autorização.
- **Faltou informação? Pergunte** — não assuma.
- Prioridade: Segurança > Correção > Simplicidade > Manutenibilidade > Performance > Estética.

Deste projeto:
- **Tudo que é específico deste projeto se escreve em
  [`Contextos/Projeto.md`](Contextos/Projeto.md)** — os demais arquivos de `Contextos/` são
  genéricos e apontam para ele em vez de repetir. Regra completa em `Convencoes.md`,
  seção 8.4; metodologia de escrita no topo do próprio `Projeto.md`.
- **Usar sempre a forma de declaração mais restritiva que a linguagem oferecer** — escopo
  mínimo e imutável por padrão; nunca a forma legada mais permissiva.
- Cabeçalho obrigatório em todo arquivo de código — com a sintaxe de comentário **correta
  para aquela linguagem** (a escolha errada pode vazar para o artefato gerado ou nem ser
  sintaxe válida).
- **Nunca dizer "testado" sem executar.** Não existe suíte de testes neste repositório —
  a verificação é manual, pelo procedimento de `Ambientes.md`, seção 4.
- **Analisar o escopo ANTES de codar.** Se o pedido implicar backend, banco de dados,
  multiusuário, autenticação real ou conexão bancária automática, ele **contraria o escopo
  registrado** (`Projeto.md`, seção 2). Avisar o usuário e propor caminhos antes de gerar
  qualquer código — não implementar em silêncio.
- **Nunca guardar dado financeiro em `localStorage`/`sessionStorage`.** A persistência real é
  a planilha do Google. Os únicos 4 itens locais permitidos estão em `Projeto.md`, seção 5.
- **Nunca prometer segurança de autenticação.** O login é trava client-side; toda menção a
  ele deve vir com a limitação explícita.
- **Não quebrar a compatibilidade do esquema da planilha** (abas e nomes de coluna): quem já
  usa tem uma planilha real preenchida. Coluna nova, sim; renomear ou remover, só com
  autorização explícita.
