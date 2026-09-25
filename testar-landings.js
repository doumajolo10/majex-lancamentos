/* Testa as landings Excel, App, Conta e Leia como celular no navegador do TikTok (UA real)
   e como desktop 1440x900.
   Uso: node sites/serve.js  e  node leitura-kit/serve-v2.js  (em outros terminais), depois
        node sites/testar-landings.js            -> servidores locais
        node sites/testar-landings.js no-ar      -> sites publicados (pixels bloqueados para não sujar métricas)
   Confere: sem erro de JavaScript, sem rolagem horizontal, todas as imagens carregando
   (inclusive as da galeria que só carregam ao arrastar), imagens de conteúdo em WebP,
   botões indo ao checkout certo com utm/ttclid/gclid, clique abre o checkout na mesma aba,
   barra fixa do celular sem vão por onde o texto aparece. Prints em %TEMP%/landing-<site>-<disp>.png */
const path = require('path');
const os = require('os');
const puppeteer = require('puppeteer-core');

const NO_AR = process.argv[2] === 'no-ar';
const SITES = [
  { nome: 'excel', url: NO_AR ? 'https://excel-piloto-automatico.vercel.app/' : 'http://localhost:8770/excel/', checkouts: ['https://pay.cakto.com.br/32fovny'] },
  { nome: 'app', url: NO_AR ? 'https://zero-ao-app-com-ia.vercel.app/' : 'http://localhost:8770/app/', checkouts: ['https://pay.cakto.com.br/or8fdfq'] },
  { nome: 'conta', url: NO_AR ? 'https://conta-em-10-minutos.vercel.app/' : 'http://localhost:8770/conta/', checkouts: ['https://pay.cakto.com.br/xkn5p4v'] },
  /* Leia: kit e combo */
  { nome: 'leia', url: NO_AR ? 'https://leia-em-10-minutos.vercel.app/' : 'http://localhost:8766/', checkouts: ['https://pay.cakto.com.br/e2nadjy', 'https://pay.cakto.com.br/3cpf8ay'] },
];
const UA_TIKTOK = 'Mozilla/5.0 (Linux; Android 13; SM-A536B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.179 Mobile Safari/537.36 trill_340204 BytedanceWebview/d8a21c6';
const QS = '?utm_source=tiktok&utm_campaign=teste&ttclid=TT123&gclid=GC456';
const RASTREIO = /analytics\.tiktok\.com|googletagmanager|google-analytics|doubleclick|googleadservices|facebook\.net|facebook\.com\/tr/;
const DISPOSITIVOS = [
  ['celular-tiktok', { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, UA_TIKTOK],
  ['desktop', { width: 1440, height: 900 }, null],
];

(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  let falhas = 0;
  const ok = (cond, msg) => { console.log((cond ? 'OK    ' : 'FALHA ') + msg); if (!cond) falhas++; };
  for (const s of SITES) {
    for (const [disp, vp, ua] of DISPOSITIVOS) {
      console.log(`\n== ${s.nome} · ${disp}`);
      const ctx = await b.createBrowserContext();
      const p = await ctx.newPage();
      if (ua) await p.setUserAgent(ua);
      await p.setViewport(vp);
      const erros = [];
      p.on('pageerror', (e) => erros.push(e.message));
      p.on('response', (r) => { if (r.status() >= 400 && !/favicon\.ico$/.test(r.url())) erros.push(`HTTP ${r.status()} ${r.url()}`); });
      let foi = null;
      await p.setRequestInterception(true);
      p.on('request', (r) => {
        const u = r.url();
        if (s.checkouts.some((c) => u.startsWith(c))) { foi = foi || u; return r.abort(); }  // não abre o checkout de verdade
        if (NO_AR && RASTREIO.test(u)) return r.abort();
        r.continue();
      });
      await p.goto(s.url + QS, { waitUntil: 'networkidle2', timeout: 90000 });
      /* rola a página e arrasta a galeria para carregar tudo que é lazy */
      await p.evaluate(async () => {
        const dorme = (ms) => new Promise((r) => setTimeout(r, ms));
        for (let y = 0; y < document.body.scrollHeight; y += 450) { scrollTo(0, y); await dorme(110); }
        const g = document.getElementById('gal');
        if (g) { g.scrollIntoView(); for (let x = 0; x <= g.scrollWidth; x += 200) { g.scrollLeft = x; await dorme(120); } g.scrollLeft = 0; }
        scrollTo(0, 0);
      });
      await new Promise((r) => setTimeout(r, 1500));
      const info = await p.evaluate(() => {
        const top = document.querySelector('.top'), nav = document.querySelector('.nav');
        const vao = top && nav && getComputedStyle(nav).position === 'fixed' ? Math.round(nav.getBoundingClientRect().top - top.getBoundingClientRect().bottom) : 0;
        return {
          largura: document.documentElement.scrollWidth, janela: innerWidth, vao,
          imgs: [...document.images].map((i) => ({ src: i.currentSrc || i.src, ok: i.complete && i.naturalWidth > 0 })),
          botoes: [...document.querySelectorAll('[data-checkout]')].map((a) => a.href),
          og: (document.querySelector('meta[property="og:image"]') || {}).content || '',
        };
      });
      await p.screenshot({ path: path.join(os.tmpdir(), `landing-${s.nome}-${disp}.png`) });
      ok(erros.length === 0, `sem erro de JavaScript/HTTP ${erros.join(' | ')}`);
      ok(info.largura <= info.janela, `sem rolagem horizontal (${info.largura} <= ${info.janela})`);
      const quebradas = info.imgs.filter((i) => !i.ok);
      ok(quebradas.length === 0, `${info.imgs.length} imagens carregadas ${quebradas.map((i) => i.src).join(', ')}`);
      const pngs = info.imgs.filter((i) => /\/img\/[^/]+\.png/.test(i.src));
      ok(pngs.length === 0, `imagens de conteúdo em WebP ${pngs.map((i) => i.src).join(', ')}`);
      ok(/\.png$/.test(info.og), `og:image continua PNG (${info.og.split('/').pop()})`);
      ok(info.vao <= 0, `menu colado na faixa de preço (vão ${info.vao}px)`);
      ok(info.botoes.length >= 3, `${info.botoes.length} botões de compra`);
      const destinos = [...new Set(info.botoes.map((h) => h.split('?')[0]))];
      ok(destinos.every((d) => s.checkouts.includes(d)), 'destinos: ' + destinos.join(' | '));
      ok(info.botoes.every((h) => /utm_source=tiktok/.test(h) && /ttclid=TT123/.test(h) && /gclid=GC456/.test(h)), 'todos os botões levam utm, ttclid e gclid');
      const abas = (await b.pages()).length;
      await p.evaluate(() => document.querySelector('[data-checkout]').click());
      await new Promise((r) => setTimeout(r, 1500));
      ok(foi && /ttclid=TT123/.test(foi) && /gclid=GC456/.test(foi), 'clique vai ao checkout com ttclid e gclid: ' + foi);
      ok((await b.pages()).length === abas, 'checkout abre na mesma aba');
      await ctx.close();
    }
  }
  await b.close();
  console.log(falhas ? `\n${falhas} FALHA(S)` : '\nLANDINGS OK');
  process.exitCode = falhas ? 1 : 0;
})();
