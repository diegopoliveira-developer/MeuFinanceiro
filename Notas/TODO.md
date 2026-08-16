# TODO — Backlog técnico

Fonte principal do backlog, conforme `Basic AI Project Rules.md`.
Atualizar conforme as tarefas forem concluídas.

Regras: checklist Markdown, tarefas agrupadas por categoria.

---

## 🔥 Fila atual — pedido de 2026-08-15

Dez tarefas pedidas pelo usuário. A **numeração T1–T10 é a do pedido original** e não muda;
a ordem em que aparecem abaixo é a **prioridade de execução** proposta, aplicando a ordem de
decisão da norma (Segurança > Correção > Simplicidade > …) e, em empate, o menor esforço
primeiro. O usuário pediu para começar por T1 e T2, fora dessa ordem — feito.

| Ordem | Tarefa | Por que nesta posição |
| --- | --- | --- |
| 1º | **T8** — status "vencido" | Correção de bug real. ✅ feito e testado |
| 2º | **T1** — modal não fechar ao clicar fora | Perda de dados digitados. ✅ feito e testado |
| 3º | **T3** — tooltip com a descrição | ✅ feito e testado |
| 4º | **T6** — edição inline do vencimento | ✅ feito e testado |
| 5º | **T10** — marcar lançamento como "não será pago" | ✅ feito e testado |
| 6º | **T2** — vincular parcelas em aberto do veículo | ✅ feito e testado |
| — | **T7** — edição inline do valor | ✅ feito e testado |
| 7º | **T5** — conciliação na importação de extrato | ✅ feito e testado |
| 8º | **T4** — dashboard de cartões | ✅ feito e testado |
| 9º | **T9** — senha sincronizada pela planilha | ✅ feito e testado (opção C, escolhida pelo usuário) |

### Tarefas

- [x] **T1 · Modal de lançamento não fecha ao clicar fora.** ✅ **2026-08-15.** `Modal` ganhou
      a prop `closeOnBackdrop` (padrão `true` — nenhum outro modal mudou de comportamento) e
      `TransactionModal` passa `false`. Fecha só por "Cancelar", pelo X ou ao salvar.
      **Testado na interface real**: com o formulário preenchido, clique no backdrop mantém o
      modal aberto e o texto digitado intacto; "Cancelar" fecha; o modal de financiamento
      (que não recebe a prop) continua fechando ao clicar fora.
- [x] **T2 · Vincular as parcelas em aberto de um veículo a lançamentos.** ✅ **2026-08-15**,
      nas duas modalidades escolhidas pelo usuário. Novo `VehicleInstallmentsModal`: abre
      sozinho ao cadastrar um financiamento com parcelas em aberto, e volta pelo botão de
      lista no card do veículo. Por parcela, três ações — **gerar** lançamento novo,
      **vincular** a um lançamento já existente daquele mês, ou **ignorar**; quando há um
      lançamento com exatamente o valor da parcela, a linha já nasce sugerindo o vínculo.
      **Testado na interface real**: veículo 45/48 pagas gerou 3 parcelas em aberto (46, 47,
      48), a de Julho casou sozinha com um lançamento de R$ 850 que já existia, e as de Agosto
      e Setembro foram criadas — as três agrupadas na aba Parcelas & Recorrências.
- [x] **T2b · Marcar a parcela como paga passa a atualizar o financiamento.** ✅ **2026-08-15**,
      a partir do relato do usuário: ele marcou a parcela como paga e o card em Categorias
      continuou em 45/48. Novo helper `vehiclePaidInstallments()` — o número exibido passou a
      ser derivado dos lançamentos (Dashboard, Categorias e a própria tela de parcelas em
      aberto usam todos ele). Decisão e alternativas em `Contextos/Decisoes.md`.
      **Testado na interface real**: 45/48 → 46/48 ao marcar como pago, volta a 45/48 ao
      desmarcar, chega a 48/48 com as três pagas — e o botão de "parcelas em aberto" some do
      card quando não há mais nenhuma. Dashboard e Categorias concordam entre si.
- [ ] **Card da série em Parcelas & Recorrências ignora as parcelas anteriores ao sistema.**
      Mostra "3 de 48 parcelas pagas · restam R$ 38.250" para um financiamento onde 45
      parcelas já foram quitadas antes de existirem como lançamento — ele conta só o que virou
      lançamento, mas compara com o total do financiamento. Diferente do card de Categorias,
      que já usa `vehiclePaidInstallments()`. Decidir: usar o mesmo helper quando a série tem
      `vehicleId`, ou deixar claro no texto que o agregado é só das parcelas lançadas.
- [x] **T3 · Tooltip da descrição do lançamento.** ✅ **2026-08-15.** O tooltip mostra a
      descrição por inteiro (ela é truncada na coluna) e, quando o lançamento tem observações,
      soma as duas — em vez de trocar uma pela outra, que perderia a informação que já existia.
      **Testado**: tooltip com observações traz descrição + "Observações: …"; sem observações,
      traz só a descrição.
- [x] **T4 · Dashboard de cartões (tela nova).** ✅ **2026-08-16.** Nova aba **Cartões**, com
      seletor de cartão e de mês. Traz: 4 KPIs (fatura do mês com o período de compras que ela
      cobre, nº de compras e ticket médio, % do limite, disponível e média mensal), barra de
      uso do limite com os selos de 80/90/100/acima, gráfico de fatura mês a mês no ano (com o
      mês selecionado destacado), rosca de composição por categoria e a lista das compras da
      fatura.
      O risco anotado aqui foi eliminado na raiz: `cardInvoiceItems()` virou a **única** função
      que decide o que cai em cada fatura, e o painel do Dashboard passou a derivar dela — não
      há como as duas telas discordarem.
      **Testado**: cartão com fechamento no dia 15 e duas compras de agosto — a do dia 10 caiu
      na fatura de agosto (período 16/07 a 15/08) e a do dia 20 na de setembro (16/08 a 15/09),
      marcada como "20/08" na lista; o painel do Dashboard mostrou exatamente os mesmos
      R$ 300 e R$ 450; uma compra de R$ 4.000 levou o selo a "80% do limite" (86%); e marcá-la
      como "não será pago" tirou-a da fatura por inteiro (R$ 4.300 → R$ 300, 86% → 6%). Em
      viewport de 375px não há rolagem horizontal na página — só dentro da tabela.
- [x] **T5 · Conciliação do extrato com lançamentos existentes.** ✅ **2026-08-16.** A prévia da
      importação ganhou a coluna **"O que fazer"**: linha que bate em mês, tipo e valor com um
      lançamento pendente já cadastrado sugere "Marcar como pago: <descrição>" em vez de criar
      um novo; o usuário confirma ou troca para "Criar lançamento novo" linha a linha. Ao
      conciliar, o lançamento existente é marcado como pago e recebe o `bankId` do extrato —
      é o que faz a reimportação reconhecê-lo como duplicata. Escolher um lançamento já
      reservado por outra linha libera a outra automaticamente.
      **Testado com CSV no formato real do Nubank**: de 4 linhas, 2 casaram com lançamentos
      existentes ("ENEL" → Conta de luz, "VIVO FIBRA" → Internet) e 2 viraram lançamentos
      novos; o resultado ficou com 4 lançamentos, não 6, os conciliados mantiveram descrição e
      categoria originais e passaram a "Pago", e o total do mês somou uma única vez
      (R$ 334,80). Reimportar o mesmo arquivo detectou as 4 como duplicata, com nada marcado.
      No caso ambíguo — dois lançamentos de R$ 200 no mesmo mês — a sugestão trocou os dois,
      como esperado, e a correção pela tela funcionou nos dois sentidos.
- [x] **T6 · Editar o dia de vencimento direto na lista.** ✅ **2026-08-15.** O vencimento
      virou botão com sublinhado tracejado; clicar abre um campo ali mesmo, já focado. Enter ou
      sair do campo salva, Escape descarta. Desabilitado em ano arquivado, como o resto.
      **Testado**: dia 14 → 27 salvou e o status recalculou sozinho de "Vencido" para
      "Pendente"; Escape depois de digitar outro valor manteve o 27.
- [x] **T7 · Editar o valor direto na lista.** ✅ **2026-08-16.** Mesma mecânica da T6: clicar
      no valor abre o campo ali mesmo, já focado; Enter ou sair salva, Escape descarta. A
      validação `> 0` continua valendo — enquanto o valor digitado é inválido, o campo fica com
      borda vermelha e a legenda "Maior que zero", e sair do campo **descarta** em vez de
      gravar. Sinal e cor (receita verde `+`, despesa vermelha `−`) preservados.
      **Testado**: despesa de R$ 250 → R$ 380,50 pela lista, com o resumo do mês acompanhando;
      `0` e `-50` recusados, mantendo o valor anterior intacto; Escape depois de digitar 999
      descartou; receita editada para R$ 5.250,75 manteve o `+` e a cor, e o resumo passou a
      R$ 5.250,75 de entradas contra R$ 380,50 de saídas.
- [x] **T8 · Corrigir o cálculo de "vencido".** ✅ **2026-08-15.** Hora zerada dos dois lados
      (só é vencido a partir do dia seguinte) e vencimento de fim de semana empurrado para a
      segunda (`nextBusinessDay`). O vencimento deslocado ganha um `*` na lista e um tooltip
      dizendo em que dia passa a ser cobrável.
      **Testado em 15/08/2026, um sábado**: vencimento dia 15 (hoje) → "Vence em breve", não
      "Vencido" — era exatamente o caso errado; dia 14 (sexta, ontem) → "Vencido"; dia 22
      (sábado) → "Pendente", com o tooltip apontando segunda, dia 24.
- [x] **T8b · Feriados no cálculo do vencimento.** ✅ **2026-08-15**, nas duas frentes, porque
      elas têm naturezas diferentes: os **nacionais são calculados** (inclusive os móveis —
      Carnaval, Sexta-feira Santa e Corpus Christi saem da Páscoa pelo algoritmo de Butcher) e
      os **municipais/estaduais são cadastrados pelo usuário**, num card novo na aba Categorias
      & Módulos. O deslocamento é em laço, então cobre emenda. Os feriados do usuário vão para
      a aba `Config` da planilha — que já existe, então nada precisa ser republicado no Apps
      Script. O tooltip do vencimento passou a dizer o motivo pelo nome ("Cai em Independência
      — só é cobrável no dia 8/09").
      **Testado**: as 13 datas nacionais de 2026 conferem, e a Páscoa foi validada contra
      2024–2027; vencimento em 07/09 (segunda-feira, mas Independência) deslocou para 08/09;
      emenda sábado 12/09 → domingo → feriado municipal na segunda 14/09 → terça 15/09;
      e o teste que importa — cadastrar um feriado em 14/08 mudou o status do lançamento de
      "Vencido" para "Vence em breve", e removê-lo devolveu para "Vencido".
- [x] **T9 · Senha com hash reforçado.** ✅ **2026-08-15** na opção C, e **revisto em
      2026-08-16**: a sincronização pela planilha foi REMOVIDA quando a credencial padrão
      passou a ser a senha forte definitiva do usuário, guardada só como hash no código-fonte.
      O hash PBKDF2 continua; o que saiu foi o trânsito dele para a planilha. Ver
      `Contextos/Decisoes.md`.
      Registro do que a T9 original entregou:
      **Antes**: hash SHA-256 de `usuario:senha` só em `localStorage` — trocar de dispositivo
      ou limpar os dados devolvia a credencial ao padrão de fábrica.
      **Agora**: PBKDF2-HMAC-SHA256 com salt aleatório e 210.000 iterações, gravado no
      `localStorage` **e** na aba `Config` da planilha (que já existia — não é preciso criar
      aba nem republicar o Apps Script). A tela de login busca a credencial na planilha antes
      de autenticar, quando já há conexão configurada. O formato antigo continua aceito e é
      substituído na primeira troca de senha. Duas verificações novas na tela de Diagnóstico:
      formato do hash e credencial sincronizada (esta alerta se não houver token secreto).
      **Testado**: credencial padrão antiga continua entrando (compatibilidade); ao trocar a
      senha, sobem para a planilha usuário/algoritmo/salt/iterações/hash/data e **nenhuma
      senha em texto puro**; simulando um segundo dispositivo (sem credencial local, com a
      mesma conexão), a credencial foi puxada no login, a senha antiga passou a ser rejeitada
      e a nova funcionou.
- [x] **T9b · "Credencial de fábrica" deixou de ser um problema.** ✅ **2026-08-16.** O padrão
      do código passou a ser a senha forte definitiva do usuário — não existe mais uma senha
      genérica que abra qualquer navegador novo. O limite que resta é outro e é do modelo, não
      da credencial: quem tem o código pode pular a verificação pelo DevTools. Só proteção na
      hospedagem ou backend resolvem isso. **Decisão pendente do usuário.**
- [ ] **Token secreto do Apps Script — ainda vale configurar.** Deixou de ser crítico para a
      senha (o hash não vai mais para a planilha), mas continua sendo o que impede quem
      descobrir a URL de ler e gravar os seus dados financeiros. Confirmar que está configurado
      nos dois lados (app e script).

- [x] **T10 · Marcar lançamento como "não será pago" / ignorado.** ✅ **2026-08-15.** Botão de
      proibido (⊘) na linha alterna o estado; o lançamento fica riscado e esmaecido, com o
      status "Não será pago", e sai de **todas** as somas — KPIs, gráficos, resumo e subtotais
      do mês, orçamentos, faturas de cartão, relatório anual e contagem de pendências —, via um
      único ponto de filtro (`activeTransactions`). Marcar como pago limpa o estado e
      vice-versa. Persistido na planilha na coluna nova `Ignorado` (aditiva: planilha antiga
      sem ela continua funcionando); template do Apps Script e `README.md` atualizados.
      **Testado**: resumo de Agosto caiu de R$ 600 para R$ 300 ao ignorar o lançamento de
      R$ 300, KPIs do Dashboard idem, a linha continuou visível e riscada, e reverter devolveu
      os R$ 600.

---

## Funcionalidades

- [x] **Modo noturno (tema escuro), com seletor e preferência salva na planilha.** ✅
      **2026-08-16.** Seletor de três opções (Claro / Escuro / Sistema) no rodapé da barra
      lateral; preferência salva no `localStorage` **e** na aba `Config` da planilha, então
      acompanha o usuário entre dispositivos.
      Feito por **indireção em variáveis CSS**: os tokens do `App.jsx` deixaram de ser
      hexadecimais e passaram a apontar para `var(--…)`, com as duas paletas em `index.css`.
      Isso trocou 12 linhas em vez dos ~530 pontos que usam cor. Antes de adotar, foi
      verificado no navegador que `var()` resolve dentro de atributo de apresentação do SVG —
      é como o Recharts recebe cor.
      **Testado**: "Sistema" resolve certo no carregamento nos dois esquemas; escolha explícita
      vence o sistema e sobrevive à recarga (o `data-theme` é escrito por um script síncrono no
      `index.html`, antes da primeira pintura, para a tela não piscar); a troca vai para a
      planilha e volta dela (simulado outro dispositivo); o tema claro ficou **idêntico** aos
      valores originais, sem regressão; no escuro o pior contraste de texto é 5,61:1 e as 8
      abas passaram na varredura automática de contraste.
      **Três defeitos encontrados e corrigidos no caminho**, todos por literal fixo em vez de
      token: pílulas selecionadas com `color: "#fff"` sobre fundo que clareia no escuro; o selo
      "Limite excedido"; e o tooltip do Recharts, que traz fundo branco próprio.
- [ ] **Modo noturno — conferir a troca ao vivo na máquina real.** O listener de
      `prefers-color-scheme` existe e a opção "Sistema" resolve certo em toda carga, mas o
      evento `change` do `matchMedia` **não dispara na emulação** do navegador de teste
      (confirmado com uma sonda própria: é limitação do ambiente, não do código). Só isso ficou
      sem verificação.

- [ ] Navegação por anos arquivados no **Dashboard** e em **Parcelas & Recorrências** — hoje
      só Lançamentos e Relatório Anual acessam o histórico.
- [ ] Projeção de saldo futuro a partir das recorrências e parcelas já cadastradas.
- [ ] Comparativo Ano x Ano no Relatório Anual.
- [ ] Exportação de relatório em PDF.
- [ ] Edição em lote de lançamentos — depende de uma UI de seleção múltipla que não existe.
- [ ] Etiqueta de autor por lançamento ("quem lançou") — **como campo livre**, não como login
      ou permissão por pessoa, que seguem fora de escopo (`Contextos/Projeto.md`, seção 2).
- [ ] Detecção de duplicata na importação de extrato também em anos arquivados — hoje só olha
      o ano corrente.
- [ ] Notificação do navegador (Notification API) com o app aberto — é a alternativa viável
      ao alerta por e-mail/push, que exigiria backend e está fora de escopo.

---

## Infraestrutura e plataforma

- [ ] PWA completo: manifest, service worker, instalação e uso offline. Não depende de
      backend, é compatível com a arquitetura atual.
- [ ] Suíte de testes automatizados **versionada neste repositório** — hoje não existe
      `npm test`, e a bateria end-to-end usada no histórico do projeto ficou fora do repo.
      Enquanto isso, nada pode ser declarado "testado" sem execução manual
      (`Contextos/Ambientes.md`, seção 4).
- [ ] Avaliar dividir `src/App.jsx` (~3.370 linhas) por responsabilidade. **Só como trabalho
      isolado**, nunca junto de outra tarefa, e de preferência depois de existir suíte de
      testes. Ver `Contextos/Decisoes.md`.
- [ ] **Decidir a versão do Vite.** A árvore tinha Vite 8.1.5 (provável `npm audit fix
      --force`) sem o `package.json` acompanhar; o `npm install` de 2026-08-15 reverteu para
      5.4.21, dentro do `^5.4.0` declarado. Se a subida for para valer, precisa ir para o
      `package.json` — senão o próximo `npm install` a apaga de novo.
- [ ] **`npm audit`: 3 vulnerabilidades** (1 moderada, 2 altas). A do `nanoid` sai com
      `npm audit fix`, sem quebra. A do `esbuild`/`vite` afeta só o servidor de
      desenvolvimento local (não o build de produção) e exige o salto para o Vite 8.
      Nenhuma das duas aplicada — mexer em dependência exige autorização.
- [ ] **Definir um único ambiente de build** (Windows ou WSL). O `node_modules/` é específico
      da plataforma; alternar entre os dois obriga a reinstalar toda vez.

---

## Pendências de conformidade

Itens em desacordo com as regras ou decisões pendentes do usuário.
Manter esta seção mesmo vazia — ela é o lugar de registrar dívida conhecida
em vez de deixá-la implícita.

- [x] **Arquivo de versão.** ✅ **2026-08-16.** O `version.js` foi criado pelo usuário e
      preenchido com o histórico dos dois dias de trabalho: 12 entradas, de `1.0.0` (estado já
      publicado antes deste ciclo) até `1.8.0` (modo noturno), seguindo a regra da norma —
      `Z` para correção/ajuste, `Y` para funcionalidade nova.
- [x] **`package.json` alinhado com o `version.js`.** ✅ **2026-08-16**, a pedido do usuário:
      ambos em `1.8.0`, e o `package-lock.json` (que guarda a versão em dois campos) foi
      atualizado junto, com `npm install --package-lock-only` — mudou só as duas linhas de
      versão, sem tocar em dependência. **O `version.js` é a fonte da verdade**; os outros dois
      o acompanham. Regra registrada em `Contextos/Ambientes.md`.
- [x] **Cabeçalho obrigatório em `src/`.** ✅ **2026-08-16**, a pedido do usuário, com o
      marcador correto por linguagem: `//` de linha em `App.jsx` e `main.jsx`, `/* */` de bloco
      em `index.css`. **Verificado que nenhum cabeçalho vaza para o `dist/`** — era exatamente
      o motivo da regra de usar comentário de linha no JS (`Contextos/Convencoes.md`, seção 4).
- [ ] **Cabeçalho ainda ausente nos arquivos de configuração** (`vite.config.js`,
      `tailwind.config.js`, `postcss.config.js`). Mesmo marcador do JS (`//`). `index.html` e
      os `.json` seguem de fora por decisão registrada na tabela de `Convencoes.md`.
- [x] **`.firebase/` removido do controle de versão.** ✅ **2026-08-16**, com autorização
      explícita do usuário: `git rm -r --cached .firebase/`. O arquivo continua no disco, com
      o conteúdo intacto (conferido por checksum antes e depois) — saiu só do índice. O
      `firebase.json` permanece versionado, como deve: é configuração do projeto (pasta
      pública, rewrite de SPA, cabeçalhos de segurança), não cache.
      **A remoção está preparada (staged), não commitada** — vale a partir do próximo commit.
      O arquivo segue existindo nos commits antigos do histórico; como o conteúdo é só uma
      lista de nomes e checksums dos arquivos publicados, sem nada sensível, não há motivo
      para reescrever histórico.
- [x] **Credencial padrão.** ✅ **2026-08-16.** Substituída pela credencial definitiva do
      usuário, guardada só como hash PBKDF2 com salt. A senha não está escrita em nenhum
      arquivo do repositório — verificado por varredura. O aviso de "credenciais de fábrica" na
      interface saiu junto, porque deixou de fazer sentido.
- [x] **`CURRENT_MONTH_IDX` passou a ler o relógio.** ✅ **2026-08-16**, confirmado pelo
      usuário. Era fixo em `6` (Julho), herdado do mês em que a planilha legada foi migrada, e
      fazia o app abrir sempre em Julho independentemente da data. **Testado em 16/08**:
      Dashboard e Lançamentos abrem em Agosto.
- [x] **`REFERENCE_YEAR_DEFAULT` passou a ler o relógio.** ✅ **2026-08-16**, decidido pelo
      usuário: mesma regra do mês. Era fixo em `2026`.
      **Testado**: sessão nova sem nada salvo começa no ano do relógio; com `2027` salvo, o app
      opera em 2027 mesmo com o relógio em 2026; com `2025` salvo, opera em 2025 — ou seja, o
      ano salvo (no navegador ou na aba `Config`) continua mandando sobre o relógio, que é o
      risco que havia sido levantado ao adiar essa mudança.
- [x] **`.firebaserc` no `.gitignore`.** ✅ **2026-08-16**, a pedido do usuário. Acrescentado
      junto o diretório de cache `.firebase/`. Ver a pendência abaixo: o `.gitignore` não
      desrastreia o que já entrou no repositório.
