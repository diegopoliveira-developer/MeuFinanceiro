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
| — | **T7** — edição inline do valor | ⏳ pendente. Mesma mecânica da T6, agora que ela existe. |
| 7º | **T5** — conciliação na importação de extrato | ⏳ pendente. Agora pode se apoiar na T10. |
| 8º | **T4** — dashboard de cartões | ⏳ pendente. Maior de todos, tela nova inteira. |
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
- [ ] **T4 · Dashboard de cartões (tela nova).** Uma tela por cartão, com recorte mensal:
      total de compras do mês, lista das compras, gráficos e comparativo entre meses. Usar o
      ciclo real de fatura (`invoicePeriodFor`), não o mês bruto do lançamento — senão a tela
      nova vai discordar do painel de faturas que já existe no Dashboard.
- [ ] **T5 · Conciliação do extrato com lançamentos existentes.** Na importação, tentar casar
      cada linha do extrato com um lançamento já cadastrado **do mesmo mês** pelo valor, e
      apresentar isso numa etapa intermediária onde o usuário confirma ou rejeita cada
      vínculo. Confirmado o vínculo, o lançamento é marcado como pago em vez de nascer um
      lançamento novo duplicado. Casar por valor é ambíguo por natureza (dois lançamentos de
      R$ 150 no mesmo mês) — a confirmação do usuário é obrigatória, nunca automática.
- [x] **T6 · Editar o dia de vencimento direto na lista.** ✅ **2026-08-15.** O vencimento
      virou botão com sublinhado tracejado; clicar abre um campo ali mesmo, já focado. Enter ou
      sair do campo salva, Escape descarta. Desabilitado em ano arquivado, como o resto.
      **Testado**: dia 14 → 27 salvou e o status recalculou sozinho de "Vencido" para
      "Pendente"; Escape depois de digitar outro valor manteve o 27.
- [ ] **T7 · Editar o valor direto na lista.** Clicar no valor habilita a edição inline.
      Manter a validação de valor `> 0` (ver `Contextos/Conhecimento.md`).
- [x] **T8 · Corrigir o cálculo de "vencido".** ✅ **2026-08-15.** Hora zerada dos dois lados
      (só é vencido a partir do dia seguinte) e vencimento de fim de semana empurrado para a
      segunda (`nextBusinessDay`). O vencimento deslocado ganha um `*` na lista e um tooltip
      dizendo em que dia passa a ser cobrável.
      **Testado em 15/08/2026, um sábado**: vencimento dia 15 (hoje) → "Vence em breve", não
      "Vencido" — era exatamente o caso errado; dia 14 (sexta, ontem) → "Vencido"; dia 22
      (sábado) → "Pendente", com o tooltip apontando segunda, dia 24.
- [ ] **T8b · Feriados não são considerados no vencimento.** Só fim de semana. Não existe
      calendário de feriados no sistema, e os municipais dependem da cidade. **Decisão
      pendente**: manter só fim de semana, ou acrescentar uma lista de feriados editável pelo
      usuário. Ver `Contextos/Decisoes.md` para as alternativas já descartadas.
- [x] **T9 · Senha sincronizada pela planilha, com hash reforçado.** ✅ **2026-08-15**, na
      opção C (recomendada), escolhida pelo usuário.
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
- [ ] **T9b · Navegador novo ainda entra com a credencial de fábrica.** Limite conhecido do
      desenho: sem conexão configurada, o app não tem como consultar a planilha antes do login,
      então cai no `AUTH_CONFIG` do código. Só se resolve de verdade com proteção na
      hospedagem (opção D: Vercel Password Protection, plano pago + migrar do Firebase) ou com
      backend. **Decisão pendente do usuário.**
- [ ] **T9c · Token secreto do Apps Script deixou de ser opcional na prática.** Agora que o
      hash da senha fica na planilha, quem tiver só a URL consegue lê-lo. Confirmar que o token
      está configurado nos dois lados (app e script).

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

- [ ] **Arquivo de versão não existe.** `Basic AI Project Rules.md` exige um `version.js` na
      raiz, no formato `X.Y.Z` e com histórico (data · versão · descrição). Hoje a versão
      (`1.0.0`) só existe no campo `version` do `package.json`. **Decisão pendente do
      usuário**: criar o `version.js` com histórico e manter os dois em sincronia, ou registrar
      em `Decisoes.md` que o `package.json` cumpre esse papel neste projeto.
- [ ] **Cabeçalho obrigatório ausente em todo arquivo de código.** `src/App.jsx`,
      `src/main.jsx`, `src/index.css` e os `*.config.js` não têm o bloco exigido por
      `Contextos/Convencoes.md`, seção 4. Aplicar quando cada arquivo for tocado por outro
      motivo; arquivo novo já nasce com ele.
- [ ] **`.firebase/hosting.ZGlzdA.cache` está versionado.** É arquivo de cache, proibido pelo
      `Basic AI Project Rules.md`. Remover do controle de versão (`git rm --cached`) e
      acrescentar `.firebase/` ao `.gitignore` — **exige autorização**, é operação de Git.
- [ ] **`.gitignore` não cobre `.firebaserc`**, que contém o id do projeto Firebase do usuário.
      O arquivo ainda não existe localmente; acrescentar a regra antes que ele apareça.
- [ ] **Credencial padrão (`familia` / `meufinanceiro`) está no código-fonte.** É padrão de
      fábrica, com aviso na interface enquanto não for trocada. Confirmar com o usuário que já
      foi alterada no navegador em uso.
- [ ] **`CURRENT_MONTH_IDX` fixo em Julho** — o mês inicialmente selecionado não acompanha o
      relógio. Confirmar com o usuário se é intencional; corrigir muda comportamento visível.
