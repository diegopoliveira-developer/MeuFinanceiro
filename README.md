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

## Instalação da planilha (Google Sheets)

O Google Sheets funciona como banco de dados externo do app — opcional, mas recomendado para os dados persistirem além da memória do navegador. Siga os passos abaixo uma única vez.

### 1. Crie a planilha

Abra [sheets.google.com](https://sheets.google.com) e crie uma planilha em branco. Dentro dela, crie as abas listadas abaixo, cada uma com a **linha 1 preenchida exatamente com os nomes de coluna indicados** (a ordem não importa, os nomes sim).

### 2. Abas e colunas

**`Lancamentos`** (obrigatória)

| Coluna | Conteúdo |
|---|---|
| ID | identificador único do lançamento (gerado pelo app) |
| Ano | ano do lançamento (ex.: 2026) |
| Mes | abreviação em português (Jan, Fev, Mar…) |
| Tipo | Receita ou Despesa |
| CategoriaId | id interno da categoria |
| Categoria | nome de exibição da categoria |
| SubcategoriaId | id interno da subcategoria |
| Subcategoria | nome de exibição da subcategoria |
| Descricao | descrição do lançamento |
| Valor | valor numérico |
| Cartao | id do cartão vinculado (se houver) |
| Veiculo | id do veículo vinculado (se houver) |
| Pago | Sim ou Não |
| Vencimento | dia do mês (1–31) |
| Notas | observações livres |
| ParcelaNumero | número da parcela atual (se for parcelado) |
| ParcelaTotal | total de parcelas (se for parcelado) |
| RecorrenciaGrupoId | id que agrupa parcelas/recorrências |
| RecorrenciaIndefinida | Sim se for recorrência sem data de término |
| BankId | identificador da transação bancária (importação de extrato) |

**`Categorias`** (obrigatória)

| Coluna | Conteúdo |
|---|---|
| ID | identificador único da linha (categoria + subcategoria) |
| Tipo | Receita ou Despesa |
| CategoriaId | id interno da categoria |
| Categoria | nome de exibição |
| Cor | cor em hexadecimal usada nos gráficos |
| SubcategoriaId | id interno da subcategoria (vazio se a categoria não tiver subcategorias) |
| Subcategoria | nome de exibição da subcategoria |

**`Config`** (obrigatória)

| Coluna | Conteúdo |
|---|---|
| ID | identificador da linha de configuração (ex.: `ano_corrente`) |
| Chave | nome da configuração (ex.: `AnoAtual`) |
| Valor | valor da configuração |

É nela que fica salvo qual é o "ano corrente" do sistema — sem isso, uma sessão nova (depois de limpar o navegador) não saberia que você já tinha arquivado e avançado de ano.

**`Cartoes`** (opcional — só necessária se você cadastra cartões de crédito)

| Coluna | Conteúdo |
|---|---|
| ID | identificador único do cartão |
| Nome | nome de exibição |
| Limite | limite total do cartão |
| DiaFechamento | dia do mês em que a fatura fecha |
| DiaVencimento | dia do mês em que a fatura vence |
| Cor | cor em hexadecimal |

**`Veiculos`** (opcional — só necessária se você cadastra financiamentos de veículos)

| Coluna | Conteúdo |
|---|---|
| ID | identificador único do veículo |
| Nome | nome de exibição |
| ValorTotal | valor total do bem/financiamento |
| TotalParcelas | número total de parcelas |
| ValorParcela | valor de cada parcela |
| ParcelasPagas | quantas parcelas já foram pagas |
| MesInicio | mês de início do financiamento (0 = Janeiro) |

**`Orcamentos`** (opcional — só necessária se você usa Metas & Orçamentos)

| Coluna | Conteúdo |
|---|---|
| ID | igual ao CategoriaId (uma meta por categoria) |
| CategoriaId | id interno da categoria |
| Limite | valor máximo mensal definido como meta |
| Ativo | Sim ou Não |
| Periodo | hoje sempre `monthly` |

### 3. Publique a aba Lancamentos como CSV (opcional, só leitura)

Só necessário se você quiser usar a importação simples via CSV (aba "Conexão Google Sheets", passo 1 do app). Vá em **Arquivo → Compartilhar → Publicar na Web**, escolha a aba `Lancamentos` e o formato **CSV**, copie o link gerado.

### 4. Publique o Apps Script (recomendado — sincronização completa e automática)

1. Na planilha, vá em **Extensões → Apps Script**.
2. Apague o conteúdo padrão e cole o código mostrado na aba "Conexão Google Sheets" do app (ele já sabe ler e gravar em todas as abas acima).
3. (Opcional, recomendado) Defina um token secreto na constante `SHARED_SECRET` do script, e cole o mesmo valor no campo "Token secreto" do app — isso impede que alguém que descubra a URL publicada consiga ler/gravar na sua planilha sem esse token.
4. Clique em **Implantar → Nova implantação**, tipo **App da Web**, execute como **Eu**, acesso **Qualquer pessoa**.
5. Copie a URL gerada (termina em `/exec`) e cole no app, aba "Conexão Google Sheets", campo "URL do Apps Script Web App".
6. Clique em "Sincronizar agora" uma vez para o primeiro alinhamento. A partir daí, tudo que você criar/editar/excluir no app é enviado automaticamente.

## Importação de extrato bancário

Na aba Lançamentos, o botão "Importar extrato" abre um assistente que lê um CSV do seu banco (reconhece automaticamente o formato do Nubank — colunas Data, Valor, Identificador, Descrição), mostra uma prévia editável antes de confirmar, detecta duplicatas (por Identificador, se a coluna existir) e permite mapear colunas manualmente para outros formatos de banco.

