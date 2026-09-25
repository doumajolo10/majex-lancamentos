/* Monta as imagens das três landings a partir das páginas reais dos PDFs.
   Uso: node sites/gerar-imagens.js   (roda o pdf-paginas.js antes, sozinho)
   Saída: sites/<produto>/img/hero.webp + hero-2x.webp, og.png (compartilhamento)
          e previa-*.webp; no Excel também print-*.webp (a partir dos print-*.png
          que o excel-ia/exportar-prints.ps1 exporta)

   Toda imagem de produto vem do PDF final. Cartão bonito que não é o produto
   levanta a dúvida "o material é isso mesmo?" na hora de pagar.

   Páginas: renderizadas a 2200 px (pdf-paginas.js, com cMap e fontes padrão) e
   reduzidas para 1100 px na hora de virar WebP: a galeria mostra cada página com no
   máximo 360 px de largura, e 1100 px cobre até tela 3x. Mais que isso só pesa.
   og.png continua PNG (WhatsApp/Facebook não aceitam WebP em todo lugar). */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const puppeteer = require('puppeteer-core');

const RAIZ = path.join(__dirname, '..');
const TMP = os.tmpdir();
const url = (f) => 'file:///' + f.replace(/\\/g, '/');
const png = (nome) => url(path.join(TMP, `${nome}.png`));

/* PNG -> WebP (ffmpeg libwebp, qualidade 84). largura opcional reduz com lanczos. */
function webp(de, para, largura) {
  const args = ['-v', 'error', '-y', '-i', de];
  if (largura) args.push('-vf', `scale=${largura}:-1:flags=lanczos`);
  args.push('-c:v', 'libwebp', '-quality', '84', '-pix_fmt', 'yuva420p', para);
  execFileSync('ffmpeg', args, { stdio: 'pipe' });
  console.log('  ', path.relative(RAIZ, para), Math.round(fs.statSync(para).size / 1024) + 'KB');
}

/* páginas de cada PDF que viram imagem */
const PAGINAS = {
  excel: ['excel-ia/entrega/Excel-no-Piloto-Automatico.pdf', [1, 2, 5, 6, 41, 42, 46]],
  app: ['app-com-ia/entrega/Do-Zero-ao-App-com-IA.pdf', [1, 5, 6, 11, 13, 14, 22, 29]],
  conta: ['conta-10-minutos/entrega/Conta-em-10-Minutos.pdf', [1, 3, 5, 7, 16, 24, 29, 35, 37, 41, 44, 45, 49, 50]],
};
for (const [prefixo, [pdf, pags]] of Object.entries(PAGINAS)) {
  execFileSync(process.execPath, [path.join(RAIZ, 'pdf-paginas.js'), path.join(RAIZ, pdf), prefixo, ...pags.map(String)], { stdio: 'pipe' });
  console.log(`  páginas de ${prefixo} renderizadas`);
}

const folha = (src, { x, y, w, giro = 0, sombra = true, raio = 10 }) =>
  `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;transform:rotate(${giro}deg);border-radius:${raio}px;overflow:hidden;
    ${sombra ? 'box-shadow:0 22px 50px rgba(20,24,40,.28),0 4px 12px rgba(20,24,40,.14);' : ''}background:#fff">
    <img src="${src}" style="display:block;width:100%"></div>`;

/* escala 2 = o dobro de pixels (hero-2x para tela retina) */
async function compor(b, arquivo, largura, altura, corpo, fundo = 'transparent', escala = 1) {
  const p = await b.newPage();
  await p.setViewport({ width: largura, height: altura, deviceScaleFactor: escala });
  // arquivo local, não setContent: de about:blank o Chrome bloqueia as imagens file://
  const temp = path.join(TMP, `_comp-${path.basename(path.dirname(path.dirname(arquivo)))}-${path.basename(arquivo)}.html`);
  fs.writeFileSync(temp, `<html><body style="margin:0;width:${largura}px;height:${altura}px;position:relative;overflow:hidden;background:${fundo}">${corpo}</body></html>`, 'utf8');
  await p.goto(url(temp), { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 300));
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  await p.screenshot({ path: arquivo, omitBackground: fundo === 'transparent' });
  await p.close();
  console.log('  ', arquivo.startsWith(RAIZ) ? path.relative(RAIZ, arquivo) : arquivo);
}

(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const S = (p, ...r) => path.join(__dirname, p, 'img', ...r);
  const printsExcel = (n) => url(S('excel', `print-${n}.png`));
  /* hero composto em 2x (2600 px) numa pasta temporária; vira hero-2x.webp e hero.webp (1300) */
  const H = (k) => path.join(TMP, `hero-${k}-2x.png`);

  /* EXCEL: capa do guia + duas planilhas reais por cima */
  await compor(b, H('excel'), 1300, 760, [
    folha(png('excel-2'), { x: 70, y: 110, w: 380, giro: -6 }),
    folha(png('excel-1'), { x: 300, y: 40, w: 420, giro: 0 }),
    folha(printsExcel('vendas'), { x: 690, y: 90, w: 560, giro: 2, raio: 8 }),
    folha(printsExcel('gantt'), { x: 560, y: 430, w: 700, giro: -1.5, raio: 8 }),
  ].join(''), 'transparent', 2);
  /* APP: capa no meio, método e projeto em leque */
  await compor(b, H('app'), 1300, 760, [
    folha(png('app-5'), { x: 110, y: 100, w: 400, giro: -9 }),
    folha(png('app-11'), { x: 790, y: 100, w: 400, giro: 9 }),
    folha(png('app-1'), { x: 435, y: 30, w: 430, giro: 0 }),
  ].join(''), 'transparent', 2);
  /* CONTA: leque de 5 páginas */
  await compor(b, H('conta'), 1300, 720, [
    folha(png('conta-35'), { x: 80, y: 120, w: 340, giro: -13 }),
    folha(png('conta-24'), { x: 280, y: 90, w: 360, giro: -6.5 }),
    folha(png('conta-41'), { x: 660, y: 90, w: 360, giro: 6.5 }),
    folha(png('conta-44'), { x: 880, y: 120, w: 340, giro: 13 }),
    folha(png('conta-1'), { x: 460, y: 50, w: 380, giro: 0 }),
  ].join(''), 'transparent', 2);

  /* imagens de compartilhamento 1200x630 com fundo (continuam PNG) */
  const og = { excel: '#0F2A1E', app: '#120B2E', conta: '#FFF7E8' };
  for (const [k, fundo] of Object.entries(og)) {
    await compor(b, S(k, 'og.png'), 1200, 630, `<img src="${url(H(k))}" style="position:absolute;left:0;top:10px;width:1200px">`, fundo);
  }
  await b.close();

  for (const k of Object.keys(og)) {
    webp(H(k), S(k, 'hero-2x.webp'));
    webp(H(k), S(k, 'hero.webp'), 1300);
  }

  /* prévias soltas para a galeria de cada landing (2200 px -> 1100 px WebP) */
  const previa = (de, site, nome) => webp(path.join(TMP, `${de}.png`), S(site, `${nome}.webp`), 1100);
  [['excel-5', 'previa-1'], ['excel-6', 'previa-2'], ['excel-46', 'previa-3'], ['excel-41', 'previa-bonus-1'], ['excel-42', 'previa-bonus-2']].forEach(([a, c]) => previa(a, 'excel', c));
  [['app-5', 'previa-1'], ['app-6', 'previa-2'], ['app-11', 'previa-3'], ['app-14', 'previa-4'], ['app-13', 'previa-5'], ['app-22', 'previa-6'], ['app-29', 'previa-7']].forEach(([a, c]) => previa(a, 'app', c));
  ['conta-5', 'conta-7', 'conta-16', 'conta-24', 'conta-29', 'conta-35', 'conta-37', 'conta-41', 'conta-44', 'conta-45', 'conta-49']
    .forEach((a, i) => previa(a, 'conta', `previa-${i + 1}`));
  previa('conta-3', 'conta', 'previa-plano'); previa('conta-50', 'conta', 'previa-certificado');

  /* prints das planilhas do Excel (o PNG exportado pelo Excel fica como fonte do hero) */
  for (const n of ['vendas', 'gantt', 'financeiro', 'estoque', 'crm', 'financiamento']) webp(S('excel', `print-${n}.png`), S('excel', `print-${n}.webp`));
  console.log('pronto');
})();
