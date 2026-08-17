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

### Comparar data de vencimento com `new Date()` marca o próprio dia como atrasado

`dueDateOf()` devolve a data à **meia-noite**; `new Date()` carrega a hora atual. Subtrair um
do outro no dia do vencimento dá algo entre −1 e 0, e o `Math.floor` levava para −1 — o
lançamento aparecia como vencido no dia em que vencia. Custou um relato de bug do usuário.

**Solução**: `startOfDay()` nos dois lados e `Math.round` na diferença. Vale para qualquer
comparação de data neste projeto: zere a hora antes.

### Os feriados personalizados vivem num registro do módulo, não em props

`paymentStatus()` é função pura chamada do chip de status, dos badges, dos alertas do mês e
das recorrências. Para ela enxergar os feriados cadastrados pelo usuário sem espalhar a mesma
prop por meia dúzia de componentes, a lista fica em `CUSTOM_HOLIDAYS`, no escopo do módulo,
atualizada pelo `Dashboard` num `useMemo` — que roda **antes** de qualquer filho renderizar.

**Cuidado**: `useEffect` não serviria aqui, porque roda depois da renderização e a primeira
pintura sairia com os feriados antigos. Se for mexer nisso, mantenha a atualização síncrona.

**Feriados nacionais**, esses, são calculados (`nationalHolidaysOf`) e ficam em cache por ano —
não passam pelo registro.

### Testar edição inline no navegador exige disparar `focusout`, não `blur()`

Ao exercitar os campos de edição da lista (vencimento e valor) por script, `input.blur()` só
dispara evento se o elemento estiver de fato focado — e a aba perde o foco do sistema
operacional durante a automação (`document.hasFocus() === false`), então o `blur()` vira
no-op e o `onBlur` nunca roda. O sintoma engana: parece que o campo "não salva".

**Solução**: disparar `new FocusEvent("focusout", { bubbles: true })` — é o evento que o React
realmente escuta para `onBlur`, e ele borbulha até a raiz onde o React delega. Vale para
qualquer teste de campo que confirme ao sair.

### O tema escuro quebra por texto branco fixo, não pelas cores de fundo

Ao ligar o tema escuro, os fundos se resolveram sozinhos (todos vinham de token), mas as
**pílulas selecionadas** ficaram ilegíveis: o padrão era
`background: ativo ? INK : PAPER, color: ativo ? "#fff" : INK`. No tema escuro `INK` vira
claro, e o `"#fff"` fixo dava texto branco sobre fundo branco.

**Solução**: `color: ativo ? PAPER : INK`. `PAPER` inverte junto com o tema, então dá texto
claro sobre escuro no tema claro e o contrário no escuro. **Regra**: num par fundo/texto que
inverte, os dois lados têm de vir de token — nunca um token e um literal.

Outros dois pontos que só apareceram no escuro, pela mesma causa: o selo "Limite excedido"
(`color: "#fff"` sobre `RUST`, que clareia no tema escuro) e o **tooltip do Recharts**, que
traz `background-color: #fff` próprio e precisa de `contentStyle`/`labelStyle`/`itemStyle`
explícitos.

**Como varrer**: no tema escuro, procurar por elementos dentro de `main` com fundo de
luminância alta e contraste < 4,5:1 contra o próprio texto. Foi o que achou os três casos.

### `transition` + variável CSS = valor preso ao trocar o tema

O Chromium **não reanima** uma propriedade em transição quando o que muda é a **variável CSS**
por trás dela. Como todas as cores vêm de `var(--…)`, qualquer elemento com `transition` ficava
preso na cor do tema anterior ao trocar de tema — a troca parecia "aplicar pela metade", e foi
relatada pelo usuário como "o seletor de modo noturno está quebrado".

**Sintoma que confunde**: `getComputedStyle` mostra a variável já com o valor novo
(`--paper: #FFFFFF`) e, ao mesmo tempo, a propriedade com o valor antigo
(`background-color: rgb(25,32,43)`). Desligar a transição no elemento faz o valor saltar para o
correto — é o teste que confirma o diagnóstico.

**Solução**: `applyTheme()` põe a classe `.theme-switching` no `<html>` (que zera `transition`
em tudo), troca o `data-theme` e remove a classe **dois quadros depois**. Um quadro só não
basta: o primeiro aplica as cores, o segundo religa as transições.

**A mesma causa** derrubava a barra lateral: com `transition-transform` e o `transform` do
Tailwind composto por `--tw-translate-x`, ao **redimensionar** a janela para além de 1024px com
a página aberta a barra ficava presa em `-100%` (fora da tela), levando junto o seletor de tema.
Resolvido com `lg:transition-none` — a partir de `lg` a barra é fixa e não precisa animar.

### Categoria apagada ressuscitava porque o seed roda toda sessão

`seedCategories()` recria a taxonomia de fábrica a cada carga do app. A sincronização fazia
**união** de local e remoto e subia para a planilha tudo que só existia local — então uma
categoria de fábrica apagada voltava do seed na sessão seguinte e era **regravada** na planilha.

**Solução**: quando a planilha já tem categorias, ela é a fonte da verdade sobre o que existe.
Sobe só o que é local **e não pertence ao seed** (`SEED_CATEGORY_ROW_IDS`), o que preserva
categoria criada pelo usuário cuja gravação falhou (offline) sem ressuscitar padrão de fábrica.
Com a planilha vazia (primeira sincronização), a taxonomia local sobe inteira.

**Só afeta categorias**: os seeds de cartões, veículos e lançamentos retornam vazio.

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

### Arquivo colocado em `dist/` é apagado na build seguinte

`vite build` **esvazia** o `dist/` antes de gerar. Uma imagem (ou qualquer outro arquivo)
deixada lá se perde no próximo build — e o `dist/` também é ignorado pelo Git, então não há
nem cópia no repositório. Aconteceu de verdade com o logotipo, entregue em
`dist/assets/images/`.

**Onde colocar**: `public/` para o que o site precisa servir por caminho fixo (`/favicon.png`,
`/images/…`) — essa pasta é copiada inteira para o `dist/` na build; `src/assets/` para
originais que não devem ir para produção (o Vite só embala o que é importado por código).

### Existem duas versões do logotipo, e usar a errada torna ele ilegível

Medição de contraste (WCAG) de cada arquivo contra cada fundo:

| Arquivo | Sobre fundo claro | Sobre o `INK` (#101B2D) |
| --- | --- | --- |
| `logo-meufinanceiro.png` (colorido) | **~13:1** ✅ | 1,2:1 no pior 10% ❌ (o "Meu" azul-escuro some) |
| `logo-meufinanceiro-white.png` (claro) | ~5:1, lavado ⚠️ | **9,9:1 de mediana, 3,07:1 no pior 10%** ✅ |

**Regra**: o componente `Logo` recebe `onDark` e escolhe o arquivo — quem usa declara o
**fundo**, nunca a cor do arquivo. Os três usos atuais (barra lateral, barra superior do
mobile e login) são todos sobre fundo escuro; a versão colorida fica pronta para os fundos
claros e para a inversão que o modo noturno vai exigir.

**Não** aplicar filtro CSS para clarear o logotipo colorido: distorce as cores da marca. Houve
uma solução intermediária de apoiar o logotipo colorido numa placa clara, substituída assim
que a versão para fundo escuro passou a existir.

### Manipular PNG sem dependência: `zlib` do Node basta

Não há ImageMagick nem biblioteca de imagem neste ambiente (atenção: `/c/WINDOWS/system32/
convert` é a ferramenta de disco do Windows, não o ImageMagick). Para recortar/redimensionar
PNG, dá para decodificar com `zlib.inflateSync`, desfazer os filtros de scanline, processar e
recodificar com `zlib.deflateSync` + CRC32 — foi assim que o favicon e a versão reduzida do
logotipo foram gerados. Dois cuidados: o redimensionamento precisa usar **alfa
pré-multiplicado** (senão as bordas transparentes puxam a cor para preto e aparece uma franja
escura), e a localização da marca dentro do logotipo sai de contar pixels com alfa alto por
coluna, achando o vão até o texto — mais confiável que estimar coordenadas no olho.

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

- **`CURRENT_MONTH_IDX` lê o relógio** (`new Date().getMonth()`) desde 2026-08-16 — é o mês em
  que o app abre. Era fixo em `6` (Julho), herança do mês da migração da planilha legada, e
  fazia o app abrir sempre em Julho. Usa `new Date()` direto porque é declarado **antes** de
  `TODAY`; referenciar `TODAY` ali daria erro de inicialização.
- **`REFERENCE_YEAR_DEFAULT` lê o relógio** (`TODAY.getFullYear()`) desde 2026-08-16, pela
  mesma regra do mês. Era fixo em `2026`. É o ano usado quando **não há nada salvo** e também
  o assumido por `dueDateOf()` para lançamento sem ano gravado. **Só vale como ponto de
  partida**: havendo ano no `localStorage` ou na aba `Config` da planilha, é ele que manda —
  inclusive quando é anterior ao do relógio (quem opera um ano atrasado continua nele).
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
- **`vehicle.paidInstallments` NÃO é o número de parcelas pagas exibido** — é só o ponto de
  partida (o que foi quitado antes de virar lançamento aqui). O número exibido vem de
  `vehiclePaidInstallments(vehicle, transactions)`, que soma a esse valor as parcelas de
  número maior já marcadas como pagas. Quem ler o campo cru — no estado, na planilha
  (`ParcelasPagas`) ou no formulário de edição — vai ver um número menor que o da tela, e isso
  é o esperado. Ao criar qualquer lugar novo que mostre progresso de financiamento, usar o
  helper, nunca o campo.

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
