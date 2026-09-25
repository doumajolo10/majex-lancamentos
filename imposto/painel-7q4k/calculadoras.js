/* Calculadoras do Simulador Imposto Menor 2026.
   Cada função reproduz uma aba da planilha "Calculadora-Imposto-Menor-2026.xlsx"
   (imposto-legal/gerar-planilha.js). Regra: usar a função do motor (IM.C, cópia literal de
   calculos.js) sempre que ela faz a mesma conta da planilha; onde a planilha tem lógica
   própria, o porte é literal e o comentário diz de qual célula veio.
   Valores de entrada em reais (número); percentuais como fração (0,05 = 5%). */
(function (g) {
  'use strict';
  var C = g.IM.C, P = g.IM.P, r2 = C.r2;
  var sim = function (v) { return v === true || v === 'Sim'; };
  var num = function (v) { v = Number(v); return isFinite(v) ? v : 0; };

  /* Excel ROUNDUP(x; 0) para x >= 0. O Excel trabalha com 15 algarismos significativos:
     0,28 × 360.000 ÷ 12 ÷ 100 dá 84 no Excel e 84,00000000000001 no JavaScript. */
  function roundupExcel(x) { return Math.ceil(Number(x.toPrecision(15))); }

  /* ===== Aba "1 IRPF Completa x Simples" ===== */
  function irpfAnual(e) {
    var rend = num(e.rend), retido = num(e.retido);
    var educ = (e.educacao || []).slice(0, 6).map(num); // C8:C13 (seis pessoas)
    /* C21:C34 = C.irAnual — mesmas deduções, mesmo limite de educação e de PGBL, mesmo redutor e mesmo desempate (B30<C30) */
    var r = C.irAnual(rend, {
      inss: num(e.inss), dependentes: num(e.dependentes), educacao: educ,
      saude: num(e.saude), pgbl: num(e.pgbl), pensao: num(e.pensao), livroCaixa: num(e.livroCaixa),
    });
    return {
      educ: r.detalhe.educ,                              // C21
      pgbl: r.detalhe.pgbl,                              // C22
      deducoes: r.completa.deducao,                      // C23
      desconto: r.simplificada.deducao,                  // C24
      baseCompleta: r.completa.base,                     // B27
      baseSimplificada: r.simplificada.base,             // C27
      tabelaCompleta: r.completa.impostoTabela,          // B28
      tabelaSimplificada: r.simplificada.impostoTabela,  // C28
      redutorCompleta: r.completa.redutor,               // B29
      redutorSimplificada: r.simplificada.redutor,       // C29
      completa: r.completa.imposto,                      // B30
      simplificada: r.simplificada.imposto,              // C30
      saldoCompleta: r2(r.completa.imposto - retido),    // B31 = B30-$C$18
      saldoSimplificada: r2(r.simplificada.imposto - retido), // C31 = C30-$C$18
      melhor: r.melhor,                                  // C33
      planilha: r.melhor === 'completa' ? 'COMPLETA' : 'SIMPLIFICADA', // texto exato de C33
      diferenca: r.diferenca,                            // C34 = ABS(B30-C30)
      retido: retido,
    };
  }

  /* ===== Aba "2 IR do Mês" ===== */
  function irMes(e) {
    var rend = num(e.rend), dep = num(e.dependentes), pensao = num(e.pensao);
    var inss = sim(e.clt) ? C.inssEmpregado(rend) : num(e.contrib); // C13 = IF(C6="Sim", INSS progressivo, C7)
    var r = C.irMensal(rend, { inss: inss, dependentes: dep, pensao: pensao, simplificado: sim(e.simplificado) }); // C15:C19
    return {
      inss: inss,                                        // C13
      legais: r2(inss + dep * P.depMensal + pensao),     // C14 = C13+C8*DepMensal+C9
      deducao: r.deducao,                                // C15
      base: r.base,                                      // C16
      tabela: r.impostoTabela,                           // C17
      redutor: r.redutor,                                // C18
      imposto: r.imposto,                                // C19
      efetiva: rend > 0 ? r.imposto / rend : 0,          // C20 = IF(C5>0,C19/C5,0)
      usouSimplificado: sim(e.simplificado) && P.simplificadoMensal > inss + dep * P.depMensal + pensao,
      liquido: r2(rend - inss - r.imposto),
      rend: rend,
    };
  }

  /* ===== Aba "3 PGBL" ===== */
  function pgbl(e) {
    var rend = num(e.rend), ja = num(e.pgblJa);
    var fixas = num(e.inss) + num(e.dependentes) * P.depAnual + num(e.educ) + num(e.saude) + num(e.outras);
    var limite = P.pgblPct * rend;                       // C14 = PgblPct*C5
    /* B18:D21 — a planilha recebe a educação já limitada (C8), por isso usa tabela+redutor do motor
       diretamente em vez de C.irAnual (que limitaria a educação por pessoa outra vez) */
    var imposto = function (d) {
      var base = Math.max(0, rend - (fixas + d));        // linha 18
      var tab = C.tabela(P.irAnual, base);               // linha 19
      var red = C.redutor(P.redAnual, rend, tab);        // linha 20
      return r2(tab - red);                              // linha 21 = ROUND(19-20,2)
    };
    var sem = imposto(0), comJa = imposto(Math.min(ja, limite)), com12 = imposto(limite);
    var simplificada = C.irAnual(rend).simplificada.imposto; // C24
    var simplMelhor = com12 >= simplificada;             // C25 = IF(D21>=C24, ...)
    return {
      limite: limite,                                    // C14
      cabe: Math.max(0, limite - ja),                    // C15 = MAX(0,C14-C11)
      sem: sem, comJa: comJa, com12: com12,              // B21, C21, D21
      deixa: Math.max(0, Math.min(sem, simplificada) - com12), // C23 = MAX(0,MIN(B21,C24)-D21): ganho contra o MELHOR modelo sem PGBL
      simplificada: simplificada,                        // C24
      simplMelhor: simplMelhor,
      planilha: simplMelhor ? 'Mesmo com PGBL a simplificada tende a ser melhor: o PGBL não traz vantagem' : 'Com PGBL, a completa fica abaixo da simplificada', // C25
      resgate10: r2(limite * C.regressiva(11)),
      rend: rend, ja: ja,
    };
  }

  /* ===== Aba "4 Simples x Presumido" ===== */
  var ANEXOS = ['I', 'II', 'III', 'IV', 'V'];
  function simplesPresumido(e) {
    var rec = num(e.receita);                                       // C5
    var rbt12 = sim(e.rbtManual) ? num(e.rbt12) : rec * 12;         // C6 (padrão =C5*12)
    var anexoInformado = ANEXOS.indexOf(e.anexo) >= 0 ? e.anexo : 'V'; // C7
    var fatorRSim = sim(e.fatorR);                                  // C8
    var folha = num(e.folha12), pl = num(e.prolabore);              // C9, C10
    var iss = num(e.iss), presuncao = num(e.presuncao), salarios = num(e.salarios); // C11, C12, C13
    if (!sim(e.temFuncionarios)) { folha = 0; salarios = 0; }       // pergunta do simulador: sem funcionários, C9 e C13 ficam 0

    var fator = rbt12 > 0 ? (folha + pl * 12) / rbt12 : 0;          // C15 = IF(C6>0,(C9+C10*12)/C6,0)
    var anexo = fatorRSim ? (fator >= P.fatorR ? 'III' : 'V') : anexoInformado; // C16
    var efetiva = rbt12 > 0 ? C.simplesEfetiva(anexo, rbt12) : 0;   // C17 (a planilha dá 0 sem RBT12)
    var das = r2(rec * efetiva);                                    // C18 = ROUND(C5*C17,2)
    var plc = C.custoProLabore(pl);                                 // C19 e C21 (INSS 11% até o teto; IR com redutor)
    var patronalSimples = anexo === 'IV' ? r2(pl * P.cppPatronal) : 0; // C20
    var totalSimples = das + plc.inss + patronalSimples + plc.ir;   // C22 = C18+C19+C20+C21

    /* Lucro Presumido — C25:C31 (porte literal: a planilha deixa a presunção editável e arredonda
       cada tributo; C.presumidoServicosMes usa 32% fixo, dá o mesmo resultado com 32%) */
    var base = rec * presuncao;
    var irpj = r2(base * P.presumido.irpj + Math.max(0, base - P.presumido.adicionalMes) * P.presumido.adicional); // C25
    var csll = r2(base * P.presumido.csll);                         // C26
    var pisCofins = r2(rec * (P.presumido.pis + P.presumido.cofins)); // C27
    var issV = r2(rec * iss);                                       // C28
    var inssPres = plc.inss + r2(pl * P.cppPatronal) + r2(salarios * 0.28); // C29 (0,28 fixo na planilha)
    var totalPresumido = irpj + csll + pisCofins + issV + inssPres + plc.ir; // C31 = SUM(C25:C30)

    /* Alternativa Fator R — C34:C37 */
    var plNec = 0, dasIII = 0, custoPlNec = 0, totalFatorR = 0, plNecC = null;
    if (fatorRSim) {
      plNec = Math.max(pl, roundupExcel(Math.max(0, P.fatorR * rbt12 - folha) / 12 / 100) * 100); // C34
      dasIII = rbt12 > 0 ? C.dasMes('III', rbt12, rec) : 0;        // C35 = IF(AND(C8="Sim",C6>0),ROUND(C5*efetiva III,2),0)
      plNecC = C.custoProLabore(plNec);
      custoPlNec = plNecC.inss + plNecC.ir;                         // C36
      totalFatorR = dasIII + custoPlNec;                            // C37
    }
    var caminho = (fatorRSim && totalFatorR < totalSimples && totalFatorR < totalPresumido)
      ? 'fatorR' : (totalSimples <= totalPresumido ? 'simples' : 'presumido'); // C39
    var textoCaminho = { fatorR: 'Simples com Fator R (Anexo III)', simples: 'Simples Nacional', presumido: 'Lucro Presumido' }[caminho];

    return {
      receita: rec, rbt12: rbt12, fatorRSim: fatorRSim, fator: fator, anexo: anexo, efetiva: efetiva,
      das: das, inssSocio: plc.inss, patronalSimples: patronalSimples, irPl: plc.ir, totalSimples: totalSimples,
      irpj: irpj, csll: csll, pisCofins: pisCofins, iss: issV, inssPresumido: inssPres, totalPresumido: totalPresumido,
      plNec: plNec, dasIII: dasIII, custoPlNec: custoPlNec, totalFatorR: totalFatorR,
      inssPlNec: plNecC ? plNecC.inss : 0, irPlNec: plNecC ? plNecC.ir : 0,
      caminho: caminho, planilha: textoCaminho, prolabore: pl,
    };
  }

  /* ===== Aba "5 Pró-labore x Lucros" ===== */
  function proLabore(e) {
    var total = num(e.total), plB = num(e.prolaboreB), cpp = sim(e.patronal);
    var lado = function (pl, lucros) {
      var c = C.custoProLabore(pl, { cpp: cpp });         // linhas 12, 13, 14 (INSS 11%, patronal 20% se "Sim", IR com redutor)
      var ret = lucros > P.dividendos.limiteMes ? r2(lucros * P.dividendos.retencao) : 0; // linha 15
      return { prolabore: pl, lucros: lucros, inss: c.inss, patronal: c.patronal, ir: c.ir, retencao: ret,
        total: c.inss + c.patronal + c.ir + ret };        // linha 16 = SUM(12:15)
    };
    var A = lado(total, 0), B = lado(plB, total - plB);   // B10/B11 e C10/C11 = C5-C6
    var dif = A.total - B.total;                          // C18
    var atencao = B.lucros > P.dividendos.limiteMes ? 'dividendos'
      : (plB < P.inssEmpregado[0][0] ? 'minimo' : 'ok');  // C20 (InssT1 = salário mínimo)
    var textos = {
      dividendos: 'Lucros acima de R$ 50 mil no mês: retenção de 10% sobre o total (antecipação do IRPF mínimo)',
      minimo: 'Pró-labore abaixo do salário mínimo pode ser questionado', ok: 'OK',
    };
    return { A: A, B: B, difMes: dif, difAno: dif * 12, atencao: atencao, planilha: textos[atencao], total: total, cpp: cpp }; // C18, C19, C20
  }

  /* ===== Aba "6 MEI Limite" ===== */
  function mei(e) {
    var acum = num(e.acumulado), fechados = num(e.fechados), ativ = num(e.atividade);
    var limite = ativ < 12 ? P.mei.limiteMes * ativ : P.mei.limite;   // C10
    var tol = limite * (1 + P.mei.tolerancia);                        // C11
    var proj = fechados > 0 ? r2(acum / fechados * ativ) : 0;         // C12 = IF(C6>0,ROUND(C5/C6*C7,2),0): ritmo por mês de atividade × meses de atividade no ano
    var cabe = Math.max(0, limite - acum);                            // C13
    var status = proj <= limite ? 'dentro' : (proj <= tol ? 'ate20' : 'acima20'); // C14
    var textos = {
      dentro: 'Dentro do limite',
      ate20: 'Até 20% acima: desenquadra em janeiro, DAS complementar sobre o excesso',
      acima20: 'Acima de 20%: risco de desenquadramento RETROATIVO a janeiro',
    };
    return { limite: limite, tolerancia: tol, projecao: proj, cabe: cabe, status: status, planilha: textos[status],
      acumulado: acum, fechados: fechados, atividade: ativ, porMes: fechados > 0 ? acum / fechados : 0 };
  }

  var CALC = { irpfAnual: irpfAnual, irMes: irMes, pgbl: pgbl, simplesPresumido: simplesPresumido, proLabore: proLabore, mei: mei, roundupExcel: roundupExcel };
  g.CALC = CALC;
  if (typeof module !== 'undefined' && module.exports) module.exports = CALC;
})(typeof window !== 'undefined' ? window : globalThis);
