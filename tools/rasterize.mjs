/**
 * Растеризация SVG → PNG (OG-обложка и apple-touch-icon).
 * Соцсети не рендерят SVG в превью, поэтому нужен PNG.
 *   node tools/rasterize.mjs
 */
import { Resvg } from '@resvg/resvg-js';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const IMG = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), 'assets', 'img');

const jobs = [
  { src: 'og-cover.svg', out: 'og-cover.png', width: 1200 },
  { src: 'logo.svg', out: 'apple-touch-icon.png', width: 180 },
  { src: 'logo.svg', out: 'icon-192.png', width: 192 },
  { src: 'logo.svg', out: 'icon-512.png', width: 512 },
];

for (const job of jobs) {
  const svg = await readFile(path.join(IMG, job.src), 'utf8');
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: job.width },
    font: { loadSystemFonts: true, defaultFontFamily: 'Helvetica' },
    background: 'white',
  });
  const png = resvg.render().asPng();
  await writeFile(path.join(IMG, job.out), png);
  console.log(`   ✓ ${job.out.padEnd(24)} ${(png.length / 1024).toFixed(1).padStart(7)} КБ`);
}
