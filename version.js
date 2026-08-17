/**
 * Versionamento interno do projeto, conforme "Basic AI Project Rules.md".
 *
 * Formato: X.Y.Z
 *   - Correção ou ajuste ......... incrementar Z
 *   - Nova funcionalidade ........ incrementar Y, zerar Z
 *   - Alteração estrutural ....... incrementar X, zerar Y e Z
 *
 * Este arquivo NÃO faz parte de nenhum bundle — fica na raiz, fora de `src/`,
 * e não é lido pelo sistema de build. É metadado de projeto.
 *
 * O histórico abaixo pode ser usado para gerar mensagens de commit.
 *
 * Ordem: cronológica, mais recentes ao FINAL — a mesma convenção de
 * `Contextos/Decisoes.md` e `Contextos/Chat.log`.
 */
const VERSION = '1.9.3';

const VERSION_HISTORY = [
    {
        date: '2026-08-15',
        version: '1.0.0',
        description:
            'Estado já publicado antes deste ciclo, conforme o package.json. Sistema em uso ' +
            'familiar: lançamentos mês a mês, parcelas e recorrências, cartões com ciclo real ' +
            'de fatura, veículos, metas e orçamentos, importação de extrato, arquivamento de ' +
            'ano, sincronização com o Google Sheets e login client-side.'
    },
    {
        date: '2026-08-15',
        version: '1.1.0',
        description:
            'Modal de lançamento deixa de fechar ao clicar fora, para não descartar um ' +
            'formulário longo por engano (T1). Parcelas em aberto de um financiamento passam ' +
            'a poder virar lançamento novo ou ser vinculadas a um lançamento já existente, ' +
            'com confirmação parcela a parcela (T2).'
    },
    {
        date: '2026-08-15',
        version: '1.1.1',
        description:
            'Correção relatada pelo usuário: marcar a parcela como paga não atualizava o ' +
            'contador do financiamento. O número exibido passou a ser derivado dos ' +
            'lançamentos, em vez de um campo armazenado que saía de sincronia.'
    },
    {
        date: '2026-08-15',
        version: '1.2.0',
        description:
            'Tooltip mostra a descrição completa do lançamento, somada às observações (T3). ' +
            'Dia de vencimento editável direto na lista (T6). Correção do status "vencido", ' +
            'que marcava atraso no próprio dia do vencimento, e passou a respeitar dia útil ' +
            '(T8). Novo estado "não será pago", que mantém o lançamento no histórico e o tira ' +
            'de todas as somas (T10).'
    },
    {
        date: '2026-08-15',
        version: '1.3.0',
        description:
            'Senha passa a ser guardada como PBKDF2-HMAC-SHA256 com salt e 210.000 iterações, ' +
            'no lugar do SHA-256 simples, e é sincronizada pela aba Config da planilha — a ' +
            'troca de credencial passa a valer em qualquer dispositivo. O formato antigo ' +
            'continua aceito e migra na primeira troca de senha (T9).'
    },
    {
        date: '2026-08-16',
        version: '1.4.0',
        description:
            'Feriados no cálculo do vencimento: os nacionais são calculados, incluindo os ' +
            'móveis derivados da Páscoa, e os municipais/estaduais são cadastrados pelo ' +
            'usuário e salvos na planilha. O deslocamento para o próximo dia útil é em laço, ' +
            'cobrindo emendas (T8b).'
    },
    {
        date: '2026-08-16',
        version: '1.5.0',
        description:
            'Valor do lançamento editável direto na lista, mantendo a validação de valor ' +
            'maior que zero: enquanto o valor digitado é inválido o campo sinaliza, e sair ' +
            'dele descarta em vez de gravar (T7).'
    },
    {
        date: '2026-08-16',
        version: '1.6.0',
        description:
            'Importação de extrato passa a conciliar com o que já existe: linha que bate em ' +
            'mês, tipo e valor com um lançamento pendente sugere marcá-lo como pago em vez de ' +
            'criar um duplicado. A sugestão nunca é aplicada sozinha — o usuário confirma ' +
            'linha a linha, porque casar por valor é ambíguo (T5).'
    },
    {
        date: '2026-08-16',
        version: '1.6.1',
        description:
            'Logotipo oficial substitui a marca desenhada em SVG na barra lateral, na barra ' +
            'superior do mobile e no login; favicon e ícone de iOS gerados a partir da marca ' +
            'recortada. Arquivos derivados em public/ e originais preservados em src/assets/.'
    },
    {
        date: '2026-08-16',
        version: '1.7.0',
        description:
            'Nova aba Cartões: uma fatura por vez, com KPIs, período de compras que a fatura ' +
            'cobre, gráfico mês a mês, composição por categoria e a lista das compras. O ' +
            'critério do que cai em cada fatura foi centralizado numa única função, também ' +
            'usada pelo painel do Dashboard, para as duas telas não discordarem (T4).'
    },
    {
        date: '2026-08-16',
        version: '1.7.1',
        description:
            'Versão do logotipo para fundo escuro, escolhida automaticamente conforme o fundo, ' +
            'e remoção da placa clara que servia de contorno enquanto só existia a arte ' +
            'colorida.'
    },
    {
        date: '2026-08-16',
        version: '1.8.0',
        description:
            'Modo noturno com seletor de três opções (Claro, Escuro e Sistema), preferência ' +
            'salva no navegador e na planilha. Internamente, os tokens de cor deixaram de ser ' +
            'hexadecimais e passaram a apontar para variáveis CSS, com as duas paletas ' +
            'definidas em index.css — mudança estrutural na base do estilo, feita sem alterar ' +
            'os cerca de 530 pontos que usam cor. O tema claro permanece idêntico ao anterior.'
    },
    {
        date: '2026-08-16',
        version: '1.9.0',
        description:
            'Credencial de acesso definitiva no código-fonte, guardada apenas como hash PBKDF2 ' +
            'com salt — a senha não existe em nenhum arquivo do repositório. Com isso, a ' +
            'sincronização da credencial pela planilha foi removida: o hash deixa de trafegar, ' +
            'e a planilha não consegue mais impor uma credencial. Em contrapartida, uma troca ' +
            'de senha feita pela interface volta a valer só no navegador onde foi feita.'
    },
    {
        date: '2026-08-16',
        version: '1.9.1',
        description:
            'O app passa a abrir no mês corrente. A constante do mês inicial estava fixa em ' +
            'Julho, herdada do mês em que a planilha legada foi migrada, e fazia o app abrir ' +
            'sempre em Julho independentemente da data.'
    },
    {
        date: '2026-08-16',
        version: '1.9.2',
        description:
            'O ano inicial também passa a vir do relógio, pela mesma regra do mês — era fixo ' +
            'em 2026. Vale só como ponto de partida: havendo ano salvo no navegador ou na aba ' +
            'Config da planilha, é ele que manda. Acrescentado ainda o cabeçalho obrigatório ' +
            'de arquivo em src/, com o marcador correto de cada linguagem.'
    },
    {
        date: '2026-08-16',
        version: '1.9.3',
        description:
            'Quatro correções relatadas pelo usuário: pílulas do banner de alerta ilegíveis no ' +
            'tema escuro (usavam branco literal); seletor de tema transbordando a barra lateral ' +
            'e cores presas na troca de tema (o navegador não reanima transição quando muda a ' +
            'variável CSS por trás dela); categoria apagada ressuscitando do seed a cada sessão ' +
            'e sendo regravada na planilha; e tela de carregamento durante a primeira ' +
            'sincronização, no lugar do conteúdo vazio. Corrigida junto a barra lateral, que ' +
            'sumia ao redimensionar a janela para além de 1024px.'
    },
];

// Exposto de forma inofensiva caso algum script queira ler a versão.
if (typeof window !== 'undefined') {
    window.__MEUFINANCEIRO_VERSION__ = VERSION;
}
