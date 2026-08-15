# Ambientes

Conforme `Basic AI Project Rules.md`: sempre identificar o ambiente afetado. **Na dúvida,
assumir que o ambiente pode ser Produção.**

---

## 1. Situação atual dos ambientes

| Ambiente | Status |
| --- | --- |
| **Desenvolvimento** | Existe. Máquina local do autor (Windows), `npm run dev` servindo em `http://localhost:5173`. |
| **Homologação** | **Não existe.** Não há ambiente intermediário: o que sai do desenvolvimento vai direto para produção. Conferência antes de publicar é feita com `npm run preview` sobre o build real. |
| **Produção** | Existe. Site estático publicado no **Firebase Hosting**, em uso real pela família do autor. Publicado por `npm run deploy`. A Vercel está configurada (`vercel.json`) como destino alternativo, mas não está em uso. |

**Dados e credenciais envolvidos:**

- **Não há banco de dados** neste projeto, em nenhum ambiente.
- **Há dado real de usuário em produção**: os lançamentos financeiros da família, guardados
  na planilha do Google do usuário. A planilha **não pertence a este repositório** e nada
  aqui deve tentar acessá-la; a URL do Apps Script e o token secreto são digitados pelo
  usuário no app e ficam no `localStorage` do navegador dele.
- **Credencial padrão de login (`familia` / `meufinanceiro`) está no código-fonte**, em
  `AUTH_CONFIG`. É o padrão de fábrica, sobrescrito pelo usuário na interface; o app avisa
  na tela enquanto não for trocado. Não é segredo de produção — e nunca deve virar um:
  segredo de verdade não pode ficar em código que roda no navegador.
- Dev e produção rodam **o mesmo código**, sem variáveis de ambiente e sem arquivo `.env`.
  A única diferença é o build (minificado, com hash nos nomes) e os cabeçalhos HTTP de
  segurança, que só a hospedagem aplica.

**Quando um ambiente de produção passar a existir, atualize este arquivo ANTES de qualquer
tarefa que possa afetá-lo.** — Ele **já existe**: qualquer alteração publicada atinge o uso
real da família. `npm run deploy` exige autorização explícita do usuário.

---

## 2. Ambiente de desenvolvimento

**Sistema**: Windows 11, projeto em `E:\Projetos\MeuFinanceiro`. O deploy no Firebase já foi
feito também de dentro do WSL via PhpStorm — nesse caso, manter o projeto no filesystem
nativo do Linux (não em `/mnt/c/...`) por desempenho, e usar `firebase login --no-localhost`
quando o navegador não abrir a partir do WSL.

⚠️ **O `node_modules/` é específico da plataforma.** Até 2026-08-15 a árvore estava instalada
para Linux (WSL) e o build **não rodava no Windows**; um `npm install` autorizado pelo usuário
reinstalou para Windows (`@esbuild/win32-x64`), e desde então `npm run dev`/`npm run build`
funcionam aqui. Trabalhar pelo WSL de novo exige rodar `npm install` lá. Ver
`Conhecimento.md`. Definir um único lado como ambiente de build evita reinstalar toda vez.

**Runtime/linguagem**: Node.js 18 ou superior. Instalado na máquina: Node v22.14.0, npm
11.6.2. JavaScript ES modules — `package.json` declara `"type": "module"`.

```text
npm install     # instala as dependências em node_modules/ (não versionado)
```

⚠️ **`npm install` é instalação de software** — conforme `Basic AI Project Rules.md`, exige
autorização explícita do usuário.

**Dependências** — todas efetivamente usadas, nenhuma preventiva:

| Dependência | Versão | Uso |
| --- | --- | --- |
| `react` | ^18.3.1 | Componentes e hooks. |
| `react-dom` | ^18.3.1 | Montagem no DOM (`createRoot`). |
| `recharts` | ^2.12.7 | Gráficos de rosca, barras e linha. |
| `papaparse` | ^5.4.1 | Leitura de CSV — planilha publicada e extrato bancário. |
| `lucide-react` | ^0.383.0 | Ícones da interface. |
| `vite` (dev) | ^5.4.0 (instalado: 5.4.21) | Servidor de desenvolvimento e build. |
| `@vitejs/plugin-react` (dev) | ^4.3.1 | Suporte a JSX e Fast Refresh. |
| `tailwindcss` (dev) | ^3.4.10 | Classes utilitárias de estilo. |
| `postcss` (dev) | ^8.4.41 | Pipeline de CSS do Tailwind. |
| `autoprefixer` (dev) | ^10.4.20 | Prefixos de compatibilidade no CSS gerado. |

**Ferramenta externa, não instalada por `npm install`**: `firebase-tools` (CLI do Firebase),
instalada globalmente e usada por `npm run deploy`. O vínculo com o projeto Firebase é feito
uma vez com `firebase use --add`, que cria o `.firebaserc` local.

Não há linter, formatador nem framework de teste configurados no projeto.

---

## 3. Sistema de build / execução

```text
npm run dev       # desenvolvimento: Vite em http://localhost:5173, com Fast Refresh
npm run build     # produção: gera dist/ (JS/CSS minificados, com hash no nome)
npm run preview   # serve o dist/ já gerado, para conferir o build antes de publicar
npm run deploy    # npm run build + firebase deploy --only hosting  ← PUBLICA EM PRODUÇÃO
```

**Diferenças entre os modos:**

- `dev` serve os módulos sem bundle, com recarga instantânea, e **não aplica** os cabeçalhos
  de segurança HTTP — eles vêm da hospedagem (`firebase.json` / `vercel.json`). Um problema de
  CSP, portanto, **não aparece em `npm run dev`**: só em `preview` publicado ou em produção.
- `build` gera `dist/`, que é artefato: nunca editar à mão, sempre recriável.
- `deploy` é **irreversível do ponto de vista do usuário final** — publica no ar. Exige
  autorização explícita, conforme `Basic AI Project Rules.md`.

### Tratamento de erro

- `vite build` retorna código de saída diferente de zero quando falha, e imprime o arquivo e
  a linha do erro. Como `npm run deploy` encadeia com `&&`, uma falha de build **impede** o
  deploy — o comportamento correto, que não deve ser afrouxado (nunca trocar por `;` ou
  `|| true`).
- Erros de runtime do app aparecem no console do navegador. O app não tem *error boundary*
  do React: uma exceção não tratada em render derruba a árvore inteira para tela em branco.
- Erros de sincronização com a planilha são capturados e exibidos como mensagem na aba
  Conexão — nunca silenciados. Falha de `localStorage` é a única exceção deliberada: cai em
  silêncio para "só nesta sessão", por design (ver `Projeto.md`, seção 5).

---

## 4. Procedimento de teste — OBRIGATÓRIO

**Nunca afirmar "testado" sem ter executado.** Diferenciar IMPLEMENTADO de TESTADO.

⚠️ **Não existe suíte de testes neste repositório.** Não há `npm test`, nem jest, nem vitest.
A bateria de testes end-to-end (jsdom + React real) usada no histórico do projeto rodava em
um ambiente de trabalho externo e **não foi versionada** — ela não está disponível aqui.
Enquanto isso não mudar (pendência em [`../Notas/TODO.md`](../Notas/TODO.md)), a verificação é
manual e o checklist abaixo é o mínimo.

Checklist mínimo antes de considerar qualquer entrega pronta:

1. `npm run build` executa sem erro e sem aviso novo.
2. `dist/` foi regenerado e contém `index.html` + `assets/` com JS e CSS.
3. `npm run dev` (ou `npm run preview`) e exercitar **na interface real**, no mínimo:
   - login com a credencial vigente;
   - criar, editar, marcar como pago e excluir um lançamento;
   - o fluxo específico que foi alterado, do começo ao fim.
4. Console do navegador aberto durante o teste — **zero erros e zero avisos do React**.
5. Testes específicos deste projeto, conforme o que foi tocado:
   - **Mexeu em sincronização, em campo de lançamento ou no esquema da planilha**: testar com
     uma planilha do Google **de teste** (nunca a do usuário), com o Apps Script publicado,
     e conferir o ciclo completo — criar no app → aparecer na planilha → recarregar a página
     → sincronizar → o dado voltar íntegro.
   - **Mexeu em layout**: conferir em viewport estreita (~375px) e em desktop — a barra
     lateral vira gaveta abaixo de 1024px.
   - **Mexeu em parcelas/recorrências ou ciclo de fatura**: conferir a aritmética com um caso
     de virada de mês e um de virada de ano (dezembro→janeiro).
   - **Mexeu em cabeçalhos de segurança, fontes ou em qualquer chamada de rede nova**: testar
     no build publicado, não em `dev` — a CSP só existe fora do `dev`.

Verificar sempre pelo resultado observado (tela, console, conteúdo real da planilha), nunca
por inspeção de código apenas.

---

## 5. Alvos suportados

- **Navegadores**: versões atuais de Chrome, Edge, Firefox e Safari, desktop e mobile. O app
  usa Web Crypto (`crypto.subtle`) com fallback em JS puro, então funciona também onde a API
  está indisponível ou o contexto não é seguro.
- **Node.js**: 18+ para desenvolvimento e build. Não é requisito para usar o app publicado.
- **Sistema operacional de desenvolvimento**: Windows e Linux/WSL, ambos já exercitados.
- **Tamanhos de tela**: a partir de ~375px de largura. O breakpoint `lg` (1024px) separa o
  layout de gaveta do layout com barra lateral fixa.
- **Hospedagem**: qualquer servidor de arquivos estáticos com rewrite de SPA. Em uso:
  Firebase Hosting; configurada como alternativa: Vercel.
- Sem suporte a Internet Explorer e sem funcionamento offline (não há service worker).

---

## 6. Versionamento e controle de versão

**Versão interna**: `1.0.0`, hoje declarada apenas no campo `version` do `package.json`.
**Não existe** o arquivo de versão com histórico (`version.js`) exigido por
`Basic AI Project Rules.md` — pendência registrada em [`../Notas/TODO.md`](../Notas/TODO.md).

**Repositório**: Git, branch principal `main`. Não há remoto de código configurado como parte
do fluxo documentado; o deploy vai direto da máquina local para o Firebase.

Conforme `Basic AI Project Rules.md`, **nenhuma operação de versionamento (commit, push,
pull, merge, rebase) deve ser executada sem autorização explícita do usuário.**

Não versionar: variáveis de ambiente, credenciais, chaves/certificados privados, arquivos
reais de banco de dados, uploads de usuários, logs, cache, dumps e backups de produção.

Neste projeto isso alcança em particular: `node_modules/`, `dist/`, `.firebase/` (cache da
CLI) e `.firebaserc` (contém o id do projeto Firebase do usuário). O `.gitignore` atual
**não** cobre `.firebase/` nem `.firebaserc`, e `.firebase/hosting.ZGlzdA.cache` está
versionado — pendência de conformidade registrada em [`../Notas/TODO.md`](../Notas/TODO.md).
