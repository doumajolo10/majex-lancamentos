/* Monta as imagens das três landings a partir das páginas reais dos PDFs.
   Uso: node sites/gerar-imagens.js   (roda o pdf-paginas.js antes, sozinho)
   Saída: sites/<produto>/img/hero.png, og.png e as prévias

   Toda imagem de produto vem do PDF final. Cartão bonito que não é o produto
   levanta a dúvida "o material é isso mesmo?" na hora de pagar. */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const puppeteer = require('puppeteer-core');

const RAIZ = path.join(__dirname, '..');
const TMP = os.tmpdir();
const url = (f) => 'file:///' + f.replace(/\\/g, '/');
const png = (nome) => url(path.join(TMP, `${nome}.png`));

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

async function compor(b, arquivo, largura, altura, corpo, fundo = 'transparent') {
  const p = await b.newPage();
  await p.setViewport({ width: largura, height: altura });
  // arquivo local, não setContent: de about:blank o Chrome bloqueia as imagens file://
  const temp = path.join(TMP, `_comp-${path.basename(path.dirname(path.dirname(arquivo)))}-${path.basename(arquivo)}.html`);
  fs.writeFileSync(temp, `<html><body style="margin:0;width:${largura}px;height:${altura}px;position:relative;overflow:hidden;background:${fundo}">${corpo}</body></html>`, 'utf8');
  await p.goto(url(temp), { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 300));
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  await p.screenshot({ path: arquivo, omitBackground: fundo === 'transparent' });
  await p.close();
  console.log('  ', path.relative(RAIZ, arquivo));
}

(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const S = (p, ...r) => path.join(__dirname, p, 'img', ...r);
  const printsExcel = (n) => url(S('excel', `print-${n}.png`));

  /* EXCEL: capa do guia + duas planilhas reais por cima */
  await compor(b, S('excel', 'hero.png'), 1300, 760, [
    folha(png('excel-2'), { x: 70, y: 110, w: 380, giro: -6 }),
    folha(png('excel-1'), { x: 300, y: 40, w: 420, giro: 0 }),
    folha(printsExcel('vendas'), { x: 690, y: 90, w: 560, giro: 2, raio: 8 }),
    folha(printsExcel('gantt'), { x: 560, y: 430, w: 700, giro: -1.5, raio: 8 }),
  ].join(''));
  /* APP: capa no meio, método e projeto em leque */
  await compor(b, S('app', 'hero.png'), 1300, 760, [
    folha(png('app-5'), { x: 110, y: 100, w: 400, giro: -9 }),
    folha(png('app-11'), { x: 790, y: 100, w: 400, giro: 9 }),
    folha(png('app-1'), { x: 435, y: 30, w: 430, giro: 0 }),
  ].join(''));
  /* CONTA: leque de 5 páginas */
  await compor(b, S('conta', 'hero.png'), 1300, 720, [
    folha(png('conta-35'), { x: 80, y: 120, w: 340, giro: -13 }),
    folha(png('conta-24'), { x: 280, y: 90, w: 360, giro: -6.5 }),
    folha(png('conta-41'), { x: 660, y: 90, w: 360, giro: 6.5 }),
    folha(png('conta-44'), { x: 880, y: 120, w: 340, giro: 13 }),
    folha(png('conta-1'), { x: 460, y: 50, w: 380, giro: 0 }),
  ].join(''));

  /* imagens de compartilhamento 1200x630 com fundo */
  const og = { excel: ['#0F2A1E', 'excel-1', 'hero.png'], app: ['#120B2E', 'app-1', 'hero.png'], conta: ['#FFF7E8', 'conta-1', 'hero.png'] };
  for (const [k, [fundo]] of Object.entries(og)) {
    await compor(b, S(k, 'og.png'), 1200, 630, `<img src="${url(S(k, 'hero.png'))}" style="position:absolute;left:0;top:10px;width:1200px">`, fundo);
  }

  /* prévias soltas para a galeria de cada landing */
  const copia = (de, para) => fs.copyFileSync(path.join(TMP, `${de}.png`), para);
  [['excel-5', 'previa-1'], ['excel-6', 'previa-2'], ['excel-46', 'previa-3'], ['excel-41', 'previa-bonus-1'], ['excel-42', 'previa-bonus-2']].forEach(([a, c]) => copia(a, S('excel', `${c}.png`)));
  [['app-5', 'previa-1'], ['app-6', 'previa-2'], ['app-11', 'previa-3'], ['app-14', 'previa-4'], ['app-13', 'previa-5'], ['app-22', 'previa-6'], ['app-29', 'previa-7']].forEach(([a, c]) => copia(a, S('app', `${c}.png`)));
  ['conta-5', 'conta-7', 'conta-16', 'conta-24', 'conta-29', 'conta-35', 'conta-37', 'conta-41', 'conta-44', 'conta-45', 'conta-49']
    .forEach((a, i) => copia(a, S('conta', `previa-${i + 1}.png`)));
  copia('conta-3', S('conta', 'previa-plano.png')); copia('conta-50', S('conta', 'previa-certificado.png'));
  await b.close();
  console.log('pronto');
})();
