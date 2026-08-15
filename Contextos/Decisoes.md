# Decisões Arquiteturais

Formato exigido por `Basic AI Project Rules.md`: **Data · Decisão · Motivo · Alternativas
consideradas** (quando aplicável).

Ordem cronológica. Decisões mais recentes ao final.

Registre aqui toda decisão que alguém no futuro poderia querer reverter sem entender o
porquê. Não registre detalhe trivial ou temporário.

> **Nota sobre as datas.** As decisões de 1 a 12 foram tomadas antes deste arquivo existir,
> durante o desenvolvimento do sistema entre **2026-07-24 e 2026-08-08** (intervalo confirmado
> pelo histórico do Git). Foram reconstruídas e registradas em **2026-08-15**, a partir do
> `CONTEXT.md` que documentava o projeto até então. A data exata de cada uma não é
> recuperável — a data indicada é a do **registro**, e a origem está marcada em cada bloco.
> Decisões novas devem trazer a data real.

---

## 2026-08-15 (registro · origem v1) · SPA React 100% client-side, sem backend

**Decisão**: o sistema é uma aplicação de página única em React que roda inteira no navegador.
Não existe servidor deste projeto, nem banco de dados, nem API própria.

**Motivo**: o objetivo era substituir uma planilha de uso familiar. Um backend traria
hospedagem paga, autenticação de verdade, migrações e manutenção contínua — custo despro-
porcional para um único domicílio. Sem backend, o deploy é um upload de arquivos estáticos.

**Alternativas rejeitadas**: app full-stack com banco (custo e manutenção incompatíveis com o
uso); continuar só na planilha (é justamente o problema que se queria resolver).

**Consequência**: toda categoria de problema que pressupõe servidor — injeção SQL, sessão,
cookie, JWT, CSRF, rate limiting real, notificação agendada por e-mail/push — **não tem
superfície neste sistema**. Pedido que dependa disso exige mudança arquitetural e aviso ao
usuário antes de qualquer código.

---

## 2026-08-15 (registro · origem v1) · Todo o app em um único arquivo `App.jsx`

**Decisão**: manter o sistema inteiro em `src/App.jsx` (~3.370 linhas), em vez de dividir em
módulos por componente.

**Motivo**: o projeto nasceu como artifact único e cresceu assim; a divisão nunca bloqueou
nenhuma tarefa, e dividir depois de pronto é refatoração ampla — exatamente o que
`Basic AI Project Rules.md` manda evitar sem necessidade comprovada.

**Alternativas rejeitadas**: uma pasta `components/` com um arquivo por componente — melhor
para navegação, mas seria mexer em tudo de uma vez, sem suíte de testes para proteger.

**Consequência**: qualquer alteração toca o arquivo do sistema inteiro. A divisão continua em
aberto no backlog; se for feita, precisa ser um trabalho isolado, não um efeito colateral de
outra tarefa.

---

## 2026-08-15 (registro · origem v10) · Login é trava client-side, e isso é declarado

**Decisão**: existe uma tela de login com usuário e senha comparados por hash SHA-256, com
bloqueio temporário após 5 tentativas — e o sistema **declara explicitamente**, no código, na
interface e no `README.md`, que isso não é segurança real.

**Motivo**: o usuário queria evitar que alguém abrisse o painel por acaso. Sem backend, o hash
e o estado "autenticado" vivem no navegador e podem ser lidos ou forçados por quem tenha
acesso ao dispositivo — omitir isso seria vender uma proteção que não existe.

**Alternativas rejeitadas**: Vercel Password Protection (proteção real na borda, mas exige
plano pago e prende o deploy à Vercel); autenticação em backend próprio (contraria a decisão
1); nenhum login (o usuário queria a barreira, mesmo simples).

**Consequência**: proibido descrever o app como "seguro" ou "com autenticação" sem a ressalva.
A aba Diagnóstico de Segurança existe para manter essa honestidade visível ao usuário.

---

## 2026-08-15 (registro · origem v10) · Google Sheets é a persistência, não `localStorage`

**Decisão**: dado financeiro nunca é gravado em `localStorage`/`sessionStorage`. A persistência
é a planilha do Google do próprio usuário, via um Apps Script Web App que ele publica. Sem
planilha configurada, os dados vivem só na memória do React e se perdem no F5.

**Motivo**: a origem foi uma restrição do ambiente de artifacts do Claude, que bloqueia esse
armazenamento; mas a decisão se sustenta sozinha — a planilha dá backup, acesso de qualquer
dispositivo e edição manual, os três sem custo e sem servidor. O dado fica com o usuário,
numa conta dele.

**Alternativas rejeitadas**: `localStorage` como fonte de verdade (some ao limpar o navegador,
não sincroniza entre dispositivos); IndexedDB (mesmo problema, mais complexidade); banco
remoto (contraria a decisão 1).

**Consequência**: só quatro chaves locais são permitidas, e nenhuma é dado financeiro —
credenciais, bloqueio de login, configuração da planilha e ano corrente. Toda operação de
CRUD precisa empurrar a mudança para a planilha no mesmo ponto em que altera o estado.

---

## 2026-08-15 (registro · origem v10/v18) · Modelo de "ano corrente único operável"

**Decisão**: apenas um ano é editável (`currentYear`). "Arquivar ano" move os lançamentos para
`archivedYears`, zera os 12 meses e avança o ano em +1. Ano arquivado é somente leitura.

**Motivo**: o modelo espelha o uso real — planilha de contas se fecha no fim do ano e começa
uma nova. Manter todos os anos editáveis ao mesmo tempo exigiria seletor de ano em toda tela e
abriria espaço para lançar em ano errado sem perceber.

**Alternativas rejeitadas**: multi-ano totalmente editável (complexidade e risco de erro);
apagar o ano anterior ao virar (perderia o histórico).

**Consequência**: qualquer funcionalidade nova precisa responder "isso vale para ano
arquivado?" — hoje só Lançamentos e Relatório Anual navegam pelo histórico; Dashboard e
Parcelas & Recorrências permanecem restritos ao ano corrente, por serem telas de gestão ativa.

---

## 2026-08-15 (registro · origem v15) · Ids internos vão para a planilha, não só os nomes

**Decisão**: a planilha guarda `CategoriaId` e `SubcategoriaId` além dos nomes de exibição.

**Motivo**: a reimportação tentava inferir o id a partir do nome exibido em minúsculas, o que
falhava em silêncio para todo nome com acento ou composto ("Cartões de Crédito" nunca batia
com o id `cartoes`). Gravar o id elimina a inferência.

**Alternativas rejeitadas**: normalizar o nome na leitura (frágil — dois nomes podem normalizar
para o mesmo id, e renomear a categoria quebraria o vínculo).

**Consequência**: nome de exibição pode mudar livremente sem quebrar o vínculo; id, não. Id de
categoria é gerado por `slugify()` na criação e nunca recalculado depois.

---

## 2026-08-15 (registro · origem v15/v19) · Merge da sincronização é diferente por entidade

**Decisão**: lançamentos são mesclados **campo a campo** (o lado remoto só sobrescreve o local
quando realmente tem valor); categorias, cartões, veículos e orçamentos são mesclados por
**união simples por `ID`**, com o valor da planilha prevalecendo.

**Motivo**: lançamentos mudam o tempo todo e têm campos (notas, parcela, recorrência) que a
planilha de um usuário antigo pode ainda não ter como coluna — o merge cauteloso evita apagar
dado local por causa de uma coluna ausente. As demais entidades são configuração estável,
editada com pouca frequência: o risco de conflito é baixo e não justifica a complexidade.

**Alternativas rejeitadas**: merge campo a campo para tudo (complexidade sem ganho
proporcional); "último a escrever vence" para tudo (apagaria dado local em planilha antiga).

**Consequência**: ao acrescentar entidade sincronizável nova, decidir conscientemente em qual
dos dois modelos ela entra — e registrar aqui se for um terceiro.

---

## 2026-08-15 (registro · origem v16) · Escopo de segurança é ajustado à arquitetura real

**Decisão**: diante de um pedido de auditoria de segurança escrito para aplicação full-stack,
o escopo foi reescrito junto com o usuário antes de gerar código, e a tela de Diagnóstico de
Segurança lista cada item como `✅ Verificado`, `⚠️ Limitação conhecida` ou `➖ Não se aplica`,
com o motivo — sem placar de nota.

**Motivo**: declarar "protegido contra injeção SQL" num sistema sem banco é fabricar
resultado. O valor do diagnóstico está em ser conferível, não em parecer bom.

**Alternativas rejeitadas**: rodar o checklist genérico como veio (produziria "aprovado" em
categorias inexistentes); pontuação numérica (esconde a diferença entre "verificado" e "não se
aplica" numa média).

**Consequência**: nenhuma afirmação de segurança entra no projeto sem a limitação junto. É
também o precedente da regra de análise de escopo aplicada a qualquer pedido.

---

## 2026-08-15 (registro · origem v16) · Sem controle de acesso por papel

**Decisão**: a aba Diagnóstico de Segurança — como todo o resto — fica visível a quem estiver
logado. Não foi criado nenhum papel de "administrador".

**Motivo**: o sistema tem um único login compartilhado pela família. Inventar autorização por
papel só para uma tela seria simular um controle de acesso que não existe no resto do sistema.

**Alternativas rejeitadas**: esconder a tela atrás de uma segunda senha (teatro de segurança,
já que tudo roda no navegador).

---

## 2026-08-15 (registro · origem v16) · Sanitização anti-injeção de fórmula na escrita

**Decisão**: todo texto do usuário gravado na planilha passa por `sanitizeForSheet`, que
prefixa com apóstrofo o valor iniciado por `=`, `+`, `-`, `@` ou caractere de controle.

**Motivo**: a planilha é aberta no Google Sheets, que interpreta esses prefixos como fórmula.
Uma descrição de lançamento poderia virar fórmula executável no ambiente do usuário.

**Alternativas rejeitadas**: bloquear esses caracteres na entrada (impediria uma descrição
legítima como "-50% conta de luz"); sanitizar só na exibição (não protege a planilha).

**Consequência**: o valor exibido dentro do app permanece o original — a sanitização acontece
na fronteira de escrita, não no estado.

---

## 2026-08-15 (registro · origem v17) · Ciclo real de fatura reaproveita o campo `dueDay`

**Decisão**: a fatura do cartão é calculada por `invoicePeriodFor()`, comparando o dia da
compra com o `closingDay` do cartão; compra após o fechamento cai na fatura do mês seguinte.
O dia da compra reaproveita o campo `dueDay` do lançamento, que muda de rótulo na tela para
"Dia da compra" quando a categoria é Cartões e há cartão vinculado.

**Motivo**: é como a fatura funciona de verdade — agrupar pelo mês bruto do lançamento colocava
compras da mesma fatura em meses diferentes. Reaproveitar o campo evitou acrescentar mais uma
coluna à planilha e migrar os dados já existentes.

**Alternativas rejeitadas**: campo novo `purchaseDay` (mais claro, mas exigiria mudança de
esquema e migração da planilha do usuário para ganho pequeno).

**Consequência**: `dueDay` tem dois significados conforme o contexto — é a única sobrecarga
desse tipo no sistema, e precisa continuar documentada.

---

## 2026-08-15 (registro · origem v18) · Importação de extrato é sempre manual

**Decisão**: o extrato bancário entra por CSV exportado pelo usuário, com prévia editável e
detecção de duplicata pelo `Identificador` do banco (campo `bankId`). Sem Open Banking.

**Motivo**: conexão bancária automática exige credencial bancária, servidor e conformidade
regulatória — incompatível com um app sem backend (decisão 1) e com o risco que envolve.

**Alternativas rejeitadas**: integração via agregador financeiro (contraria a decisão 1, e
implicaria entregar credencial bancária a terceiro).

**Consequência**: a detecção de duplicata só olha o ano corrente, por simplicidade — reimportar
um extrato antigo depois de arquivar o ano pode duplicar lançamentos.

---

## 2026-08-15 · Parcelas de financiamento: gerar ou vincular, escolhido parcela a parcela

**Decisão**: as parcelas em aberto de um veículo são conciliadas em um passo próprio
(`VehicleInstallmentsModal`), onde cada parcela pode **gerar** um lançamento novo, ser
**vinculada** a um lançamento que já existe naquele mês, ou ser **ignorada**. O mês da próxima
parcela é informado pelo usuário, e a série usa um `recurringGroupId` determinístico
(`veh_<id do veículo>`), para que rodadas sucessivas caiam no mesmo agrupamento.

**Motivo**: os dois cenários existem de verdade. Quem cadastra o financiamento agora quer as
parcelas futuras no fluxo mensal (gerar); quem já lançava a parcela do carro à mão todo mês
quer amarrar o que existe em vez de duplicar (vincular). Escolher um só dos dois produziria
lançamento duplicado ou trabalho manual repetido.

**Alternativas rejeitadas**: gerar tudo automaticamente ao salvar o veículo, sem passo de
conciliação (duplicaria o que o usuário já lançava); derivar o mês da primeira parcela do
campo `startMonth` do veículo (é gravado fixo em `0` no cadastro — seria um palpite errado).

**Consequência**: vincular **não** altera categoria, valor nem o contador `paidInstallments`
do veículo — só amarra o lançamento à parcela. Mexer em qualquer um desses três seria alterar
dado que o usuário preencheu, sem ele ter pedido. Efeito colateral aceito: o card da série em
Parcelas & Recorrências agrega sobre o total de parcelas do financiamento, incluindo as que
foram pagas antes de o sistema existir e nunca viraram lançamento — registrado em
`Notas/TODO.md`.

---

## 2026-08-15 · Adoção do padrão de contexto do `Basic AI Project Rules.md`

**Decisão**: o antigo `Contextos/CONTEXT.md` — arquivo único que acumulava escopo, arquitetura,
histórico versão a versão e changelog — foi **substituído** pela estrutura de `Contextos/`
exigida pela norma (`Projeto.md`, `Convencoes.md`, `Ambientes.md`, `Decisoes.md`,
`Conhecimento.md`, `Chat.log`, `Notas/TODO.md`), e removido do repositório a pedido do usuário.

**Motivo**: um arquivo único de leitura obrigatória cresce sem limite e mistura o que é
normativo com o que é histórico — o custo de contexto passa a ser pago inteiro em toda sessão,
mesmo para uma tarefa pequena. A estrutura da norma separa o que se lê sempre do que se lê sob
demanda, e dá dono único a cada assunto.

**Alternativas rejeitadas**: manter os dois formatos em paralelo (duplicação garantida, e a
pergunta "qual dos dois vale?" a cada divergência).

**Consequência**: o histórico versão a versão (v1–v20) do `CONTEXT.md` **não foi copiado
integralmente** — o que era normativo virou `Projeto.md`/`Convencoes.md`/`Ambientes.md`, o
porquê virou este arquivo, as armadilhas viraram `Conhecimento.md` e o que faltava virou
`Notas/TODO.md`. O `CONTEXT.md` **nunca chegou a ser versionado** (era arquivo não rastreado
pelo Git), então sua remoção é definitiva e o texto original não é recuperável pelo
repositório — o que sobreviveu dele é o que está nos arquivos de `Contextos/`. De agora em
diante, o registro cronológico é o `Chat.log`.
