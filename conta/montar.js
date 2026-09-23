/* Monta sites/conta/index.html usando o CSS da landing do Leia (mesma família
   visual, já testada no ar) + o corpo próprio do Conta.
   Uso: node sites/conta/montar.js <corpo.html>
   Depois de montado, o index.html é autossuficiente. */
const fs = require('fs');
const path = require('path');

const leia = fs.readFileSync(path.join(__dirname, '../../../leitura-kit/site-v2/index.html'), 'utf8');
const css = leia.slice(leia.indexOf('<style>'), leia.indexOf('</style>') + '</style>'.length);
const corpo = fs.readFileSync(process.argv[2], 'utf8');

const extra = `<style>
.brand__b--azul{background:var(--azul);font-size:20px}
.plans--um{grid-template-columns:1fr;max-width:560px;margin-left:auto;margin-right:auto}
.tq div{color:var(--azul);font-family:var(--fd);font-weight:800;letter-spacing:0}
@media(max-width:640px){.top__x{display:none}}
</style>`;

const head = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Conta em 10 Minutos — Kit de matemática para imprimir</title>
<meta name="description" content="50 páginas de matemática na ordem em que a criança aprende: contar, somar, subtrair, dezenas, horas e dinheiro. Plano de 30 dias e gabarito. De R$ 47 por R$ 19,90.">
<meta name="theme-color" content="#FFFDF7">
<meta property="og:title" content="Do contar nos dedos à continha de cabeça, 10 minutos por dia">
<meta property="og:description" content="Kit de matemática para imprimir, 5 a 8 anos: 50 páginas, plano de 30 dias e gabarito. De R$ 47 por R$ 19,90.">
<meta property="og:type" content="website">
<meta property="og:image" content="https://conta-em-10-minutos.vercel.app/img/og.png">
<link rel="icon" href="img/fig/estrela.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
`;

fs.writeFileSync(path.join(__dirname, 'index.html'), head + css + '\n' + extra + '\n' + corpo, 'utf8');
console.log('index.html montado');
