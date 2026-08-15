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
| 1º | **T8** — status "vencido" | Correção de bug real, já visível hoje. Pequeno. |
| 2º | **T1** — modal não fechar ao clicar fora | Perda de dados digitados. Trivial. ✅ feito e testado |
| 3º | **T3** — tooltip com a descrição | Trivial. |
| 4º | **T6 + T7** — edição inline de vencimento e valor | Mesma natureza, fazer juntas. |
| 5º | **T10** — marcar lançamento como "não será pago" | Muda o cálculo de pendências/KPIs — melhor antes das telas novas. |
| 6º | **T2** — vincular parcelas em aberto do veículo | ✅ feito e testado (antecipado a pedido do usuário). |
| 7º | **T5** — conciliação na importação de extrato | Depende de T10 e do vínculo de parcelas para não brigar com eles. |
| 8º | **T4** — dashboard de cartões | Maior de todos, e o único que é tela nova inteira. |
| 9º | **T9** — onde a senha fica salva | ⚠️ decisão de segurança pendente (abaixo). |

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
      **Limitação conhecida** (não é regressão, é consequência do modelo): o card da série em
      Parcelas & Recorrências calcula o total por `parcelas × valor`, então mostra
      "0 de 48 pagas · restam R$ 40.800" mesmo quando as 45 primeiras foram pagas antes de o
      sistema existir e nunca viraram lançamento. Ver item abaixo.
- [ ] **Agregado da série de financiamento conta parcelas que nunca existiram como lançamento**
      (surgiu com a T2). Decidir como tratar: usar `paidInstallments` do veículo como piso na
      contagem do card, ou exibir o agregado só sobre as parcelas realmente lançadas.
- [ ] **T3 · Tooltip da descrição do lançamento.** Passar o mouse sobre o nome na lista deve
      mostrar a descrição. Hoje o `title` da linha mostra as **observações** (`notes`), não a
      descrição — confirmar se o pedido é trocar ou somar as duas informações.
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
- [ ] **T6 · Editar o dia de vencimento direto na lista.** Clicar no vencimento abre a edição
      ali mesmo, sem abrir o modal.
- [ ] **T7 · Editar o valor direto na lista.** Clicar no valor habilita a edição inline.
      Manter a validação de valor `> 0` (ver `Contextos/Conhecimento.md`).
- [ ] **T8 · Corrigir o cálculo de "vencido".**
      - **Bug confirmado no código**: `paymentStatus()` compara `dueDate` (meia-noite) com
        `TODAY` (que carrega a hora atual), então **no próprio dia do vencimento** a diferença
        já é negativa e o lançamento aparece como *vencido*. Corrigir zerando a hora dos dois
        lados: vencido só quando hoje for **depois** do vencimento.
      - **Dia útil**: vencimento que cai em sábado ou domingo passa a valer na segunda-feira
        seguinte, e o status deve respeitar isso.
      - ❓ **Feriado não está resolvido**: não existe calendário de feriados no sistema e não
        há como saber os municipais. Decidir com o usuário: considerar só fim de semana, ou
        acrescentar uma lista de feriados nacionais fixa/editável.
- [ ] **T9 · Onde a senha de acesso fica salva — e se vai para a planilha.**
      **Resposta ao que foi perguntado**: hoje a senha **é salva**, mas nunca em texto puro e
      nunca na planilha. Ao trocar usuário/senha, o app guarda o **hash SHA-256** de
      `usuario:senha` em `localStorage`, na chave `meufinanceiro_auth_v1`, só no navegador em
      uso. Enquanto o usuário não troca, vale o hash padrão que está no código (`AUTH_CONFIG`).
      Consequência real: **a troca de senha não acompanha o usuário entre dispositivos**, e
      limpar os dados do navegador devolve a credencial ao padrão de fábrica.
      **⚠️ Levar a senha para a planilha tem custo de segurança** — analisado abaixo, em
      "Decisão pendente T9". Não implementar sem decisão explícita.

### Decisão pendente T9 — sincronizar a credencial pela planilha

O problema que o usuário quer resolver é real: a senha trocada não sobrevive à troca de
navegador nem à limpeza dos dados. As opções, com o custo de cada uma:

| Opção | O que resolve | O que custa |
| --- | --- | --- |
| **A. Não fazer nada** | — | O problema continua: senha volta ao padrão ao limpar o navegador. |
| **B. Gravar o hash numa aba `Auth` da planilha** | Credencial passa a valer em qualquer dispositivo que sincronize. | O hash fica exposto a **quem tiver a URL do Apps Script**, e quem tem a URL já tem acesso a tudo — a proteção vira circular. Hash de senha curta cai em ataque de dicionário offline em segundos. |
| **C. Gravar na planilha + endurecer o hash** (salt aleatório + muitas iterações, via PBKDF2 da Web Crypto) | Mesma sincronização, com o hash bem mais caro de atacar offline. | Mais código, e **não elimina** o problema de origem: continua sendo trava client-side (`Contextos/Decisoes.md`). |
| **D. Proteção real na hospedagem** (ex.: Vercel Password Protection) | Barreira de verdade, antes do app carregar. | Plano pago e migração do deploy do Firebase para a Vercel. |

Recomendação: **C** se a sincronização for mesmo necessária — nunca **B** puro. E, em
qualquer caso, manter na tela o aviso de que isso não é autenticação de servidor.

- [ ] **T10 · Marcar lançamento como "não será pago" / ignorado.** Um estado além de
      pago/pendente, para o lançamento parar de contar como pendência sem precisar excluí-lo.
      Ao implementar, revisar em conjunto: badge de pendências na barra lateral, banner de
      alerta do mês, KPIs, orçamentos, relatório anual e a coluna correspondente na planilha
      (coluna nova, nunca renomear as existentes).

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
