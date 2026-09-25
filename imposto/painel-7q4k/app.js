/* Simulador Imposto Menor 2026 — interface.
   Contas: calculadoras.js (porte da planilha sobre o motor do guia). Textos do guia: guia.js.
   Nada sai do navegador: sem analytics, sem envio. As respostas ficam só no localStorage (se existir). */
(function () {
  'use strict';
  var P = window.IM.P, CALC = window.CALC, G = window.GUIA;
  var CHAVE = 'imposto-menor-simulador-v1';

  /* ================= utilidades ================= */
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var md = function (s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); };
  var r2 = function (v) { return Math.round(((+v || 0) + (v < 0 ? -Number.EPSILON : Number.EPSILON)) * 100) / 100; };
  function fmtNum(v, d) {
    d = d === undefined ? 2 : d;
    var x = d === 2 ? r2(v) : Math.round(+v || 0);
    var neg = x < 0; x = Math.abs(x);
    var p = x.toFixed(d).split('.');
    return (neg ? '−' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d ? ',' + p[1] : '');
  }
  var fmtR = function (v) { var s = fmtNum(v); return s.charAt(0) === '−' ? '−R$ ' + s.slice(1) : 'R$ ' + s; };
  var fmtPct = function (v, d) { d = d === undefined ? 2 : d; return (Math.round((+v || 0) * Math.pow(10, d + 2)) / Math.pow(10, d)).toFixed(d).replace('.', ',') + '%'; };
  var vr = function (k, v) { return '<span class="num" data-r="' + k + '">' + fmtR(v) + '</span>'; };
  var vp = function (k, v) { return '<span class="num" data-r="' + k + '">' + fmtPct(v) + '</span>'; };
  var R = function (v) { return '<span class="num">' + fmtR(v) + '</span>'; };

  /* máscara brasileira: aceita dígitos e uma vírgula; ponto digitado vira vírgula decimal */
  function formataDigitando(s) {
    s = String(s).replace(/[^\d,]/g, '');
    var i = s.indexOf(',');
    var inteiro = i >= 0 ? s.slice(0, i) : s;
    var dec = i >= 0 ? s.slice(i + 1).replace(/,/g, '') : null;
    /* três dígitos depois da vírgula = era separador de milhar ("320.000" digitado vira 320 mil) */
    if (dec !== null && dec.length >= 3) { inteiro += dec; dec = null; }
    inteiro = inteiro.replace(/^0+(?=\d)/, '').slice(0, 12);
    var f = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return dec === null ? f : (f || '0') + ',' + dec;
  }
  function lerMoeda(txt) {
    var s = String(txt == null ? '' : txt).replace(/[^\d,.]/g, '');
    if (!s) return 0;
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    var n = parseFloat(s);
    return isFinite(n) ? Math.round(n * 100) / 100 : 0;
  }
  var fmtCampo = function (v) { return v ? fmtNum(v) : ''; };
  var fmtPctCampo = function (v) { var x = Math.round((+v || 0) * 10000) / 100; return String(x).replace('.', ','); };

  var ICONE = {
    pf: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
    pj: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-5h6v5"/><path d="M9 10h.01M15 10h.01"/></svg>',
    ambos: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M2.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5"/><path d="M14 20V9l4-2.5L22 9v11"/></svg>',
    seta: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    voltar: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    ok: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>',
    info: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    alerta: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17h.01"/></svg>',
    livro: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/><path d="M9 7h6"/></svg>',
    impressora: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/></svg>',
    cal: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  };

  var cap = function (k) { return G.capitulos[k]; };
  var calendario = function (re) { for (var i = 0; i < G.calendario.length; i++) if (re.test(G.calendario[i].quando)) return G.calendario[i]; return null; };
  var AVISO = 'Conteúdo educativo. Não substitui contador; resultados são estimativas com as regras vigentes em ' + P.referencia + '.';

  /* ================= componentes de resultado ================= */
  function topo(rotulo, grande, sub, txt) {
    return '<div class="res-topo"><div class="rot">' + rotulo + '</div><div class="res-grande' + (txt ? ' txt' : '') + '">' + grande + '</div>' + (sub ? '<div class="res-sub">' + sub + '</div>' : '') + '</div>';
  }
  function topoDuplo(a, b) {
    var um = function (x) { return '<div><div class="rot">' + x[0] + '</div><div class="res-grande">' + x[1] + '</div>' + (x[2] ? '<div class="res-sub">' + x[2] + '</div>' : '') + '</div>'; };
    return '<div class="res-topo res-duplo">' + um(a) + um(b) + '</div>';
  }
  function barras(itens, titulo) {
    var max = Math.max.apply(null, itens.map(function (i) { return i.valor; }).concat([1]));
    return '<ul class="barras" aria-label="' + esc(titulo) + '">' + itens.map(function (i) {
      var w = Math.max(0, i.valor) / max * 100;
      return '<li class="barra' + (i.ganha ? ' ganha' : '') + (i.ref ? ' ref' : '') + '"><div class="barra-topo"><span>' + i.rotulo + (i.ganha ? '<em>menor</em>' : '') + '</span><b>' + (i.k ? vr(i.k, i.valor) : R(i.valor)) + '</b></div><div class="trilho"><i style="width:' + w.toFixed(2) + '%"></i></div></li>';
    }).join('') + '</ul>';
  }
  function pilhas(lados, max, titulo) {
    var seg = [['inss', 'c-inss', 'INSS do sócio'], ['patronal', 'c-pat', 'INSS patronal'], ['ir', 'c-ir', 'IR do pró-labore'], ['retencao', 'c-ret', 'IR retido sobre lucros']];
    max = Math.max(max, 1);
    return '<ul class="barras" aria-label="' + esc(titulo) + '">' + lados.map(function (l) {
      return '<li class="barra"><div class="barra-topo"><span>' + l.rotulo + (l.ganha ? '<em>menor</em>' : '') + '</span><b>' + vr(l.k, l.dados.total) + '</b></div><div class="trilho pilha">' +
        seg.filter(function (s) { return l.dados[s[0]] > 0; }).map(function (s) { return '<i class="' + s[1] + '" style="width:' + (l.dados[s[0]] / max * 100).toFixed(2) + '%" title="' + s[2] + '"></i>'; }).join('') + '</div></li>';
    }).join('') + '</ul><ul class="legenda" aria-hidden="true">' + seg.map(function (s) { return '<li><i class="' + s[1] + '"></i>' + s[2] + '</li>'; }).join('') + '</ul>';
  }
  var conclusao = function (html, planilha, neutra) { return '<div class="conclusao' + (neutra ? ' neutra' : '') + '" data-conclusao' + (planilha != null ? ' data-planilha="' + esc(planilha) + '"' : '') + '>' + (neutra ? ICONE.info : ICONE.ok) + '<p>' + html + '</p></div>'; };
  var alerta = function (html, forte, planilha) { return '<div class="alerta' + (forte ? ' forte' : '') + '"' + (planilha != null ? ' data-planilha="' + esc(planilha) + '"' : '') + '>' + ICONE.alerta + '<p>' + html + '</p></div>'; };
  var porque = function (ps) { return '<div class="porque"><h3>Por quê?</h3>' + ps.map(function (p) { return '<p>' + p + '</p>'; }).join('') + '</div>'; };
  function leiaMais(chaves) {
    return '<div class="guia-ref">' + ICONE.livro + '<div><span>Leia mais no guia</span>' + chaves.map(function (k) { var c = cap(k); return '<b>Capítulo ' + c.n + ' · ' + esc(c.titulo) + '</b>'; }).join('') + '</div></div>';
  }
  function conta(titulo, tabelas) {
    return '<details class="conta"><summary>' + titulo + '</summary>' + tabelas.join('') + '</details>';
  }
  function tabela(linhas, cab, legenda) {
    return '<table class="tabela">' + (legenda ? '<caption>' + legenda + '</caption>' : '') + (cab ? '<thead><tr>' + cab.map(function (c) { return '<th scope="col">' + c + '</th>'; }).join('') + '</tr></thead>' : '') + '<tbody>' +
      linhas.map(function (l) { return '<tr' + (l.total ? ' class="total"' : '') + '><th scope="row">' + l[0] + '</th>' + l.slice(1).map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  var T = function (arr) { arr.total = true; return arr; };
  var vazio = function (t, p) { return '<div class="vazio"><b>' + t + '</b>' + p + '</div>'; };
  var cenario = function (ctx) { return ctx.exemplo ? 'Neste exemplo' : 'Com os seus números'; };

  /* ================= os seis módulos ================= */
  var MODS = [
    /* ---------- 1 ---------- */
    {
      id: 'irpf', n: 1, grupo: 'pf', curto: 'Completa ou simplificada', titulo: 'Declaração: completa ou simplificada?',
      lead: 'Compare os dois modelos da declaração do ano de 2026 (entregue em 2027) e veja quanto vale cada recibo.',
      exemplo: 'Família do guia: salário de R$ 12.000 por mês, dois filhos na escola, plano de saúde e dentista.',
      calc: CALC.irpfAnual,
      padrao: { rend: 144000, inss: 11857.08, dependentes: 2, educacao: [14400, 14400], saude: 15000, pgbl: 0, pensao: 0, livroCaixa: 0, retido: 0 },
      zerado: { rend: 0, inss: 0, dependentes: 0, educacao: [0], saude: 0, pgbl: 0, pensao: 0, livroCaixa: 0, retido: 0 },
      blocos: [
        { t: 'Sua renda no ano', campos: [
          { id: 'rend', tipo: 'moeda', perg: 'Quanto você recebe de rendimentos tributáveis no ano?', ajuda: 'Salário, pró-labore, aluguel e serviços como autônomo, somados. Sem o 13º.', onde: 'No informe de rendimentos que a empresa manda até fevereiro, no quadro de rendimentos tributáveis (linha do total dos rendimentos). Para 2026, some os holerites até agora e estime os meses que faltam.' },
          { id: 'inss', tipo: 'moeda', perg: 'Quanto foi para o INSS (ou previdência oficial) no ano?', ajuda: 'O desconto de INSS do holerite, somado no ano.', onde: 'No mesmo informe de rendimentos, na linha da contribuição previdenciária oficial.' },
        ] },
        { t: 'Família e despesas dedutíveis', campos: [
          { id: 'dependentes', tipo: 'inteiro', min: 0, max: 20, perg: 'Quantos dependentes você declara?', ajuda: 'Filhos até 21 anos (até 24 se fazem faculdade), cônjuge e outros previstos em lei. Cada um desconta ' + fmtR(P.depAnual) + ' no ano.' },
          { id: 'educacao', tipo: 'lista', rotulo: 'Pessoa', max: 6, perg: 'Quanto você gasta com escola ou faculdade, por pessoa, no ano?', ajuda: 'Ensino infantil, fundamental, médio, técnico, superior e pós. O limite de ' + fmtR(P.educacaoAnual) + ' por pessoa é aplicado automaticamente.', onde: 'Nos recibos ou no informe anual da escola. Curso de idioma, material escolar, uniforme e transporte não entram.' },
          { id: 'saude', tipo: 'moeda', perg: 'Quanto você gasta com saúde no ano?', ajuda: 'Plano de saúde, médicos, dentistas, psicólogos, exames e hospital, seus e dos dependentes. Sem limite; só o que não foi reembolsado.', onde: 'No informe anual do plano de saúde e nos recibos com CPF ou CNPJ de quem atendeu. Guarde tudo por 5 anos.' },
          { id: 'pgbl', tipo: 'moeda', perg: 'Aportou em previdência PGBL?', ajuda: 'Só PGBL (não VGBL). A dedução é limitada a 12% da renda automaticamente.', onde: 'No informe de rendimentos da seguradora ou do banco onde está o plano.' },
        ] },
        { t: 'Já pagou algo? (opcional)', mais: 'Pensão, livro-caixa e imposto já retido', campos: [
          { id: 'retido', tipo: 'moeda', perg: 'Quanto de imposto já foi retido na fonte no ano?', ajuda: 'Serve para estimar se você vai pagar ou receber de volta.', onde: 'No informe de rendimentos, na linha do imposto sobre a renda retido na fonte.' },
          { id: 'pensao', tipo: 'moeda', perg: 'Paga pensão alimentícia judicial?', ajuda: 'Só a definida por decisão judicial ou escritura pública.' },
          { id: 'livroCaixa', tipo: 'moeda', perg: 'Despesas de livro-caixa (autônomo)?', ajuda: 'Despesas necessárias da atividade de quem recebe como autônomo, escrituradas no livro-caixa.' },
        ] },
      ],
      resultado: function (r, v, ctx) {
        if (!v.rend) return vazio('Falta a sua renda', 'Informe os rendimentos do ano para comparar os dois modelos.');
        var comp = r.melhor === 'completa', nome = comp ? 'completa' : 'simplificada', empate = r.diferenca < 0.005;
        var h = empate ? topo('Resultado', 'Empate', 'Os dois modelos dão ' + vr('completa', r.completa) + ' de imposto no ano.', true)
          : topo('Modelo que tende a compensar', comp ? 'Completa' : 'Simplificada', vr('diferenca', r.diferenca) + ' a menos de imposto no ano');
        var c;
        if (r.completa === 0 && r.simplificada === 0) c = conclusao(cenario(ctx) + ', o imposto do ano fica zerado nos dois modelos, por causa do redutor de 2026.', r.planilha, true);
        else if (empate) c = conclusao(cenario(ctx) + ', os dois modelos dão o mesmo imposto: ' + R(r.completa) + '.', r.planilha, true);
        else c = conclusao(cenario(ctx) + ', a <strong>' + nome + '</strong> tende a compensar: <strong>' + R(r.diferenca) + ' a menos</strong> de imposto no ano.', r.planilha);
        var saldo = '';
        if (r.retido > 0) {
          var s = comp ? r.saldoCompleta : r.saldoSimplificada;
          saldo = conclusao('Com ' + R(r.retido) + ' já retidos, na ' + nome + ' a estimativa é de ' + (s >= 0 ? '<strong>' + R(s) + ' a pagar</strong>' : '<strong>' + R(-s) + ' a restituir</strong>') + ' na declaração.', null, true);
        }
        var why = comp
          ? 'Suas deduções com comprovante somam ' + R(r.deducoes) + ', mais que o desconto padrão da simplificada (' + R(r.desconto) + ': 20% da renda, com teto de ' + R(P.simplificadoTeto) + '). Na completa só conta o que você comprovar, então guarde cada recibo.'
          : 'Suas deduções somam ' + R(r.deducoes) + ', menos que o desconto padrão da simplificada (' + R(r.desconto) + '), que não exige comprovante. Se surgir um gasto grande com saúde ou educação, refaça a conta.';
        return h + '<div class="res-corpo">' +
          barras([{ rotulo: 'Completa', valor: r.completa, k: 'completa', ganha: comp && !empate }, { rotulo: 'Simplificada', valor: r.simplificada, k: 'simplificada', ganha: !comp && !empate }], 'Imposto devido no ano em cada modelo') +
          c + saldo + porque([why, 'O programa da Receita faz a comparação final na entrega. Esta conta serve para planejar durante o ano.']) + leiaMais(['completa', 'deducoes']) +
          conta('Ver a conta linha por linha', [
            tabela([['Educação dedutível (com limite)', vr('educ', r.educ)], ['PGBL dedutível (até 12%)', vr('pgbl', r.pgbl)], ['Total de deduções na completa', vr('deducoes', r.deducoes)], ['Desconto da simplificada', vr('desconto', r.desconto)]]),
            tabela([['Base de cálculo', vr('baseCompleta', r.baseCompleta), vr('baseSimplificada', r.baseSimplificada)], ['Imposto pela tabela', vr('tabelaCompleta', r.tabelaCompleta), vr('tabelaSimplificada', r.tabelaSimplificada)], ['Redutor (Lei 15.270)', vr('redutorCompleta', r.redutorCompleta), vr('redutorSimplificada', r.redutorSimplificada)], T(['Imposto devido no ano', vr('completa', r.completa), vr('simplificada', r.simplificada)]), ['A pagar (+) ou a restituir (−)', vr('saldoCompleta', r.saldoCompleta), vr('saldoSimplificada', r.saldoSimplificada)]], ['', 'Completa', 'Simplificada']),
          ]) + '</div>';
      },
      resumo: function (r, v) {
        if (!v.rend) return ['Declaração anual', 'Falta a renda do ano'];
        if (r.diferenca < 0.005) return ['Completa e simplificada', 'Empate: ' + fmtR(r.completa)];
        return [(r.melhor === 'completa' ? 'Completa' : 'Simplificada') + ' tende a compensar', fmtR(r.diferenca) + ' a menos'];
      },
      linhaPlano: function (r) { return 'Completa ' + fmtR(r.completa) + ' × simplificada ' + fmtR(r.simplificada) + ' de imposto no ano.'; },
      acoes: function (r, v) {
        var a = [], decl = calendario(/mar[çc]o a maio/i), rev = calendario(/setembro a novembro/i);
        if (!v.rend) return a;
        if (r.melhor === 'completa' && r.diferenca > 0) a.push({ prio: 2, valor: r.diferenca, t: 'Guarde os comprovantes e planeje declarar pela completa', p: 'A completa ficou ' + fmtR(r.diferenca) + ' abaixo da simplificada. Ela só vale com recibo: separe desde já os de saúde e educação (com CPF ou CNPJ) e o informe de rendimentos.', quando: decl && decl.quando, cap: 'completa' });
        else a.push({ prio: 4, valor: r.diferenca, t: 'A simplificada tende a compensar: refaça a conta no fim do ano', p: 'Suas deduções (' + fmtR(r.deducoes) + ') ficaram abaixo do desconto padrão (' + fmtR(r.desconto) + '). Um gasto grande com saúde ou educação pode inverter o resultado.', quando: rev && rev.quando, cap: 'completa' });
        if (r.retido > 0) { var s = r.melhor === 'completa' ? r.saldoCompleta : r.saldoSimplificada; a.push({ prio: 5, valor: Math.abs(s), t: s >= 0 ? 'Reserve dinheiro para o imposto a pagar' : 'Você tende a ter imposto a restituir', p: 'Estimativa: ' + fmtR(Math.abs(s)) + (s >= 0 ? ' a pagar' : ' a restituir') + ' na declaração, considerando ' + fmtR(r.retido) + ' já retidos.', quando: decl && decl.quando, cap: 'completa' }); }
        return a;
      },
    },
    /* ---------- 2 ---------- */
    {
      id: 'irmes', n: 2, grupo: 'pf', curto: 'Imposto do mês', titulo: 'Quanto de imposto sai no mês?',
      lead: 'Salário, pró-labore ou carnê-leão: veja o efeito do redutor de 2026, que zera o imposto até R$ 5 mil por mês.',
      exemplo: 'Exemplo do guia: salário de R$ 6.000 por mês com carteira assinada, sem dependentes.',
      calc: CALC.irMes,
      padrao: { rend: 6000, clt: 'Sim', contrib: 0, dependentes: 0, pensao: 0, simplificado: 'Sim' },
      zerado: { rend: 0, contrib: 0, dependentes: 0, pensao: 0 },
      blocos: [
        { t: 'Seu rendimento', campos: [
          { id: 'rend', tipo: 'moeda', perg: 'Qual é o rendimento bruto do mês?', ajuda: 'Salário antes dos descontos, pró-labore, ou o que recebeu de pessoas físicas (aluguel, serviços) no carnê-leão.', onde: 'No holerite, na linha de salário ou total de vencimentos. Para aluguel, use o valor recebido menos IPTU, condomínio e taxa da imobiliária, se o contrato disser que são pagos por você (capítulo ' + cap('aluguel').n + ' do guia).' },
          { id: 'clt', tipo: 'simnao', perg: 'Tem carteira assinada (CLT)?', ajuda: 'Se sim, o INSS é calculado pela tabela de 2026. Se não (carnê-leão ou pró-labore), informe a contribuição do mês.', rotulos: ['Sim, calcular o INSS', 'Não'] },
          { id: 'contrib', tipo: 'moeda', se: function (v) { return v.clt !== 'Sim'; }, perg: 'Quanto pagou de previdência oficial no mês?', ajuda: 'INSS como autônomo (carnê ou GPS) ou os 11% do pró-labore. Deixe em branco se não pagou.' },
        ] },
        { t: 'Deduções do mês', campos: [
          { id: 'dependentes', tipo: 'inteiro', min: 0, max: 20, perg: 'Quantos dependentes?', ajuda: 'Cada um desconta ' + fmtR(P.depMensal) + ' por mês.' },
          { id: 'pensao', tipo: 'moeda', perg: 'Paga pensão alimentícia judicial no mês?', ajuda: 'Só a definida por decisão judicial ou escritura pública.' },
          { id: 'simplificado', tipo: 'simnao', perg: 'Usar o desconto simplificado mensal quando for maior?', ajuda: 'A lei permite trocar as deduções por ' + fmtR(P.simplificadoMensal) + ' quando isso for melhor, inclusive no carnê-leão. Deixe "Sim".' },
        ] },
      ],
      resultado: function (r, v, ctx) {
        if (!v.rend) return vazio('Falta o rendimento', 'Informe o rendimento bruto do mês para ver o imposto.');
        var red = P.redMensal, zona = r.rend <= red.ate ? 0 : (r.rend <= red.teto ? 1 : 2);
        var h = topo('Imposto estimado no mês', vr('imposto', r.imposto), vp('efetiva', r.efetiva) + ' do rendimento bruto');
        var eq = '<div class="equacao"><div><span>Imposto pela tabela</span><b>' + vr('tabela', r.tabela) + '</b></div><div><span>Redutor de 2026</span><b>−' + vr('redutor', r.redutor) + '</b></div><div class="eq-total"><span>Imposto do mês</span><b>' + R(r.imposto) + '</b></div></div>';
        var escala = Math.max(10000, r.rend * 1.15), pos = Math.min(r.rend, escala) / escala * 100;
        var regua = '<div class="regua" aria-hidden="true"><div class="regua-trilho"><i class="z-zero" style="width:' + (red.ate / escala * 100) + '%"></i><i class="z-parc" style="width:' + ((red.teto - red.ate) / escala * 100) + '%"></i><i class="z-cheia" style="flex:1"></i></div>' +
          '<div class="regua-pos"><span class="marcador" style="left:' + Math.min(Math.max(pos, 9), 91) + '%">' + fmtR(r.rend) + '</span></div>' +
          '<ul class="regua-leg"><li><i class="z-zero"></i>até ' + fmtR(red.ate) + ': imposto zero</li><li><i class="z-parc"></i>até ' + fmtR(red.teto) + ': redutor parcial</li><li><i class="z-cheia"></i>acima: tabela cheia</li></ul></div>';
        var c = zona === 0 ? conclusao(cenario(ctx) + ', o imposto do mês é <strong>zero</strong>: até ' + R(red.ate) + ' de rendimento, o redutor de 2026 cancela o imposto da tabela.')
          : zona === 1 ? conclusao(cenario(ctx) + ', o redutor tira ' + R(r.redutor) + ' do imposto: você paga <strong>' + R(r.imposto) + '</strong> no mês, ' + fmtPct(r.efetiva) + ' do bruto.')
            : conclusao(cenario(ctx) + ', o imposto é <strong>' + R(r.imposto) + '</strong> no mês (' + fmtPct(r.efetiva) + ' do bruto). Acima de ' + R(red.teto) + ' o redutor não se aplica.', null, true);
        var ded = r.usouSimplificado ? 'O desconto usado foi o simplificado mensal (' + R(P.simplificadoMensal) + '), maior que as suas deduções legais (' + R(r.legais) + ').' : 'O desconto usado foram as deduções legais (' + R(r.legais) + (v.simplificado === 'Sim' ? '), maiores que o desconto simplificado mensal (' + R(P.simplificadoMensal) + ').' : ').');
        return h + '<div class="res-corpo">' + eq + regua + c +
          porque([ded + ' O imposto sai da tabela sobre a base de ' + R(r.base) + ' e depois o redutor da Lei 15.270 diminui o valor de quem ganha até ' + R(red.teto) + '.', 'Se você tem outras rendas, o imposto pode aparecer no ajuste anual, porque o redutor olha cada fonte no mês e a renda total no ano.']) +
          leiaMais(['mudou', 'aluguel']) +
          conta('Ver a conta linha por linha', [tabela([['INSS / previdência', vr('inss', r.inss)], ['Deduções legais', vr('legais', r.legais)], ['Dedução usada', vr('deducao', r.deducao)], ['Base de cálculo', vr('base', r.base)], ['Imposto pela tabela', R(r.tabela)], ['Redutor (Lei 15.270)', R(r.redutor)], T(['Imposto do mês', R(r.imposto)]), ['Alíquota efetiva sobre o bruto', fmtPct(r.efetiva)]])]) + '</div>';
      },
      resumo: function (r, v) { return v.rend ? ['Imposto estimado no mês', fmtR(r.imposto) + ' · ' + fmtPct(r.efetiva) + ' do bruto'] : ['Imposto do mês', 'Falta o rendimento']; },
      linhaPlano: function (r) { return 'Imposto estimado de ' + fmtR(r.imposto) + ' no mês (' + fmtPct(r.efetiva) + ' do bruto de ' + fmtR(r.rend) + ').'; },
      acoes: function (r, v) {
        if (!v.rend) return [];
        var todo = calendario(/^todo m[êe]s$/i);
        if (v.clt === 'Sim') return [{ prio: 6, valor: r.imposto * 12, t: 'Confira o imposto no seu holerite', p: 'A estimativa é de ' + fmtR(r.imposto) + ' no mês. Se o holerite mostrar um valor muito diferente, pergunte ao RH qual dedução foi usada.', quando: 'Todo mês', cap: 'mudou' }];
        return [{ prio: 3, valor: r.imposto * 12, t: 'Pague o carnê-leão com o desconto certo', p: 'Estimativa de ' + fmtR(r.imposto) + ' no mês, já com o redutor de 2026 e o desconto ' + (r.usouSimplificado ? 'simplificado mensal.' : 'das deduções legais.') + ' Para aluguel, exclua IPTU, condomínio e taxa da imobiliária pagos por você.', quando: todo ? todo.quando : 'Todo mês', cap: 'aluguel' }];
      },
    },
    /* ---------- 3 ---------- */
    {
      id: 'pgbl', n: 3, grupo: 'pf', curto: 'PGBL', titulo: 'Quanto aportar no PGBL e quanto volta?',
      lead: 'Só faz sentido para quem declara pela completa e contribui ao INSS. O imposto não some: é adiado para o resgate.',
      exemplo: 'Exemplo do guia: renda de R$ 180.000 no ano, INSS no teto, R$ 6.000 de saúde, sem dependentes.',
      calc: CALC.pgbl,
      padrao: { rend: 180000, inss: 11857.08, dependentes: 0, educ: 0, saude: 6000, outras: 0, pgblJa: 0 },
      zerado: { rend: 0, inss: 0, dependentes: 0, educ: 0, saude: 0, outras: 0, pgblJa: 0 },
      blocos: [
        { t: 'Sua renda no ano', campos: [
          { id: 'rend', tipo: 'moeda', perg: 'Quanto você recebe de rendimentos tributáveis no ano?', ajuda: 'Salário, pró-labore, aluguel e serviços somados. O limite do PGBL é 12% desse valor.', onde: 'No informe de rendimentos (quadro de rendimentos tributáveis). Para 2026, some o que recebeu e estime até dezembro.' },
          { id: 'inss', tipo: 'moeda', perg: 'Quanto foi para o INSS no ano?', ajuda: 'Quem não contribui para o INSS ou regime próprio não pode deduzir o PGBL.' },
        ] },
        { t: 'Suas deduções', campos: [
          { id: 'dependentes', tipo: 'inteiro', min: 0, max: 20, perg: 'Quantos dependentes?', ajuda: 'Cada um desconta ' + fmtR(P.depAnual) + ' no ano.' },
          { id: 'saude', tipo: 'moeda', perg: 'Despesas com saúde no ano?', ajuda: 'Plano, médicos, dentistas, exames. Sem limite.' },
          { id: 'educ', tipo: 'moeda', perg: 'Educação dedutível (já com o limite)?', ajuda: 'Some até ' + fmtR(P.educacaoAnual) + ' por pessoa. Se não souber, faça antes a simulação da declaração (etapa 1).' },
          { id: 'outras', tipo: 'moeda', perg: 'Outras deduções (pensão judicial, livro-caixa)?', ajuda: 'Deixe em branco se não tiver.' },
        ] },
        { t: 'O que já aportou', campos: [
          { id: 'pgblJa', tipo: 'moeda', perg: 'Quanto já aportou em PGBL neste ano?', ajuda: 'Some os aportes de janeiro até hoje.', onde: 'No aplicativo ou extrato do plano de previdência (seguradora ou banco).' },
        ] },
      ],
      resultado: function (r, v, ctx) {
        if (!v.rend) return vazio('Falta a sua renda', 'Informe os rendimentos do ano para ver o limite do PGBL.');
        var h = topoDuplo(['Ainda cabe aportar até dezembro', vr('cabe', r.cabe), 'limite de 12%: ' + vr('limite', r.limite)], ['Imposto a menos neste ano, com 12%', vr('deixa', r.deixa), 'contra o seu melhor modelo sem PGBL']);
        var itens = [{ rotulo: 'Sem PGBL', valor: r.sem, k: 'sem' }];
        if (r.ja > 0) itens.push({ rotulo: 'Com o que já aportou', valor: r.comJa, k: 'comJa' });
        itens.push({ rotulo: 'Com 12% da renda', valor: r.com12, k: 'com12', ganha: r.deixa > 0.005 });
        itens.push({ rotulo: 'Simplificada (para comparar)', valor: r.simplificada, k: 'simplificada', ref: true });
        var c;
        if (r.deixa <= 0.005) c = alerta(cenario(ctx) + ', <strong>o PGBL não reduz o seu imposto</strong>: mesmo com o aporte máximo, a simplificada tende a ser melhor. Se quiser previdência, o motivo não será o imposto deste ano.', false, r.planilha);
        else if (r.cabe <= 0) c = conclusao(cenario(ctx) + ', você já usou todo o limite de 12%. Aportes acima dele não reduzem o imposto.', r.planilha, true);
        else c = conclusao(cenario(ctx) + ', aportar até <strong>' + R(r.cabe) + '</strong> até dezembro deixa o imposto deste ano <strong>' + R(r.deixa) + ' menor</strong>, comparado com o seu melhor modelo sem PGBL' + (r.ja > 0 ? ' e sem nenhum aporte' : '') + '.', r.planilha);
        return h + '<div class="res-corpo">' + barras(itens, 'Imposto no ano com e sem PGBL') + c +
          porque(['O imposto não some: é adiado. No resgate, o valor sacado paga IR. Na tabela regressiva, depois de mais de 10 anos a alíquota é 10% (sobre ' + R(r.limite) + ', seriam ' + R(r.resgate10) + ').', 'Só vale para quem declara pela completa e contribui ao INSS. Aporte até meados de dezembro: a dedução é do ano em que o dinheiro entrou no plano.']) +
          leiaMais(['pgbl']) +
          conta('Ver a conta linha por linha', [tabela([['Limite dedutível (12% da renda)', R(r.limite)], ['Quanto ainda cabe aportar', R(r.cabe)], ['Imposto sem PGBL (completa)', R(r.sem)], ['Imposto com o já aportado', R(r.comJa)], ['Imposto com 12% (completa)', R(r.com12)], T(['Imposto que deixa de pagar neste ano (contra o melhor modelo sem PGBL)', R(r.deixa)]), ['Imposto na simplificada', R(r.simplificada)]])]) + '</div>';
      },
      resumo: function (r, v) { return v.rend ? (r.deixa <= 0.005 ? ['PGBL', 'Sem vantagem: simplificada é melhor'] : ['Ainda cabe no PGBL', fmtR(r.cabe) + ' · imposto ' + fmtR(r.deixa) + ' menor']) : ['PGBL', 'Falta a renda do ano']; },
      linhaPlano: function (r) { return r.deixa <= 0.005 ? 'PGBL sem vantagem: a simplificada tende a ser melhor mesmo com o aporte.' : 'Cabem ' + fmtR(r.cabe) + ' no PGBL; com 12% da renda, o imposto do ano cai ' + fmtR(r.deixa) + ' (é adiado, não perdoado).'; },
      acoes: function (r, v) {
        if (!v.rend) return [];
        var dez = calendario(/dezembro/i);
        if (r.deixa <= 0.005) return [{ prio: 7, valor: 0, t: 'Não conte com o PGBL para reduzir o imposto', p: 'Mesmo com o aporte máximo, a simplificada tende a ser melhor. Se quiser previdência, compare com o VGBL e com outras aplicações pelo custo.', quando: null, cap: 'pgbl' }];
        if (r.cabe <= 0) return [{ prio: 7, valor: 0, t: 'Limite do PGBL já usado', p: 'Aportes acima de 12% da renda não reduzem o imposto deste ano.', quando: null, cap: 'pgbl' }];
        return [{ prio: 1, valor: r.deixa, t: 'Decida até meados de dezembro se vai aportar no PGBL', p: 'Cabem até ' + fmtR(r.cabe) + '. Com 12% da renda, o imposto deste ano fica ' + fmtR(r.deixa) + ' menor, comparado com o seu melhor modelo sem PGBL. É imposto adiado: no resgate há IR, de 10% depois de 10 anos na tabela regressiva.', quando: dez ? dez.quando : 'Até meados de dezembro', cap: 'pgbl' }];
      },
    },
    /* ---------- 4 ---------- */
    {
      id: 'simples', n: 4, grupo: 'pj', curto: 'Simples x Presumido', titulo: 'Simples, Presumido ou Fator R?',
      lead: 'Para empresas de serviço: compare os tributos por mês em cada caminho, já com o INSS e o IR do pró-labore.',
      exemplo: 'Exemplo do guia: consultoria que fatura R$ 30.000 por mês, sócio único com pró-labore de R$ 3.000, sem funcionários.',
      calc: CALC.simplesPresumido,
      padrao: { receita: 30000, rbtManual: 'Não', rbt12: 360000, fatorR: 'Sim', anexo: 'V', prolabore: 3000, temFuncionarios: 'Não', folha12: 0, salarios: 0, iss: 0.05, presuncao: 0.32 },
      zerado: { receita: 0, rbt12: 0, prolabore: 0, folha12: 0, salarios: 0 },
      blocos: [
        { t: 'Faturamento', campos: [
          { id: 'receita', tipo: 'moeda', perg: 'Quanto a empresa fatura, em média, por mês?', ajuda: 'Receita bruta de serviços, antes de qualquer imposto.' },
          { id: 'rbtManual', tipo: 'simnao', perg: 'Sabe a receita exata dos últimos 12 meses?', ajuda: 'Se não, usamos a média do mês × 12.', rotulos: ['Sim, vou informar', 'Não, usar média × 12'] },
          { id: 'rbt12', tipo: 'moeda', se: function (v) { return v.rbtManual === 'Sim'; }, perg: 'Receita dos últimos 12 meses (RBT12)', ajuda: 'É ela que define a faixa do Simples.', onde: 'No extrato do Simples Nacional (PGDAS-D) ou com o seu contador.' },
        ] },
        { t: 'Atividade e sócios', campos: [
          { id: 'fatorR', tipo: 'simnao', perg: 'Sua atividade está sujeita ao Fator R?', ajuda: 'Medicina, odontologia, psicologia, fisioterapia, arquitetura, engenharia, software, consultoria, publicidade, entre outras.', onde: 'No CNAE da empresa, conferido com o contador. O capítulo ' + cap('simples').n + ' do guia explica o Fator R.' },
          { id: 'anexo', tipo: 'anexo', se: function (v) { return v.fatorR !== 'Sim'; }, perg: 'Em qual anexo do Simples fica a sua atividade?' },
          { id: 'prolabore', tipo: 'moeda', perg: 'Qual é o pró-labore mensal do(s) sócio(s)?', ajuda: 'A remuneração fixa pelo trabalho, com INSS. Não é a distribuição de lucros.' },
          { id: 'temFuncionarios', tipo: 'simnao', perg: 'A empresa tem funcionários?', rotulos: ['Sim', 'Não'] },
          { id: 'salarios', tipo: 'moeda', se: function (v) { return v.temFuncionarios === 'Sim'; }, perg: 'Salários mensais dos funcionários (sem o pró-labore)', ajuda: 'No Presumido, a empresa paga cerca de 28% de INSS sobre eles. No Simples (Anexos III e V) isso já está no DAS.' },
          { id: 'folha12', tipo: 'moeda', se: function (v) { return v.temFuncionarios === 'Sim'; }, perg: 'Folha dos últimos 12 meses sem o pró-labore', ajuda: 'Salários, FGTS e INSS dos funcionários em 12 meses. Entra no Fator R.' },
        ] },
        { t: 'Detalhes do Lucro Presumido', mais: 'ISS do município e presunção de lucro', campos: [
          { id: 'iss', tipo: 'pct', perg: 'Alíquota de ISS do município', ajuda: 'De 2% a 5%, conforme a cidade e o serviço.' },
          { id: 'presuncao', tipo: 'pct', perg: 'Presunção de lucro', ajuda: '32% para serviços em geral. Mude só se o contador indicar outra.' },
        ] },
      ],
      resultado: function (r, v, ctx) {
        if (!v.receita) return vazio('Falta o faturamento', 'Informe o faturamento médio por mês para comparar os regimes.');
        var nomes = { simples: 'Simples Nacional (Anexo ' + r.anexo + ')', presumido: 'Lucro Presumido', fatorR: 'Simples com Fator R (Anexo III)' };
        var tot = { simples: r.totalSimples, presumido: r.totalPresumido, fatorR: r.totalFatorR };
        var ordem = ['simples', 'presumido'].concat(r.fatorRSim ? ['fatorR'] : []).sort(function (a, b) { return tot[a] - tot[b]; });
        var melhor = r.caminho, segundo = ordem.filter(function (k) { return k !== melhor; })[0];
        var dif = tot[segundo] - tot[melhor];
        var h = topo('Caminho mais barato neste cenário', esc(nomes[melhor]), vr('total_' + melhor, tot[melhor]) + ' por mês · ' + R(dif) + ' a menos que o 2º', true);
        var itens = [{ rotulo: 'Simples hoje (Anexo ' + r.anexo + ')', valor: r.totalSimples, k: 'totalSimples', ganha: melhor === 'simples' }, { rotulo: 'Lucro Presumido', valor: r.totalPresumido, k: 'totalPresumido', ganha: melhor === 'presumido' }];
        if (r.fatorRSim) itens.push({ rotulo: 'Simples com Fator R (Anexo III)', valor: r.totalFatorR, k: 'totalFatorR', ganha: melhor === 'fatorR' });
        var fatos = '<div class="fatos"><div class="fato"><span>Fator R hoje</span><b>' + vp('fator', r.fator) + '</b></div><div class="fato"><span>Anexo aplicado hoje</span><b data-r="anexo">' + r.anexo + '</b></div><div class="fato"><span>Alíquota efetiva do DAS</span><b>' + vp('efetiva', r.efetiva) + '</b></div></div>';
        var c = conclusao(cenario(ctx) + ', o caminho mais barato é <strong>' + esc(nomes[melhor]) + '</strong>: ' + R(tot[melhor]) + ' por mês, ' + R(dif) + ' a menos que ' + esc(nomes[segundo]) + ' (' + R(dif * 12) + ' no ano).', r.planilha);
        var why = [];
        if (melhor === 'fatorR') why.push('Com a folha em pelo menos 28% da receita, a atividade sai do Anexo V para o Anexo III, de alíquota bem menor. Para isso o pró-labore teria de ser de ' + vr('plNec', r.plNec) + ' por mês, que paga mais INSS e IR, mas neste cenário a economia no DAS é maior. Deixe folga (29% a 30%) e só faça se o pró-labore corresponder ao trabalho real do sócio.');
        else if (melhor === 'simples') why.push('No Simples os tributos vêm numa guia só (DAS), com alíquota efetiva de ' + fmtPct(r.efetiva) + '. No Presumido, IRPJ, CSLL, PIS, Cofins e ISS somam mais, além de 20% de INSS patronal sobre o pró-labore.' + (r.fatorRSim ? ' O Fator R exigiria pró-labore de ' + R(r.plNec) + ', e o INSS e o IR dele comeriam a economia.' : ''));
        else why.push('Com margem alta e faturamento maior, a alíquota efetiva do Simples (' + fmtPct(r.efetiva) + ') passa a carga do Presumido. Mas o Presumido tem contabilidade mais cara e mais obrigações, que não estão nesta conta.');
        why.push('Aproximação mensal para planejar. Não inclui o custo do contador, nem o acréscimo de presunção para receitas acima de R$ 5 milhões por ano (LC 224/2025).');
        var set = calendario(/^setembro$/i);
        var prazo = set ? alerta('<strong>Prazo:</strong> ' + md(set.oque) + ' A saída do Simples é comunicada em janeiro.') : '';
        return h + '<div class="res-corpo">' + barras(itens, 'Tributos por mês em cada caminho') + fatos + c + prazo + porque(why) + leiaMais(['simples', 'presumido']) +
          conta('Ver a conta linha por linha', [
            tabela([['Fator R atual', fmtPct(r.fator)], ['Anexo aplicado', r.anexo], ['Alíquota efetiva', fmtPct(r.efetiva)], ['DAS do mês', vr('das', r.das)], ['INSS do sócio (11% até o teto)', vr('inssSocio', r.inssSocio)], ['INSS patronal (só Anexo IV)', vr('patronalSimples', r.patronalSimples)], ['IR do pró-labore (com redutor)', vr('irPl', r.irPl)], T(['Total por mês no Simples', vr('totalSimples', r.totalSimples)])], null, 'Simples Nacional'),
            tabela([['IRPJ (15% + adicional)', vr('irpj', r.irpj)], ['CSLL', vr('csll', r.csll)], ['PIS e Cofins', vr('pisCofins', r.pisCofins)], ['ISS', vr('iss', r.iss)], ['INSS do sócio + 20% patronal + INSS sobre salários', vr('inssPresumido', r.inssPresumido)], ['IR do pró-labore (com redutor)', R(r.irPl)], T(['Total por mês no Presumido', vr('totalPresumido', r.totalPresumido)])], null, 'Lucro Presumido (serviços)'),
            r.fatorRSim ? tabela([['Pró-labore mensal necessário', vr('plNec', r.plNec)], ['DAS no Anexo III', vr('dasIII', r.dasIII)], ['INSS e IR desse pró-labore', vr('custoPlNec', r.custoPlNec)], T(['Total por mês com Fator R', vr('totalFatorR', r.totalFatorR)])], null, 'Simples com Fator R') : '',
          ]) + '</div>';
      },
      resumo: function (r, v) {
        if (!v.receita) return ['Simples x Presumido', 'Falta o faturamento'];
        var n = { simples: 'Simples', presumido: 'Presumido', fatorR: 'Fator R (Anexo III)' }[r.caminho];
        var t = { simples: r.totalSimples, presumido: r.totalPresumido, fatorR: r.totalFatorR }[r.caminho];
        return ['Mais barato: ' + n, fmtR(t) + ' por mês'];
      },
      linhaPlano: function (r) { return 'Caminho mais barato: ' + r.planilha + '. Simples ' + fmtR(r.totalSimples) + ', Presumido ' + fmtR(r.totalPresumido) + (r.fatorRSim ? ', Fator R ' + fmtR(r.totalFatorR) : '') + ' por mês.'; },
      acoes: function (r, v) {
        if (!v.receita) return [];
        var set = calendario(/^setembro$/i), jan = calendario(/^janeiro$/i), ago = calendario(/^agosto$/i);
        var tot = { simples: r.totalSimples, presumido: r.totalPresumido, fatorR: r.totalFatorR };
        var outros = Object.keys(tot).filter(function (k) { return k !== r.caminho && (k !== 'fatorR' || r.fatorRSim); });
        var dif = Math.min.apply(null, outros.map(function (k) { return tot[k]; })) - tot[r.caminho];
        var a = [];
        if (r.caminho === 'presumido') a.push({ prio: 2, valor: dif * 12, t: 'Leve a comparação de regime ao contador', p: 'O Lucro Presumido ficou ' + fmtR(dif) + ' por mês abaixo do segundo caminho, antes do custo maior de contabilidade. Se a empresa está no Simples, a saída é comunicada em janeiro e o Presumido se confirma com o 1º DARF de IRPJ, em abril.', quando: jan ? jan.quando : 'Janeiro', cap: 'presumido' });
        else a.push({ prio: 1, valor: dif * 12, t: 'Confirme o regime de 2027 com o contador', p: (r.caminho === 'fatorR' ? 'O Simples com Fator R (Anexo III) ficou ' : 'O Simples ficou ') + fmtR(dif) + ' por mês abaixo do segundo caminho (' + fmtR(dif * 12) + ' no ano). Quem ainda não está no Simples faz a opção para o ano seguinte em setembro.', quando: set ? set.quando : 'Setembro', cap: 'simples' });
        if (r.caminho === 'fatorR') a.push({ prio: 2, valor: dif * 12, t: 'Ajuste o pró-labore para o Fator R, com folga', p: 'Pró-labore necessário: ' + fmtR(r.plNec) + ' por mês (28% da receita). Mire em 29% a 30% e lembre que o Fator R olha os últimos 12 meses: o efeito vem aos poucos.', quando: 'Todo mês', cap: 'simples' });
        a.push({ prio: 8, valor: 0, t: 'Refaça a simulação de regime todo ano', p: 'Com os números até julho e a previsão do ano seguinte.', quando: ago ? ago.quando : 'Agosto', cap: 'presumido' });
        return a;
      },
    },
    /* ---------- 5 ---------- */
    {
      id: 'prolabore', n: 5, grupo: 'pj', curto: 'Pró-labore x lucros', titulo: 'Como tirar dinheiro da empresa?',
      lead: 'Compare tirar tudo como pró-labore com um pró-labore menor mais distribuição de lucros.',
      exemplo: 'Exemplo do guia: sócio de empresa no Lucro Presumido que retira R$ 30.000 por mês.',
      calc: CALC.proLabore,
      padrao: { total: 30000, prolaboreB: 5000, patronal: 'Sim' },
      zerado: { total: 0, prolaboreB: 0 },
      blocos: [
        { t: 'Quanto você retira', campos: [
          { id: 'total', tipo: 'moeda', perg: 'Quanto você quer retirar da empresa por mês, no total?', ajuda: 'Tudo o que sai da empresa para você: pró-labore mais lucros.' },
          { id: 'prolaboreB', tipo: 'moeda', perg: 'Qual seria o pró-labore no formato B?', ajuda: 'O restante sai como lucro. O pró-labore precisa ser compatível com o trabalho que você faz.' },
        ] },
        { t: 'Regime da empresa', campos: [
          { id: 'patronal', tipo: 'simnao', perg: 'A empresa paga 20% de INSS patronal?', ajuda: 'Sim: Lucro Presumido, Lucro Real ou Simples no Anexo IV. Não: Simples nos Anexos I, II, III e V.' },
        ] },
      ],
      resultado: function (r, v, ctx) {
        if (!v.total) return vazio('Falta a retirada', 'Informe quanto você quer tirar da empresa por mês.');
        var h = topo('Diferença de tributos por mês (A − B)', vr('difMes', r.difMes), vr('difAno', r.difAno) + ' no ano');
        var max = Math.max(r.A.total, r.B.total);
        var p = pilhas([{ rotulo: 'A) Tudo como pró-labore', k: 'totalA', dados: r.A, ganha: r.A.total < r.B.total - 0.005 }, { rotulo: 'B) Pró-labore de ' + fmtR(r.B.prolabore) + ' + lucros', k: 'totalB', dados: r.B, ganha: r.B.total < r.A.total - 0.005 }], max, 'Tributos por mês em cada formato');
        var c = r.difMes > 0.005 ? conclusao(cenario(ctx) + ', tirar ' + R(r.total) + ' como pró-labore de ' + R(r.B.prolabore) + ' mais lucros custa <strong>' + R(r.difMes) + ' a menos por mês</strong> em tributos (' + R(r.difAno) + ' no ano).', r.planilha)
          : conclusao(cenario(ctx) + ', o formato B não reduz os tributos.', r.planilha, true);
        var at = r.atencao === 'dividendos' ? alerta('Lucros acima de ' + R(P.dividendos.limiteMes) + ' no mês, pagos pela mesma empresa: retenção de 10% sobre o total (antecipação do imposto mínimo da alta renda).', false, r.planilha)
          : r.atencao === 'minimo' ? alerta('Pró-labore abaixo do salário mínimo (' + R(P.salarioMinimo) + ') pode ser questionado.', true, r.planilha) : '';
        if (r.B.lucros < 0) at += alerta('O pró-labore do formato B está maior que a retirada total. Confira os valores.', true);
        return h + '<div class="res-corpo">' + p + c + at +
          porque(['Pró-labore paga INSS de 11% (até o teto), IR pela tabela e, fora do Simples ou no Anexo IV, 20% de INSS patronal. Lucro distribuído não paga INSS e, até ' + R(P.dividendos.limiteMes) + ' por mês por empresa, não tem IR retido.', '<strong>Só vale se</strong> o lucro existe de verdade e está registrado, o pró-labore é compatível com o trabalho e a distribuição segue o contrato social. Pró-labore menor também significa aposentadoria menor.']) +
          leiaMais(['prolabore']) +
          conta('Ver a conta linha por linha', [tabela([
            ['Pró-labore', R(r.A.prolabore), R(r.B.prolabore)], ['Lucros distribuídos', R(r.A.lucros), R(r.B.lucros)],
            ['INSS do sócio (11% até o teto)', vr('inssA', r.A.inss), vr('inssB', r.B.inss)], ['INSS patronal', vr('patronalA', r.A.patronal), vr('patronalB', r.B.patronal)],
            ['IR do pró-labore (com redutor)', vr('irA', r.A.ir), vr('irB', r.B.ir)], ['IR retido sobre lucros', vr('retA', r.A.retencao), vr('retB', r.B.retencao)],
            T(['Total de tributos por mês', vr('totalA', r.A.total), vr('totalB', r.B.total)])], ['', 'A', 'B'])]) + '</div>';
      },
      resumo: function (r, v) { return v.total ? (r.difMes > 0.005 ? ['Formato B custa menos', fmtR(r.difMes) + ' por mês'] : ['Pró-labore x lucros', 'Formato B não reduz']) : ['Pró-labore x lucros', 'Falta a retirada']; },
      linhaPlano: function (r) { return 'Tudo pró-labore: ' + fmtR(r.A.total) + ' de tributos por mês; pró-labore de ' + fmtR(r.B.prolabore) + ' + lucros: ' + fmtR(r.B.total) + '.'; },
      acoes: function (r, v) {
        if (!v.total) return [];
        var a = [];
        if (r.difMes > 0.005) a.push({ prio: 2, valor: r.difAno, t: 'Revise a forma de tirar dinheiro da empresa', p: 'Com pró-labore de ' + fmtR(r.B.prolabore) + ' mais lucros, os tributos ficam ' + fmtR(r.difMes) + ' menores por mês (' + fmtR(r.difAno) + ' no ano). Só com lucro apurado de verdade, pró-labore compatível com o trabalho e distribuição registrada.', quando: 'Todo mês', cap: 'prolabore' });
        if (r.atencao === 'dividendos') a.push({ prio: 1, valor: r.B.retencao * 12, t: 'Atenção à retenção de 10% sobre lucros', p: 'Acima de ' + fmtR(P.dividendos.limiteMes) + ' por mês da mesma empresa, há retenção de 10% sobre o total. Pergunte ao contador como organizar as distribuições.', quando: 'Todo mês', cap: 'prolabore' });
        if (r.atencao === 'minimo') a.push({ prio: 1, valor: 0, t: 'Pró-labore abaixo do salário mínimo', p: 'Pode ser questionado pelo INSS. Defina um pró-labore compatível com o trabalho.', quando: null, cap: 'prolabore' });
        return a;
      },
    },
    /* ---------- 6 ---------- */
    {
      id: 'mei', n: 6, grupo: 'pj', curto: 'Limite do MEI', titulo: 'MEI: vou estourar o limite?',
      lead: 'Projete o faturamento do ano no ritmo atual e veja em que faixa você cai antes que seja tarde.',
      exemplo: 'Exemplo da planilha: MEI aberto antes de janeiro, com R$ 70.000 faturados em 9 meses.',
      calc: CALC.mei,
      padrao: { acumulado: 70000, fechados: 9, atividade: 12 },
      zerado: { acumulado: 0 },
      blocos: [
        { t: 'Seu faturamento', campos: [
          { id: 'acumulado', tipo: 'moeda', perg: 'Quanto você faturou no ano até agora?', ajuda: 'Tudo o que entrou como MEI desde janeiro (ou desde a abertura).', onde: 'Some as notas emitidas e o que recebeu sem nota. O relatório mensal de receitas brutas ajuda.' },
          { id: 'fechados', tipo: 'inteiro', min: 0, max: 12, perg: 'Meses de atividade já fechados no ano', ajuda: 'Quem abriu em maio e está em outubro: 5 meses fechados (maio a setembro). Aberto antes de janeiro, em outubro: 9.' },
          { id: 'atividade', tipo: 'inteiro', min: 1, max: 12, perg: 'Quantos meses de atividade no ano?', ajuda: 'Use 12 se o MEI foi aberto antes de janeiro. No ano de abertura, o limite é ' + fmtR(P.mei.limiteMes) + ' por mês de atividade.' },
        ] },
      ],
      resultado: function (r, v, ctx) {
        if (!v.acumulado) return vazio('Falta o faturamento', 'Informe quanto já faturou no ano.');
        var st = { dentro: 'Dentro do limite', ate20: 'Até 20% acima', acima20: 'Acima de 20%' }[r.status];
        var h = topo('Situação pela projeção', st, 'Projeção do ano no ritmo atual: ' + vr('projecao', r.projecao), true);
        var escala = Math.max(r.tolerancia * 1.18, r.projecao * 1.08, r.acumulado * 1.08);
        var pc = function (x) { return Math.min(Math.max(x / escala * 100, 8), 92); };
        var med = '<div class="regua" aria-hidden="true"><div class="regua-trilho"><i class="z-ok" style="width:' + (r.limite / escala * 100) + '%"></i><i class="z-tol" style="width:' + ((r.tolerancia - r.limite) / escala * 100) + '%"></i><i class="z-fora" style="flex:1"></i></div>' +
          '<div class="regua-pos"><span class="marcador vazado" style="left:' + pc(r.projecao) + '%">projeção</span></div>' +
          '<ul class="regua-leg"><li><i class="z-ok"></i>até ' + fmtR(r.limite) + '</li><li><i class="z-tol"></i>até ' + fmtR(r.tolerancia) + '</li><li><i class="z-fora"></i>acima: retroativo</li></ul></div>';
        var fatos = '<div class="fatos"><div class="fato"><span>Seu limite neste ano</span><b>' + vr('limite', r.limite) + '</b></div><div class="fato"><span>Limite + 20%</span><b>' + vr('tolerancia', r.tolerancia) + '</b></div><div class="fato"><span>Ainda cabe faturar</span><b>' + vr('cabe', r.cabe) + '</b></div></div>';
        var ritmo = r.fechados > 0 ? ' no ritmo atual (' + R(r.porMes) + ' por mês)' : '';
        var c = r.status === 'dentro' ? conclusao(cenario(ctx) + ritmo + ', o ano fecha em ' + R(r.projecao) + ', <strong>dentro do limite</strong>. Ainda cabem ' + R(r.cabe) + ' até ' + R(r.limite) + '.', r.planilha)
          : r.status === 'ate20' ? conclusao(cenario(ctx) + ritmo + ', o ano fecha em ' + R(r.projecao) + ': <strong>até 20% acima do limite</strong>. Você continua MEI até dezembro, paga DAS complementar sobre o excesso e vira microempresa em 1º de janeiro.', r.planilha, true)
            : alerta(cenario(ctx) + ritmo + ', o ano fecha em ' + R(r.projecao) + ': <strong>mais de 20% acima do limite</strong>. O desenquadramento seria retroativo ' + (r.atividade < 12 ? 'à data de abertura' : 'a 1º de janeiro') + ', com todo o faturamento recalculado pelo Simples. Converse com o contador antes das próximas notas.', true, r.planilha);
        if (r.fechados === 0) c = conclusao('Informe quantos meses já fecharam para projetar o ano.', r.planilha, true);
        return h + '<div class="res-corpo">' + med + fatos + c +
          porque(['O limite do MEI é ' + R(P.mei.limite) + ' por ano (' + R(P.mei.limiteMes) + ' por mês de atividade no ano de abertura). Até 20% acima, a saída é em janeiro; acima disso, o ano inteiro é recalculado.', 'Sair antes do estouro sai mais barato: dá para pedir o desenquadramento e virar microempresa no mesmo CNPJ, já escolhendo o regime. Dividir o faturamento com o MEI de um parente para não estourar é simulação.']) +
          leiaMais(['mei']) +
          conta('Ver a conta linha por linha', [tabela([['Seu limite neste ano', R(r.limite)], ['Limite + 20% (sem retroativo)', R(r.tolerancia)], ['Projeção do ano no ritmo atual', R(r.projecao)], T(['Quanto ainda cabe faturar até o limite', R(r.cabe)])])]) + '</div>';
      },
      resumo: function (r, v) { return v.acumulado ? ['Projeção: ' + fmtR(r.projecao), { dentro: 'Dentro do limite', ate20: 'Até 20% acima', acima20: 'Acima de 20%: risco retroativo' }[r.status]] : ['Limite do MEI', 'Falta o faturamento']; },
      linhaPlano: function (r) { return 'Projeção de ' + fmtR(r.projecao) + ' no ano para um limite de ' + fmtR(r.limite) + ': ' + r.planilha.charAt(0).toLowerCase() + r.planilha.slice(1) + '.'; },
      acoes: function (r, v) {
        if (!v.acumulado) return [];
        var set = calendario(/^setembro$/i), dasn = calendario(/31 de maio/i);
        if (r.status === 'acima20') return [{ prio: 0, valor: r.projecao, t: 'Fale com o contador agora sobre sair do MEI', p: 'A projeção passa de ' + fmtR(r.tolerancia) + ' (limite + 20%). Acima disso, o desenquadramento é retroativo ' + (r.atividade < 12 ? 'à data de abertura' : 'a janeiro') + '. O caminho é pedir o desenquadramento e virar microempresa no mesmo CNPJ.', quando: 'Agora', urgente: true, cap: 'mei' }];
        if (r.status === 'ate20') return [{ prio: 0, valor: r.projecao - r.limite, t: 'Planeje a saída do MEI para janeiro', p: 'A projeção (' + fmtR(r.projecao) + ') passa do limite, mas fica até 20% acima: DAS complementar sobre o excesso e microempresa em 1º de janeiro. Escolha o regime com o contador.', quando: set ? set.quando + ' (opção pelo Simples)' : 'Setembro', urgente: true, cap: 'mei' }];
        return [{ prio: 7, valor: 0, t: 'Acompanhe o faturamento do MEI todo mês', p: 'Ainda cabem ' + fmtR(r.cabe) + ' até o limite. Entregue a declaração anual do MEI mesmo sem faturamento.', quando: dasn ? dasn.quando : 'Até 31 de maio', cap: 'mei' }];
      },
    },
  ];
  var MOD = {}; MODS.forEach(function (m) { MOD[m.id] = m; });
  var ROTAS = { pf: ['irpf', 'irmes', 'pgbl'], pj: ['simples', 'prolabore', 'mei'], ambos: ['irpf', 'irmes', 'pgbl', 'simples', 'prolabore', 'mei'] };
  var ANEXOS = [['I', 'Comércio'], ['II', 'Indústria'], ['III', 'Serviços em geral e locação de bens móveis'], ['IV', 'Construção civil, vigilância, limpeza, advocacia'], ['V', 'Serviços intelectuais e técnicos (sem Fator R)']];

  /* ================= estado (localStorage é opcional) ================= */
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  function estadoNovo() {
    var e = { versao: 1, perfil: null, v: {}, modo: {}, visitados: {}, pulados: {}, perguntas: {} };
    MODS.forEach(function (m) { e.v[m.id] = clone(m.padrao); e.modo[m.id] = 'exemplo'; });
    return e;
  }
  var estado = estadoNovo();
  var armazenamento = null;
  try { armazenamento = window.localStorage; var t = '__t'; armazenamento.setItem(t, t); armazenamento.removeItem(t); } catch (e) { armazenamento = null; }
  function carregar() {
    if (!armazenamento) return;
    try {
      var s = armazenamento.getItem(CHAVE); if (!s) return;
      var o = JSON.parse(s); if (!o || o.versao !== 1) return;
      ['perfil', 'visitados', 'pulados', 'perguntas', 'modo'].forEach(function (k) { if (o[k] != null) estado[k] = o[k]; });
      MODS.forEach(function (m) { if (o.v && o.v[m.id]) Object.keys(m.padrao).forEach(function (k) { if (o.v[m.id][k] !== undefined) estado.v[m.id][k] = o.v[m.id][k]; }); });
    } catch (e) { /* estado salvo corrompido: começa do zero */ }
  }
  var tSalvar = null;
  function salvar() { if (!armazenamento) return; clearTimeout(tSalvar); tSalvar = setTimeout(function () { try { armazenamento.setItem(CHAVE, JSON.stringify(estado)); } catch (e) { } }, 250); }
  function apagar() { try { if (armazenamento) armazenamento.removeItem(CHAVE); } catch (e) { } estado = estadoNovo(); }
  var temProgresso = function () { return estado.perfil || Object.keys(estado.visitados).length > 0; };

  /* ================= montagem das telas ================= */
  var app = document.getElementById('app');
  document.getElementById('aviso-rodape').textContent = AVISO + ' Nenhum dado sai do seu aparelho.';

  function campoHTML(m, c) {
    var id = 'f-' + m.id + '-' + c.id, hid = 'h-' + m.id + '-' + c.id;
    var ajuda = c.ajuda ? '<p class="ajuda" id="' + hid + '">' + c.ajuda + '</p>' : '';
    var onde = c.onde ? '<details class="onde"><summary>Onde encontro isso?</summary><p>' + c.onde + '</p></details>' : '';
    var desc = c.ajuda ? ' aria-describedby="' + hid + '"' : '';
    var h;
    if (c.tipo === 'moeda') h = '<div class="campo" data-campo="' + c.id + '"><label class="perg" for="' + id + '">' + c.perg + '</label>' + ajuda + '<div class="entrada"><span class="pre" aria-hidden="true">R$</span><input id="' + id + '" type="text" inputmode="decimal" autocomplete="off" enterkeyhint="next" placeholder="0,00" data-tipo="moeda" data-m="' + m.id + '" data-c="' + c.id + '"' + desc + '></div>' + onde + '</div>';
    else if (c.tipo === 'pct') h = '<div class="campo" data-campo="' + c.id + '"><label class="perg" for="' + id + '">' + c.perg + '</label>' + ajuda + '<div class="entrada pct"><input id="' + id + '" type="text" inputmode="decimal" autocomplete="off" data-tipo="pct" data-m="' + m.id + '" data-c="' + c.id + '"' + desc + '><span class="suf" aria-hidden="true">%</span></div>' + onde + '</div>';
    else if (c.tipo === 'inteiro') h = '<div class="campo" data-campo="' + c.id + '"><label class="perg" for="' + id + '">' + c.perg + '</label>' + ajuda + '<div class="stepper"><button type="button" data-passo="-1" data-m="' + m.id + '" data-c="' + c.id + '" aria-label="Diminuir">−</button><input id="' + id + '" type="text" inputmode="numeric" autocomplete="off" data-tipo="inteiro" data-min="' + c.min + '" data-max="' + c.max + '" data-m="' + m.id + '" data-c="' + c.id + '"' + desc + '><button type="button" data-passo="1" data-m="' + m.id + '" data-c="' + c.id + '" aria-label="Aumentar">+</button></div>' + onde + '</div>';
    else if (c.tipo === 'simnao') {
      var rot = c.rotulos || ['Sim', 'Não'];
      h = '<fieldset class="campo" data-campo="' + c.id + '"' + desc + '><legend class="perg">' + c.perg + '</legend>' + ajuda + '<div class="seg">' + ['Sim', 'Não'].map(function (val, i) { return '<label><input type="radio" name="' + id + '" value="' + val + '" data-tipo="simnao" data-m="' + m.id + '" data-c="' + c.id + '"><span>' + rot[i] + '</span></label>'; }).join('') + '</div>' + onde + '</fieldset>';
    } else if (c.tipo === 'anexo') h = '<fieldset class="campo" data-campo="' + c.id + '"><legend class="perg">' + c.perg + '</legend><div class="opcoes">' + ANEXOS.map(function (a) { return '<label><input type="radio" name="' + id + '" value="' + a[0] + '" data-tipo="anexo" data-m="' + m.id + '" data-c="' + c.id + '"><span><b>' + a[0] + '</b>' + a[1] + '</span></label>'; }).join('') + '</div></fieldset>';
    else if (c.tipo === 'lista') h = '<fieldset class="campo" data-campo="' + c.id + '"' + desc + '><legend class="perg">' + c.perg + '</legend>' + ajuda + '<div class="lista-itens" data-lista></div><button type="button" class="mais" data-mais="' + m.id + '" data-c="' + c.id + '">+ Adicionar pessoa</button>' + onde + '</fieldset>';
    return h;
  }
  function listaHTML(m, c) {
    var arr = estado.v[m.id][c.id];
    return arr.map(function (val, i) {
      var id = 'f-' + m.id + '-' + c.id + '-' + i;
      return '<div class="item-lista"><label class="rot" for="' + id + '">' + c.rotulo + ' ' + (i + 1) + '</label><div class="entrada"><span class="pre" aria-hidden="true">R$</span><input id="' + id + '" type="text" inputmode="decimal" autocomplete="off" placeholder="0,00" data-tipo="moeda" data-m="' + m.id + '" data-c="' + c.id + '" data-i="' + i + '" value="' + fmtCampo(val) + '"></div>' +
        (arr.length > 1 ? '<button type="button" class="tira" data-tira="' + i + '" data-m="' + m.id + '" data-c="' + c.id + '" aria-label="Remover ' + c.rotulo.toLowerCase() + ' ' + (i + 1) + '">×</button>' : '') + '</div>';
    }).join('');
  }
  function blocoHTML(m, b, i) {
    var campos = b.campos.map(function (c) { return campoHTML(m, c); }).join('');
    if (b.mais) return '<div class="bloco"><details class="mais-campos"><summary><div><div class="bloco-t" style="margin:0"><i>' + (i + 1) + '</i>' + b.t + '</div><span>' + b.mais + '</span></div></summary>' + campos + '</details></div>';
    return '<div class="bloco"><div class="bloco-t"><i>' + (i + 1) + '</i>' + b.t + '</div>' + campos + '</div>';
  }
  function telaModulo(m) {
    return '<section class="tela tela-mod g-' + m.grupo + '" id="tela-' + m.id + '" hidden aria-labelledby="t-' + m.id + '">' +
      '<div class="mod-topo"><div class="wrap"><p class="eyebrow"><span class="chip">' + (m.grupo === 'pf' ? 'Pessoa física' : 'Empresa') + '</span><span class="etapa" data-etapa></span></p>' +
      '<h1 id="t-' + m.id + '" tabindex="-1">' + m.titulo + '</h1><p class="lead">' + m.lead + '</p></div></div>' +
      '<div class="wrap mod-corpo"><div class="mod-perguntas"><div class="exemplo" data-exemplo></div>' + m.blocos.map(function (b, i) { return blocoHTML(m, b, i); }).join('') + '</div>' +
      '<div class="mod-resultado"><h2 class="sr-only">Resultado</h2><div class="res-card" id="res-' + m.id + '" data-res></div></div></div>' +
      '<div class="wrap mod-nav nao-imprime"><div class="linha"><a class="btn btn-sec btn-voltar" data-voltar href="#/">' + ICONE.voltar + '<span>Voltar</span></a><a class="btn" data-proxima href="#/plano"></a></div><button type="button" class="btn-txt" data-pular="' + m.id + '">Não se aplica a mim, pular esta etapa</button></div>' +
      '<div class="barra-fixa escondida nao-imprime" data-fixa aria-hidden="true"><div class="barra-fixa-in"><div class="barra-fixa-tx"><span data-fixa-rot></span><b data-fixa-val></b></div><button type="button" class="btn" data-ver-res="' + m.id + '" tabindex="-1">Ver resultado</button></div></div>' +
      '<p class="sr-only" aria-live="polite" data-live></p></section>';
  }
  function telaInicio() {
    var casos = [['pf', 'Pessoa física', 'Salário, aluguel ou autônomo. Declaração, imposto do mês e PGBL.', '--c:var(--verde);--c-cl:var(--verde-cl)'], ['pj', 'Tenho empresa', 'MEI, Simples ou Presumido. Regime, pró-labore e limite do MEI.', '--c:var(--roxo);--c-cl:var(--roxo-cl)'], ['ambos', 'Os dois', 'As seis simulações, uma depois da outra.', '--c:var(--azul3);--c-cl:#E7EEF7']];
    return '<section class="tela tela-inicio" id="tela-inicio" hidden aria-labelledby="t-inicio">' +
      '<div class="hero"><div class="wrap"><p class="hero-eyebrow">Imposto Menor, Dentro da Lei · 2026</p><h1 id="t-inicio" tabindex="-1">Veja, com os seus números, o que <em>a lei permite</em> pagar a menos.</h1>' +
      '<p class="sub">Seis simulações do guia, em linguagem simples. Os números do exemplo já vêm preenchidos: troque pelos seus quando quiser.</p>' +
      '<ul class="hero-fatos"><li><i></i>Regras de 2026</li><li><i></i>Uns 10 minutos</li><li><i></i>Nada sai do seu aparelho</li></ul></div></div>' +
      '<div class="wrap escolha"><h2 class="escolha-t">Qual é o seu caso?</h2><div class="cards-caso">' + casos.map(function (c) {
        return '<button type="button" class="caso" data-perfil="' + c[0] + '" style="' + c[3] + '" aria-pressed="false"><span class="caso-ic">' + ICONE[c[0]] + '</span><span class="caso-tx"><b>' + c[1] + '</b><span>' + c[2] + '</span></span><span class="caso-seta">' + ICONE.seta + '</span></button>';
      }).join('') + '</div><div class="continuar" data-continuar hidden></div>' +
      '<h2 class="secao-t">Ou vá direto a uma simulação</h2><p class="secao-sub">Cada uma reproduz uma aba da planilha que acompanha o guia.</p><ul class="lista-mods">' + MODS.map(function (m) {
        var cor = m.grupo === 'pf' ? '--c:var(--verde);--c-cl:var(--verde-cl)' : '--c:var(--roxo);--c-cl:var(--roxo-cl)';
        return '<li><a class="mod-link" href="#/' + m.id + '" style="' + cor + '"><span class="mod-n">' + m.n + '</span><span><b>' + m.curto + '</b><span>' + (m.grupo === 'pf' ? 'Pessoa física' : 'Empresa') + '</span></span><span class="feito" data-feito="' + m.id + '" hidden>feito</span></a></li>';
      }).join('') + '</ul>' +
      '<div class="aviso">' + ICONE.info + '<p><b>Conteúdo educativo.</b> Não substitui contador; resultados são estimativas com as regras vigentes em ' + esc(P.referencia) + '. Tudo aqui é planejamento dentro da lei: nada de omitir renda ou simular operações. As respostas ficam só neste aparelho.</p></div></div></section>';
  }
  function telaPlano() {
    return '<section class="tela tela-plano" id="tela-plano" hidden aria-labelledby="t-plano"><div class="plano-topo"><div class="wrap"><p class="eyebrow">Simulador Imposto Menor 2026</p><h1 id="t-plano" tabindex="-1">Meu plano</h1><p data-plano-data></p>' +
      '<div class="plano-acoes-topo nao-imprime"><button type="button" class="btn" data-imprimir>' + ICONE.impressora + 'Salvar em PDF / imprimir</button></div></div></div>' +
      '<div class="wrap plano-corpo" data-plano></div></section>';
  }
  app.insertAdjacentHTML('beforeend', telaInicio() + MODS.map(telaModulo).join('') + telaPlano());

  /* ================= preencher, calcular, desenhar ================= */
  function preencher(m) {
    var v = estado.v[m.id], tela = $('#tela-' + m.id);
    m.blocos.forEach(function (b) {
      b.campos.forEach(function (c) {
        if (c.tipo === 'moeda') $('#f-' + m.id + '-' + c.id).value = fmtCampo(v[c.id]);
        else if (c.tipo === 'pct') $('#f-' + m.id + '-' + c.id).value = fmtPctCampo(v[c.id]);
        else if (c.tipo === 'inteiro') { $('#f-' + m.id + '-' + c.id).value = String(v[c.id]); atualizaStepper(m.id, c); }
        else if (c.tipo === 'simnao' || c.tipo === 'anexo') $$('input[name="f-' + m.id + '-' + c.id + '"]', tela).forEach(function (r) { r.checked = r.value === v[c.id]; });
        else if (c.tipo === 'lista') { $('[data-campo="' + c.id + '"] [data-lista]', tela).innerHTML = listaHTML(m, c); $('[data-mais="' + m.id + '"]', tela).hidden = v[c.id].length >= c.max; }
      });
    });
    condicionais(m);
    desenhaExemplo(m);
  }
  function atualizaStepper(mid, c) {
    var v = estado.v[mid][c.id], tela = $('#tela-' + mid);
    $('[data-campo="' + c.id + '"] [data-passo="-1"]', tela).disabled = v <= c.min;
    $('[data-campo="' + c.id + '"] [data-passo="1"]', tela).disabled = v >= c.max;
  }
  function condicionais(m) {
    var v = estado.v[m.id], tela = $('#tela-' + m.id);
    m.blocos.forEach(function (b) { b.campos.forEach(function (c) { if (c.se) $('[data-campo="' + c.id + '"]', tela).hidden = !c.se(v); }); });
  }
  function desenhaExemplo(m) {
    var ex = estado.modo[m.id] === 'exemplo';
    $('#tela-' + m.id + ' [data-exemplo]').innerHTML = ex
      ? '<div class="exemplo-tx"><b>Números do exemplo</b>' + m.exemplo + '</div><button type="button" class="btn" data-meus="' + m.id + '">Usar meus números</button>'
      : '<div class="exemplo-tx"><b>Seus números</b>Os resultados usam os valores que você informou.</div><button type="button" class="btn" data-exemplo-volta="' + m.id + '">Voltar ao exemplo</button>';
  }
  var cache = {};
  function calcular(m) { var r = m.calc(estado.v[m.id]); cache[m.id] = r; return r; }
  var tLive = {};
  function desenha(m) {
    var r = calcular(m), v = estado.v[m.id], ctx = { exemplo: estado.modo[m.id] === 'exemplo' };
    var tela = $('#tela-' + m.id);
    var contaAberta = $('[data-res] details.conta', tela); contaAberta = contaAberta && contaAberta.open;
    $('[data-res]', tela).innerHTML = m.resultado(r, v, ctx);
    if (contaAberta && $('[data-res] details.conta', tela)) $('[data-res] details.conta', tela).open = true;
    var s = m.resumo(r, v);
    $('[data-fixa-rot]', tela).textContent = s[0];
    $('[data-fixa-val]', tela).textContent = s[1];
    clearTimeout(tLive[m.id]);
    tLive[m.id] = setTimeout(function () { var c = $('[data-conclusao]', tela) || $('.alerta', tela); $('[data-live]', tela).textContent = c ? c.textContent : s[0] + ': ' + s[1]; }, 900);
  }

  /* ================= eventos dos campos ================= */
  function mudou(mid) { estado.modo[mid] = 'meus'; var m = MOD[mid]; condicionais(m); desenhaExemplo(m); desenha(m); salvar(); }
  var campoDef = function (mid, cid) { var achado = null; MOD[mid].blocos.forEach(function (b) { b.campos.forEach(function (c) { if (c.id === cid) achado = c; }); }); return achado; };

  document.addEventListener('input', function (e) {
    var el = e.target, mid = el.getAttribute('data-m'), cid = el.getAttribute('data-c'), tipo = el.getAttribute('data-tipo');
    if (!mid || !tipo) return;
    if (tipo === 'moeda' || tipo === 'pct') {
      var pos = el.selectionStart == null ? el.value.length : el.selectionStart, val = el.value;
      /* ponto ou vírgula digitados viram a vírgula decimal (vale para teclados que só têm ponto) */
      if ((e.data === '.' || e.data === ',') && pos > 0 && (val.charAt(pos - 1) === '.' || val.charAt(pos - 1) === ',')) {
        val = val.slice(0, pos - 1).replace(/,/g, '') + ',' + val.slice(pos).replace(/,/g, '');
      }
      var n = (val.slice(0, pos).match(/[\d,]/g) || []).length;
      var novo = formataDigitando(val);
      el.value = novo;
      var i = 0, k = 0; while (i < novo.length && k < n) { if (/[\d,]/.test(novo.charAt(i))) k++; i++; }
      try { if (document.activeElement === el) el.setSelectionRange(i, i); } catch (x) { }
      var num = lerMoeda(novo);
      if (tipo === 'pct') num = Math.round(num * 100) / 10000;
      var idx = el.getAttribute('data-i');
      if (idx != null) estado.v[mid][cid][+idx] = num; else estado.v[mid][cid] = num;
      mudou(mid);
    } else if (tipo === 'inteiro') {
      var c = campoDef(mid, cid), d = el.value.replace(/\D/g, '').slice(0, 2);
      el.value = d;
      if (d !== '') { estado.v[mid][cid] = Math.min(c.max, Math.max(c.min, +d)); atualizaStepper(mid, c); mudou(mid); }
    }
  });
  document.addEventListener('change', function (e) {
    var el = e.target, mid = el.getAttribute('data-m'), cid = el.getAttribute('data-c'), tipo = el.getAttribute('data-tipo');
    if (!mid) return;
    if (tipo === 'simnao' || tipo === 'anexo') {
      estado.v[mid][cid] = el.value;
      if (mid === 'simples' && cid === 'rbtManual' && el.value === 'Sim' && !estado.v.simples.rbt12) { estado.v.simples.rbt12 = r2(estado.v.simples.receita * 12); $('#f-simples-rbt12').value = fmtCampo(estado.v.simples.rbt12); }
      mudou(mid);
    }
  });
  document.addEventListener('focusout', function (e) {
    var el = e.target, mid = el.getAttribute && el.getAttribute('data-m'), cid = el.getAttribute && el.getAttribute('data-c'), tipo = el.getAttribute && el.getAttribute('data-tipo');
    if (!mid) return;
    var idx = el.getAttribute('data-i');
    var v = idx != null ? estado.v[mid][cid][+idx] : estado.v[mid][cid];
    if (tipo === 'moeda') el.value = fmtCampo(v);
    else if (tipo === 'pct') el.value = fmtPctCampo(v);
    else if (tipo === 'inteiro') el.value = String(v);
    setTimeout(atualizaBarraFixa, 60);
  });
  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (el.matches && el.matches('input[data-tipo="moeda"],input[data-tipo="pct"],input[data-tipo="inteiro"]')) {
      setTimeout(function () { try { if (document.activeElement === el) el.setSelectionRange(0, el.value.length); } catch (x) { } }, 0);
    }
    atualizaBarraFixa();
  });
  document.addEventListener('keydown', function (e) {
    var el = e.target;
    if (e.key === 'Enter' && el.matches && el.matches('input[data-tipo]') && el.type === 'text') {
      e.preventDefault();
      var ins = $$('input[type="text"]', el.closest('.tela')).filter(function (x) { return x.offsetParent !== null; });
      var i = ins.indexOf(el); if (i >= 0 && ins[i + 1]) ins[i + 1].focus(); else el.blur();
    }
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && el.getAttribute && el.getAttribute('data-tipo') === 'inteiro') {
      e.preventDefault(); passo(el.getAttribute('data-m'), el.getAttribute('data-c'), e.key === 'ArrowUp' ? 1 : -1);
    }
  });
  function passo(mid, cid, d) {
    var c = campoDef(mid, cid), v = estado.v[mid][cid] + d;
    v = Math.min(c.max, Math.max(c.min, v));
    estado.v[mid][cid] = v; $('#f-' + mid + '-' + cid).value = String(v); atualizaStepper(mid, c); mudou(mid);
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button, a') : null;
    if (!b) return;
    var a;
    if ((a = b.getAttribute('data-perfil'))) { estado.perfil = a; salvar(); ir(ROTAS[a][0]); return; }
    if ((a = b.getAttribute('data-passo'))) { passo(b.getAttribute('data-m'), b.getAttribute('data-c'), +a); return; }
    if ((a = b.getAttribute('data-mais'))) {
      var c = campoDef(a, b.getAttribute('data-c')), arr = estado.v[a][c.id];
      if (arr.length < c.max) { arr.push(0); preencher(MOD[a]); mudou(a); var ins = $$('[data-campo="' + c.id + '"] input', $('#tela-' + a)); ins[ins.length - 1].focus(); }
      return;
    }
    if ((a = b.getAttribute('data-tira')) != null) {
      var mid = b.getAttribute('data-m'), cd = campoDef(mid, b.getAttribute('data-c'));
      estado.v[mid][cd.id].splice(+a, 1); preencher(MOD[mid]); mudou(mid);
      var restantes = $$('[data-campo="' + cd.id + '"] input', $('#tela-' + mid)); (restantes[Math.min(+a, restantes.length - 1)] || b).focus();
      return;
    }
    if ((a = b.getAttribute('data-meus'))) {
      var m = MOD[a]; Object.keys(m.zerado).forEach(function (k) { estado.v[a][k] = clone(m.zerado[k]); });
      if (a === 'mei') estado.v.mei.fechados = Math.max(1, new Date().getMonth());
      estado.modo[a] = 'meus'; preencher(m); desenha(m); salvar();
      var primeiro = $('#tela-' + a + ' input[type="text"]'); if (primeiro) primeiro.focus();
      return;
    }
    if ((a = b.getAttribute('data-exemplo-volta'))) { estado.v[a] = clone(MOD[a].padrao); estado.modo[a] = 'exemplo'; preencher(MOD[a]); desenha(MOD[a]); salvar(); return; }
    if ((a = b.getAttribute('data-pular'))) { estado.pulados[a] = true; salvar(); ir(proxima(a)); return; }
    if ((a = b.getAttribute('data-ver-res'))) { var rc = $('#res-' + a); rc.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (b.hasAttribute('data-imprimir')) { imprimir(); return; }
    if (b.hasAttribute('data-recomecar')) {
      if (!b.classList.contains('confirmar')) {
        b.classList.add('confirmar'); b.textContent = 'Toque de novo para apagar tudo';
        setTimeout(function () { b.classList.remove('confirmar'); b.textContent = 'Começar de novo'; }, 4000);
        return;
      }
      apagar(); MODS.forEach(function (m) { preencher(m); }); ir(''); return;
    }
  });

  /* ================= rotas ================= */
  function ir(r) { if (location.hash === '#/' + r) mostrar(); else location.hash = '#/' + r; }
  var rotaAtual = function () { return ROTAS[estado.perfil] || ROTAS.ambos; };
  function proxima(mid) {
    var rota = rotaAtual(), i = rota.indexOf(mid);
    if (i < 0) return 'plano';
    for (var j = i + 1; j < rota.length; j++) if (!estado.pulados[rota[j]]) return rota[j];
    return 'plano';
  }
  function anterior(mid) { var rota = rotaAtual(), i = rota.indexOf(mid); return i > 0 ? rota[i - 1] : ''; }
  function progresso(tela) {
    var rota = rotaAtual(), i = rota.indexOf(tela), pct = tela === 'plano' ? 100 : tela === 'inicio' ? 0 : (i >= 0 ? (i + 1) / (rota.length + 1) * 100 : 50);
    $('#progresso').style.width = pct + '%';
  }
  var telaVisivel = 'inicio';
  function mostrar() {
    var r = (location.hash || '').replace(/^#\/?/, '');
    if (!r) r = 'inicio';
    if (r !== 'inicio' && r !== 'plano' && !MOD[r]) r = 'inicio';
    telaVisivel = r;
    $$('.tela').forEach(function (t) { t.hidden = t.id !== 'tela-' + r; });
    $('.topo-plano').setAttribute('aria-current', r === 'plano' ? 'page' : 'false');
    if (MOD[r]) {
      var m = MOD[r], tela = $('#tela-' + r), rota = rotaAtual(), i = rota.indexOf(r);
      estado.visitados[r] = true; estado.pulados[r] = false; salvar();
      $('[data-etapa]', tela).textContent = i >= 0 ? 'Etapa ' + (i + 1) + ' de ' + rota.length : 'Simulação avulsa';
      var prox = proxima(r);
      $('[data-proxima]', tela).innerHTML = '<span>' + (prox === 'plano' ? 'Ver meu plano' : 'Próxima: ' + MOD[prox].curto) + '</span>' + ICONE.seta;
      $('[data-proxima]', tela).setAttribute('href', '#/' + prox);
      $('[data-voltar]', tela).setAttribute('href', '#/' + anterior(r));
      $('[data-pular]', tela).hidden = i < 0;
      desenha(m);
      document.title = m.curto + ' · Simulador Imposto Menor 2026';
    } else if (r === 'plano') { desenhaPlano(); document.title = 'Meu plano · Simulador Imposto Menor 2026'; }
    else { desenhaInicio(); document.title = 'Simulador Imposto Menor 2026'; }
    progresso(r);
    window.scrollTo(0, 0);
    /* leitor de tela e teclado: o foco vai para o título da tela nova (não na primeira carga) */
    var h1 = $('#tela-' + r + ' h1'); if (h1 && !primeiraVez) h1.focus({ preventScroll: true });
    primeiraVez = false;
    setTimeout(atualizaBarraFixa, 50);
  }
  var primeiraVez = true;
  window.addEventListener('hashchange', mostrar);

  function desenhaInicio() {
    $$('[data-perfil]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-perfil') === estado.perfil)); });
    MODS.forEach(function (m) { $('[data-feito="' + m.id + '"]').hidden = !(estado.visitados[m.id] && !estado.pulados[m.id]); });
    var cont = $('[data-continuar]');
    if (temProgresso()) {
      var feitos = MODS.filter(function (m) { return estado.visitados[m.id] && !estado.pulados[m.id]; }).length;
      var alvo = rotaAtual().filter(function (id) { return !estado.visitados[id] && !estado.pulados[id]; })[0] || 'plano';
      cont.innerHTML = '<p><b>Você já começou</b>' + feitos + ' de 6 simulações feitas. As respostas estão salvas neste aparelho.</p><a class="btn" href="#/' + alvo + '">' + (alvo === 'plano' ? 'Ver meu plano' : 'Continuar') + ICONE.seta + '</a>';
      cont.hidden = false;
    } else cont.hidden = true;
  }

  /* barra fixa com o resultado ao vivo: some quando o resultado está na tela ou o teclado está aberto */
  function atualizaBarraFixa() {
    var m = MOD[telaVisivel]; if (!m) return;
    var tela = $('#tela-' + m.id), barra = $('[data-fixa]', tela), res = $('#res-' + m.id);
    var ativo = document.activeElement, digitando = ativo && ativo.matches && ativo.matches('input[type="text"]');
    var rect = res.getBoundingClientRect(), visivel = rect.top < window.innerHeight - 80 && rect.bottom > 60;
    var esconder = digitando || visivel || window.innerWidth >= 1024;
    barra.classList.toggle('escondida', esconder);
    barra.setAttribute('aria-hidden', String(esconder));
    $('[data-ver-res]', barra).tabIndex = esconder ? -1 : 0;
  }
  window.addEventListener('scroll', atualizaBarraFixa, { passive: true });
  window.addEventListener('resize', atualizaBarraFixa);

  /* ================= meu plano ================= */
  var MESES = { janeiro: 1, fevereiro: 2, 'março': 3, marco: 3, abril: 4, maio: 5, junho: 6, julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12 };
  function mesesDe(txt) { var m = String(txt).toLowerCase().match(/janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro/g); return m ? m.map(function (x) { return MESES[x]; }) : []; }
  function temaData(d) {
    var t = d.quando + ' ' + d.oque, pf = /declara|PGBL|restitui|carn[êe]-le[ãa]o|doa[çc]|pessoa f[íi]sica/i.test(t), pj = /Simples|MEI|Presumido|DAS|empresa|regime|pr[óo]-labore|IBS/i.test(t);
    if (/DASN|declara[çc][ãa]o anual do MEI/i.test(t)) { pf = false; pj = true; }
    return { pf: pf, pj: pj };
  }
  function desenhaPlano() {
    var el = $('[data-plano]'), hoje = new Date();
    var dd = function (n) { return (n < 10 ? '0' : '') + n; };
    $('[data-plano-data]').textContent = 'Feito em ' + dd(hoje.getDate()) + '/' + dd(hoje.getMonth() + 1) + '/' + hoje.getFullYear() + ', com as regras vigentes em ' + P.referencia + '.';
    var feitos = MODS.filter(function (m) { return estado.visitados[m.id] && !estado.pulados[m.id]; });
    if (!feitos.length) {
      el.innerHTML = '<div class="plano-sec plano-vazio"><b>Seu plano ainda está vazio</b><p>Faça pelo menos uma simulação. O plano junta os resultados, as datas e as perguntas para o contador.</p><a class="btn" href="#/' + (estado.perfil ? ROTAS[estado.perfil][0] : '') + '">' + (estado.perfil ? 'Começar as simulações' : 'Escolher o meu caso') + '</a></div>' + rodapePlano();
      return;
    }
    var temPF = feitos.some(function (m) { return m.grupo === 'pf'; }), temPJ = feitos.some(function (m) { return m.grupo === 'pj'; });
    var algumExemplo = feitos.some(function (m) { return estado.modo[m.id] === 'exemplo'; });

    /* resumo */
    var resumo = '<section class="plano-sec"><h2>O que as simulações mostraram</h2><p class="sub">Estimativas para planejar, não valores oficiais.' + (algumExemplo ? ' Onde aparece "exemplo", os números ainda são os do guia.' : '') + '</p><ul class="resumo-lista">' + feitos.map(function (m) {
      var r = calcular(m), cor = m.grupo === 'pf' ? '--c:var(--verde);--c-cl:var(--verde-cl)' : '--c:var(--roxo);--c-cl:var(--roxo-cl)';
      return '<li style="' + cor + '"><span class="mod-n">' + m.n + '</span><div><b>' + m.curto + (estado.modo[m.id] === 'exemplo' ? '<span class="tag-ex">exemplo</span>' : '') + '</b><p>' + esc(m.linhaPlano(r)) + '</p><a href="#/' + m.id + '">Rever esta simulação</a></div></li>';
    }).join('') + '</ul></section>';

    /* ações priorizadas */
    var acoes = [];
    feitos.forEach(function (m) { m.acoes(calcular(m), estado.v[m.id]).forEach(function (a) { a.mod = m; acoes.push(a); }); });
    acoes.sort(function (a, b) { return a.prio - b.prio || b.valor - a.valor; });
    var acoesH = '<section class="plano-sec"><h2>O que fazer, por ordem</h2><p class="sub">Primeiro o que tem prazo perto, depois o que pesa mais no bolso.</p><ol class="acoes">' + acoes.map(function (a) {
      var c = cap(a.cap);
      return '<li class="acao' + (a.urgente || a.prio <= 1 ? ' urgente' : '') + '"><b>' + esc(a.t) + (estado.modo[a.mod.id] === 'exemplo' ? '<span class="tag-ex">exemplo</span>' : '') + '</b><p>' + esc(a.p) + '</p><div class="meta">' + (a.quando ? '<span class="quando">' + ICONE.cal + esc(a.quando) + '</span>' : '') + '<span>Guia: capítulo ' + c.n + '</span></div></li>';
    }).join('') + '</ol></section>';

    /* datas: do mês atual em diante */
    var atual = hoje.getMonth() + 1;
    var datas = G.calendario.map(function (d) {
      var ms = mesesDe(d.quando), tema = temaData(d), ini, fim, dist;
      if (!ms.length) { ms = /declara/i.test(d.quando) ? [5] : []; }
      if (!ms.length) dist = -1; /* todo mês */
      else { ini = ms[0]; fim = ms[ms.length - 1]; var dentro = ((atual - ini + 12) % 12) <= ((fim - ini + 12) % 12); dist = dentro ? 0 : (ini - atual + 12) % 12; }
      return { d: d, tema: tema, dist: dist };
    }).filter(function (x) { return (temPF && x.tema.pf) || (temPJ && x.tema.pj); })
      .sort(function (a, b) { return a.dist - b.dist; });
    var datasH = '<section class="plano-sec"><h2>Datas que importam</h2><p class="sub">Do calendário do guia, a partir deste mês.</p><ul class="agenda">' + datas.map(function (x) {
      return '<li><div class="q">' + esc(x.d.quando) + (x.dist === 0 ? '<br><span class="agora">agora</span>' : '') + '</div><p>' + md(x.d.oque) + '</p></li>';
    }).join('') + '</ul></section>';

    /* perguntas para o contador */
    var rPJ5 = estado.visitados.prolabore && !estado.pulados.prolabore ? calcular(MOD.prolabore) : null;
    var rPF1 = estado.visitados.irpf && !estado.pulados.irpf ? calcular(MOD.irpf) : null;
    var rendaAlta = (rPF1 && estado.v.irpf.rend > P.irpfm.inicio) || (rPJ5 && estado.v.prolabore.total * 12 > P.irpfm.inicio);
    var grupos = G.perguntas.map(function (g) {
      var itens = [];
      if (/pessoa f[íi]sica/i.test(g.grupo)) itens = temPF ? g.itens : [];
      else if (/^empresa/i.test(g.grupo)) itens = temPJ ? g.itens : [];
      else itens = g.itens.filter(function (q) {
        if (/50 mil/.test(q)) return rPJ5 && rPJ5.B.lucros > P.dividendos.limiteMes * 0.8;
        if (/600 mil/.test(q)) return rendaAlta;
        if (/reforma/i.test(q)) return temPJ;
        if (/holding/i.test(q)) return rendaAlta;
        return false;
      });
      return { grupo: g.grupo, itens: itens };
    }).filter(function (g) { return g.itens.length; });
    var pergH = '<section class="plano-sec"><h2>Leve para o seu contador</h2><p class="sub">As perguntas do guia que se aplicam ao seu caso. Marque as que já fez.</p><div class="perguntas">' + grupos.map(function (g) {
      return '<h3>' + esc(g.grupo) + '</h3>' + g.itens.map(function (q) {
        var k = q.slice(0, 60);
        return '<label class="perg-item"><input type="checkbox" data-pergunta="' + esc(k) + '"' + (estado.perguntas[k] ? ' checked' : '') + '><span>' + esc(q) + '</span></label>';
      }).join('');
    }).join('') + '</div></section>';

    el.innerHTML = resumo + acoesH + datasH + pergH + rodapePlano();
  }
  function rodapePlano() {
    return '<div class="aviso">' + ICONE.info + '<p>' + esc(G.aviso) + ' Os resultados são estimativas para planejar.</p></div>' +
      '<p class="so-impressao aviso-impressao">Gerado no Simulador Imposto Menor 2026 (guia Imposto Menor, Dentro da Lei · MAJEX). Não substitui contador. Sem vínculo com órgãos do governo.</p>' +
      '<div class="plano-rodape nao-imprime"><button type="button" class="btn" data-imprimir>' + ICONE.impressora + 'Salvar em PDF / imprimir</button><button type="button" class="btn btn-perigo" data-recomecar>Começar de novo</button></div>';
  }
  document.addEventListener('change', function (e) {
    var k = e.target.getAttribute && e.target.getAttribute('data-pergunta');
    if (k == null) return;
    estado.perguntas[k] = e.target.checked; salvar();
  });
  function imprimir() {
    if (telaVisivel !== 'plano') { ir('plano'); setTimeout(function () { window.print(); }, 300); return; }
    window.print();
  }

  /* ================= início ================= */
  carregar();
  MODS.forEach(function (m) { preencher(m); });
  mostrar();
})();
