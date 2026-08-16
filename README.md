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

O app pede usuário e senha ao abrir. **A senha não está escrita neste repositório** — o que existe em `src/App.jsx`, na constante `AUTH_CONFIG`, é só o hash PBKDF2 dela (com salt e 210.000 iterações). No login, o app aplica a mesma derivação ao que você digitar e compara os hashes. Quem ler o código-fonte não descobre a senha.

Para definir outra credencial, siga o comentário no topo de `src/App.jsx`, acima de `AUTH_CONFIG`: ele traz o trecho para gerar salt e hash no console do navegador, sem que a senha saia dali.

Também dá para trocar usuário e senha **dentro do app**, no botão "Alterar usuário e senha" no rodapé do menu lateral (pede a senha atual para confirmar). Essa troca é salva no `localStorage` e **vale só no navegador onde foi feita** — para mudar em todos os dispositivos, altere no código-fonte e publique.

> **O que isso protege e o que não protege.** Guardar só o hash impede que alguém com acesso ao código descubra a sua senha. Não impede que essa mesma pessoa **pule a verificação**: como tudo roda no navegador, o login é uma trava contra acesso casual, não autenticação de verdade. Para barreira real, use proteção por senha no provedor de hospedagem.

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
| Ignorado | `Sim` se o lançamento foi marcado como "não será pago" (fica no histórico, fora de todas as somas) |

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

Esta aba guarda também, nas mesmas três colunas: o **hash da sua senha** (nunca a senha em si — veja a seção Login) e os **feriados da sua cidade** cadastrados no app, um por linha.

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

## Aba Cartões

Uma tela por cartão e por mês: total da fatura, quantas compras e o ticket médio, quanto do limite já foi usado, gráfico da fatura mês a mês no ano, composição por categoria e a lista das compras.

O agrupamento respeita o **ciclo real do cartão**, não o mês do lançamento: com fechamento no dia 15, uma compra feita no dia 20 de agosto entra na fatura de **setembro**. Por isso a tela mostra o período que cada fatura cobre (ex.: "compras de 16/08 a 15/09") e marca o dia com o mês quando a compra veio do mês anterior.

## Vencimentos, dias úteis e feriados

Um lançamento só é marcado como **vencido a partir do dia seguinte** ao vencimento — nunca no próprio dia. E vencimento que cai em sábado, domingo ou feriado passa a valer no próximo dia útil (o app mostra um `*` ao lado do dia, e o motivo aparece ao passar o mouse).

Os **feriados nacionais são calculados automaticamente**, inclusive os que mudam de data todo ano (Carnaval, Sexta-feira Santa e Corpus Christi). Os **feriados da sua cidade ou estado** você cadastra na aba **Categorias & Módulos**, no card "Feriados" — eles são salvos na planilha junto com o resto.

## Importação de extrato bancário

Na aba Lançamentos, o botão "Importar extrato" abre um assistente que lê um CSV do seu banco (reconhece automaticamente o formato do Nubank — colunas Data, Valor, Identificador, Descrição), mostra uma prévia editável antes de confirmar, detecta duplicatas (por Identificador, se a coluna existir) e permite mapear colunas manualmente para outros formatos de banco.

### Conciliação com o que você já lançou

Se uma linha do extrato bate em **mês, tipo e valor** com uma conta que você já tinha cadastrado e ainda estava pendente, a coluna **"O que fazer"** sugere marcar essa conta como paga em vez de criar um lançamento novo — assim a despesa não é contada duas vezes.

A sugestão nunca é aplicada sozinha: confira linha a linha e troque para "Criar lançamento novo" quando não for o caso. Isso importa porque a comparação é só por valor — se você tem duas contas de R$ 200 no mesmo mês, o app não tem como saber qual é qual, e pode trocá-las. Se isso acontecer, basta escolher o lançamento certo na lista; a outra linha se ajusta sozinha.

## Para quem vai desenvolver (ou para a IA)

Este README é a documentação de **uso**. A documentação de **desenvolvimento** fica em
[`Contextos/`](Contextos/) — comece por [`Contextos/LEIA-PRIMEIRO.md`](Contextos/LEIA-PRIMEIRO.md).

| Arquivo | O que é |
| --- | --- |
| [`Contextos/Basic AI Project Rules.md`](Contextos/Basic%20AI%20Project%20Rules.md) | Norma de prioridade máxima. |
| [`Contextos/Projeto.md`](Contextos/Projeto.md) | O que este projeto é, seu escopo e seu não-escopo. |
| [`Contextos/Convencoes.md`](Contextos/Convencoes.md) | Arquitetura e convenções de código (normativo). |
| [`Contextos/Ambientes.md`](Contextos/Ambientes.md) | Build, deploy e procedimento de teste. |
| [`Contextos/Decisoes.md`](Contextos/Decisoes.md) | Por que cada coisa é como é. |
| [`Contextos/Conhecimento.md`](Contextos/Conhecimento.md) | Armadilhas técnicas já descobertas. |
| [`Notas/TODO.md`](Notas/TODO.md) | Backlog técnico. |

Dois avisos que valem para qualquer alteração:

- **`npm run deploy` publica em produção** — o site em uso pela família.
- **As abas e colunas da planilha do Google são contrato**: acrescentar coluna é seguro,
  renomear ou remover quebra a planilha de quem já usa.

