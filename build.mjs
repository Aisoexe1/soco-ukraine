/**
 * SOCO-SANI — сборщик статических страниц.
 *
 * Собирает готовые HTML-файлы из общего каркаса (src/layout.html),
 * переиспользуемых партиалов (src/partials/*.html) и страниц (src/pages/*.html).
 *
 *   node build.mjs                        — базовая сборка в корень репозитория
 *   node build.mjs --watch                — пересборка при изменении файлов
 *   node build.mjs --theme=premium-black  — визуальная версия в dist/premium-black
 *   node build.mjs --themes               — обе визуальные версии + витрина dist/index.html
 *
 * Разметка, контент, данные и скрипты у всех версий ОДНИ И ТЕ ЖЕ (src/ + assets/).
 * Версии отличаются только подключаемой темой оформления (src/themes/*.css)
 * и атрибутом data-theme на <html>.
 *
 * Синтаксис страницы: первый HTML-комментарий содержит JSON с мета-данными.
 * В разметке доступны включения:  <!-- @include header -->
 */

import { readFile, writeFile, readdir, mkdir, cp, rm } from 'node:fs/promises';
import { watch } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const PAGES = path.join(SRC, 'pages');
const PARTIALS = path.join(SRC, 'partials');
const DIST = path.join(ROOT, 'dist');

/**
 * Реальні дані компанії. Джерело — офіційний сайт замовника
 * https://soco-sani.com.ua (розділи «Про нас», «Контакти»,
 * «Доставка та оплата», «Гарантія», «Повернення та обмін»).
 * Нічого тут не вигадуємо: якщо даних немає — поле лишається порожнім
 * і відповідний блок не виводиться.
 */
const SITE = {
  name: 'SOCO-SANI',
  legalName: 'SOCO-SANI',
  legalForm: 'Приватне підприємство',
  url: 'https://soco-sani.com.ua',
  contactPerson: 'Анна',
  phone: '+380 (98) 755-55-88',
  phoneHref: '+380987555588',
  phone2: '+380 (98) 385-96-97',
  phone2Href: '+380983859697',
  email: 'molmar0175@gmail.com',
  address: 'вул. Куренівська, 5/7, 3 поверх, офіс 105',
  addressShort: 'вул. Куренівська, 5/7',
  city: 'Київ',
  zip: '',
  reviewsCount: 181,
  reviewsUrl: 'https://soco-sani.com.ua/ua/testimonials',
  brands: ['Coxo', 'Woodpecker', 'Sani', 'Nic', 'Soco'],
  locale: 'uk_UA',
  lang: 'uk',
  crmApiUrl: process.env.SOCO_CRM_API_URL?.trim() || '',
};

/* ==========================================================================
   Визуальные темы.
   Контент и функциональность общие; отличается только слой оформления.
   ========================================================================== */
const THEMES = {
  base: {
    id: '',
    title: 'Базова версія',
    outDir: ROOT,
    css: 'src/input.css',
    themeColor: '#ffffff',
    colorScheme: 'light',
  },
  'premium-black': {
    id: 'premium-black',
    title: 'Premium Black',
    outDir: path.join(DIST, 'premium-black'),
    css: 'src/themes/premium-black.css',
    themeColor: '#111313',
    colorScheme: 'dark',
  },
  'dental-future': {
    id: 'dental-future',
    title: 'Dental Future',
    outDir: path.join(DIST, 'dental-future'),
    css: 'src/themes/dental-future.css',
    themeColor: '#061722',
    colorScheme: 'dark',
  },
};

const argOf = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Подставляет партиалы: <!-- @include name --> */
async function expandIncludes(html, partials, depth = 0) {
  if (depth > 6) return html;
  const re = /<!--\s*@include\s+([\w-]+)\s*-->/g;
  if (!re.test(html)) return html;
  re.lastIndex = 0;
  const out = html.replace(re, (_, name) => {
    if (!(name in partials)) {
      console.warn(`  ⚠ партіал не знайдено: ${name}`);
      return '';
    }
    return partials[name];
  });
  return expandIncludes(out, partials, depth + 1);
}

/** Заменяет {{KEY}} на значения */
function interpolate(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (m, key) => (key in vars ? vars[key] : ''));
}

async function loadPartials() {
  const files = (await readdir(PARTIALS)).filter((f) => f.endsWith('.html'));
  const partials = {};
  for (const f of files) {
    partials[path.basename(f, '.html')] = await readFile(path.join(PARTIALS, f), 'utf8');
  }
  return partials;
}

/** Общий JSON-LD, присутствующий на каждой странице */
function baseJsonLd() {
  const org = {
    '@type': 'Organization',
    '@id': `${SITE.url}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    logo: { '@type': 'ImageObject', url: `${SITE.url}/assets/img/logo.svg`, width: 512, height: 512 },
    image: `${SITE.url}/assets/img/og-cover.png`,
    description:
      'Продаж стоматологічного обладнання та матеріалів. Офіційний дистриб’ютор марок Coxo, Woodpecker, Sani, Nic і Soco. Прямі постачання без посередників, офіційна гарантія на кожен товар.',
    email: SITE.email,
    telephone: SITE.phoneHref,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.address,
      addressLocality: SITE.city,
      addressCountry: 'UA',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: SITE.phoneHref,
        contactType: 'sales',
        areaServed: 'UA',
        availableLanguage: ['uk', 'ru'],
      },
    ],
    brand: SITE.brands.map((b) => ({ '@type': 'Brand', name: b })),
  };

  const website = {
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    url: SITE.url,
    name: SITE.name,
    inLanguage: 'uk-UA',
    publisher: { '@id': `${SITE.url}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE.url}/catalog.html?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };

  const store = {
    '@type': 'MedicalBusiness',
    '@id': `${SITE.url}/#store`,
    name: SITE.name,
    image: `${SITE.url}/assets/img/og-cover.png`,
    url: SITE.url,
    telephone: SITE.phoneHref,
    email: SITE.email,
    currenciesAccepted: 'UAH',
    paymentAccepted: 'Передоплата, Готівка, Оплата на картку, Реквізити ФОП, Післяплата',
    address: org.address,
    areaServed: { '@type': 'Country', name: 'Україна' },
  };

  return [org, website, store];
}

function buildJsonLd(meta) {
  const graph = [...baseJsonLd()];

  if (meta.breadcrumbs?.length) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${SITE.url}/${meta.slug}#breadcrumbs`,
      itemListElement: meta.breadcrumbs.map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: b.name,
        item: `${SITE.url}${b.url}`,
      })),
    });
  }

  if (meta.jsonld) graph.push(...(Array.isArray(meta.jsonld) ? meta.jsonld : [meta.jsonld]));

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

async function buildPage(file, layout, partials, theme) {
  const raw = await readFile(path.join(PAGES, file), 'utf8');

  const metaMatch = raw.match(/^\s*<!--META\s*([\s\S]*?)-->/);
  if (!metaMatch) throw new Error(`${file}: відсутній блок <!--META ... -->`);
  const meta = JSON.parse(metaMatch[1]);
  const body = raw.slice(metaMatch[0].length).trim();

  const slug = path.basename(file);
  meta.slug = slug;
  const canonical = slug === 'index.html' ? `${SITE.url}/` : `${SITE.url}/${slug}`;

  const vars = {
    LANG: SITE.lang,
    TITLE: esc(meta.title),
    DESCRIPTION: esc(meta.description),
    KEYWORDS: esc(meta.keywords || `стоматологічне обладнання, стоматологічні матеріали, купити, Україна, ${SITE.name}`),
    CANONICAL: canonical,
    OG_TYPE: meta.ogType || 'website',
    OG_IMAGE: `${SITE.url}${meta.ogImage || '/assets/img/og-cover.png'}`,
    OG_LOCALE: SITE.locale,
    SITE_NAME: SITE.name,
    SITE_URL: SITE.url,
    LEGAL_NAME: SITE.legalName,
    LEGAL_FORM: SITE.legalForm,
    CONTACT_PERSON: SITE.contactPerson,
    PHONE: SITE.phone,
    PHONE_HREF: SITE.phoneHref,
    PHONE2: SITE.phone2,
    PHONE2_HREF: SITE.phone2Href,
    EMAIL: SITE.email,
    ADDRESS: SITE.address,
    ADDRESS_SHORT: SITE.addressShort,
    CITY: SITE.city,
    REVIEWS_COUNT: String(SITE.reviewsCount),
    REVIEWS_URL: SITE.reviewsUrl,
    BRANDS: SITE.brands.join(', '),
    CRM_API_URL: esc(SITE.crmApiUrl),
    THEME_ATTR: theme.id ? ` data-theme="${theme.id}"` : '',
    THEME_META:
      theme.colorScheme === 'light'
        ? `<meta name="theme-color" content="${theme.themeColor}" media="(prefers-color-scheme: light)" />`
        : `<meta name="theme-color" content="${theme.themeColor}" />`,
    COLOR_SCHEME: theme.colorScheme,
    JSONLD: buildJsonLd(meta),
    BODY: await expandIncludes(body, partials),
    PAGE_SCRIPT: meta.script ? `\n    <script src="assets/js/${meta.script}" defer></script>` : '',
    BODY_CLASS: meta.bodyClass || '',
    ROBOTS: meta.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    NAV_ACTIVE: meta.nav || '',
    PRELOAD: (meta.preload || [])
      .map((p) => `\n    <link rel="preload" href="${p.href}" as="${p.as}"${p.type ? ` type="${p.type}"` : ''} crossorigin>`)
      .join(''),
  };

  let html = interpolate(layout, vars);
  html = await expandIncludes(html, partials);
  // Другий прохід: плейсхолдери всередині партіалів і сторінок
  // (контакти компанії живуть лише в SITE, а не в розмітці).
  html = interpolate(html, vars);

  // Отметить активный пункт меню
  if (meta.nav) {
    html = html.replaceAll(`data-nav="${meta.nav}"`, `data-nav="${meta.nav}" data-active="true"`);
  }

  await writeFile(path.join(theme.outDir, slug), html, 'utf8');
  return { slug, size: Buffer.byteLength(html) };
}

async function buildSitemap(pages, theme) {
  const today = process.env.BUILD_DATE || '2026-07-26';
  const priority = { 'index.html': '1.0', 'catalog.html': '0.9', 'product.html': '0.8', 'contacts.html': '0.7' };
  const urls = pages
    .map(({ slug }) => {
      const loc = slug === 'index.html' ? `${SITE.url}/` : `${SITE.url}/${slug}`;
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority[slug] || '0.6'}</priority>\n  </url>`;
    })
    .join('\n');

  await writeFile(
    path.join(theme.outDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    'utf8'
  );

  await writeFile(
    path.join(theme.outDir, 'robots.txt'),
    `User-agent: *\nAllow: /\nDisallow: /cart.html\nDisallow: /account.html\nDisallow: /compare.html\n\nSitemap: ${SITE.url}/sitemap.xml\n`,
    'utf8'
  );
}

/** Запускает Tailwind CLI для указанной точки входа. */
function compileCss(input, output) {
  return new Promise((resolve, reject) => {
    const bin = path.join(ROOT, 'node_modules', '.bin', 'tailwindcss');
    const child = spawn(bin, ['-i', input, '-o', output, '--minify'], { cwd: ROOT, stdio: 'ignore' });
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`tailwindcss завершився з кодом ${code}`))));
  });
}

/**
 * Копирует общие ассеты (шрифты, изображения, скрипты) в каталог версии.
 * Дублируется только сборочный результат — исходники остаются едиными.
 */
async function copyShared(theme) {
  await rm(theme.outDir, { recursive: true, force: true });
  await mkdir(path.join(theme.outDir, 'assets', 'css'), { recursive: true });

  for (const dir of ['fonts', 'img', 'js']) {
    await cp(path.join(ROOT, 'assets', dir), path.join(theme.outDir, 'assets', dir), { recursive: true });
  }
  await cp(path.join(ROOT, 'assets', 'css', 'fonts.css'), path.join(theme.outDir, 'assets', 'css', 'fonts.css'));
  await cp(path.join(ROOT, 'site.webmanifest'), path.join(theme.outDir, 'site.webmanifest'));
}

async function build(theme = THEMES.base) {
  const t0 = performance.now();
  const layout = await readFile(path.join(SRC, 'layout.html'), 'utf8');
  const partials = await loadPartials();
  const files = (await readdir(PAGES)).filter((f) => f.endsWith('.html')).sort();

  if (theme.outDir !== ROOT) await copyShared(theme);
  await mkdir(path.join(theme.outDir, 'assets', 'css'), { recursive: true });

  const built = [];
  for (const f of files) {
    try {
      built.push(await buildPage(f, layout, partials, theme));
    } catch (e) {
      console.error(`  ✗ ${f}: ${e.message}`);
    }
  }

  await buildSitemap(built, theme);
  await compileCss(path.join(ROOT, theme.css), path.join(theme.outDir, 'assets', 'css', 'style.css'));

  const ms = (performance.now() - t0).toFixed(0);
  const where = path.relative(ROOT, theme.outDir) || '.';
  console.log(`\n  ${SITE.name} · ${theme.title} → ${where}/ — ${built.length} сторінок за ${ms} мс`);
  for (const b of built) {
    console.log(`   ✓ ${b.slug.padEnd(22)} ${(b.size / 1024).toFixed(1).padStart(7)} KB`);
  }
  console.log(`   ✓ style.css, sitemap.xml, robots.txt\n`);
}

/** Витрина со ссылками на обе визуальные версии (служебный файл сборки). */
async function buildShowcase() {
  const cards = Object.values(THEMES)
    .filter((t) => t.id)
    .map(
      (t) => `      <a class="card" href="${path.basename(t.outDir)}/index.html" style="--sw:${t.themeColor}">
        <span class="sw"></span>
        <b>${t.title}</b>
        <span class="meta">data-theme="${t.id}"</span>
      </a>`
    )
    .join('\n');

  await writeFile(
    path.join(DIST, 'index.html'),
    `<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>SOCO-SANI — візуальні версії</title>
<link rel="icon" href="premium-black/assets/img/favicon.svg" type="image/svg+xml" />
<style>
  :root{color-scheme:dark}
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0f14;color:#e7edf5;
       font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
  main{width:min(720px,90vw);padding:40px 0}
  h1{font-size:22px;font-weight:600;letter-spacing:-.02em;margin:0 0 4px}
  p{margin:0 0 28px;color:#8a99ad;font-size:14px}
  .grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
  .card{display:grid;gap:8px;padding:20px;border:1px solid #1d2733;border-radius:14px;
        background:#111823;color:inherit;text-decoration:none;transition:border-color .2s,transform .2s}
  .card:hover{border-color:#31465e;transform:translateY(-2px)}
  .sw{width:34px;height:34px;border-radius:9px;background:var(--sw);border:1px solid #2a3644}
  b{font-size:16px;font-weight:600}
  .meta{font-size:12px;color:#7e8ea3;font-family:ui-monospace,Menlo,Consolas,monospace}
</style>
</head>
<body>
  <main>
    <h1>SOCO-SANI — візуальні версії</h1>
    <p>Однаковий контент, дані та функціональність. Відрізняється лише шар оформлення.</p>
    <div class="grid">
${cards}
    </div>
  </main>
</body>
</html>
`,
    'utf8'
  );
  console.log(`   ✓ dist/index.html — витрина версій\n`);
}

const themeArg = argOf('theme');
if (process.argv.includes('--themes')) {
  for (const key of Object.keys(THEMES).filter((k) => THEMES[k].id)) await build(THEMES[key]);
  await buildShowcase();
} else if (themeArg) {
  const theme = THEMES[themeArg];
  if (!theme) {
    console.error(`  ✗ невідома тема: ${themeArg}. Доступні: ${Object.keys(THEMES).join(', ')}`);
    process.exit(1);
  }
  await build(theme);
} else {
  await build(THEMES.base);
}

if (process.argv.includes('--watch')) {
  console.log('  👀 Стежу за змінами в src/ …\n');
  let timer;
  watch(SRC, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => build().catch(console.error), 80);
  });
}
