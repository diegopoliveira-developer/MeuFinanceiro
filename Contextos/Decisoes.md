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

**Consequência**: vincular **não** altera a categoria nem o valor do lançamento — mexer neles
seria alterar dado que o usuário preencheu, sem ele ter pedido.

---

## 2026-08-15 · Parcelas pagas de um financiamento são derivadas dos lançamentos

**Decisão**: o contador exibido ("45/48 parcelas") é **calculado** por
`vehiclePaidInstallments()` = o valor informado no cadastro do veículo (parcelas quitadas antes
de existirem como lançamento) **mais** as parcelas de número maior que esse já marcadas como
pagas na lista de lançamentos. O campo `paidInstallments` do veículo deixa de ser o número
exibido e passa a ser apenas o **ponto de partida**; não é reescrito ao marcar/desmarcar.

**Substitui**: a decisão registrada acima nesta mesma data, que dizia que vincular não mexia no
contador. O usuário marcou uma parcela como paga e o card continuou em 45/48 — o contador
precisa refletir o pagamento, e o comportamento anterior estava errado do ponto de vista de
quem usa.

**Motivo**: o lançamento é a fonte da verdade do que foi pago. Derivar mantém as duas coisas
coerentes por construção — ao desmarcar, o número volta sozinho — e elimina a classe inteira de
bug em que o contador armazenado se desalinha dos lançamentos (F5, sincronização com a
planilha, exclusão de lançamento, importação de extrato).

**Alternativas rejeitadas**: incrementar/decrementar o campo armazenado a cada
marcação (só a exclusão de um lançamento pago já bastaria para desalinhar, e a planilha
guardaria um número que discorda dos próprios lançamentos que ela também guarda); usar a maior
parcela paga em vez da contagem (diria "48 de 48 pagas" com a 47 em aberto, se a 48 fosse paga
antes).

**Consequência**: a coluna `ParcelasPagas` da planilha continua guardando o ponto de partida,
não o total pago — quem ler a planilha direto precisa saber disso. O campo "Parcelas já pagas"
do cadastro ganhou uma explicação na própria tela para não induzir o usuário a corrigi-lo todo
mês.

---

## 2026-08-15 · "Vencido" respeita o dia do vencimento e o dia útil — mas não feriados

**Decisão**: `paymentStatus()` compara as duas datas com a hora zerada e só considera vencido
a partir do dia **seguinte** ao vencimento; vencimento em sábado ou domingo é empurrado para a
segunda-feira (`nextBusinessDay`). **Feriados não são considerados**, e isso está escrito no
comentário da função.

**Motivo**: havia um bug real — a data de vencimento nasce à meia-noite e era comparada com um
`TODAY` que carrega a hora do dia, então todo lançamento aparecia como vencido no próprio dia
em que vencia. E boleto que cai em fim de semana só é cobrável no dia útil seguinte, então
marcar como atrasado antes disso é falso.

**Alternativas rejeitadas**: consultar uma API de feriados (dependência externa nova, contra o
princípio de não adicionar peso para problema pequeno).

**Consequência**: resolvida no mesmo dia pela decisão abaixo, que acrescentou os feriados.

---

## 2026-08-15 · Feriados: nacionais calculados, municipais cadastrados pelo usuário

**Decisão**: `nextBusinessDay()` passou a pular feriado além de fim de semana, em laço (cobre
emenda). Os **feriados nacionais são calculados**, incluindo os móveis — Carnaval, Sexta-feira
Santa e Corpus Christi saem da Páscoa, obtida pelo algoritmo de Butcher. Os **estaduais e
municipais são cadastrados pelo usuário**, em um card na aba Categorias & Módulos, e vão para
a aba `Config` da planilha (uma linha por feriado, valor `AAAA-MM-DD|Nome`).

**Motivo**: as duas metades do problema têm naturezas diferentes. Feriado nacional é regra
pública e estável: pedir que o usuário digite treze datas por ano seria trabalho manual para
algo que o código sabe calcular. Feriado municipal é impossível de saber daqui — depende da
cidade —, então só o usuário pode informar. Fazer só uma das metades deixaria o cálculo errado
de qualquer forma.

**Alternativas rejeitadas**: só a lista editável (obrigaria o usuário a cadastrar todo ano os
nacionais, inclusive os móveis, que mudam de data); só os nacionais (deixaria o feriado da
cidade — o caso mais comum de erro no dia a dia — sem solução); aba nova `Feriados` na planilha
(exigiria o usuário criar a aba e republicar o Apps Script; a `Config` já existe e já é lida
e gravada, mesmo motivo da decisão sobre a credencial).

**Consequência**: Carnaval e Corpus Christi entram como feriado embora sejam ponto facultativo
federal — banco não abre, e é a cobrança do boleto que importa aqui. A lista de feriados
personalizados vive num registro no escopo do módulo (`CUSTOM_HOLIDAYS`), mantido pelo
`Dashboard`, porque `paymentStatus()` é função pura chamada de muitos pontos; ver
`Conhecimento.md`.

---

## 2026-08-15 · "Não será pago" é um estado, e sai de todas as somas

**Decisão**: lançamento pode ser marcado como ignorado (`ignored`), o que o mantém visível na
lista — riscado e esmaecido — e o remove de **todo** cálculo financeiro: KPIs, gráficos,
subtotais do mês, orçamentos, faturas de cartão, relatório anual e contagem de pendências. Um
único ponto de filtro, `activeTransactions`, alimenta todas as somas. Persistido na planilha
em uma coluna nova, `Ignorado`.

**Motivo**: o usuário precisava cancelar uma conta sem perder o registro dela. Excluir apaga o
histórico; deixar como pendente para sempre polui alerta, orçamento e saldo. Se o lançamento
não vai ser pago, mantê-lo em qualquer soma torna o saldo do mês errado — meia solução seria
pior que nenhuma.

**Alternativas rejeitadas**: reaproveitar `paid` com uma observação (mentiria dizendo que foi
pago, e entraria nas despesas do mês); esconder o lançamento da lista (viraria uma exclusão
disfarçada, sem o histórico que era o ponto do pedido).

**Consequência**: marcar como pago limpa o `ignored` e vice-versa — são estados mutuamente
exclusivos. Qualquer cálculo novo precisa partir de `activeTransactions`; a regra está em
`Convencoes.md`, seção 2. A coluna `Ignorado` é aditiva: planilha antiga sem ela continua
funcionando, e o valor ausente é lido como "não ignorado".

---

## 2026-08-15 · Credencial vai para a planilha, com hash PBKDF2 e salt

**Decisão**: a senha passa a ser guardada como **PBKDF2-HMAC-SHA256, salt aleatório de 16
bytes, 210.000 iterações** (recomendação OWASP), e o registro — usuário, algoritmo, salt,
iterações, hash e data de atualização — é gravado na aba `Config` da planilha, além do
`localStorage`. A tela de login busca esse registro na planilha **antes** de autenticar,
quando já existe conexão configurada neste navegador. O formato antigo (SHA-256 de
`usuario:senha`, sem salt) continua sendo aceito na verificação, e é substituído na primeira
troca de senha.

**Motivo**: o problema relatado pelo usuário era real — a troca de senha vivia só no
navegador, então mudar de dispositivo ou limpar os dados devolvia a credencial ao padrão de
fábrica. Levar o hash para a planilha resolve isso, **mas expõe o hash a quem obtiver a URL do
Apps Script** — por isso ele precisou ficar caro de atacar offline antes de sair daqui.
SHA-256 sem salt cai em ataque de dicionário em segundos; PBKDF2 com 210k iterações, não.
Usar a aba `Config`, que já existe e que o Apps Script já lê e grava, evitou obrigar o usuário
a criar aba nova e republicar o script.

**Alternativas rejeitadas**: gravar o SHA-256 atual na planilha (sincronizava, mas entregava um
hash barato de quebrar); manter tudo só no navegador (não resolvia o problema relatado);
proteção por senha na hospedagem, ex.: Vercel Password Protection (é a única barreira de
verdade, mas exige plano pago e migrar o deploy do Firebase — segue disponível se o usuário
quiser); PBKDF2 em JS puro para o caso de a Web Crypto faltar (lento demais; onde ela não
existe, cai para o formato antigo e a tela de Diagnóstico avisa).

**Consequência**: **isto continua não sendo autenticação de verdade** — segue valendo a decisão
de que o login é trava client-side. E há um limite que o usuário precisa conhecer: um navegador
**novo, sem conexão configurada**, ainda entra com a credencial padrão de fábrica, porque não
tem como consultar a planilha antes de o usuário configurá-la. O token secreto do Apps Script
deixou de ser opcional na prática — sem ele, a URL sozinha dá acesso ao hash —, e a tela de
Diagnóstico passa a alertar quando a sincronização está ativa sem token.

---

## 2026-08-16 · Extrato: conciliar com o que já existe, sempre com confirmação

**Decisão**: na prévia da importação de extrato, cada linha que bate em **mês, tipo e valor**
com um lançamento pendente já cadastrado passa a sugerir "marcar como pago" em vez de criar um
lançamento novo. A sugestão é só sugestão: uma coluna "O que fazer" mostra a escolha e o
usuário confirma linha a linha. Confirmar o vínculo marca o lançamento existente como pago e
grava nele o `bankId` do extrato.

**Motivo**: a conta já estava prevista no sistema; o extrato só confirma que ela foi paga.
Criar um segundo lançamento dobraria a despesa no mês — o oposto do que o usuário quer ao
importar. Gravar o `bankId` no lançamento conciliado é o que faz a reimportação do mesmo
extrato reconhecê-lo como duplicata.

**Alternativas rejeitadas**: aplicar o vínculo automaticamente, sem confirmação (casar por
valor é ambíguo por construção — duas contas de R$ 200 no mesmo mês são indistinguíveis daqui,
e o teste real mostrou a sugestão trocando as duas); casar também por descrição (o texto do
extrato quase nunca parece com o do usuário: "Debito automatico VIVO FIBRA" contra "Internet");
casar por data exata (o pagamento raramente cai no dia do vencimento cadastrado).

**Consequência**: a sugestão erra em caso de empate de valor, e isso é esperado — por isso a
tela permite corrigir. Escolher um lançamento já reservado por outra linha **libera a outra
linha** automaticamente (ela volta a "criar novo"); sem isso, desfazer uma sugestão trocada
exigiria dois passos. Só lançamentos **pendentes e não ignorados** são candidatos: o que já
está pago não precisa de conciliação.

---

## 2026-08-16 · Logotipo em imagem substitui a marca desenhada em SVG

**Decisão**: o logotipo passou a ser a imagem oficial do usuário (marca + palavra
"MeuFinanceiro"), no lugar do SVG anterior (moeda dourada com um "M"). Onde a imagem entra, o
texto "MeuFinanceiro" que ficava ao lado **sai** — a imagem já traz o nome. Sobre fundo
escuro ela é apoiada numa placa clara. O favicon é a **marca recortada** do logotipo, não o
logotipo inteiro.

**Motivo**: identidade visual definida pelo usuário. O recorte para o favicon é necessário
porque o logotipo é 5,4:1 de proporção — espremido num quadrado de 64px, viraria um borrão.
A placa clara resolve um problema medido: sobre o `INK`, partes do logotipo ficam em ~1,2:1 de
contraste (ver `Conhecimento.md`).

**Alternativas rejeitadas**: usar o PNG de 2172×724 e 724 KB como está (é ~14× maior que a
maior exibição na tela, e serviria 724 KB a cada visita); aplicar filtro CSS para clarear o
logotipo no fundo escuro (distorce as cores da marca); usar o logotipo inteiro como favicon
(ilegível em 64px).

**Consequência**: os arquivos derivados vivem em `public/` — `favicon.png` (64×64),
`apple-touch-icon.png` (180×180) e `images/logo-meufinanceiro*.png` (640 px de largura, com a
margem transparente aparada). Os **originais em alta resolução foram preservados** em
`src/assets/`, que não vai para o site; é deles que qualquer tamanho novo deve ser regerado,
nunca dos derivados. Os arquivos entregues em `dist/` não podiam ficar lá: a build esvazia
essa pasta.

---

## 2026-08-16 · Duas versões do logotipo, escolhidas pelo fundo

**Decisão**: o projeto passou a ter duas versões do logotipo — a colorida para fundo claro e
`logo-meufinanceiro-white.png` para fundo escuro. O componente `Logo` recebe `onDark` e escolhe
o arquivo; quem usa declara o **fundo**, não a cor. A placa clara atrás do logotipo, criada
enquanto só existia a versão colorida, foi **removida**.

**Motivo**: o usuário forneceu a arte para fundo escuro, que é a solução correta para o
problema — a placa era um contorno. Medido: a versão clara dá 9,9:1 de mediana sobre o `INK`
(3,07:1 no pior 10%, acima do mínimo de 3:1), contra 1,2:1 da colorida no mesmo fundo.

**Consequência**: hoje **todos** os três lugares onde o logotipo aparece têm fundo escuro, então
a versão colorida não está visível em lugar nenhum — ela fica pronta para superfícies claras e
para a inversão que o modo noturno vai exigir. O favicon continua sendo a marca colorida.
Regerar qualquer tamanho a partir dos originais em `src/assets/`.

---

## 2026-08-16 · Tema escuro por indireção em variáveis CSS

**Decisão**: as constantes de cor do `App.jsx` deixaram de conter hexadecimais e passaram a
apontar para variáveis CSS (`const INK = "var(--ink)"`). As duas paletas vivem em
`index.css`, selecionadas pelo atributo `data-theme` no `<html>`. O seletor tem três opções —
Claro, Escuro e Sistema — e a preferência é gravada no `localStorage` **e** na aba `Config` da
planilha.

**Motivo**: as cores estavam aplicadas por estilo inline em ~530 pontos. Trocar cada um por um
contexto de tema seria uma refatoração enorme e arriscada, num arquivo sem testes automatizados.
A indireção por variável CSS muda **12 linhas** e o navegador resolve o resto — inclusive
dentro de atributos de apresentação do SVG, o que foi verificado antes de adotar a abordagem,
porque é assim que o Recharts recebe cor.

**Alternativas rejeitadas**: Context API de tema com objeto de cores (tocaria os ~530 pontos);
`filter: invert()` na página (destrói as cores da marca e das categorias); duplicar a paleta
num `@media (prefers-color-scheme)` puro (não permitiria a escolha explícita do usuário).

**Consequência**: quem escrever cor nova precisa usar os tokens — **hexadecimal fixo no meio do
JSX não acompanha o tema**, e é assim que o tema escuro quebra aos poucos. Três exceções
deliberadas mantêm hexadecimal: o "chrome escuro" (barra lateral, login), que é escuro nos dois
temas e por isso ganhou os tokens `SHELL*`; as `CAT_COLORS`, que são dado do usuário e não
tema; e a cor dos cartões, idem. A preferência guarda a **escolha** ("system" inclusive), não o
resultado — senão "seguir o sistema" congelaria no valor do dia em que foi escolhido.

---

## 2026-08-16 · Credencial só no código-fonte, como hash; sincronização pela planilha removida

**Decisão**: a credencial padrão passou a ser um usuário próprio com uma **senha longa e
aleatória (26 caracteres)**, guardada em `AUTH_CONFIG` apenas como **hash PBKDF2 com salt** —
a senha em si não existe em nenhum arquivo do repositório. Em consequência, o mecanismo que
gravava e lia a credencial na aba `Config` da planilha foi **removido**.

**Substitui**: a decisão de 2026-08-15 que levava o hash da senha para a planilha (opção C
daquele momento). O que mudou entre as duas: lá a senha era escolhida pelo usuário e podia ser
fraca, o que exigia encarecer o ataque offline e justificava sincronizar para não voltar ao
padrão de fábrica ao limpar o navegador. Aqui o padrão de fábrica **já é** a senha forte
definitiva, então não há mais nada que precise viajar.

**Motivo**: com uma senha aleatória de 26 caracteres, reverter o hash é inviável na prática —
quem ler o código-fonte não descobre a senha. E não enviar o hash para a planilha elimina o
ponto em que a URL do Apps Script dava acesso a ele. Menos peça, menos superfície.

**Alternativas rejeitadas**: manter a sincronização em paralelo (o hash voltaria a trafegar
sem necessidade, já que a fonte da verdade passou a ser o código); usar SHA-256 simples, sem
salt (bastaria para esta senha, mas o caminho PBKDF2 já existia e não custa nada).

**Consequência**: (a) **uma troca de senha feita pela interface volta a valer só no navegador
onde foi feita** — para mudar em todos os dispositivos, altera-se o código e publica-se;
(b) a planilha **não consegue mais impor uma credencial**, vetor que existia enquanto a
sincronização lia a aba `Config`; (c) trocar a senha exige acesso ao código e um deploy, o que
é aceitável para um app de uso familiar mantido pelo próprio dono.

**O que continua valendo**: isto protege a SENHA, não a trava. O login segue sendo verificado
no navegador, então quem tem o código pode pular a verificação pelo DevTools sem nunca
descobrir a senha — a decisão de 2026-08-15 sobre o login ser trava client-side não mudou.

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
