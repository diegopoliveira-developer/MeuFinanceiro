# Conhecimento Descoberto

Informações técnicas descobertas durante o desenvolvimento — registradas para **evitar
redescoberta futura**, conforme `Basic AI Project Rules.md`.

Cada item deve ser uma armadilha **real** que custou tempo, não teoria ou boa prática
genérica. Se dá para descobrir lendo a documentação oficial em 30 segundos, não entra aqui.

---

## Armadilhas do React / navegador

### A tela de login não enxerga as classes CSS injetadas pelo `Dashboard`

O bloco `<style>` que define `.btn-primary` (e as fontes) é renderizado **dentro do
`Dashboard`**. A `LoginScreen` aparece antes disso, então qualquer classe definida ali
simplesmente não existe no momento em que o login é pintado — o botão "Entrar" ficou
praticamente invisível por causa disso.

**Solução**: a tela de login tem seu próprio bloco `<style>` e usa estilo inline explícito no
botão. **Regra**: componente que renderiza fora do `Dashboard` não pode depender de
`.btn-primary` nem de qualquer classe injetada por ele.

### Gerenciador de senha preenche o DOM sem o React saber

Autofill do navegador/gerenciador de senhas escreve direto no campo sem disparar o evento
`input` que o React escuta. O estado continuava vazio, o botão de submit continuava
`disabled`, e o usuário via os campos preenchidos e o botão morto.

**Solução**: no submit, ler o valor pelo `ref` do input, não pelo estado.

### Teclado mobile altera a credencial digitada

Autocapitalização e autocorreção transformavam `familia` em `Familia` no login.

**Solução**: `autoCapitalize="off"` e `autoCorrect="off"` nos campos de usuário e senha.

### `Ctrl+N` não pode ser interceptado no Chrome desktop

O atalho de "novo lançamento" funciona no Firefox e no app instalado como PWA, mas o Chrome
desktop reserva `Ctrl+N` para abrir janela nova e não deixa o JavaScript sobrescrever. **Não é
bug do código** — não tentar "consertar".

### `crypto.subtle` pode não existir mesmo em contexto seguro

Alguns ambientes de sandbox restringem a Web Crypto API. Por isso existe
`sha256HexFallback()`, uma implementação de SHA-256 em JS puro, validada byte a byte contra o
`crypto` do Node. **Não remover** achando que é redundante.

### `!valor` não rejeita número negativo

A validação antiga do campo de valor usava `!amount`. Como o campo é string, `"-50"` é
*truthy* e passava — dava para lançar despesa negativa, que virava receita disfarçada.

**Solução**: comparação explícita `> 0`. Vale para qualquer campo numérico novo.

### Um erro de render derruba o app inteiro

Não existe *error boundary*. Exceção não tratada durante o render leva a tela em branco, sem
mensagem. Ao mexer em código de render, conferir o console — não confiar na tela.

---

## Armadilhas da integração com Google Sheets

### As duas URLs do Google são parecidas e fazem coisas diferentes

A URL de **CSV publicado** (`.../pub?output=csv`) é só leitura. A URL do **Apps Script Web
App** (termina em `/exec`) é leitura + escrita. Colar a primeira no campo da segunda produz o
erro "... is not valid JSON", porque o app recebe CSV onde esperava JSON. O app hoje detecta
esse caso e explica — **manter essa mensagem** ao mexer no tratamento de erro.

### Inferir id de categoria pelo nome exibido falha em silêncio

O reimport tentava deduzir o id a partir do nome em minúsculas: "Cartões de Crédito" nunca
batia com o id real `cartoes` (acento e espaço). Falhava sem erro, só perdendo o vínculo.

**Solução**: as colunas `CategoriaId`/`SubcategoriaId` guardam o id. **Regra**: nunca derivar
identificador a partir de texto de exibição em tempo de leitura — ver `Decisoes.md`.

### Categoria sem subcategoria some da planilha

A aba `Categorias` tem uma linha por par (categoria, subcategoria). Categoria sem nenhuma
subcategoria precisa de uma linha "raiz", com `SubcategoriaId`/`Subcategoria` vazios — senão
desaparece na próxima sincronização. O CRUD cria e remove essa linha raiz quando a categoria
ganha ou perde a última subcategoria.

### A planilha do usuário pode ser mais antiga que o código

Aba nova ou coluna nova não existe na planilha de quem começou antes. Por isso a leitura
tolera ausência, e o merge de lançamentos só sobrescreve campo quando o lado remoto **tem**
valor — senão uma sincronização apagaria "Parcela 3/12" só porque a planilha ainda não tinha a
coluna. **Não simplificar esse merge.**

### Sem a aba `Config`, uma sessão nova erra o ano

A aba `Config` guarda o `AnoAtual`. Sem ela, um navegador limpo trataria dados de ano
arquivado como se fossem do ano corrente. Na sincronização, o ano corrente **nunca regride**:
vale sempre o maior valor entre local e remoto.

---

## Armadilhas de build, deploy e ambiente

### A CSP não existe em `npm run dev`

Os cabeçalhos de segurança vêm de `firebase.json` / `vercel.json`, aplicados pela hospedagem.
O servidor de desenvolvimento do Vite não os aplica: **um bloqueio de CSP só aparece em
produção ou no `preview` publicado**. Ao acrescentar domínio externo (fonte, API, imagem),
atualizar os dois arquivos.

### As fontes chegam por `@import` dentro de `<style>` no JSX

Não estão em `index.css`. Quem procurar a origem das fontes no CSS não acha. Isso exige
`'unsafe-inline'` em `style-src` na CSP — está lá por esse motivo, não por descuido.

### O `node_modules/` do repositório foi instalado no WSL — o build não roda no Windows

Descoberto em 2026-08-15. `npm run build` no Windows falha com `'vite' não é reconhecido`, e
chamar o Vite direto pelo Node falha em seguida com `MODULE_NOT_FOUND` no binding nativo do
`rolldown`. Não é problema do código: a árvore instalada é **de Linux**. Duas evidências:
`node_modules/.bin/` só tem o shim POSIX `vite` (sem `vite.cmd`/`vite.ps1`, que o `npm run` do
Windows precisa), e o pacote de binário nativo presente é
`@rolldown/binding-linux-x64-gnu`.

**Solução**: rodar build e dev no WSL, onde a árvore foi instalada; **ou** rodar `npm install`
no Windows para reinstalar com os binários da plataforma certa — o que troca os binários
nativos e exige reinstalar de novo ao voltar para o WSL. Escolher um dos dois lados como
ambiente de build evita o vai e vem.

**Verificação de sintaxe sem instalar nada**: o `sucrase` (JS puro, já presente na árvore)
transpila o `App.jsx` e acusa erro de sintaxe. Serve para pegar JSX quebrado —
**não substitui teste**, porque não executa nada.

```bash
node -e "const{transform}=require('sucrase');const fs=require('fs');transform(fs.readFileSync('src/App.jsx','utf8'),{transforms:['jsx','imports']});console.log('sintaxe OK')"
```

### `npm audit fix --force` sobe o Vite de major e o `npm install` desfaz isso

Em 2026-08-15 a árvore instalada tinha **Vite 8.1.5**, fora do `^5.4.0` declarado no
`package.json` — assinatura de um `npm audit fix --force` (é exatamente o que o `npm audit`
deste projeto sugere, "Will install vite@8.2.1, which is a breaking change"). Como o
`package.json` não foi atualizado junto, um `npm install` comum **reverte** para o Vite 5 e a
vulnerabilidade do `esbuild` volta a aparecer.

**Regra**: se a subida de major for para valer, ela precisa estar no `package.json`; senão o
próximo `npm install` a apaga em silêncio. Auditoria atual: 3 vulnerabilidades — a do
`nanoid` se resolve com `npm audit fix` (sem quebra), a do `esbuild`/`vite` só com o salto
para o Vite 8.

### `.firebaserc` depende do projeto Firebase do usuário

Não é gerado pelo repositório: nasce do `firebase use --add` na primeira vez. Contém o id do
projeto Firebase e **não deve ser versionado**.

### `esbuild` (via Vite) tem vulnerabilidade conhecida no servidor de dev

Afeta apenas o servidor de desenvolvimento local, não o build de produção. A correção
automática exige salto de versão major do Vite (*breaking change*), por isso não foi aplicada.
Registrado em `Notas/TODO.md`.

### Testar em jsdom exige dois cuidados não óbvios

Descobertos ao montar a bateria de testes end-to-end (que **não** está versionada aqui):
o React tenta usar `attachEvent`, API antiga do IE que o jsdom não fornece — precisa de
*polyfill*; e o `require` do React tem que vir **depois** de o DOM existir, senão ele
inicializa sem `document` e falha de forma confusa.

---

## Detalhes de implementação que não são óbvios

- **`CURRENT_MONTH_IDX = 6` (Julho) é fixo no código** — é o mês inicialmente selecionado, e
  **não** o mês atual do sistema. Herança do ponto de referência da planilha legada. Já
  confunde hoje; se for corrigido para o mês corrente, é mudança de comportamento visível.
- **`REFERENCE_YEAR_DEFAULT = 2026`** é o ano usado quando não há nada salvo em
  `localStorage` — ponto de partida fixo, não o ano do relógio.
- **`dueDay` tem dois significados**: dia de vencimento em geral, e "dia da compra" quando o
  lançamento é de cartão com cartão vinculado (alimenta o cálculo do ciclo de fatura). O
  rótulo na tela muda; o campo é o mesmo.
- **`onSave` do modal de lançamento pode devolver um objeto ou um array** — array quando é
  série parcelada/recorrente. `addTransactionSeries` trata os dois casos.
- **Status de pagamento é calculado, não armazenado**: `paymentStatus()` compara
  `dueDay`/mês/ano com a data real de hoje. Só `paid` é campo de verdade.
- **Recorrência indefinida é materializada até dezembro do ano corrente** — não é infinita de
  verdade; ao virar o ano, as ocorrências do ano novo precisam existir.
- **Duplicar lançamento não copia** o id, o status de pago nem os vínculos de
  parcela/recorrência — duplicar a parcela 3/12 não pode criar um elo novo com a série.
- **Confirmação por digitação** é o padrão das operações destrutivas: "RESETAR" para apagar
  tudo, "ARQUIVAR" para fechar o ano. Não substituir por um clique simples.

---

## Inventário — o que já existe (não recriar)

Tudo dentro de `src/App.jsx`. Antes de escrever algo parecido, procurar por:

| Precisa de | Já existe |
| --- | --- |
| Formatar dinheiro | `brl()`, `brlCompact()` |
| Id novo | `uid()`; para categoria, `slugify()` |
| Hash SHA-256 | `sha256Hex()` (com fallback `sha256HexFallback()`) |
| Data de vencimento / status | `dueDateOf()`, `paymentStatus()` |
| Escrever texto na planilha | `sanitizeForSheet()` |
| Ler/gravar/apagar na planilha | `pushToSheet()`, `deleteFromSheet()`, `syncWithSheet()` |
| Converter lançamento ↔ linha | `toSheetRow()`, `parseCsvIntoTransactions()` |
| Árvore de categorias ↔ linhas | `flattenCategories()`, `unflattenCategoryRows()`, `categoryRowId()` |
| Fatura de cartão | `invoicePeriodFor()`, `cardInvoice()` |
| Detectar colunas de extrato | `detectColumnMapping()`, `parseStatementDate()` |
| Estado vazio, modal, campo, KPI, chip | `EmptyState`, `Modal`, `Field`, `KpiCard`, `StatusChip` |
| Checar `localStorage` | `checkLocalStorageAvailable()` |
