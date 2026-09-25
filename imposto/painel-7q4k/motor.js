/* GERADO por imposto-legal/montar-painel.js em 2026-09-25T19:46:26.771Z — não edite à mão.
   Motor de cálculo do guia "Imposto Menor, Dentro da Lei" (params.js + calculos.js), sem alterações.
   Expõe window.IM = { P, FONTES, C }. */
(function (global) {
  'use strict';
  var registro = {}, cache = {};
  function definir(nome, fn) { registro[nome] = fn; }
  function exigir(nome) {
    if (cache[nome]) return cache[nome].exports;
    if (!registro[nome]) throw new Error('módulo ausente no motor: ' + nome);
    var module = { exports: {} };
    cache[nome] = module;
    registro[nome].call(module.exports, module, module.exports, exigir);
    return module.exports;
  }
  exigir.main = null; /* desliga o autoteste "if (require.main === module)" de calculos.js */

/* ===== params.js (sha256 ac2972d69769) — cópia literal ===== */
definir('./params.js', function (module, exports, require) {
/* Todos os números do produto em um lugar só, cada um com a fonte oficial.
   Guia (conteudo.js), casos (calculos.js) e planilha (gerar-planilha.js) leem daqui.
   Fonte: pesquisa/dossie-2026.md. Regra: nada entra aqui sem fonte. */

const P = {
  referencia: 'setembro de 2026',

  /* IRPF mensal 2026 (retenção na fonte / carnê-leão) — Receita, Tributação de 2026 */
  irMensal: [
    [2428.80, 0, 0],
    [2826.65, 0.075, 182.16],
    [3751.05, 0.15, 394.16],
    [4664.68, 0.225, 675.49],
    [Infinity, 0.275, 908.73],
  ],
  depMensal: 189.59,
  simplificadoMensal: 607.20,
  /* redutor mensal (Lei 9.250, art. 3º-A, Lei 15.270/2025) */
  redMensal: { ate: 5000, maxZera: 312.89, teto: 7350, a: 978.62, b: 0.133145 },

  /* IRPF anual — ano-calendário 2026, declaração de 2027 */
  irAnual: [
    [29145.60, 0, 0],
    [33919.80, 0.075, 2185.92],
    [45012.60, 0.15, 4729.91],
    [55976.16, 0.225, 8105.85],
    [Infinity, 0.275, 10904.66],
  ],
  redAnual: { ate: 60000, maxZera: 2694.15, teto: 88200, a: 8429.73, b: 0.095575 },
  depAnual: 2275.08,
  educacaoAnual: 3561.50,
  simplificadoPct: 0.20,
  simplificadoTeto: 17640.00, // declaração 2027 (Lei 9.250, art. 10, X)
  simplificadoTeto2026: 16754.34, // declaração entregue em 2026 (ano 2025)
  pgblPct: 0.12,

  /* IRPF mínimo alta renda (Lei 9.250, art. 16-A) — a partir da declaração de 2027 */
  irpfm: { inicio: 600000, cheio: 1200000, aliqMax: 0.10 },
  dividendos: { limiteMes: 50000, retencao: 0.10 },

  /* isenções */
  acoesVendasMes: 20000,
  pequenoValorMes: 35000,
  unicoImovel: 440000,

  /* INSS 2026 (Portaria Interministerial MPS/MF 13/2026) */
  salarioMinimo: 1621.00,
  tetoINSS: 8475.55,
  inssEmpregado: [[1621.00, 0.075], [2902.84, 0.09], [4354.27, 0.12], [8475.55, 0.14]],
  inssSocio: 0.11,
  cppPatronal: 0.20,

  /* MEI (LC 123, art. 18-A; Portal do Simples) */
  mei: { limite: 81000, limiteMes: 6750, tolerancia: 0.20, dasComercio: 82.05, dasServicos: 86.05, dasMisto: 87.05 },

  /* Simples Nacional — LC 123, Anexos I a V: [teto RBT12, alíquota nominal, parcela a deduzir] */
  simples: {
    I: [[180000, 0.04, 0], [360000, 0.073, 5940], [720000, 0.095, 13860], [1800000, 0.107, 22500], [3600000, 0.143, 87300], [4800000, 0.19, 378000]],
    II: [[180000, 0.045, 0], [360000, 0.078, 5940], [720000, 0.10, 13860], [1800000, 0.112, 22500], [3600000, 0.147, 85500], [4800000, 0.30, 720000]],
    III: [[180000, 0.06, 0], [360000, 0.112, 9360], [720000, 0.135, 17640], [1800000, 0.16, 35640], [3600000, 0.21, 125640], [4800000, 0.33, 648000]],
    IV: [[180000, 0.045, 0], [360000, 0.09, 8100], [720000, 0.102, 12420], [1800000, 0.14, 39780], [3600000, 0.22, 183780], [4800000, 0.33, 828000]],
    V: [[180000, 0.155, 0], [360000, 0.18, 4500], [720000, 0.195, 9900], [1800000, 0.205, 17100], [3600000, 0.23, 62100], [4800000, 0.305, 540000]],
  },
  fatorR: 0.28,
  limiteME: 360000, limiteEPP: 4800000, sublimite: 3600000,

  /* Lucro Presumido (Lei 9.249, arts. 3º, 15 e 20; Lei 9.718) */
  presumido: {
    limite: 78000000,
    presServicos: 0.32, presComercio: 0.08, presCsllComercio: 0.12,
    irpj: 0.15, adicional: 0.10, adicionalMes: 20000,
    csll: 0.09, pis: 0.0065, cofins: 0.03,
    acrescimoLC224: 1.10, acrescimoAcimaDe: 5000000,
  },
};

const FONTES = [
  ['Receita Federal — Tributação de 2026 (tabelas mensal e anual, redutor)', 'gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026'],
  ['Receita Federal — Tributação de 2025 (declaração entregue em 2026)', 'gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2025'],
  ['Lei 15.270/2025 — isenção até R$ 5 mil, IRPF mínimo, dividendos', 'planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15270.htm'],
  ['Lei 9.250/1995 — IRPF (deduções, simplificado, arts. 3º-A, 6º-A, 11-A, 16-A, 16-B)', 'planalto.gov.br/ccivil_03/leis/l9250.htm'],
  ['Perguntas e Respostas IRPF 2026 (Receita Federal)', 'gov.br/receitafederal — p-r-irpf-2026-v1-00-2026-04-23.pdf'],
  ['Lei 9.532/1997, art. 11 — PGBL até 12%', 'planalto.gov.br/ccivil_03/leis/l9532.htm'],
  ['Lei 11.053/2004 — tabela regressiva da previdência privada', 'planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11053.htm'],
  ['Lei 11.033/2004 — isenções (ações até R$ 20 mil, LCI/LCA, FII)', 'planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11033.htm'],
  ['Lei 11.196/2005, art. 39 — venda e compra de imóvel residencial em 180 dias', 'planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11196.htm'],
  ['Lei Complementar 123/2006 — Simples Nacional e MEI', 'planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm'],
  ['Portal do Simples Nacional — valores do DAS MEI 2026', 'www8.receita.fazenda.gov.br/simplesnacional'],
  ['Lei 9.249/1995 — IRPJ/CSLL e presunção do Lucro Presumido', 'planalto.gov.br/ccivil_03/leis/l9249.htm'],
  ['Lei 9.718/1998 — limite do Lucro Presumido, PIS/Cofins cumulativos', 'planalto.gov.br/ccivil_03/leis/l9718compilada.htm'],
  ['Lei Complementar 224/2025 — acréscimo de 10% na presunção acima de R$ 5 mi', 'planalto.gov.br/ccivil_03/leis/lcp/lcp224.htm'],
  ['Portaria Interministerial MPS/MF 13/2026 — salário mínimo e teto do INSS', 'gov.br/previdencia'],
  ['Lei 8.212/1991 — contribuições ao INSS (sócio 11%, patronal 20%)', 'planalto.gov.br/ccivil_03/leis/l8212cons.htm'],
  ['Lei Complementar 214/2025 — IBS e CBS (reforma tributária)', 'planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm'],
  ['Lei Complementar 227/2026 — normas gerais de ITCMD e ITBI', 'planalto.gov.br/ccivil_03/leis/lcp/lcp227.htm'],
  ['Código Tributário Nacional — Lei 5.172/1966, art. 116', 'planalto.gov.br/ccivil_03/leis/l5172compilado.htm'],
  ['Lei 8.137/1990 — crimes contra a ordem tributária', 'planalto.gov.br/ccivil_03/leis/l8137.htm'],
  ['Lei 9.430/1996, art. 44 (redação da Lei 14.689/2023) — multas', 'planalto.gov.br/ccivil_03/leis/l9430.htm'],
  ['Lei 9.250/1995, art. 4º, § 2º (Lei 14.663/2023) — desconto simplificado mensal, inclusive no carnê-leão', 'planalto.gov.br/ccivil_03/leis/l9250.htm'],
  ['Lei 14.803/2024 — escolha da tabela da previdência até o primeiro resgate', 'planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14803.htm'],
  ['LC 214/2025, art. 517 — nova redação da LC 123 (opção pelo Simples em setembro; IBS/CBS fora do DAS)', 'planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm'],
  ['Resolução CGSN 186/2026 — prazos de opção para 2027 (Portal do Simples)', 'www8.receita.fazenda.gov.br/simplesnacional'],
  ['Código Penal, art. 168-A — apropriação indébita previdenciária', 'planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm'],
  ['IN RFB 1.700/2017, art. 238 — distribuição de lucros sem escrituração completa', 'normas.receita.fazenda.gov.br'],
  ['IN RFB 2.299/2025 — tributação de lucros e dividendos', 'normas.receita.fazenda.gov.br'],
  ['Lei 8.245/1991, arts. 22 e 23 — obrigações de locador e inquilino', 'planalto.gov.br/ccivil_03/leis/l8245.htm'],
  ['Receita Federal — lotes de restituição 2026', 'gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/restituicao/lotes/2026'],
];

module.exports = { P, FONTES };

});

/* ===== calculos.js (sha256 698bc7f514a5) — cópia literal ===== */
definir('./calculos.js', function (module, exports, require) {
/* Motor de cálculo do produto. Os casos do guia e o teste da planilha usam estas funções,
   então guia e calculadora nunca discordam. Valores em reais, arredondados a centavos no fim. */

const { P } = require('./params.js');

const r2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;
const faixa = (tab, base) => tab.find(([teto]) => base <= teto);

/** IR pela tabela progressiva (mensal ou anual), sem redutor. */
function tabela(tab, base) {
  if (base <= 0) return 0;
  const [, aliq, ded] = faixa(tab, base);
  return Math.max(0, base * aliq - ded);
}

/** Redutor da Lei 15.270 (mensal ou anual). Critério: rendimento tributável BRUTO. */
function redutor(red, rendBruto, impostoTabela) {
  let r = 0;
  if (rendBruto <= red.ate) r = red.maxZera;
  else if (rendBruto <= red.teto) r = red.a - red.b * rendBruto;
  return Math.min(Math.max(0, r), impostoTabela);
}

/** INSS do empregado (progressivo por faixas, limitado ao teto). */
function inssEmpregado(salario) {
  let ant = 0, total = 0;
  for (const [teto, aliq] of P.inssEmpregado) {
    if (salario > ant) total += (Math.min(salario, teto) - ant) * aliq;
    ant = teto;
  }
  return r2(total);
}

/** IR mensal na fonte (2026): usa o que for melhor entre deduções legais e desconto simplificado mensal. */
function irMensal(rendBruto, { inss = 0, dependentes = 0, pensao = 0, livroCaixa = 0, simplificado = true } = {}) {
  const legal = inss + dependentes * P.depMensal + pensao + livroCaixa;
  const deducao = simplificado ? Math.max(legal, P.simplificadoMensal) : legal;
  const base = Math.max(0, rendBruto - deducao);
  const imp = tabela(P.irMensal, base);
  const red = redutor(P.redMensal, rendBruto, imp);
  return { deducao: r2(deducao), base: r2(base), impostoTabela: r2(imp), redutor: r2(red), imposto: r2(imp - red) };
}

/** Declaração anual (ano-calendário 2026, entregue em 2027): completa x simplificada. */
function irAnual(rendTrib, d = {}) {
  const { inss = 0, dependentes = 0, educacao = [], saude = 0, pgbl = 0, pensao = 0, livroCaixa = 0 } = d;
  const educ = educacao.reduce((s, v) => s + Math.min(v, P.educacaoAnual), 0);
  const pgblOk = Math.min(pgbl, P.pgblPct * rendTrib);
  const deducoes = inss + dependentes * P.depAnual + educ + saude + pgblOk + pensao + livroCaixa;
  const calc = (ded) => {
    const base = Math.max(0, rendTrib - ded);
    const imp = tabela(P.irAnual, base);
    const red = redutor(P.redAnual, rendTrib, imp);
    return { deducao: r2(ded), base: r2(base), impostoTabela: r2(imp), redutor: r2(red), imposto: r2(imp - red) };
  };
  const completa = calc(deducoes);
  const simplificada = calc(Math.min(P.simplificadoPct * rendTrib, P.simplificadoTeto));
  const melhor = completa.imposto < simplificada.imposto ? 'completa' : 'simplificada';
  return { completa, simplificada, melhor, diferenca: r2(Math.abs(completa.imposto - simplificada.imposto)), detalhe: { educ: r2(educ), pgbl: r2(pgblOk) } };
}

/** Alíquota do IRPF mínimo (art. 16-A) para uma renda total anual. */
function aliquotaIrpfm(rendaTotal) {
  if (rendaTotal <= P.irpfm.inicio) return 0;
  if (rendaTotal >= P.irpfm.cheio) return P.irpfm.aliqMax;
  return (rendaTotal / 60000 - 10) / 100;
}

/** Simples Nacional: alíquota efetiva e DAS do mês. */
function simplesEfetiva(anexo, rbt12) {
  const [, aliq, ded] = faixa(P.simples[anexo], rbt12) || P.simples[anexo][5];
  return rbt12 <= 0 ? P.simples[anexo][0][1] : (rbt12 * aliq - ded) / rbt12;
}
const dasMes = (anexo, rbt12, receitaMes) => r2(receitaMes * simplesEfetiva(anexo, rbt12));

/** Custo mensal do pró-labore para a empresa + sócio (INSS 11% até o teto, CPP 20% se couber, IRRF com redutor). */
function custoProLabore(valor, { cpp = false, dependentes = 0 } = {}) {
  const inss = r2(Math.min(valor, P.tetoINSS) * P.inssSocio);
  const patronal = cpp ? r2(valor * P.cppPatronal) : 0;
  const ir = irMensal(valor, { inss, dependentes }).imposto;
  return { inss, patronal, ir, liquido: r2(valor - inss - ir), custoTributos: r2(inss + patronal + ir) };
}

/** Lucro Presumido de serviços (presunção de 32%), valores mensais aproximados (adicional pela base mensal). */
function presumidoServicosMes(receitaMes, iss = 0.05) {
  const base = receitaMes * P.presumido.presServicos;
  const irpj = base * P.presumido.irpj + Math.max(0, base - P.presumido.adicionalMes) * P.presumido.adicional;
  const csll = base * P.presumido.csll;
  const pis = receitaMes * P.presumido.pis;
  const cofins = receitaMes * P.presumido.cofins;
  const issV = receitaMes * iss;
  const total = irpj + csll + pis + cofins + issV;
  return { irpj: r2(irpj), csll: r2(csll), pis: r2(pis), cofins: r2(cofins), iss: r2(issV), total: r2(total), carga: total / receitaMes };
}

/** MEI: situação de acordo com a receita do ano (ano completo). */
function situacaoMei(receitaAno) {
  const lim = P.mei.limite, tol = lim * (1 + P.mei.tolerancia);
  if (receitaAno <= lim) return { status: 'dentro', excesso: 0 };
  if (receitaAno <= tol) return { status: 'ate20', excesso: r2(receitaAno - lim) };
  return { status: 'acima20', excesso: r2(receitaAno - lim) };
}

/** Tabela regressiva da previdência privada (Lei 11.053/2004): alíquota pelo prazo de acumulação. */
function regressiva(anos) {
  if (anos <= 2) return 0.35; if (anos <= 4) return 0.30; if (anos <= 6) return 0.25;
  if (anos <= 8) return 0.20; if (anos <= 10) return 0.15; return 0.10;
}

module.exports = { r2, tabela, redutor, inssEmpregado, irMensal, irAnual, aliquotaIrpfm, simplesEfetiva, dasMes, custoProLabore, presumidoServicosMes, situacaoMei, regressiva };

/* Autoteste com os exemplos oficiais do dossiê */
if (require.main === module) {
  const ok = (nome, a, b) => console.log((Math.abs(a - b) < 0.011 ? 'OK   ' : 'FALHA') + ` ${nome}: ${a} (esperado ${b})`);
  ok('IR mensal R$ 5.000 simplificado', irMensal(5000).imposto, 0);
  ok('IR mensal R$ 6.000 simplificado', irMensal(6000).imposto, 394.54);
  ok('Redutor mensal R$ 7.350', redutor(P.redMensal, 7350, 1000), 0);
  ok('Simples III RBT12 500 mil', r2(simplesEfetiva('III', 500000) * 100), 9.97);
  ok('IRPFM R$ 900 mil', aliquotaIrpfm(900000) * 100, 5);
  ok('INSS no teto', inssEmpregado(10000), 988.09);
  ok('INSS sócio no teto', custoProLabore(10000).inss, 932.31);
}

});

  var params = exigir('./params.js');
  var calculos = exigir('./calculos.js');
  global.IM = { P: params.P, FONTES: params.FONTES, C: calculos, versao: 'd37a2aec3122' };
})(typeof window !== 'undefined' ? window : globalThis);
