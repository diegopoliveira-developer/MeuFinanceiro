# MeuFinanceiro

Dashboard de controle financeiro familiar (React + Tailwind + Recharts).

## Como rodar localmente

Pré-requisito: [Node.js](https://nodejs.org) instalado (versão 18 ou superior).

```bash
# 1. Instale as dependências
npm install

# 2. Rode em modo desenvolvimento
npm run dev
```

Isso abre o app em `http://localhost:5173` (o terminal mostra o link exato).

## Como gerar uma versão para publicar (build de produção)

```bash
npm run build
```

Isso cria a pasta `dist/` com os arquivos estáticos prontos. Você pode:
- Subir a pasta `dist/` em qualquer hospedagem estática (Vercel, Netlify, GitHub Pages, Firebase Hosting, etc.)
- Ou testar localmente com `npm run preview`

## Publicar no Firebase Hosting

O projeto já vem com `firebase.json` pré-configurado (pasta pública `dist`, com rewrite de SPA). Passos:

```bash
# 1. Instale a CLI do Firebase (uma vez só, globalmente)
npm install -g firebase-tools

# 2. Faça login
firebase login
# Se estiver no WSL e o navegador não abrir sozinho:
# firebase login --no-localhost

# 3. Vincule este projeto a um projeto do Firebase (cria o .firebaserc)
firebase use --add

# 4. Build + deploy num comando só
npm run deploy
```

O comando `npm run deploy` já faz `vite build` seguido de `firebase deploy --only hosting`. Toda vez que atualizar o código, é só rodar `npm run deploy` de novo.

## Estrutura do projeto

```
meufinanceiro/
├── index.html          # HTML de entrada
├── firebase.json        # config. do Firebase Hosting (pasta dist + rewrite de SPA)
├── src/
│   ├── main.jsx        # ponto de entrada React
│   ├── App.jsx         # o dashboard completo (todo o app está aqui)
│   └── index.css       # diretivas do Tailwind
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── package.json
```

## Observações

- Os dados ficam em memória (state do React) — ao dar refresh na página, os dados voltam ao estado em branco. Use a aba **Conexão Google Sheets** para importar/exportar/sincronizar seus dados, ou implemente persistência própria (ex.: `localStorage`, que funciona normalmente aqui fora do ambiente de artifacts do Claude, ou um backend).
- Todo o código do dashboard está em `src/App.jsx`, um único arquivo — fica à vontade para dividir em componentes menores se o projeto crescer.

## Login

O app pede usuário e senha ao abrir. Credenciais padrão:
- **Usuário:** `familia`
- **Senha:** `meufinanceiro`

Você pode trocar usuário e senha **dentro do próprio app**, no botão "Alterar usuário e senha" no rodapé do menu lateral (pede a senha atual para confirmar). Isso é salvo no `localStorage` do navegador — funciona normalmente depois de publicado (Vercel, StackBlitz etc.), mas **não persiste dentro do preview de artifacts do Claude.ai**, que bloqueia esse tipo de armazenamento; nesse caso a alteração vale só durante a sessão atual da aba.

Se preferir trocar a credencial padrão diretamente no código (sem depender do navegador), veja o comentário no topo de `src/App.jsx`, na constante `AUTH_CONFIG`.

## Sincronização com Google Sheets

Depois de configurar a URL do Apps Script Web App na aba "Conexão Google Sheets", todo lançamento (inclusive parcelas/recorrências), categoria e subcategoria criada, editada ou excluída é enviada automaticamente para a planilha (upsert por ID). O botão "Sincronizar agora" serve para trazer o que já estava na planilha e alinhar os dois lados na primeira vez.

A planilha precisa de três abas: `Lancamentos`, `Categorias` e `Config` (esta última guarda só o "ano corrente" do sistema — veja o passo a passo dentro do app, aba Conexão). A aba `Config` é o que permite recuperar tanto os anos arquivados quanto qual ano está ativo mesmo depois de limpar os dados do navegador por completo — sem ela, uma sessão nova sempre volta a assumir que o ano corrente é o padrão de fábrica.

## Importação de extrato bancário

Na aba Lançamentos, o botão "Importar extrato" abre um assistente que lê um CSV do seu banco (reconhece automaticamente o formato do Nubank — colunas Data, Valor, Identificador, Descrição), mostra uma prévia editável antes de confirmar, detecta duplicatas (por Identificador, se a coluna existir) e permite mapear colunas manualmente para outros formatos de banco.

