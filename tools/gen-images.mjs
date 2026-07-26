/**
 * SOCO Ukraine — генератор SVG-иллюстраций.
 *
 * Векторная графика вместо фотостоков: единый визуальный язык,
 * идеальная резкость на любом DPI, вес одного изображения 2–8 КБ.
 *
 *   node tools/gen-images.mjs
 */

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const IMG = path.join(ROOT, 'assets', 'img');
const PROD = path.join(IMG, 'products');

/* ==========================================================================
   Палитра
   ========================================================================== */
const C = {
  blue: '#0d6efd',
  blueDark: '#0b5ed7',
  blueDeep: '#0a3f8f',
  blueLight: '#5f97ff',
  bluePale: '#dbe8ff',
  blueMist: '#eff5ff',
  ink: '#0f1c33',
  slate: '#64748b',
  line: '#cbd5e5',
  steel: '#e2e8f2',
  white: '#ffffff',
  mint: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
};

/* ==========================================================================
   Общие defs: градиенты металла, стекла, пластика, фона
   ========================================================================== */
const defs = (extra = '') => `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset=".55" stop-color="#f5f9ff"/>
      <stop offset="1" stop-color="#e6efff"/>
    </linearGradient>
    <radialGradient id="glow" cx=".5" cy=".42" r=".62">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".95"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="shadow" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="${C.blueDeep}" stop-opacity=".22"/>
      <stop offset="1" stop-color="${C.blueDeep}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8fa3bd"/>
      <stop offset=".18" stop-color="#e8eef7"/>
      <stop offset=".42" stop-color="#ffffff"/>
      <stop offset=".68" stop-color="#dde5f0"/>
      <stop offset="1" stop-color="#93a6bf"/>
    </linearGradient>
    <linearGradient id="metalV" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f4f7fc"/>
      <stop offset=".5" stop-color="#dbe3ee"/>
      <stop offset="1" stop-color="#a9b8cd"/>
    </linearGradient>
    <linearGradient id="blueG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.blueLight}"/>
      <stop offset=".5" stop-color="${C.blue}"/>
      <stop offset="1" stop-color="${C.blueDeep}"/>
    </linearGradient>
    <linearGradient id="blueSoft" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#eaf2ff"/>
      <stop offset="1" stop-color="#c9dcff"/>
    </linearGradient>
    <linearGradient id="whiteG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset=".62" stop-color="#f2f6fc"/>
      <stop offset="1" stop-color="#dde5f1"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".15"/>
      <stop offset=".28" stop-color="#ffffff" stop-opacity=".72"/>
      <stop offset=".55" stop-color="#ffffff" stop-opacity=".12"/>
      <stop offset="1" stop-color="#9fb4cf" stop-opacity=".35"/>
    </linearGradient>
    <linearGradient id="darkG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#33415c"/>
      <stop offset="1" stop-color="#111a2e"/>
    </linearGradient>
    ${extra}
  </defs>`;

/** Каркас продуктовой картинки 640×640 */
const frame = (body, { extraDefs = '', floor = 566, floorW = 175 } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="640" height="640" role="img">
${defs(extraDefs)}
  <rect width="640" height="640" fill="url(#bg)"/>
  <circle cx="320" cy="288" r="248" fill="url(#glow)"/>
  <ellipse cx="320" cy="${floor}" rx="${floorW}" ry="26" fill="url(#shadow)"/>
${body}
</svg>
`;

/* ==========================================================================
   Продуктовые иллюстрации
   ========================================================================== */
const items = {};

/* ---- Шприц композита ---- */
items['composite-syringe'] = frame(`
  <g transform="rotate(-24 320 320)">
    <!-- поршень -->
    <rect x="150" y="292" width="52" height="12" rx="6" fill="#94a3b8"/>
    <rect x="196" y="276" width="26" height="44" rx="9" fill="url(#metalV)" stroke="${C.line}" stroke-width="2"/>
    <!-- корпус -->
    <rect x="218" y="262" width="212" height="72" rx="20" fill="url(#whiteG)" stroke="${C.line}" stroke-width="2.5"/>
    <rect x="230" y="274" width="188" height="26" rx="13" fill="url(#blueG)" opacity=".92"/>
    <rect x="230" y="306" width="118" height="12" rx="6" fill="${C.steel}"/>
    <!-- этикетка -->
    <circle cx="252" cy="287" r="8" fill="#fff" opacity=".9"/>
    <rect x="270" y="282" width="88" height="10" rx="5" fill="#fff" opacity=".85"/>
    <rect x="366" y="282" width="34" height="10" rx="5" fill="#fff" opacity=".5"/>
    <!-- шейка и канюля -->
    <path d="M430 282h26l6 16-6 16h-26z" fill="url(#metalV)" stroke="${C.line}" stroke-width="2"/>
    <path d="M462 292c26 2 44 4 62 6 6 .7 6 8.6 0 9.3-18 2-36 4-62 6z" fill="url(#metal)" stroke="#9aa9be" stroke-width="1.6"/>
    <circle cx="529" cy="298.5" r="5" fill="${C.blue}"/>
    <!-- блик -->
    <rect x="228" y="268" width="196" height="8" rx="4" fill="#fff" opacity=".75"/>
  </g>
  <!-- капля материала -->
  <path d="M560 372c0 12-9 20-20 20s-20-8-20-20 20-34 20-34 20 22 20 34z" fill="url(#blueG)" opacity=".28"/>
`);

/* ---- Набор композита (коробка) ---- */
items['composite-kit'] = frame(`
  <!-- коробка -->
  <path d="M148 250h344v238a26 26 0 0 1-26 26H174a26 26 0 0 1-26-26z" fill="url(#whiteG)" stroke="${C.line}" stroke-width="2.5"/>
  <path d="M148 250h344v58H148z" fill="url(#blueG)"/>
  <path d="M148 250 320 168l172 82z" fill="#f4f8ff" stroke="${C.line}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M320 168v82" stroke="${C.line}" stroke-width="2" opacity=".6"/>
  <!-- логотип на крышке -->
  <circle cx="320" cy="279" r="17" fill="#fff" opacity=".95"/>
  <path d="M320 269c-2.6 0-4 1.4-6 1.4s-3-.8-3.6.6c-1.4 3.4-.4 8 1.6 12.6 1.2 2.8 2.2 4.4 3.6 4.4 1.4 0 1.8-1.2 2.4-3l1-2.6c.2-.6.6-.6.8 0l1 2.6c.6 1.8 1 3 2.4 3 1.4 0 2.4-1.6 3.6-4.4 2-4.6 3-9.2 1.6-12.6-.6-1.4-1.8-.6-3.6-.6s-3.4-1.4-6-1.4z" fill="${C.blue}"/>
  <!-- шприцы внутри -->
  <g>
    <rect x="182" y="336" width="122" height="34" rx="17" fill="#fff" stroke="${C.line}" stroke-width="2"/>
    <rect x="192" y="345" width="80" height="16" rx="8" fill="${C.blueLight}" opacity=".55"/>
    <rect x="182" y="386" width="122" height="34" rx="17" fill="#fff" stroke="${C.line}" stroke-width="2"/>
    <rect x="192" y="395" width="80" height="16" rx="8" fill="${C.blue}" opacity=".45"/>
    <rect x="182" y="436" width="122" height="34" rx="17" fill="#fff" stroke="${C.line}" stroke-width="2"/>
    <rect x="192" y="445" width="80" height="16" rx="8" fill="${C.blueDeep}" opacity=".35"/>
  </g>
  <g>
    <rect x="336" y="336" width="122" height="134" rx="16" fill="#f7fafe" stroke="${C.line}" stroke-width="2"/>
    <rect x="352" y="354" width="90" height="10" rx="5" fill="${C.steel}"/>
    <rect x="352" y="374" width="66" height="10" rx="5" fill="${C.steel}"/>
    <rect x="352" y="404" width="90" height="46" rx="10" fill="url(#blueSoft)"/>
    <path d="m370 428 12 12 26-28" fill="none" stroke="${C.blue}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
`);

/* ---- Бонд (флакон) ---- */
items['bonding'] = frame(`
  <g>
    <!-- крышка -->
    <rect x="278" y="164" width="84" height="46" rx="12" fill="url(#darkG)"/>
    <rect x="288" y="150" width="64" height="20" rx="8" fill="#475569"/>
    <!-- горловина -->
    <rect x="292" y="206" width="56" height="30" rx="8" fill="url(#metalV)" stroke="${C.line}" stroke-width="2"/>
    <!-- корпус -->
    <path d="M268 236h104a34 34 0 0 1 34 34v192a34 34 0 0 1-34 34H268a34 34 0 0 1-34-34V270a34 34 0 0 1 34-34z" fill="url(#whiteG)" stroke="${C.line}" stroke-width="2.5"/>
    <!-- этикетка -->
    <rect x="248" y="290" width="144" height="130" rx="14" fill="url(#blueG)"/>
    <rect x="266" y="310" width="108" height="12" rx="6" fill="#fff" opacity=".92"/>
    <rect x="266" y="332" width="78" height="9" rx="4.5" fill="#fff" opacity=".6"/>
    <circle cx="320" cy="382" r="24" fill="#fff" opacity=".2"/>
    <path d="M320 366c-4 0-6.4 2.2-9.4 2.2-2.8 0-4.6-1.2-5.6 1-2.2 5.4-.6 12.6 2.6 19.8 1.8 4.4 3.4 6.8 5.6 6.8 2.2 0 2.8-1.8 3.8-4.6l1.6-4.2c.3-1 1-1 1.3 0l1.6 4.2c1 2.8 1.6 4.6 3.8 4.6s3.8-2.4 5.6-6.8c3.2-7.2 4.8-14.4 2.6-19.8-1-2.2-2.8-1-5.6-1-3 0-5.4-2.2-9.4-2.2z" fill="#fff" opacity=".95"/>
    <!-- уровень жидкости -->
    <path d="M234 440h172v22a34 34 0 0 1-34 34H268a34 34 0 0 1-34-34z" fill="${C.blueLight}" opacity=".3"/>
    <!-- блик -->
    <rect x="252" y="252" width="16" height="220" rx="8" fill="#fff" opacity=".75"/>
  </g>
  <!-- кисточка-аппликатор -->
  <g transform="rotate(18 470 340)">
    <rect x="462" y="210" width="14" height="180" rx="7" fill="url(#metal)" stroke="#9aa9be" stroke-width="1.4"/>
    <path d="M462 386h14l-3 26a4 4 0 0 1-8 0z" fill="${C.blue}"/>
  </g>
`);

/* ---- Набор боров в блоке ---- */
items['burs-set'] = frame(`
  <!-- подставка -->
  <path d="M146 386h348a20 20 0 0 1 20 20v92a20 20 0 0 1-20 20H146a20 20 0 0 1-20-20v-92a20 20 0 0 1 20-20z" fill="url(#whiteG)" stroke="${C.line}" stroke-width="2.5"/>
  <path d="M126 428h388" stroke="${C.line}" stroke-width="2" opacity=".7"/>
  <rect x="150" y="452" width="120" height="12" rx="6" fill="${C.steel}"/>
  <rect x="150" y="478" width="76" height="10" rx="5" fill="${C.steel}"/>
  <rect x="380" y="452" width="106" height="36" rx="10" fill="url(#blueG)" opacity=".9"/>
  ${(() => {
    const shapes = [
      { head: 'ball', color: C.blue },
      { head: 'cone', color: C.blueDark },
      { head: 'cyl', color: C.blueDeep },
      { head: 'flame', color: C.blue },
      { head: 'ball', color: C.blueDark },
      { head: 'cone', color: C.blueDeep },
      { head: 'cyl', color: C.blue },
      { head: 'flame', color: C.blueDark },
    ];
    return shapes
      .map((s, i) => {
        const x = 168 + i * 43;
        const top = 168 + (i % 3) * 8;
        const shank = `<rect x="${x - 5}" y="${top}" width="10" height="${386 - top}" rx="5" fill="url(#metal)" stroke="#9aa9be" stroke-width="1.2"/>`;
        let head = '';
        if (s.head === 'ball') head = `<circle cx="${x}" cy="${top + 14}" r="14" fill="${s.color}"/>`;
        if (s.head === 'cone') head = `<path d="M${x - 13} ${top + 30}h26L${x} ${top - 4}z" fill="${s.color}"/>`;
        if (s.head === 'cyl') head = `<rect x="${x - 12}" y="${top - 2}" width="24" height="34" rx="10" fill="${s.color}"/>`;
        if (s.head === 'flame')
          head = `<path d="M${x} ${top - 6}c11 12 13 22 13 28 0 9-6 14-13 14s-13-5-13-14c0-6 2-16 13-28z" fill="${s.color}"/>`;
        const ring = `<rect x="${x - 6}" y="${top + 54}" width="12" height="9" rx="3" fill="${s.color}" opacity=".85"/>`;
        return shank + head + ring;
      })
      .join('\n  ');
  })()}
`);

/* ---- Одиночный бор (крупно) ---- */
items['bur-single'] = frame(`
  <g transform="rotate(-32 320 320)">
    <rect x="304" y="196" width="32" height="286" rx="16" fill="url(#metal)" stroke="#9aa9be" stroke-width="2"/>
    <rect x="304" y="196" width="32" height="18" rx="9" fill="#8fa3bd"/>
    <rect x="298" y="300" width="44" height="26" rx="8" fill="url(#blueG)"/>
    <!-- рабочая часть -->
    <path d="M320 128c30 34 40 60 40 76 0 25-18 38-40 38s-40-13-40-38c0-16 10-42 40-76z" fill="url(#blueG)"/>
    <g opacity=".38" fill="#fff">
      ${Array.from({ length: 42 }, (_, i) => {
        const a = (i * 137.5 * Math.PI) / 180;
        const r = 8 + (i / 42) * 30;
        const cx = 320 + Math.cos(a) * r * 0.8;
        const cy = 190 + Math.sin(a) * r * 0.95 - 20;
        return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.4"/>`;
      }).join('')}
    </g>
    <path d="M296 150c8-10 16-18 24-24" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".55" fill="none"/>
  </g>
`);

/* ---- Набор инструментов в кассете ---- */
items['instrument-kit'] = frame(`
  <g transform="rotate(-8 320 340)">
    <!-- кассета -->
    <rect x="120" y="238" width="400" height="204" rx="26" fill="url(#whiteG)" stroke="${C.line}" stroke-width="2.5"/>
    <rect x="140" y="258" width="360" height="164" rx="18" fill="#f3f7fd" stroke="${C.steel}" stroke-width="2"/>
    ${Array.from({ length: 5 }, (_, i) => {
      const y = 278 + i * 32;
      return `<rect x="158" y="${y}" width="324" height="16" rx="8" fill="#e8eef8"/>`;
    }).join('\n    ')}
    <!-- инструменты -->
    ${(() => {
      const tips = ['mirror', 'probe', 'excavator', 'spatula', 'tweezer'];
      return tips
        .map((t, i) => {
          const y = 286 + i * 32;
          const handle = `<rect x="220" y="${y - 4}" width="180" height="12" rx="6" fill="url(#metal)" stroke="#9aa9be" stroke-width="1.2"/>
          <rect x="252" y="${y - 3}" width="112" height="10" rx="5" fill="${C.blue}" opacity="${0.16 + i * 0.05}"/>`;
          let left = '';
          let right = '';
          if (t === 'mirror') {
            left = `<circle cx="196" cy="${y + 2}" r="17" fill="url(#metalV)" stroke="#9aa9be" stroke-width="1.6"/><circle cx="196" cy="${y + 2}" r="11" fill="#dbeafe"/>`;
            right = `<path d="M400 ${y + 2}h26" stroke="url(#metal)" stroke-width="9" stroke-linecap="round"/>`;
          }
          if (t === 'probe') {
            left = `<path d="M220 ${y + 2}c-14 0-22-8-30-14" stroke="url(#metal)" stroke-width="7" fill="none" stroke-linecap="round"/>`;
            right = `<path d="M400 ${y + 2}c14 0 22 8 30 16" stroke="url(#metal)" stroke-width="7" fill="none" stroke-linecap="round"/>`;
          }
          if (t === 'excavator') {
            left = `<path d="M220 ${y + 2}h-24" stroke="url(#metal)" stroke-width="8" stroke-linecap="round"/><circle cx="188" cy="${y + 2}" r="9" fill="none" stroke="#9aa9be" stroke-width="4"/>`;
            right = `<path d="M400 ${y + 2}h24" stroke="url(#metal)" stroke-width="8" stroke-linecap="round"/><circle cx="432" cy="${y + 2}" r="9" fill="none" stroke="#9aa9be" stroke-width="4"/>`;
          }
          if (t === 'spatula') {
            left = `<path d="M220 ${y + 2}h-20l-16-7v14l16-7z" fill="url(#metalV)" stroke="#9aa9be" stroke-width="1.5"/>`;
            right = `<path d="M400 ${y + 2}h20l18-8v16l-18-8z" fill="url(#metalV)" stroke="#9aa9be" stroke-width="1.5"/>`;
          }
          if (t === 'tweezer') {
            left = `<path d="M222 ${y - 3}c-16 2-24 4-34 5m34 7c-16-2-24-4-34-5" stroke="url(#metal)" stroke-width="6" fill="none" stroke-linecap="round"/>`;
            right = `<path d="M398 ${y + 2}h30" stroke="url(#metal)" stroke-width="8" stroke-linecap="round"/>`;
          }
          return handle + left + right;
        })
        .join('\n    ');
    })()}
    <!-- петли кассеты -->
    <rect x="120" y="308" width="14" height="64" rx="7" fill="${C.blue}" opacity=".85"/>
    <rect x="506" y="308" width="14" height="64" rx="7" fill="${C.blue}" opacity=".85"/>
  </g>
`);

/* ---- Зеркало + зонд ---- */
items['mirror'] = frame(`
  <g transform="rotate(-30 320 320)">
    <rect x="298" y="228" width="24" height="286" rx="12" fill="url(#metal)" stroke="#9aa9be" stroke-width="2"/>
    <rect x="298" y="300" width="24" height="120" rx="12" fill="${C.blue}" opacity=".2"/>
    ${Array.from({ length: 14 }, (_, i) => `<rect x="298" y="${306 + i * 8}" width="24" height="3" rx="1.5" fill="#94a3b8" opacity=".55"/>`).join('')}
    <circle cx="310" cy="196" r="52" fill="url(#metalV)" stroke="#93a6bf" stroke-width="3"/>
    <circle cx="310" cy="196" r="40" fill="#e6f0ff"/>
    <circle cx="310" cy="196" r="40" fill="url(#glass)" opacity=".9"/>
    <path d="M286 176a34 34 0 0 1 30-14" stroke="#fff" stroke-width="8" stroke-linecap="round" fill="none" opacity=".85"/>
  </g>
  <g transform="rotate(24 400 340)">
    <rect x="404" y="226" width="18" height="266" rx="9" fill="url(#metal)" stroke="#9aa9be" stroke-width="1.8"/>
    <rect x="404" y="298" width="18" height="104" rx="9" fill="${C.blueDeep}" opacity=".18"/>
    <path d="M413 226c0-22-8-38-24-52" stroke="url(#metal)" stroke-width="11" fill="none" stroke-linecap="round"/>
    <path d="M413 492c0 20 6 32 18 42" stroke="url(#metal)" stroke-width="11" fill="none" stroke-linecap="round"/>
  </g>
`);

/* ---- Коробка перчаток ---- */
items['gloves-box'] = frame(`
  <!-- коробка -->
  <path d="M136 258h368v250a24 24 0 0 1-24 24H160a24 24 0 0 1-24-24z" fill="url(#whiteG)" stroke="${C.line}" stroke-width="2.5"/>
  <path d="M136 258h368v18H136z" fill="${C.steel}"/>
  <path d="M136 296h368v112H136z" fill="url(#blueG)"/>
  <!-- отверстие выдачи -->
  <path d="M226 258h188a0 0 0 0 1 0 0v6a34 34 0 0 1-34 34H260a34 34 0 0 1-34-34v-6z" fill="#0b3d85" opacity=".55"/>
  <!-- перчатка -->
  <path d="M300 252c-6-44-10-70-8-96 1-14 20-14 22-1l6 46 4-64c1-14 21-14 22 0l3 62 8-52c2-13 22-11 21 3l-6 60 9-38c3-13 22-9 20 5l-11 62c-5 28-12 42-20 54-5 8-6 12-6 18z" fill="#fff" stroke="${C.line}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M300 252c-6-44-10-70-8-96 1-14 20-14 22-1l6 46" fill="#eaf2ff" opacity=".8"/>
  <!-- текст-заглушки -->
  <rect x="168" y="322" width="150" height="14" rx="7" fill="#fff" opacity=".95"/>
  <rect x="168" y="348" width="104" height="11" rx="5.5" fill="#fff" opacity=".65"/>
  <rect x="168" y="374" width="128" height="11" rx="5.5" fill="#fff" opacity=".45"/>
  <g transform="translate(392 318)">
    <circle cx="34" cy="34" r="34" fill="#fff" opacity=".2"/>
    <path d="M34 16 14 24v14c0 12 8 22 20 26 12-4 20-14 20-26V24z" fill="#fff" opacity=".9"/>
    <path d="m26 36 6 7 11-13" stroke="${C.blue}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <rect x="168" y="432" width="90" height="26" rx="13" fill="${C.blueMist}"/>
  <rect x="272" y="432" width="90" height="26" rx="13" fill="${C.blueMist}"/>
  <rect x="376" y="432" width="90" height="26" rx="13" fill="${C.blueMist}"/>
  <rect x="168" y="474" width="176" height="10" rx="5" fill="${C.steel}"/>
`);

/* ---- Маски ---- */
items['masks'] = frame(`
  <!-- пачка -->
  <path d="M126 330h388v170a22 22 0 0 1-22 22H148a22 22 0 0 1-22-22z" fill="url(#whiteG)" stroke="${C.line}" stroke-width="2.5"/>
  <path d="M126 330h388v58H126z" fill="url(#blueG)"/>
  <rect x="156" y="410" width="150" height="13" rx="6.5" fill="${C.steel}"/>
  <rect x="156" y="436" width="106" height="11" rx="5.5" fill="${C.steel}"/>
  <rect x="156" y="470" width="120" height="28" rx="14" fill="${C.blueMist}"/>
  <g transform="translate(388 404)">
    <circle cx="46" cy="46" r="44" fill="${C.blueMist}"/>
    <path d="M46 22 22 32v16c0 14 10 26 24 30 14-4 24-16 24-30V32z" fill="${C.blue}" opacity=".9"/>
    <path d="m36 47 7 8 14-16" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <!-- маска -->
  <g transform="translate(0 -14)">
    <path d="M196 196h248c10 0 16 8 14 18l-16 96c-4 26-28 46-56 46h-132c-28 0-52-20-56-46l-16-96c-2-10 4-18 14-18z" fill="#fff" stroke="${C.line}" stroke-width="2.5"/>
    <path d="M196 196h248c10 0 16 8 14 18l-4 24H186l-4-24c-2-10 4-18 14-18z" fill="url(#blueSoft)"/>
    <path d="M186 262h272M190 292h264M196 322h252" stroke="${C.line}" stroke-width="3" stroke-linecap="round" opacity=".8"/>
    <rect x="252" y="204" width="136" height="12" rx="6" fill="#94a3b8"/>
    <path d="M196 214c-30 6-44 26-44 52M444 214c30 6 44 26 44 52" stroke="${C.blueLight}" stroke-width="7" fill="none" stroke-linecap="round"/>
  </g>
`);

/* ---- Анестетик (карпулы) ---- */
items['anesthetic'] = frame(`
  <!-- коробка -->
  <path d="M150 316h340v180a22 22 0 0 1-22 22H172a22 22 0 0 1-22-22z" fill="url(#whiteG)" stroke="${C.line}" stroke-width="2.5"/>
  <path d="M150 316h340v56H150z" fill="url(#blueG)"/>
  <rect x="178" y="394" width="146" height="13" rx="6.5" fill="${C.steel}"/>
  <rect x="178" y="420" width="98" height="11" rx="5.5" fill="${C.steel}"/>
  <rect x="178" y="456" width="120" height="30" rx="15" fill="${C.blueMist}"/>
  <rect x="360" y="392" width="104" height="94" rx="14" fill="#f3f7fd" stroke="${C.steel}" stroke-width="2"/>
  <path d="M392 440h40M412 420v40" stroke="${C.blue}" stroke-width="8" stroke-linecap="round"/>
  <!-- карпулы -->
  ${[0, 1, 2]
    .map((i) => {
      const x = 214 + i * 78;
      const y = 138 + (i === 1 ? -14 : 0);
      return `<g transform="translate(${x} ${y})">
    <rect x="0" y="0" width="44" height="164" rx="14" fill="#eef4fb" stroke="${C.line}" stroke-width="2"/>
    <rect x="0" y="0" width="44" height="164" rx="14" fill="url(#glass)"/>
    <rect x="6" y="34" width="32" height="112" rx="8" fill="${C.blueLight}" opacity=".28"/>
    <rect x="4" y="6" width="36" height="24" rx="8" fill="url(#metalV)" stroke="#9aa9be" stroke-width="1.4"/>
    <circle cx="22" cy="18" r="7" fill="${C.blue}" opacity=".7"/>
    <rect x="6" y="146" width="32" height="14" rx="6" fill="#94a3b8"/>
    <rect x="10" y="60" width="24" height="7" rx="3.5" fill="#fff" opacity=".9"/>
    <rect x="10" y="74" width="16" height="6" rx="3" fill="#fff" opacity=".65"/>
    <rect x="6" y="12" width="7" height="128" rx="3.5" fill="#fff" opacity=".7"/>
  </g>`;
    })
    .join('\n  ')}
`);

/* ---- Карпульный шприц ---- */
items['syringe'] = frame(`
  <g transform="rotate(-38 320 320)">
    <!-- кольцо для пальца -->
    <circle cx="320" cy="150" r="30" fill="none" stroke="url(#metal)" stroke-width="15"/>
    <rect x="312" y="176" width="16" height="34" rx="8" fill="url(#metal)"/>
    <!-- упоры -->
    <rect x="266" y="206" width="108" height="18" rx="9" fill="url(#metalV)" stroke="#9aa9be" stroke-width="1.6"/>
    <!-- корпус -->
    <rect x="288" y="222" width="64" height="212" rx="16" fill="url(#metal)" stroke="#93a6bf" stroke-width="2"/>
    <!-- окно с карпулой -->
    <rect x="302" y="240" width="36" height="176" rx="12" fill="#eef4fb" stroke="#9aa9be" stroke-width="1.6"/>
    <rect x="306" y="262" width="28" height="140" rx="9" fill="${C.blueLight}" opacity=".3"/>
    <rect x="306" y="244" width="28" height="14" rx="6" fill="#94a3b8"/>
    <!-- шейка -->
    <path d="M296 434h48l-8 26h-32z" fill="url(#metalV)" stroke="#9aa9be" stroke-width="1.6"/>
    <!-- игла -->
    <rect x="313" y="458" width="14" height="42" rx="6" fill="${C.blue}"/>
    <path d="M320 500v78" stroke="url(#metal)" stroke-width="6" stroke-linecap="round"/>
    <path d="M320 578v14" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
    <!-- блики -->
    <rect x="292" y="228" width="9" height="200" rx="4.5" fill="#fff" opacity=".8"/>
  </g>
`);

/* ---- Картридж А-силикона ---- */
items['impression-cartridge'] = frame(`
  <g transform="rotate(-16 320 340)">
    <!-- корпус картриджа -->
    <rect x="150" y="264" width="300" height="118" rx="26" fill="url(#whiteG)" stroke="${C.line}" stroke-width="2.5"/>
    <rect x="150" y="264" width="300" height="58" rx="26" fill="url(#blueG)" opacity=".92"/>
    <path d="M150 300h300v22H150z" fill="url(#blueG)" opacity=".92"/>
    <!-- разделение двух камер -->
    <path d="M300 264v118" stroke="#fff" stroke-width="3" opacity=".5"/>
    <rect x="172" y="284" width="106" height="12" rx="6" fill="#fff" opacity=".9"/>
    <rect x="172" y="340" width="80" height="11" rx="5.5" fill="${C.steel}"/>
    <rect x="320" y="340" width="104" height="11" rx="5.5" fill="${C.steel}"/>
    <!-- поршни -->
    <rect x="116" y="288" width="38" height="70" rx="12" fill="url(#metalV)" stroke="${C.line}" stroke-width="2"/>
    <!-- выход -->
    <rect x="446" y="296" width="34" height="54" rx="10" fill="url(#metalV)" stroke="${C.line}" stroke-width="2"/>
    <!-- смешивающая канюля -->
    <g>
      <rect x="478" y="300" width="30" height="46" rx="9" fill="${C.blue}"/>
      <path d="M508 310h44c8 0 8 26 0 26h-44z" fill="url(#blueG)"/>
      <path d="M552 316c22-2 40 4 54 20" stroke="${C.blueLight}" stroke-width="13" fill="none" stroke-linecap="round"/>
    </g>
    <rect x="158" y="270" width="284" height="9" rx="4.5" fill="#fff" opacity=".55"/>
  </g>
  <!-- выдавленный материал -->
  <path d="M470 446c34-8 58 0 74 22 6 8-2 18-12 14-24-10-44-12-62-6-10 3-14-8-4-11z" fill="url(#blueG)" opacity=".3"/>
`);

/* ---- Альгинат (банка) ---- */
items['alginate'] = frame(`
  <!-- крышка -->
  <ellipse cx="320" cy="196" rx="132" ry="34" fill="url(#blueG)"/>
  <rect x="188" y="196" width="264" height="34" fill="url(#blueG)"/>
  <ellipse cx="320" cy="230" rx="132" ry="34" fill="${C.blueDark}" opacity=".55"/>
  <!-- корпус -->
  <path d="M188 224h264v250a34 34 0 0 1-34 34H222a34 34 0 0 1-34-34z" fill="url(#whiteG)" stroke="${C.line}" stroke-width="2.5"/>
  <ellipse cx="320" cy="474" rx="132" ry="30" fill="#eef3fa"/>
  <!-- этикетка -->
  <path d="M188 286h264v144H188z" fill="#f7fafe" stroke="${C.steel}" stroke-width="2"/>
  <rect x="216" y="308" width="146" height="16" rx="8" fill="url(#blueG)"/>
  <rect x="216" y="336" width="104" height="11" rx="5.5" fill="${C.steel}"/>
  <g transform="translate(216 366)">
    <rect x="0" y="0" width="40" height="40" rx="12" fill="${C.mint}" opacity=".85"/>
    <rect x="52" y="0" width="40" height="40" rx="12" fill="${C.amber}" opacity=".85"/>
    <rect x="104" y="0" width="40" height="40" rx="12" fill="${C.rose}" opacity=".8"/>
    <path d="M156 20h32m0 0-9-9m9 9-9 9" stroke="${C.slate}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <rect x="204" y="240" width="20" height="230" rx="10" fill="#fff" opacity=".8"/>
  <!-- мерная ложка -->
  <g transform="rotate(24 496 430)">
    <rect x="488" y="330" width="14" height="96" rx="7" fill="${C.blueLight}"/>
    <ellipse cx="495" cy="440" rx="30" ry="22" fill="${C.blue}" opacity=".85"/>
    <ellipse cx="495" cy="436" rx="22" ry="15" fill="#fff" opacity=".4"/>
  </g>
`);

/* ---- Дезинфектант (флакон с триггером) ---- */
items['disinfectant'] = frame(`
  <!-- триггер -->
  <g>
    <path d="M282 118h76v40h-76z" fill="url(#darkG)"/>
    <path d="M262 138h116a14 14 0 0 1 14 14v26a14 14 0 0 1-14 14H262a14 14 0 0 1-14-14v-26a14 14 0 0 1 14-14z" fill="#334155"/>
    <path d="M248 158h-58a10 10 0 0 0-10 10v6a10 10 0 0 0 10 10h58z" fill="#475569"/>
    <path d="M276 192c-6 22-18 34-40 40 20 12 34 8 44-6z" fill="#334155"/>
  </g>
  <!-- горловина -->
  <rect x="284" y="192" width="72" height="34" rx="8" fill="#94a3b8"/>
  <!-- корпус -->
  <path d="M242 226h156a34 34 0 0 1 34 34v220a34 34 0 0 1-34 34H242a34 34 0 0 1-34-34V260a34 34 0 0 1 34-34z" fill="url(#whiteG)" stroke="${C.line}" stroke-width="2.5"/>
  <path d="M208 380h224v100a34 34 0 0 1-34 34H242a34 34 0 0 1-34-34z" fill="${C.blueLight}" opacity=".26"/>
  <!-- этикетка -->
  <rect x="222" y="272" width="196" height="150" rx="16" fill="url(#blueG)"/>
  <rect x="244" y="296" width="140" height="15" rx="7.5" fill="#fff" opacity=".95"/>
  <rect x="244" y="322" width="96" height="10" rx="5" fill="#fff" opacity=".6"/>
  <g transform="translate(244 348)">
    <circle cx="26" cy="26" r="26" fill="#fff" opacity=".2"/>
    <path d="M26 10 8 17v13c0 11 8 21 18 24 10-3 18-13 18-24V17z" fill="#fff" opacity=".92"/>
    <path d="m19 27 5 6 11-12" stroke="${C.blue}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <rect x="308" y="360" width="90" height="10" rx="5" fill="#fff" opacity=".5"/>
  <rect x="308" y="380" width="72" height="10" rx="5" fill="#fff" opacity=".35"/>
  <rect x="308" y="400" width="84" height="10" rx="5" fill="#fff" opacity=".35"/>
  <rect x="228" y="244" width="18" height="256" rx="9" fill="#fff" opacity=".75"/>
  <!-- брызги -->
  <g fill="${C.blueLight}" opacity=".45">
    <circle cx="150" cy="168" r="7"/><circle cx="122" cy="192" r="5"/><circle cx="158" cy="206" r="4"/>
    <circle cx="112" cy="150" r="4"/><circle cx="134" cy="222" r="3"/>
  </g>
`);

/* ---- Салфетки (туба) ---- */
items['wipes'] = frame(`
  <!-- крышка -->
  <ellipse cx="320" cy="176" rx="112" ry="30" fill="${C.blueDark}"/>
  <rect x="208" y="176" width="224" height="40" fill="url(#blueG)"/>
  <ellipse cx="320" cy="216" rx="112" ry="30" fill="${C.blue}" opacity=".9"/>
  <ellipse cx="320" cy="174" rx="46" ry="14" fill="${C.blueDeep}" opacity=".6"/>
  <!-- вытянутая салфетка -->
  <path d="M292 172c-6-38-4-66 10-92 6-10 22-6 20 6-6 30-8 54-2 84z" fill="#fff" stroke="${C.line}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M300 96c8-14 22-22 40-24" stroke="${C.steel}" stroke-width="7" fill="none" stroke-linecap="round"/>
  <!-- корпус -->
  <path d="M208 210h224v272a30 30 0 0 1-30 30H238a30 30 0 0 1-30-30z" fill="url(#whiteG)" stroke="${C.line}" stroke-width="2.5"/>
  <ellipse cx="320" cy="482" rx="112" ry="28" fill="#eef3fa"/>
  <rect x="208" y="268" width="224" height="150" fill="#f7fafe" stroke="${C.steel}" stroke-width="2"/>
  <rect x="238" y="292" width="140" height="16" rx="8" fill="url(#blueG)"/>
  <rect x="238" y="320" width="96" height="11" rx="5.5" fill="${C.steel}"/>
  <rect x="238" y="344" width="118" height="11" rx="5.5" fill="${C.steel}"/>
  <rect x="238" y="376" width="86" height="28" rx="14" fill="${C.blueMist}"/>
  <text x="281" y="395" font-family="Inter, sans-serif" font-size="15" font-weight="700" fill="${C.blue}" text-anchor="middle">200</text>
  <rect x="222" y="226" width="18" height="270" rx="9" fill="#fff" opacity=".8"/>
`);

/* ---- Полимеризационная лампа ---- */
items['curing-lamp'] = frame(`
  <g transform="rotate(-26 320 330)">
    <!-- рукоять -->
    <rect x="284" y="242" width="72" height="266" rx="34" fill="url(#whiteG)" stroke="${C.line}" stroke-width="2.5"/>
    <rect x="284" y="242" width="72" height="72" rx="34" fill="url(#blueG)"/>
    <!-- дисплей -->
    <rect x="298" y="336" width="44" height="60" rx="12" fill="url(#darkG)"/>
    <rect x="306" y="346" width="28" height="8" rx="4" fill="${C.mint}"/>
    <rect x="306" y="360" width="20" height="6" rx="3" fill="#64748b"/>
    <rect x="306" y="372" width="28" height="6" rx="3" fill="#64748b"/>
    <!-- кнопки -->
    <circle cx="320" cy="418" r="14" fill="${C.blue}"/>
    <circle cx="320" cy="452" r="10" fill="${C.steel}"/>
    <rect x="292" y="486" width="56" height="10" rx="5" fill="${C.steel}"/>
    <!-- световод -->
    <path d="M300 242c-4-40-2-66 8-84 6-12 22-12 28 0 10 18 12 44 8 84z" fill="url(#metalV)" stroke="${C.line}" stroke-width="2"/>
    <path d="M312 150c-6-18-2-32 8-42 10 10 14 24 8 42z" fill="#dbe8ff" stroke="${C.line}" stroke-width="2"/>
    <!-- луч -->
    <path d="M320 96c-40-16-64-44-70-84h140c-6 40-30 68-70 84z" fill="url(#blueG)" opacity=".22"/>
    <circle cx="320" cy="112" r="20" fill="${C.blueLight}" opacity=".55"/>
    <circle cx="320" cy="112" r="10" fill="#fff"/>
    <rect x="292" y="250" width="14" height="240" rx="7" fill="#fff" opacity=".7"/>
  </g>
`);

/* ---- Турбинный наконечник ---- */
items['handpiece'] = frame(`
  <g transform="rotate(34 320 320)">
    <!-- хвостовик/коннектор -->
    <rect x="292" y="446" width="56" height="94" rx="16" fill="url(#metalV)" stroke="#93a6bf" stroke-width="2"/>
    <rect x="286" y="430" width="68" height="24" rx="10" fill="#8fa3bd"/>
    <!-- корпус -->
    <path d="M296 190h48a26 26 0 0 1 26 26v218a26 26 0 0 1-26 26h-48a26 26 0 0 1-26-26V216a26 26 0 0 1 26-26z" fill="url(#metal)" stroke="#93a6bf" stroke-width="2"/>
    <rect x="278" y="250" width="84" height="26" rx="13" fill="url(#blueG)"/>
    <rect x="286" y="300" width="68" height="9" rx="4.5" fill="#9aa9be" opacity=".7"/>
    <rect x="286" y="318" width="52" height="9" rx="4.5" fill="#9aa9be" opacity=".5"/>
    <!-- головка -->
    <path d="M270 216c-10-24-6-44 12-58l38-30c14-10 32 2 30 20l-6 62z" fill="url(#metal)" stroke="#93a6bf" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="304" cy="164" r="26" fill="url(#metalV)" stroke="#93a6bf" stroke-width="2"/>
    <circle cx="304" cy="164" r="13" fill="${C.blueDeep}" opacity=".5"/>
    <!-- LED -->
    <circle cx="266" cy="200" r="11" fill="#fff9d6" stroke="#e7dfa8" stroke-width="2"/>
    <circle cx="266" cy="200" r="20" fill="#fffbe0" opacity=".5"/>
    <!-- бор в головке -->
    <path d="M304 138V78" stroke="url(#metal)" stroke-width="10" stroke-linecap="round"/>
    <path d="M304 78c8 10 12 18 12 24 0 9-5 14-12 14s-12-5-12-14c0-6 4-14 12-24z" fill="${C.blue}"/>
    <rect x="276" y="200" width="12" height="240" rx="6" fill="#fff" opacity=".7"/>
  </g>
`);

/* ---- Ультразвуковой скалер ---- */
items['scaler'] = frame(`
  <!-- блок -->
  <path d="M132 314h300a26 26 0 0 1 26 26v134a26 26 0 0 1-26 26H132a26 26 0 0 1-26-26V340a26 26 0 0 1 26-26z" fill="url(#whiteG)" stroke="${C.line}" stroke-width="2.5"/>
  <rect x="132" y="340" width="300" height="12" rx="6" fill="${C.steel}" opacity=".6"/>
  <!-- дисплей -->
  <rect x="156" y="368" width="150" height="88" rx="14" fill="url(#darkG)"/>
  <rect x="172" y="386" width="76" height="12" rx="6" fill="${C.mint}"/>
  <rect x="172" y="408" width="52" height="9" rx="4.5" fill="#64748b"/>
  <g fill="${C.blue}">
    ${Array.from({ length: 8 }, (_, i) => `<rect x="${172 + i * 15}" y="${434 - i * 2}" width="9" height="${10 + i * 2}" rx="3" opacity="${0.35 + i * 0.08}"/>`).join('')}
  </g>
  <!-- регуляторы -->
  <circle cx="360" cy="396" r="30" fill="url(#metalV)" stroke="${C.line}" stroke-width="2"/>
  <circle cx="360" cy="396" r="12" fill="${C.blue}"/>
  <path d="M360 372v10" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
  <circle cx="360" cy="452" r="16" fill="${C.blueMist}" stroke="${C.line}" stroke-width="2"/>
  <!-- ручка на держателе -->
  <g transform="rotate(-22 460 260)">
    <rect x="436" y="132" width="48" height="230" rx="24" fill="url(#metal)" stroke="#93a6bf" stroke-width="2"/>
    <rect x="428" y="196" width="64" height="24" rx="12" fill="url(#blueG)"/>
    <rect x="440" y="240" width="40" height="8" rx="4" fill="#9aa9be" opacity=".7"/>
    <rect x="440" y="256" width="40" height="8" rx="4" fill="#9aa9be" opacity=".5"/>
    <path d="M460 132c0-30-8-52-26-68" stroke="url(#metal)" stroke-width="14" fill="none" stroke-linecap="round"/>
    <path d="M434 64c-8-8-12-16-14-26" stroke="${C.blue}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <rect x="434" y="140" width="10" height="200" rx="5" fill="#fff" opacity=".7"/>
  </g>
  <!-- шнур -->
  <path d="M458 470c40 0 62-40 40-72" stroke="${C.line}" stroke-width="9" fill="none" stroke-linecap="round"/>
`);

/* ---- Эндомотор ---- */
items['endo-motor'] = frame(`
  <!-- база -->
  <path d="M148 300h256a28 28 0 0 1 28 28v146a28 28 0 0 1-28 28H148a28 28 0 0 1-28-28V328a28 28 0 0 1 28-28z" fill="url(#whiteG)" stroke="${C.line}" stroke-width="2.5"/>
  <rect x="150" y="326" width="252" height="102" rx="16" fill="url(#darkG)"/>
  <rect x="170" y="346" width="86" height="14" rx="7" fill="${C.mint}"/>
  <rect x="170" y="370" width="120" height="10" rx="5" fill="#64748b"/>
  <rect x="170" y="390" width="64" height="10" rx="5" fill="#64748b"/>
  <g transform="translate(300 342)">
    <circle cx="42" cy="34" r="32" fill="none" stroke="${C.blue}" stroke-width="6" opacity=".35"/>
    <path d="M42 2a32 32 0 0 1 27 49" fill="none" stroke="${C.blue}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="42" cy="34" r="8" fill="${C.blue}"/>
  </g>
  <circle cx="186" cy="462" r="18" fill="${C.blueMist}" stroke="${C.line}" stroke-width="2"/>
  <circle cx="240" cy="462" r="18" fill="${C.blueMist}" stroke="${C.line}" stroke-width="2"/>
  <rect x="286" y="446" width="112" height="32" rx="16" fill="url(#blueG)"/>
  <!-- наконечник -->
  <g transform="rotate(28 466 270)">
    <rect x="440" y="142" width="52" height="216" rx="26" fill="url(#metal)" stroke="#93a6bf" stroke-width="2"/>
    <rect x="432" y="200" width="68" height="26" rx="13" fill="url(#blueG)"/>
    <rect x="446" y="250" width="40" height="9" rx="4.5" fill="#9aa9be" opacity=".6"/>
    <path d="M466 142c-4-26 0-44 12-58" stroke="url(#metal)" stroke-width="16" fill="none" stroke-linecap="round"/>
    <circle cx="484" cy="80" r="17" fill="url(#metalV)" stroke="#93a6bf" stroke-width="2"/>
    <path d="M484 63V22" stroke="${C.blue}" stroke-width="6" stroke-linecap="round"/>
    <path d="M484 22c0 0-5 6-5 10" stroke="${C.blueDeep}" stroke-width="3" stroke-linecap="round"/>
    <rect x="438" y="152" width="10" height="190" rx="5" fill="#fff" opacity=".7"/>
  </g>
`);

/* ---- Автоклав ---- */
items['autoclave'] = frame(`
  <!-- корпус -->
  <path d="M118 202h404a26 26 0 0 1 26 26v292a26 26 0 0 1-26 26H118a26 26 0 0 1-26-26V228a26 26 0 0 1 26-26z" fill="url(#whiteG)" stroke="${C.line}" stroke-width="2.5"/>
  <path d="M92 246h456" stroke="${C.steel}" stroke-width="2"/>
  <!-- дверца-камера -->
  <circle cx="252" cy="392" r="122" fill="#f2f6fc" stroke="${C.line}" stroke-width="3"/>
  <circle cx="252" cy="392" r="104" fill="url(#metalV)" stroke="#9aa9be" stroke-width="2"/>
  <circle cx="252" cy="392" r="84" fill="#dfe8f4"/>
  <circle cx="252" cy="392" r="84" fill="url(#glass)" opacity=".8"/>
  ${Array.from({ length: 3 }, (_, i) => `<rect x="188" y="${348 + i * 30}" width="128" height="16" rx="8" fill="#fff" opacity=".85"/>`).join('\n  ')}
  <path d="M196 340a84 84 0 0 1 40-38" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" opacity=".8"/>
  <!-- ручка -->
  <rect x="368" y="368" width="26" height="52" rx="13" fill="url(#metal)" stroke="#93a6bf" stroke-width="2"/>
  <!-- панель -->
  <rect x="356" y="268" width="164" height="76" rx="14" fill="url(#darkG)"/>
  <rect x="374" y="286" width="72" height="12" rx="6" fill="${C.mint}"/>
  <rect x="374" y="308" width="104" height="9" rx="4.5" fill="#64748b"/>
  <rect x="374" y="324" width="60" height="9" rx="4.5" fill="#64748b"/>
  <!-- кнопки -->
  ${Array.from({ length: 4 }, (_, i) => `<circle cx="${382 + i * 44}" cy="386" r="16" fill="${C.blueMist}" stroke="${C.line}" stroke-width="2"/>`).join('\n  ')}
  <rect x="366" y="426" width="144" height="34" rx="17" fill="url(#blueG)"/>
  <!-- ножки -->
  <rect x="150" y="546" width="46" height="20" rx="8" fill="#94a3b8"/>
  <rect x="444" y="546" width="46" height="20" rx="8" fill="#94a3b8"/>
  <!-- индикатор пара -->
  <g opacity=".5" stroke="${C.blueLight}" stroke-width="8" fill="none" stroke-linecap="round">
    <path d="M482 196c0-18-14-18-14-36s14-18 14-36"/>
    <path d="M520 196c0-18-14-18-14-36s14-18 14-36" opacity=".6"/>
  </g>
`, { floor: 588, floorW: 220 });

/* ==========================================================================
   Крупные иллюстрации: hero, клиника
   ========================================================================== */

/** Hero — набор инструментов на лотке */
const hero = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 760" width="900" height="760" role="img">
${defs(`
    <linearGradient id="trayG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset=".5" stop-color="#eef3fb"/>
      <stop offset="1" stop-color="#d9e4f3"/>
    </linearGradient>
    <linearGradient id="clothG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e8f1ff"/>
      <stop offset="1" stop-color="#cfe0fb"/>
    </linearGradient>`)}
  <rect width="900" height="760" fill="none"/>
  <circle cx="450" cy="330" r="330" fill="url(#glow)"/>

  <!-- лоток -->
  <g transform="rotate(-6 450 430)">
    <path d="M126 300h648a34 34 0 0 1 34 34v244a34 34 0 0 1-34 34H126a34 34 0 0 1-34-34V334a34 34 0 0 1 34-34z" fill="url(#trayG)" stroke="${C.line}" stroke-width="3"/>
    <path d="M150 326h600a20 20 0 0 1 20 20v212a20 20 0 0 1-20 20H150a20 20 0 0 1-20-20V346a20 20 0 0 1 20-20z" fill="url(#clothG)"/>
    <path d="M150 326h600a20 20 0 0 1 20 20v34H130v-34a20 20 0 0 1 20-20z" fill="#fff" opacity=".55"/>

    <!-- инструменты на лотке -->
    <g>
      <!-- зеркало -->
      <g transform="rotate(-4 300 420)">
        <rect x="212" y="410" width="300" height="20" rx="10" fill="url(#metal)" stroke="#9aa9be" stroke-width="2"/>
        <rect x="272" y="412" width="176" height="16" rx="8" fill="${C.blue}" opacity=".22"/>
        ${Array.from({ length: 18 }, (_, i) => `<rect x="${280 + i * 9}" y="413" width="3.5" height="14" rx="1.75" fill="#8fa3bd" opacity=".5"/>`).join('')}
        <circle cx="188" cy="420" r="34" fill="url(#metalV)" stroke="#93a6bf" stroke-width="3"/>
        <circle cx="188" cy="420" r="25" fill="#e3edff"/>
        <path d="M172 408a26 26 0 0 1 20-9" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M512 420h34" stroke="url(#metal)" stroke-width="14" stroke-linecap="round"/>
      </g>

      <!-- зонд -->
      <g transform="rotate(4 420 480)">
        <rect x="248" y="474" width="310" height="17" rx="8.5" fill="url(#metal)" stroke="#9aa9be" stroke-width="2"/>
        <rect x="306" y="476" width="180" height="13" rx="6.5" fill="${C.blueDeep}" opacity=".18"/>
        <path d="M248 482c-24 0-40-10-56-26" stroke="url(#metal)" stroke-width="13" fill="none" stroke-linecap="round"/>
        <path d="M558 482c24 0 40 10 54 28" stroke="url(#metal)" stroke-width="13" fill="none" stroke-linecap="round"/>
      </g>

      <!-- пинцет -->
      <g transform="rotate(10 470 546)">
        <path d="M300 540h250c14 0 22 6 22 6s-8 6-22 6H300z" fill="url(#metal)" stroke="#9aa9be" stroke-width="2"/>
        <path d="M300 540c-30 4-52 8-72 14m72 12c-30-4-52-8-72-14" stroke="url(#metal)" stroke-width="12" fill="none" stroke-linecap="round"/>
        <rect x="352" y="541" width="150" height="14" rx="7" fill="${C.blue}" opacity=".2"/>
      </g>

      <!-- наконечник -->
      <g transform="rotate(-14 660 400)">
        <rect x="618" y="330" width="52" height="196" rx="26" fill="url(#metal)" stroke="#93a6bf" stroke-width="2.5"/>
        <rect x="610" y="382" width="68" height="26" rx="13" fill="url(#blueG)"/>
        <rect x="626" y="430" width="36" height="9" rx="4.5" fill="#9aa9be" opacity=".6"/>
        <rect x="626" y="448" width="28" height="9" rx="4.5" fill="#9aa9be" opacity=".45"/>
        <path d="M618 336c-8-22-4-40 12-52l28-22c12-8 26 2 24 16l-4 58z" fill="url(#metal)" stroke="#93a6bf" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="646" cy="288" r="22" fill="url(#metalV)" stroke="#93a6bf" stroke-width="2"/>
        <circle cx="646" cy="288" r="11" fill="${C.blueDeep}" opacity=".45"/>
        <path d="M646 266v-46" stroke="url(#metal)" stroke-width="9" stroke-linecap="round"/>
        <path d="M646 220c7 9 11 16 11 22 0 8-5 13-11 13s-11-5-11-13c0-6 4-13 11-22z" fill="${C.blue}"/>
        <circle cx="616" cy="316" r="10" fill="#fff9d6" stroke="#e7dfa8" stroke-width="2"/>
        <rect x="614" y="344" width="11" height="170" rx="5.5" fill="#fff" opacity=".7"/>
      </g>
    </g>
  </g>

  <!-- шприц композита сверху слева -->
  <g transform="rotate(-40 190 190)">
    <rect x="86" y="172" width="34" height="12" rx="6" fill="#94a3b8"/>
    <rect x="116" y="160" width="22" height="36" rx="8" fill="url(#metalV)" stroke="${C.line}" stroke-width="2"/>
    <rect x="134" y="150" width="150" height="56" rx="16" fill="url(#whiteG)" stroke="${C.line}" stroke-width="2.5"/>
    <rect x="144" y="160" width="130" height="20" rx="10" fill="url(#blueG)"/>
    <rect x="144" y="186" width="80" height="10" rx="5" fill="${C.steel}"/>
    <path d="M284 166h20l5 12-5 12h-20z" fill="url(#metalV)" stroke="${C.line}" stroke-width="2"/>
    <path d="M309 174c20 2 34 3 48 5 5 .6 5 6.6 0 7.2-14 1.6-28 3-48 4.6z" fill="url(#metal)" stroke="#9aa9be" stroke-width="1.5"/>
  </g>

  <!-- боры справа сверху -->
  <g transform="translate(716 96) rotate(12)">
    <rect x="0" y="0" width="132" height="120" rx="20" fill="url(#whiteG)" stroke="${C.line}" stroke-width="2.5"/>
    <rect x="0" y="0" width="132" height="26" rx="20" fill="url(#blueG)"/>
    <path d="M0 20h132v6H0z" fill="url(#blueG)"/>
    ${[0, 1, 2, 3]
      .map((i) => {
        const x = 26 + i * 28;
        return `<rect x="${x - 3.5}" y="44" width="7" height="58" rx="3.5" fill="url(#metal)" stroke="#9aa9be" stroke-width="1"/>
    <circle cx="${x}" cy="46" r="9" fill="${i % 2 ? C.blueDark : C.blue}"/>`;
      })
      .join('\n    ')}
  </g>

  <!-- перчатка внизу справа -->
  <g transform="translate(700 520) rotate(-8) scale(.86)">
    <path d="M40 200c-8-56-13-90-10-124 1-18 26-18 28-1l8 60 5-84c1-18 27-18 28 0l4 80 10-68c3-17 29-14 27 4l-8 78 12-50c4-17 29-12 26 6l-14 80c-7 36-16 54-26 70-6 10-8 16-8 24z" fill="#fff" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M40 200c-8-56-13-90-10-124 1-18 26-18 28-1l8 60" fill="#e8f1ff"/>
  </g>

  <!-- плавающие «пузырьки» акцентов -->
  <circle cx="96" cy="470" r="14" fill="${C.blue}" opacity=".14"/>
  <circle cx="820" cy="300" r="20" fill="${C.blue}" opacity=".1"/>
  <circle cx="60" cy="240" r="9" fill="${C.blueLight}" opacity=".3"/>
</svg>
`;

/** Клиника — интерьер */
const clinic = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 700" width="960" height="700" role="img">
${defs(`
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f8fbff"/>
      <stop offset="1" stop-color="#e9f1fc"/>
    </linearGradient>
    <linearGradient id="floorG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#dde7f5"/>
      <stop offset="1" stop-color="#eff4fb"/>
    </linearGradient>
    <linearGradient id="chairG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset=".55" stop-color="#eaf1fb"/>
      <stop offset="1" stop-color="#cddcef"/>
    </linearGradient>
    <linearGradient id="winG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#cfe4ff"/>
      <stop offset="1" stop-color="#eaf4ff"/>
    </linearGradient>`)}
  <rect width="960" height="700" fill="url(#wall)"/>
  <path d="M0 470h960v230H0z" fill="url(#floorG)"/>
  <path d="M0 470h960" stroke="${C.line}" stroke-width="2"/>

  <!-- окно -->
  <g>
    <rect x="600" y="70" width="300" height="300" rx="18" fill="url(#winG)" stroke="${C.line}" stroke-width="3"/>
    <path d="M750 70v300M600 220h300" stroke="#fff" stroke-width="6" opacity=".9"/>
    <path d="M620 340c40-70 70-100 120-120 44-18 80-6 120 20v130H620z" fill="#fff" opacity=".35"/>
    <circle cx="836" cy="132" r="26" fill="#fff" opacity=".8"/>
  </g>

  <!-- шкаф -->
  <g>
    <rect x="40" y="180" width="230" height="290" rx="16" fill="#fff" stroke="${C.line}" stroke-width="3"/>
    <path d="M155 180v290" stroke="${C.line}" stroke-width="2"/>
    <path d="M40 300h230M40 386h230" stroke="${C.line}" stroke-width="2"/>
    ${[0, 1, 2]
      .map((r) => [0, 1].map((c) => `<rect x="${68 + c * 116}" y="${216 + r * 86}" width="72" height="10" rx="5" fill="${C.steel}"/>`).join(''))
      .join('')}
    <rect x="126" y="246" width="14" height="10" rx="5" fill="${C.blue}" opacity=".6"/>
    <rect x="126" y="332" width="14" height="10" rx="5" fill="${C.blue}" opacity=".6"/>
    <!-- предметы на шкафу -->
    <rect x="72" y="140" width="34" height="40" rx="8" fill="url(#blueG)" opacity=".85"/>
    <rect x="118" y="152" width="26" height="28" rx="7" fill="${C.steel}"/>
    <rect x="156" y="132" width="44" height="48" rx="10" fill="#fff" stroke="${C.line}" stroke-width="2"/>
    <rect x="166" y="146" width="24" height="8" rx="4" fill="${C.blue}" opacity=".5"/>
  </g>

  <!-- стоматологическая установка: кресло -->
  <g transform="translate(300 150)">
    <!-- основание -->
    <path d="M104 396h150a16 16 0 0 1 0 32H104a16 16 0 0 1 0-32z" fill="#b9c7da"/>
    <path d="M158 300h42v100h-42z" fill="url(#metalV)"/>
    <!-- сиденье -->
    <path d="M42 268h250a30 30 0 0 1 30 30v18a30 30 0 0 1-30 30H42a30 30 0 0 1-30-30v-18a30 30 0 0 1 30-30z" fill="url(#chairG)" stroke="${C.line}" stroke-width="3"/>
    <!-- спинка -->
    <path d="M12 122a34 34 0 0 1 34-34h44a34 34 0 0 1 34 34v146H12z" fill="url(#chairG)" stroke="${C.line}" stroke-width="3" transform="rotate(-16 74 178)"/>
    <!-- подголовник -->
    <rect x="-20" y="52" width="86" height="52" rx="22" fill="url(#chairG)" stroke="${C.line}" stroke-width="3" transform="rotate(-16 23 78)"/>
    <!-- подлокотник -->
    <rect x="196" y="228" width="130" height="18" rx="9" fill="#dbe6f5" stroke="${C.line}" stroke-width="2"/>
  </g>

  <!-- светильник -->
  <g transform="translate(430 60)">
    <path d="M110 0v54" stroke="${C.line}" stroke-width="8" stroke-linecap="round"/>
    <path d="M110 54c-56 4-96 22-120 54" stroke="url(#metal)" stroke-width="12" fill="none" stroke-linecap="round"/>
    <g transform="rotate(24 -8 116)">
      <rect x="-70" y="94" width="128" height="48" rx="20" fill="url(#whiteG)" stroke="${C.line}" stroke-width="3"/>
      <rect x="-58" y="134" width="104" height="14" rx="7" fill="#dbe8ff"/>
      <path d="M-58 148 -34 214h96l24-66z" fill="${C.blueLight}" opacity=".2"/>
      <circle cx="-30" cy="118" r="9" fill="${C.blueMist}"/>
      <circle cx="-6" cy="118" r="9" fill="${C.blueMist}"/>
      <circle cx="18" cy="118" r="9" fill="${C.blueMist}"/>
    </g>
  </g>

  <!-- столик с инструментами -->
  <g transform="translate(600 330)">
    <rect x="0" y="0" width="200" height="16" rx="8" fill="url(#metalV)" stroke="${C.line}" stroke-width="2"/>
    <rect x="88" y="16" width="16" height="124" fill="url(#metalV)"/>
    <ellipse cx="96" cy="146" rx="52" ry="12" fill="#c3d1e4"/>
    <rect x="18" y="-14" width="70" height="14" rx="7" fill="url(#metal)"/>
    <rect x="104" y="-12" width="56" height="12" rx="6" fill="url(#metal)"/>
    <rect x="24" y="-30" width="40" height="16" rx="6" fill="url(#blueG)" opacity=".8"/>
  </g>

  <!-- растение -->
  <g transform="translate(856 372)">
    <path d="M28 98V44" stroke="#4d7c5f" stroke-width="6" stroke-linecap="round"/>
    <path d="M28 60c-26-6-36-24-34-46 22-2 34 14 34 32zM28 46c22-8 30-24 26-44-20 0-30 16-30 32z" fill="#5fa37a"/>
    <path d="M8 98h40l-6 40a10 10 0 0 1-10 8H24a10 10 0 0 1-10-8z" fill="#fff" stroke="${C.line}" stroke-width="2.5"/>
  </g>

  <!-- тени на полу -->
  <ellipse cx="480" cy="560" rx="230" ry="26" fill="${C.blueDeep}" opacity=".07"/>
  <ellipse cx="696" cy="482" rx="90" ry="14" fill="${C.blueDeep}" opacity=".06"/>
</svg>
`;

/* ==========================================================================
   Логотип, favicon, паттерн
   ========================================================================== */
const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img">
  <defs>
    <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.blue}"/>
      <stop offset="1" stop-color="${C.blueDeep}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="122" fill="url(#lg)"/>
  <path d="M256 118c-24 0-41 8-63 15-19 7-33 11-50 11-12 0-25-2-37-7-14-6-29 5-33 20-15 45-14 96 2 155 10 36 25 76 43 120 12 29 22 48 32 62 10 16 24 26 41 26 21 0 33-15 40-38l13-43c4-14 8-21 12-21s8 7 12 21l13 43c7 23 19 38 40 38 17 0 31-10 41-26 10-14 20-33 32-62 18-44 33-84 43-120 16-59 17-110 2-155-4-15-19-26-33-20-12 5-25 7-37 7-17 0-31-4-50-11-22-7-39-15-63-15z" fill="#fff"/>
</svg>
`;

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs><linearGradient id="f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.blue}"/><stop offset="1" stop-color="${C.blueDeep}"/></linearGradient></defs>
  <rect width="64" height="64" rx="16" fill="url(#f)"/>
  <path d="M32 15c-3 0-5.2 1-8 1.9-2.4.9-4.1 1.4-6.3 1.4-1.5 0-3.1-.3-4.6-.9-1.8-.7-3.6.6-4.1 2.5-1.9 5.7-1.8 12 .2 19.4 1.3 4.5 3.2 9.5 5.4 15 1.5 3.6 2.7 6 4 7.7 1.3 2 3 3.3 5.1 3.3 2.6 0 4.1-1.9 5-4.8l1.6-5.4c.5-1.7 1-2.6 1.5-2.6s1 .9 1.5 2.6l1.6 5.4c.9 2.9 2.4 4.8 5 4.8 2.1 0 3.8-1.3 5.1-3.3 1.3-1.7 2.5-4.1 4-7.7 2.2-5.5 4.1-10.5 5.4-15 2-7.4 2.1-13.7.2-19.4-.5-1.9-2.3-3.2-4.1-2.5-1.5.6-3.1.9-4.6.9-2.2 0-3.9-.5-6.3-1.4-2.8-.9-5-1.9-8-1.9z" fill="#fff"/>
</svg>
`;

/** OG-обложка 1200×630 */
const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="ogbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset=".55" stop-color="#f2f7ff"/>
      <stop offset="1" stop-color="#dbe8ff"/>
    </linearGradient>
    <linearGradient id="ogblue" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.blue}"/>
      <stop offset="1" stop-color="${C.blueDeep}"/>
    </linearGradient>
    <linearGradient id="ogmetal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8fa3bd"/><stop offset=".3" stop-color="#ffffff"/><stop offset="1" stop-color="#9fb0c7"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#ogbg)"/>
  <circle cx="980" cy="150" r="300" fill="${C.blue}" opacity=".07"/>
  <circle cx="1080" cy="520" r="200" fill="${C.blue}" opacity=".05"/>

  <g transform="translate(88 96)">
    <rect width="88" height="88" rx="24" fill="url(#ogblue)"/>
    <path d="M44 22c-4 0-7 1.4-11 2.6-3.2 1.2-5.6 1.9-8.6 1.9-2 0-4.2-.4-6.2-1.2-2.4-1-4.9.8-5.6 3.4-2.6 7.8-2.4 16.4.3 26.6 1.8 6.2 4.4 13 7.4 20.6 2 4.9 3.7 8.2 5.5 10.5 1.7 2.7 4 4.5 6.9 4.5 3.6 0 5.6-2.6 6.9-6.6l2.2-7.4c.7-2.4 1.4-3.6 2-3.6s1.3 1.2 2 3.6l2.2 7.4c1.3 4 3.3 6.6 6.9 6.6 2.9 0 5.2-1.8 6.9-4.5 1.8-2.3 3.5-5.6 5.5-10.5 3-7.6 5.6-14.4 7.4-20.6 2.7-10.2 2.9-18.8.3-26.6-.7-2.6-3.2-4.4-5.6-3.4-2 .8-4.2 1.2-6.2 1.2-3 0-5.4-.7-8.6-1.9C51 23.4 48 22 44 22z" fill="#fff"/>
  </g>
  <text x="196" y="140" font-family="Inter, Helvetica, Arial, sans-serif" font-size="44" font-weight="700" fill="${C.ink}" letter-spacing="-1">SOCO<tspan fill="${C.blue}">.</tspan></text>
  <text x="197" y="172" font-family="Inter, Helvetica, Arial, sans-serif" font-size="17" font-weight="600" fill="${C.blue}" letter-spacing="5">UKRAINE · DENTAL</text>

  <text x="88" y="300" font-family="Inter, Helvetica, Arial, sans-serif" font-size="60" font-weight="700" fill="${C.ink}" letter-spacing="-1.6">Профессиональные</text>
  <text x="88" y="368" font-family="Inter, Helvetica, Arial, sans-serif" font-size="60" font-weight="700" fill="${C.ink}" letter-spacing="-1.6">стоматологические</text>
  <text x="88" y="436" font-family="Inter, Helvetica, Arial, sans-serif" font-size="60" font-weight="700" fill="url(#ogblue)" letter-spacing="-1.6">материалы</text>

  <text x="88" y="500" font-family="Inter, Helvetica, Arial, sans-serif" font-size="24" fill="${C.slate}">Оборудование и расходники для клиник · Доставка по Украине</text>

  <g transform="translate(88 536)">
    ${['5 000+ товаров', 'Оригинал и сертификаты', 'Доставка 1–2 дня']
      .map((t, i) => {
        const x = i * 300;
        return `<rect x="${x}" y="0" width="272" height="48" rx="24" fill="#fff" stroke="${C.bluePale}" stroke-width="2"/>
    <circle cx="${x + 28}" cy="24" r="9" fill="${C.blue}"/>
    <path d="m${x + 24} 24 3 3.4 5.6-6.4" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="${x + 50}" y="30" font-family="Inter, Helvetica, Arial, sans-serif" font-size="17" font-weight="600" fill="${C.ink}">${t}</text>`;
      })
      .join('\n    ')}
  </g>

  <!-- инструменты справа -->
  <g transform="translate(880 250) rotate(-24)">
    <rect x="0" y="0" width="240" height="18" rx="9" fill="url(#ogmetal)" stroke="#9aa9be" stroke-width="1.5"/>
    <rect x="52" y="2" width="140" height="14" rx="7" fill="${C.blue}" opacity=".22"/>
    <circle cx="-26" cy="9" r="30" fill="#eef3fa" stroke="#93a6bf" stroke-width="2.5"/>
    <circle cx="-26" cy="9" r="21" fill="#dbeafe"/>
  </g>
  <g transform="translate(870 340) rotate(16)">
    <rect x="0" y="0" width="230" height="16" rx="8" fill="url(#ogmetal)" stroke="#9aa9be" stroke-width="1.5"/>
    <rect x="50" y="2" width="130" height="12" rx="6" fill="${C.blueDeep}" opacity=".18"/>
    <path d="M0 8c-22 0-36-9-50-24" stroke="url(#ogmetal)" stroke-width="12" fill="none" stroke-linecap="round"/>
  </g>
  <g transform="translate(900 420) rotate(-8)">
    <rect x="0" y="0" width="150" height="52" rx="16" fill="#fff" stroke="${C.bluePale}" stroke-width="2.5"/>
    <rect x="10" y="10" width="120" height="18" rx="9" fill="url(#ogblue)" opacity=".9"/>
    <rect x="10" y="34" width="76" height="10" rx="5" fill="#e2e8f2"/>
  </g>
</svg>
`;

/* ==========================================================================
   Запись файлов
   ========================================================================== */
await mkdir(PROD, { recursive: true });

const written = [];
for (const [name, svg] of Object.entries(items)) {
  const file = path.join(PROD, `${name}.svg`);
  await writeFile(file, svg, 'utf8');
  written.push([`products/${name}.svg`, Buffer.byteLength(svg)]);
}

const roots = { 'hero-instruments': hero, clinic, logo, favicon, 'og-cover': og };
for (const [name, svg] of Object.entries(roots)) {
  const file = path.join(IMG, `${name}.svg`);
  await writeFile(file, svg, 'utf8');
  written.push([`${name}.svg`, Buffer.byteLength(svg)]);
}

const total = written.reduce((s, [, b]) => s + b, 0);
console.log(`\n  Сгенерировано ${written.length} SVG · ${(total / 1024).toFixed(1)} КБ суммарно\n`);
for (const [n, b] of written) console.log(`   ✓ ${n.padEnd(42)} ${(b / 1024).toFixed(1).padStart(6)} КБ`);
console.log('');
