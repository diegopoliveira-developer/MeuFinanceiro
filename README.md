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
- Subir a pasta `dist/` em qualquer hospedagem estática (Vercel, Netlify, GitHub Pages, etc.)
- Ou testar localmente com `npm run preview`

## Estrutura do projeto

```
meufinanceiro/
├── index.html          # HTML de entrada
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

**Troque isso antes de publicar!** Veja o comentário no topo de `src/App.jsx`, na constante `AUTH_CONFIG` — ele explica como gerar um novo hash e por que essa trava é apenas uma proteção básica do lado do cliente (não substitui autenticação de verdade num backend, nem a proteção por senha oferecida por provedores como a Vercel).

