# Projeto

Características **específicas** do projeto `MeuFinanceiro`.

Este é o **único** arquivo de `Contextos/` que descreve *este* projeto em particular. Todos
os outros são genéricos e reutilizáveis em qualquer projeto — quando precisam de algo
específico, apontam para cá em vez de escrever.

---

## Metodologia de escrita — ler antes de editar este arquivo

### Regra de ouro

Só entra aqui o que **deixaria de ser verdade se o projeto fosse outro**. Se a frase continua
valendo em qualquer projeto, ela não pertence a este arquivo: pertence ao arquivo genérico
correspondente.

### Do que este arquivo é dono

| É dono de | NÃO é dono de — dono real |
| --- | --- |
| Identidade, tipo e escopo do projeto | Como escrever código → `Convencoes.md` |
| Domínio e vocabulário | Arquitetura e estrutura de diretórios → `Convencoes.md` |
| Stack e superfície pública | Build, execução e teste → `Ambientes.md` |
| Restrições e integrações externas | *Por que* cada coisa é assim → `Decisoes.md` |
| Estado atual | Armadilhas e inventário → `Conhecimento.md` |
| | Backlog de tarefas → `../Notas/TODO.md` |

A fronteira com `Convencoes.md`: aqui se declara **qual** é a stack; lá se define **como se
escreve código** nela.

### Como escrever

- **Uma afirmação por item, e verificável.** Nada de adjetivo vago ("robusto", "moderno",
  "escalável") — quem lê precisa poder conferir se ainda é verdade.
- **Declare o não-escopo.** O que o projeto explicitamente NÃO é vale tanto quanto o que ele
  é, e evita trabalho fora do lugar.
- **Lacuna é informação.** Se algo não existe ou ainda não foi definido, escreva "não
  existe" ou "não definido" — nunca deixe a seção em branco, senão não se distingue
  "ninguém decidiu" de "ninguém escreveu".
- **Não duplique.** Se o assunto tem dono em outro arquivo, aponte para ele.
- **Sem histórico aqui.** Este arquivo descreve o estado presente. O *porquê* e o que foi
  substituído vão para `Decisoes.md`.
- **Mudança estrutural exige registro.** Alterar escopo, stack ou restrição aqui implica
  registrar a decisão em `Decisoes.md` com motivo.

### Quando revisar

Ao mudar o escopo, ao trocar ou acrescentar item da stack, ao surgir ou cair uma integração
externa, e ao concluir um marco que altere a seção 6.

---

## 1. Identidade

**Nome**: `MeuFinanceiro`

**Tipo**: aplicação web — SPA (Single Page Application) 100% client-side, sem backend próprio.

**Em uma frase**: painel de controle financeiro familiar que substitui a planilha de contas
de casa — lançamentos mês a mês, cartões de crédito, financiamentos de veículos, metas e
relatório anual, com sincronização opcional para uma planilha do Google Sheets.

**Versão atual**: `1.0.0`, declarada em `package.json` (campo `version`).
**Não existe** arquivo de versão dedicado (`version.js`) com histórico, como pede
`Basic AI Project Rules.md` — pendência registrada em [`../Notas/TODO.md`](../Notas/TODO.md).

---

## 2. Problema e escopo

**Problema que resolve**: uma família controlava as contas em planilha manual; conferir o que
está pago, o que vence, quanto sobra no mês e quanto cada categoria consome exigia leitura e
soma manuais. O app troca a planilha pela interface, e opcionalmente **mantém** a planilha
como armazenamento persistente por trás.

**Dentro do escopo**:

- Lançamento manual de receitas e despesas por mês (Janeiro–Dezembro) de um único ano corrente.
- Categorias e subcategorias criadas/removidas pelo usuário em tempo de uso.
- Lançamentos parcelados (N parcelas) e recorrentes (fixos mensais, com ou sem data de término).
- Cartões de crédito com cálculo de fatura por ciclo real (dia de fechamento/vencimento), e
  uma tela dedicada por cartão e por mês, com as compras da fatura e gráficos.
- Financiamentos de veículos (valor total, parcelas totais/pagas).
- Metas e orçamentos mensais por categoria de despesa.
- Controle de vencimento e status de pagamento (Pago / Vencido / Vence em breve / Pendente).
- KPIs e gráficos do mês/ano; relatório anual consolidado.
- Arquivamento de ano: o ano corrente vira histórico somente-leitura e o sistema avança +1.
- Importação de extrato bancário em CSV (formato do Nubank reconhecido automaticamente).
- Sincronização bidirecional opcional com Google Sheets via Apps Script do próprio usuário.
- Login único de acesso (trava client-side) e tela de Diagnóstico de Segurança.

**Explicitamente FORA do escopo**:

- **Backend e banco de dados próprios.** Não existe servidor deste projeto; não existe SQL nem
  NoSQL em lugar nenhum. Pedidos sobre "injeção SQL" ou "segurança do banco" não têm
  superfície aqui. Ver [`Decisoes.md`](Decisoes.md).
- **Autenticação real.** O login é uma trava do lado do cliente e não protege contra atacante
  determinado — nunca descrevê-la como segurança de verdade.
- **Multiusuário / múltiplos perfis / permissões.** Um único login compartilhado pela família.
- **Open Banking / conexão bancária automática.** Lançamento é sempre manual, importado por
  CSV ou sincronizado pela planilha.
- **Cálculo de impostos, declaração de IR e conversão de moedas.**
- **Notificações externas (e-mail/push).** Exigiriam um processo rodando 24h — incompatível com
  "sem backend". Notificação do navegador com o app aberto seria compatível, mas não existe.
- **Edição de anos arquivados.** Só o ano corrente é operável; anos arquivados são leitura.
- **Roteamento por URL.** Navegação é por estado, sem React Router — não há URLs por tela.

---

## 3. Domínio e vocabulário

| Termo | Significa |
| --- | --- |
| `lançamento` (transaction) | Uma receita ou despesa de um mês. Unidade básica do sistema. |
| `ano corrente` (`currentYear`) | O único ano editável. Todo lançamento novo pertence a ele. |
| `ano arquivado` (`archivedYears`) | Ano fechado por "Arquivar ano" — somente leitura. |
| `arquivar ano` | Move os lançamentos do ano corrente para o histórico, zera os 12 meses e avança `currentYear` em +1. Confirmado digitando "ARQUIVAR". |
| `zerar mês` | Apaga os lançamentos de um mês do ano corrente. |
| `resetar` | Apaga **todos** os lançamentos. Confirmado digitando "RESETAR". |
| `recorrência indefinida` | Lançamento fixo mensal sem data de término (`indefiniteRecurring`), materializado até dezembro do ano corrente. |
| `parcelado` | Série de N lançamentos com `installmentNumber`/`installmentTotal`. |
| `recurringGroupId` | Id que amarra as ocorrências de uma mesma série (parcelada ou recorrente). |
| `dueDay` | Dia do mês do vencimento. Em despesa de cartão com cartão vinculado, o rótulo na tela muda para "Dia da compra" e o campo alimenta o cálculo do ciclo de fatura. |
| `ciclo de fatura` (`invoicePeriodFor`) | Compra depois do `closingDay` do cartão cai na fatura do mês seguinte (com virada de ano em dezembro). |
| `orçamento` / meta (`budgets`) | Limite mensal por categoria de despesa, com alertas em 80% / 100% / acima. |
| `bankId` | `Identificador` da transação vindo do extrato do banco; usado para detectar reimportação duplicada. |
| `sheetConfig` | Trio de configuração da planilha: URL do CSV publicado, URL do Apps Script Web App e token secreto. |
| `Apps Script Web App` | Script publicado pelo usuário na planilha dele; é o único componente server-side, e não pertence a este repositório. |

---

## 4. Stack e superfície pública

**Linguagem(ns)**: JavaScript (ES modules) com JSX. **Sem TypeScript.** Todo o app está em
`src/App.jsx`. O template do Google Apps Script (JavaScript do lado do Google) vive como
string dentro desse mesmo arquivo, para o usuário copiar — não é executado aqui.

**Framework / bibliotecas estruturais**:

| Item | Papel |
| --- | --- |
| React 18 | Function components + hooks (`useState`, `useMemo`, `useCallback`, `useEffect`, `useRef`). Sem Context API, sem Redux — props diretas. |
| Vite 5 + `@vitejs/plugin-react` | Servidor de desenvolvimento e build de produção. |
| Tailwind CSS 3 (+ PostCSS, Autoprefixer) | Estilo por classes utilitárias, incluindo valores arbitrários (`text-[13px]`). Tokens de cor/tipografia aplicados por estilo inline. |
| Recharts | `PieChart`, `BarChart`, `LineChart`. |
| `lucide-react` | Ícones. |
| `papaparse` | Leitura de CSV (planilha publicada e extrato bancário). |
| Google Fonts | Fraunces (títulos), Inter (corpo), JetBrains Mono (valores) — carregadas por `@import` dentro de `<style>` injetado no componente. |

**Superfície pública**: nenhuma API consumida por terceiros. O que é "público" é a interface:
as 8 abas do app — Dashboard, Lançamentos, Parcelas & Recorrências, Cartões, Categorias,
Conexão Google Sheets, Relatório Anual, Diagnóstico de Segurança. O único contrato externo estável é o
**esquema de abas/colunas da planilha do Google** (`Lancamentos`, `Categorias`, `Config`,
`Cartoes`, `Veiculos`, `Orcamentos`), documentado no `README.md` da raiz — mudar nome ou
significado de coluna quebra a planilha de quem já usa.

Versões exatas e comandos de execução em [`Ambientes.md`](Ambientes.md) — não repetir aqui.

---

## 5. Restrições e integrações externas

**Restrições**:

- **Nenhum dado financeiro em `localStorage`/`sessionStorage`.** Lançamentos, categorias,
  cartões, veículos e anos arquivados vivem em memória. Só quatro coisas são persistidas
  localmente, e nenhuma é dado financeiro: credenciais alteradas
  (`meufinanceiro_auth_v1`), bloqueio de login (`meufinanceiro_lockout_v1`), configuração da
  planilha (`meufinanceiro_sheet_v1`) e o ano corrente (`meufinanceiro_current_year_v1`).
- **A senha nunca é guardada em texto puro, em lugar nenhum.** O que se guarda — no navegador
  e na aba `Config` da planilha — é um hash PBKDF2-HMAC-SHA256 com salt aleatório e 210.000
  iterações. Como esse hash sai do navegador, o token secreto do Apps Script é o que impede
  que quem descubra a URL o leia. Ver [`Decisoes.md`](Decisoes.md).
- **Todo acesso a `localStorage` é envolvido em `try/catch` com fallback silencioso** para
  "só nesta sessão" — o app precisa continuar funcionando onde o armazenamento é bloqueado.
- **Fonte de verdade da persistência é a planilha do Google**, quando configurada. Sem ela,
  recarregar a página zera os dados — comportamento conhecido e aceito.
- **Compatibilidade do esquema da planilha**: leitura tolera aba ou coluna ausente (planilha
  antiga do usuário não pode quebrar o app); escrita nunca apaga campo local só porque o lado
  remoto não tem a coluna.
- **Texto do usuário gravado na planilha passa por `sanitizeForSheet`** — valor iniciado por
  `=`, `+`, `-`, `@` ou caractere de controle recebe apóstrofo, contra injeção de fórmula.
- **Cabeçalhos HTTP de segurança são responsabilidade da hospedagem**, não do código:
  `firebase.json` e `vercel.json` definem CSP, `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy` e `Permissions-Policy`. A CSP libera `fonts.googleapis.com`/
  `fonts.gstatic.com` (fontes), `docs.google.com` e `script.google(usercontent).com`
  (planilha) — acrescentar um domínio externo novo exige atualizar os dois arquivos.
- **Interface em português do Brasil**, moeda `BRL` via `Intl.NumberFormat("pt-BR")`.

**Integrações**:

| Integração | Criticidade | O que é |
| --- | --- | --- |
| Google Sheets via Apps Script Web App (`doGet`/`doPost`) | **Crítica quando configurada** — é a única persistência real. Opcional: o app funciona sem, em memória. | Leitura + escrita, upsert e exclusão por coluna `ID`, com token secreto opcional. Script publicado pelo usuário; template fornecido na aba Conexão. |
| Google Sheets publicado como CSV | Não crítica | Só leitura, só a aba `Lancamentos`, substitui os dados locais. |
| Google Fonts | Não crítica | Fontes; sem elas o app cai para as fontes de sistema. |
| Firebase Hosting | Não crítica | Destino de deploy em uso (`npm run deploy`). |
| Vercel | Não crítica | Destino de deploy alternativo, configurado mas não em uso. |

Nenhuma outra: sem gateway de pagamento, sem e-mail, sem autenticação de terceiros, sem
telemetria/analytics.

---

## 6. Estado atual

**Pronto e em uso**: o sistema está em produção para uso familiar, publicado no Firebase
Hosting. Funcionam ponta a ponta: login e troca de credenciais; lançamentos com
parcelas/recorrências; cartões com ciclo real de fatura; veículos; metas e orçamentos;
importação de extrato do Nubank; arquivamento de ano; relatório anual; sincronização
bidirecional completa com a planilha (lançamentos, categorias, cartões, veículos, orçamentos,
ano corrente e anos arquivados); layout responsivo em celular e desktop.

**Ressalva sobre "testado"**: a bateria de testes end-to-end (jsdom + React real) que validou
esses fluxos foi executada em um **ambiente de trabalho externo e não faz parte deste
repositório** — não há suíte de testes aqui, e `npm test` não existe. Nada neste repositório
pode ser declarado "testado" sem execução nova. Ver [`Ambientes.md`](Ambientes.md), seção 4.

**Falta** (panorama; backlog completo em [`../Notas/TODO.md`](../Notas/TODO.md)):

- Suíte de testes versionada dentro do repositório.
- Arquivo de versão com histórico, exigido pela norma.
- Cabeçalho obrigatório em `src/App.jsx`, `src/main.jsx` e demais arquivos de código.
- Dashboard e Parcelas & Recorrências ainda não navegam por anos arquivados.
- PWA (manifest/service worker/offline), projeção de saldo, comparativo ano a ano,
  exportação em PDF, edição em lote e etiqueta de autor por lançamento.
- `src/App.jsx` tem ~3.370 linhas em arquivo único; a divisão por responsabilidade ainda não
  foi feita.
