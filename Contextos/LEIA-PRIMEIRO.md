# LEIA PRIMEIRO

Ponto de entrada do contexto do projeto **MeuFinanceiro**. Se você (agente de IA ou
pessoa) está começando uma conversa nova neste repositório, leia este arquivo inteiro antes
de qualquer coisa — ele é curto de propósito e diz onde está o resto.

---

## 1. Norma de prioridade máxima

Este projeto segue [`Basic AI Project Rules.md`](Basic%20AI%20Project%20Rules.md) — regras
gerais para qualquer projeto mantido com auxílio de IA. Em conflito com qualquer convenção
deste repositório, **aquele documento vence**.

**Todo o contexto está aqui dentro.** Não há nada a consultar fora do repositório.

Pontos que ele impõe e que são fáceis de esquecer:

- **Ordem de decisão**: Segurança > Correção > Simplicidade > Manutenibilidade > Performance
  > Estética.
- **Não alterar outros projetos.** Se algo fora deste repositório precisar mudar, documente
  o que precisa — não faça.
- **Não apagar arquivos.** Mover para backup/histórico; exclusão definitiva exige
  autorização explícita.
- **Nunca executar** commit, push, pull, merge, rebase, migrations, alterações em banco,
  exclusão de dados, reinício de serviços ou instalação de software **sem autorização**.
- **Se faltar informação, perguntar** — não assumir. Suposição inevitável deve ser declarada.

---

## 2. Ordem de leitura

| Arquivo | O que é | Quando ler |
| --- | --- | --- |
| [`Basic AI Project Rules.md`](Basic%20AI%20Project%20Rules.md) | **Norma de prioridade máxima.** | Sempre, antes de tudo. |
| `LEIA-PRIMEIRO.md` | Este arquivo. | Logo em seguida. |
| [`Projeto.md`](Projeto.md) | **O que é específico deste projeto** — identidade, escopo, domínio, stack, estado atual. | Sempre, no início da sessão. |
| [`Convencoes.md`](Convencoes.md) | **Normativo** — arquitetura, estrutura, convenções. | Antes de escrever código. |
| [`Ambientes.md`](Ambientes.md) | Ambientes, build, **procedimento de teste**. | Antes de rodar ou testar. |
| [`Conhecimento.md`](Conhecimento.md) | Armadilhas técnicas + inventário. | Ao debugar ou criar algo parecido com o existente. |
| [`Decisoes.md`](Decisoes.md) | Decisões com motivo e alternativas. | Antes de mudar algo já decidido. |
| [`Chat.log`](Chat.log) | Histórico append-only. | No início de cada sessão. |
| [`../Notas/TODO.md`](../Notas/TODO.md) | Backlog técnico. | Ao escolher o que fazer. |

**⚠️ `Historico/` — NÃO ler por padrão.** Specs originais, arquivos obsoletos e logs
arquivados. Não são normativos; ler "por segurança" é desperdício de contexto (ver
`Convencoes.md`, seção 8.1).

Onde `Convencoes.md`/`Decisoes.md` contradizem material histórico, **eles vencem**.

---

## 3. O que é este projeto

Em [`Projeto.md`](Projeto.md) — identidade, problema, escopo e não-escopo, domínio, stack e
superfície pública. Não repetido aqui (ver `Convencoes.md`, seções 8.3 e 8.4).

---

## 4. Estado atual

Em [`Projeto.md`](Projeto.md), seção 6. Backlog completo em
[`../Notas/TODO.md`](../Notas/TODO.md).

---

## 5. As convenções que mais se esquece

O resumo está no `CLAUDE.md` da raiz (carregado automaticamente); o detalhamento completo em
[`Convencoes.md`](Convencoes.md). Não repetidas aqui — ver `Convencoes.md`, seção 8.3, sobre
evitar duplicação.

Lista aberta — acrescente aqui só o que **de fato** foi esquecido e causou retrabalho.

- **Análise de escopo antes de codar.** Já aconteceu duas vezes (auditoria de segurança
  escrita para app full-stack; pacote de pedidos com notificação por e-mail) de o pedido
  pressupor uma arquitetura que este projeto não tem. Conferir `Projeto.md`, seção 2, antes
  de aceitar o pedido como está — e avisar o usuário em vez de fabricar a resposta.
- **O cabeçalho obrigatório de arquivo ainda não existe em nenhum arquivo de código** deste
  repositório (ver `Notas/TODO.md`). Ao criar arquivo novo, aplicar mesmo assim.

---

## 6. Fluxo obrigatório de toda tarefa

```
1. Ler Contextos/ (este arquivo + Projeto.md + Convencoes.md; Chat.log no início da sessão)
2. Inspecionar o código atual
3. Identificar a arquitetura existente e verificar conflitos com o registrado
4. Planejar; perguntar se faltar informação (não assumir)
5. Implementar apenas o que foi pedido
6. Testar de verdade (Ambientes.md)
7. Atualizar a documentação
8. Registrar: Decisoes.md (decisão nova), Conhecimento.md (aprendizado),
   Projeto.md (se mudou característica do projeto), Chat.log (sempre),
   Notas/TODO.md (backlog), arquivo de versão (se mudou)
9. Informar o resultado: o que foi feito, o que foi testado, o que ficou pendente
```

Se uma tarefa nova conflitar com uma regra já registrada, **não ignore silenciosamente**:
aponte o conflito, avalie se a mudança é mesmo necessária, e se for, registre em
`Decisoes.md` a decisão antiga substituída junto com a nova e o motivo.

---

## 7. Comandos úteis

Atalho. Definição completa dos modos de execução em [`Ambientes.md`](Ambientes.md),
seção 3 — é lá que eles vivem.

```text
npm install      # instalar dependências (uma vez)
npm run dev      # servidor de desenvolvimento (Vite, http://localhost:5173)
npm run build    # build de produção em dist/
npm run preview  # servir o build gerado, para conferir antes de publicar
npm run deploy   # build + firebase deploy --only hosting  ← PUBLICA EM PRODUÇÃO
```

⚠️ **`npm run deploy` publica no ar.** É deploy em produção — exige autorização explícita do
usuário, como qualquer operação irreversível (ver `Basic AI Project Rules.md`).

Não existe comando de teste — ver `Ambientes.md`, seção 4.
