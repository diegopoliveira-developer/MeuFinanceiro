# Convenções

Convenções específicas do projeto **MeuFinanceiro**, conforme exigido por
`Basic AI Project Rules.md`.

Este arquivo é **normativo**. O *porquê* de cada convenção fica em
[`Decisoes.md`](Decisoes.md); as armadilhas técnicas descobertas em
[`Conhecimento.md`](Conhecimento.md).

---

## 1. Objetivo do projeto

Identidade, escopo e não-escopo estão em [`Projeto.md`](Projeto.md) — não repetidos aqui.

---

## 2. Arquitetura

SPA React de **arquivo único**: praticamente todo o sistema vive em `src/App.jsx`.

**Camadas, de fora para dentro:**

```
main.jsx            monta <App /> em #root, dentro de <React.StrictMode>
  └── App           raiz: estado de autenticação (authed, authConfig, loginLog),
      │             expõe verifyCredentials / updateCredentials
      ├── LoginScreen        (enquanto não autenticado)
      └── Dashboard          dono de TODO o estado de domínio e da navegação por abas
          ├── (estado)  categories, transactions, cards, vehicles, budgets,
          │             currentYear, archivedYears, sheetConfig
          ├── (efeitos) persistência local dos 4 itens permitidos + sync com a planilha
          └── *Tab               telas: Dashboard, Lancamentos, Recorrencias, Categorias,
                                 Conexao, Relatorio, Seguranca
              └── *Modal / *Card / primitivos de UI
```

**Regras de dependência (o que é PROIBIDO):**

- **Componentes de apresentação não têm estado de domínio.** Recebem dados e callbacks por
  props (prop drilling deliberado). Não introduzir Context API, Redux, Zustand ou similar
  sem registrar a decisão em [`Decisoes.md`](Decisoes.md).
- **Toda mutação de domínio nasce no `Dashboard`.** Uma aba nunca escreve estado direto:
  chama o callback que o `Dashboard` passou.
- **Toda soma financeira parte de `activeTransactions`, nunca de `transactions`.** O segundo
  inclui os lançamentos marcados como "não será pago", que existem para aparecer na lista e
  ficar fora de KPI, gráfico, subtotal, orçamento, fatura, relatório e contagem de pendência.
  Listar usa `transactions`; somar usa `activeTransactions` — errar isso produz total errado
  em silêncio.
- **Status de vencimento só se calcula por `paymentStatus()`.** Ela já zera a hora dos dois
  lados e empurra o vencimento de fim de semana para o próximo dia útil. Nunca comparar
  `dueDateOf()` com `new Date()` na mão.
- **Toda operação de CRUD que altera dado sincronizável precisa empurrar para a planilha**
  no mesmo ponto em que altera o estado (`pushToSheet` / `deleteFromSheet`). Alterar estado
  sem empurrar cria divergência silenciosa entre app e planilha — é bug, não omissão.
- **Nada de acesso direto a `localStorage` fora dos helpers já existentes**, e sempre dentro
  de `try/catch` com fallback silencioso (ver `Projeto.md`, seção 5).
- **Nenhum dado do usuário vai para a planilha sem passar por `sanitizeForSheet`.**
- Não existe roteador: navegação é o estado `tab` + renderização condicional.

---

## 3. Estrutura de Diretórios

```
MeuFinanceiro/
├── src/                 ← ÚNICA pasta de código-fonte editável
│   ├── App.jsx            todo o app (~3.370 linhas): tokens, helpers, auth, abas, modais
│   ├── main.jsx           ponto de entrada React
│   └── index.css          diretivas do Tailwind
├── dist/                ← ARTEFATO GERADO por `npm run build`. Nunca editar à mão.
├── Contextos/           documentação normativa (este arquivo e os irmãos)
│   └── Historico/        material arquivado — não normativo, não ler por padrão
├── Notas/               backlog técnico (TODO.md)
├── .firebase/           cache da CLI do Firebase — gerado, não editar
├── index.html           HTML de entrada do Vite
├── firebase.json        Firebase Hosting: pasta pública, rewrite de SPA, headers de segurança
├── vercel.json          headers de segurança para deploy alternativo na Vercel
├── vite.config.js · tailwind.config.js · postcss.config.js · package.json
└── README.md            instruções de uso, deploy e o esquema da planilha do Google
```

Pasta `Contextos/Historico/` ainda **não existe** — será criada na primeira rotação do
`Chat.log` (seção 8.2).

**Separe sempre código-fonte editável de artefato gerado.** O que é gerado (build,
compilação, transpilação, bundle, documentação automática) **nunca é editado à mão** e deve
ser sempre recriável do zero a partir da fonte.

Fonte: `src/`. Saída: `dist/` (ignorada pelo Git; regenerável com `npm run build`).

---

## 4. Convenções de Código

### Cabeçalho obrigatório
Todo arquivo de código começa com este bloco, comentado na sintaxe da linguagem (em
linguagens com shebang ou declaração obrigatória de abertura, logo após ela):

```text
Project: MeuFinanceiro
File: NOME-DO-ARQUIVO.ext
Developed By: Diego Oliveira
Last Modified: AAAA-MM-DD
Copyright (c) 2026. All rights reserved.
```

**O marcador de comentário muda por linguagem** — isso não é estético, é funcional. Escolha
o marcador que seja sintaxe válida **e** que se comporte corretamente na etapa de geração:

| Situação | Marcador | Motivo |
| --- | --- | --- |
| Linguagem com comentário de bloco, sem etapa de geração que o preserve indevidamente | de bloco | — |
| Linguagem cujo comentário de bloco **sobrevive à geração** | de linha | senão o cabeçalho vaza para o artefato final e é distribuído. |
| Linguagem sem comentário de bloco | de linha | o de bloco não é sintaxe válida. |

Neste projeto:

| Arquivo | Marcador | Motivo |
| --- | --- | --- |
| `.js` / `.jsx` (`src/`, `*.config.js`) | `//` de linha | O comentário de bloco `/* */` no topo do módulo pode ser preservado pelo bundler como comentário legal e vazar para o `dist/`. Marcador de linha é descartado com segurança. |
| `.css` | `/* */` de bloco | CSS não tem comentário de linha — `//` não é sintaxe válida. O PostCSS remove o bloco no build. |
| `.html` | **não aplicar** | `<!-- -->` é copiado literalmente para o `dist/` e serviria o cabeçalho a qualquer visitante. |
| `.json` (`package.json`, `firebase.json`, `vercel.json`) | **não aplicar** | JSON não admite comentário — qualquer marcador quebra o parsing. |
| `.md` (`Contextos/`, `Notas/`, `README.md`) | **não aplicar** | Regra abaixo. |

**Estado real**: nenhum arquivo de código deste repositório tem o cabeçalho hoje. É dívida
conhecida, registrada em [`../Notas/TODO.md`](../Notas/TODO.md) — arquivo novo já nasce com
ele; arquivo existente recebe quando for tocado por outro motivo.

`Last Modified` reflete a data da última alteração real. **Não aplicado** a arquivos de
`Contextos/`, `Notas/`, `README.md` ou arquivos de configuração/dependências.

### Regras gerais de código

Válidas para qualquer projeto:

- **Sempre a forma de declaração mais restritiva que a linguagem oferecer** — escopo mínimo
  e imutável por padrão; nunca a forma legada mais permissiva, salvo motivo técnico
  documentado.
- **Documentação na API pública**, no formato de documentação idiomático da linguagem. Não
  documentar trivialidades — só o que não é óbvio pelo nome.
- **Segurança**: nunca executar string arbitrária como código; nunca montar por concatenação
  algo que será interpretado por outro motor (marcação, consulta, comando de sistema,
  template) usando dado externo. Preferir sempre a API que trata dado como **dado**
  (parametrização, escape, construção estruturada) àquela que o trata como código.
- Evitar poluir o escopo global/compartilhado — um namespace ou prefixo único, nada solto.
- Dividir arquivo por **responsabilidade**, não por contagem de linhas.
- Não criar abstração para eliminar poucas linhas duplicadas.

Específicas desta stack (JavaScript/React):

- **`const` por padrão; `let` só quando reatribuir de fato; `var` nunca.** É a aplicação
  direta da regra "forma mais restritiva" acima.
- **Componentes são funções, com hooks.** Sem classes, sem `React.Component`.
- **Sem TypeScript e sem `prop-types`** — a validação de contrato hoje é a leitura do código.
  Trocar isso é decisão estrutural: registrar em `Decisoes.md` antes.
- **`useMemo`/`useCallback` só onde há custo real** (derivar listas de lançamentos, totais,
  séries de gráfico). Não envolver tudo por reflexo.
- **Nunca `dangerouslySetInnerHTML`.** Texto do usuário é renderizado como texto — é o que
  neutraliza payload de XSS colado em descrição/observações.
- **Todo valor monetário é `number` em reais**, formatado só na exibição por `brl()` /
  `brlCompact()`. Não guardar string formatada no estado.
- **Valor de lançamento precisa ser `> 0`** — o tipo (receita/despesa) define o sinal, não o
  número. Checagem por `!amount` não pega negativo: usar comparação explícita.
- **Todo campo de texto livre tem `maxLength`** (descrição 120, observações 500).
- **Estilo**: classes Tailwind para layout/espaçamento; estilo inline apenas para os tokens
  de cor e tipografia definidos no topo de `App.jsx` (`INK`, `PARCHMENT`, `SAGE`, `GOLD`,
  `RUST`…). Não introduzir cor hexadecimal solta no meio do JSX — usar o token.
- **Ícone sempre de `lucide-react`**, importado nominalmente no topo do arquivo.
- **Ao adicionar campo novo em lançamento/categoria/cartão/veículo/orçamento**, atualizar em
  conjunto: o estado, `toSheetRow`, o parser da planilha, o template do Apps Script na aba
  Conexão **e** a tabela de colunas no `README.md`. Esquecer um desses é o modo de falha mais
  comum deste projeto — ver `Conhecimento.md`.

---

## 5. Convenções de Nomenclatura

Padrão de partida, a ajustar conforme a convenção idiomática da linguagem adotada:

| Contexto | Convenção |
| --- | --- |
| Variáveis/funções | `camelCase` |
| Classes/tipos | `PascalCase` |
| Arquivos de código | `kebab-case` |
| Arquivos de `Contextos/` | `PascalCase.md` conforme `Basic AI Project Rules.md` |

Ajustes e exceções deste projeto:

| Contexto | Convenção | Observação |
| --- | --- | --- |
| Componentes React | `PascalCase` | Obrigatório pelo JSX: identificador em minúscula é interpretado como tag HTML nativa, não como componente. |
| Arquivos de componente | `PascalCase.jsx` | Exceção ao `kebab-case`: convenção idiomática do React, e é o que já está no repositório (`App.jsx`). |
| Arquivos de configuração | `kebab-case` / nome fixo da ferramenta | `vite.config.js`, `tailwind.config.js` — o nome é exigido pela ferramenta. |
| Constantes de token de design | `SCREAMING_SNAKE_CASE` | `INK`, `PARCHMENT`, `CAT_COLORS`, `AUTH_CONFIG`. |
| Chaves de `localStorage` | `meufinanceiro_<assunto>_v<N>` | O sufixo de versão permite mudar o formato sem quebrar quem tem o valor antigo salvo. |
| Colunas e abas da planilha | `PascalCase` **sem acento** | `Lancamentos`, `CategoriaId`, `RecorrenciaIndefinida`. Sem acento porque o nome é chave de comparação entre app e planilha, e acento vindo do CSV já causou falha de correspondência. |
| Identificadores de domínio (`id` de categoria) | `snake_case` sem acento, via `slugify()` | Nunca derivar id do nome exibido em tempo de leitura — ver `Conhecimento.md`. |
| Textos de interface | Português do Brasil | O app é de uso familiar; o código e os nomes de variável seguem em inglês. |

---

## 6. Regras de documentação

Onde cada coisa vive:

| Documento | Público | Obrigatório atualizar quando |
| --- | --- | --- |
| `README.md` (raiz) | **Usuário final.** Como rodar, publicar, fazer login, montar a planilha do Google e importar extrato. | Mudar comando, fluxo de deploy, credencial padrão ou **qualquer aba/coluna da planilha**. |
| `Contextos/` | Agente/desenvolvedor. | Conforme o fluxo obrigatório de `LEIA-PRIMEIRO.md`, seção 6. |
| Template do Apps Script (dentro da aba Conexão, em `App.jsx`) | Usuário que publica o script na planilha dele. | Mudar o contrato de leitura/escrita da planilha. |

Obrigatório ao criar algo novo:

- Bloco de comentário explicando o **porquê** acima de função não óbvia — o padrão já usado
  em `App.jsx` (ex.: o bloco sobre a limitação da autenticação, o bloco de tokens de design).
  Não documentar o óbvio pelo nome.
- Toda limitação conhecida se documenta **onde o usuário vai encontrá-la**: na própria
  interface quando afeta o uso (é o que a aba Diagnóstico de Segurança faz), e no `README.md`.
  Nunca deixar a limitação só no código.
- Não existe documentação gerada automaticamente neste projeto.

---

## 7. Regras obrigatórias de trabalho

As regras gerais (não alterar outros projetos, não apagar arquivos, não executar operações
de versionamento sem autorização, perguntar em vez de assumir) estão em
[`Basic AI Project Rules.md`](Basic%20AI%20Project%20Rules.md) — **não repetidas aqui**.

Específicas deste projeto:

- **Nunca afirmar "testado" sem executar** — procedimento em `Ambientes.md`, seção 4.
- Registrar decisão nova em `Decisoes.md`, aprendizado técnico em `Conhecimento.md`, e
  sempre um registro em `Chat.log`.
- **Analisar o escopo antes de codar.** Pedido que pressuponha backend, banco de dados,
  multiusuário, autenticação real ou conexão bancária automática contraria o escopo de
  `Projeto.md`, seção 2: avisar o usuário, explicar o conflito e propor caminhos **antes** de
  gerar código.
- **Nunca declarar o sistema "seguro" ou "pronto para produção" sem as ressalvas reais** —
  login client-side, dados em memória, planilha como única persistência.
- **`npm run deploy` publica em produção** — exige autorização explícita, como qualquer
  operação irreversível.
- **Não renomear nem remover aba/coluna da planilha** sem autorização explícita: a planilha do
  usuário já tem dados reais e é a única persistência do sistema. Acrescentar coluna é seguro;
  a leitura precisa continuar tolerando a ausência dela.
- **Mudança em `src/App.jsx` é mudança no app inteiro** — arquivo único, sem testes
  automatizados no repositório. Alterar apenas o necessário e conferir o que está em volta.

---

## 8. Manutenção do contexto

O contexto é lido a cada sessão nova, então o tamanho dele é **custo recorrente**. Estas
regras existem para que esse custo não cresça indefinidamente.

### 8.1 Orçamento de leitura

`CLAUDE.md` classifica cada arquivo em: **sempre**, **sob demanda** ou **não ler por
padrão**. Ao adicionar um arquivo novo em `Contextos/`, classifique-o lá também.

Alvo: uma sessão típica deve custar **~8–10k tokens** de contexto.

**Nunca deixe material histórico na rota de leitura padrão** — specs originais, arquivos
obsoletos e logs arquivados vão para `Contextos/Historico/` e são marcados "não ler".

### 8.2 Rotação do `Chat.log`

O log é append-only e cresce para sempre — sem rotação, viraria o maior custo fixo do
projeto.

**Regra**: quando `Chat.log` passar de **400 linhas**, mova os registros mais antigos —
**verbatim, sem resumir e sem apagar** — para `Contextos/Historico/Chat-AAAA-MM.log`,
deixando no log ativo apenas o período corrente. Acrescente no log ativo um registro novo
apontando para o arquivo criado.

Isso respeita as três proibições do `Basic AI Project Rules.md` (não apagar, não alterar, não
resumir): o conteúdo continua íntegro, apenas em outro arquivo.

### 8.3 Evitar duplicação entre arquivos de contexto

Cada informação deve viver em **um** arquivo. Quando dois precisarem citá-la, um aponta para
o outro em vez de repetir.

| Arquivo | Dono de |
| --- | --- |
| `LEIA-PRIMEIRO.md` | Ordem de leitura; fluxo obrigatório de trabalho |
| `Projeto.md` | O que é específico deste projeto (ver 8.4) |
| `Convencoes.md` | Como escrever código; arquitetura; estrutura; regras (normativo) |
| `Decisoes.md` | *Por que* cada coisa é como é |
| `Conhecimento.md` | Armadilhas técnicas; inventário do que existe |
| `Ambientes.md` | Build, dependências, procedimento de teste |

### 8.4 O que é específico do projeto vai em `Projeto.md`

Os demais arquivos de `Contextos/` são **genéricos e reutilizáveis**: o mesmo texto serve a
qualquer projeto, de qualquer tipo, em qualquer stack.

**Toda característica específica deste projeto — identidade, escopo e não-escopo, domínio e
vocabulário, stack, superfície pública, restrições, integrações externas e estado atual —
deve ser escrita em [`Projeto.md`](Projeto.md)**, não espalhada pelos outros arquivos.

Teste para decidir: **se a frase deixaria de ser verdade em outro projeto, ela é específica**
e vai para `Projeto.md`. Onde um arquivo genérico precisar de um dado específico, ele
**aponta** para `Projeto.md` em vez de repetir.

A metodologia de escrita — regra de ouro, fronteiras, como redigir cada seção e quando
revisar — está no topo do próprio `Projeto.md`.

**Não migre para `Projeto.md`**: regras normativas de código e arquitetura (`Convencoes.md`),
procedimento de build e teste (`Ambientes.md`), os porquês (`Decisoes.md`) e as armadilhas
(`Conhecimento.md`) — mesmo quando específicos deste projeto. Esses arquivos já são donos
desses assuntos. `Projeto.md` declara **o que o projeto é**, não como se trabalha nele.
