/* Folha de contato das prévias de um site: node sites/_folha.js conta 11 */
const puppeteer = require('puppeteer-core'), path = require('path'), fs = require('fs'), os = require('os');
const [site, n] = [process.argv[2], Number(process.argv[3])];
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const p = await b.newPage();
  await p.setViewport({ width: 1400, height: 520 });
  const dir = path.join(__dirname, site, 'img').split(path.sep).join('/');
  const html = '<body style="margin:0;display:flex;gap:6px;flex-wrap:wrap;background:#ccc">' +
    Array.from({ length: n }, (_, i) => `<div style="text-align:center;font:bold 14px Arial"><img src="file:///${dir}/previa-${i + 1}.png" style="height:230px;display:block">${i + 1}</div>`).join('') + '</body>';
  const t = path.join(os.tmpdir(), '_folha.html');
  fs.writeFileSync(t, html);
  await p.goto('file:///' + t.split(path.sep).join('/'));
  await new Promise((r) => setTimeout(r, 500));
  await p.screenshot({ path: path.join(os.tmpdir(), '_folha.png') });
  await b.close();
})();
