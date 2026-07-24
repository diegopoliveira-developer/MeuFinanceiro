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

- Os dados ficam em memória (state do React) — ao dar refresh na página, os dados voltam para o exemplo inicial. Use a aba **Conexão Google Sheets** para importar/exportar seus dados via CSV, ou implemente persistência própria (ex.: um backend, ou `localStorage` — que funciona normalmente aqui fora do ambiente de artifacts do Claude).
- Todo o código do dashboard está em `src/App.jsx`, um único arquivo — fica à vontade para dividir em componentes menores se o projeto crescer.
