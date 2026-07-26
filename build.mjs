/**
 * SOCO Ukraine — сборщик статических страниц.
 *
 * Собирает готовые HTML-файлы из общего каркаса (src/layout.html),
 * переиспользуемых партиалов (src/partials/*.html) и страниц (src/pages/*.html).
 *
 *   node build.mjs            — одна сборка
 *   node build.mjs --watch    — пересборка при изменении файлов
 *
 * Синтаксис страницы: первый HTML-комментарий содержит JSON с мета-данными.
 * В разметке доступны включения:  <!-- @include header -->
 */

import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const PAGES = path.join(SRC, 'pages');
const PARTIALS = path.join(SRC, 'partials');

const SITE = {
  name: 'SOCO Ukraine',
  legalName: 'ТОВ «СОКО УКРАЇНА»',
  url: 'https://soco.ua',
  phone: '+380 (44) 501-22-80',
  phoneHref: '+380445012280',
  phone2: '+380 (67) 401-15-90',
  phone2Href: '+380674011590',
  email: 'info@soco.ua',
  address: 'вул. Антоновича, 44, оф. 210',
  city: 'Київ',
  zip: '01033',
  locale: 'uk_UA',
  lang: 'uk',
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
      'Професійні стоматологічні матеріали та обладнання для клінік, лікарів і зуботехнічних лабораторій. Оригінальна сертифікована продукція з доставкою по Україні.',
    email: SITE.email,
    telephone: SITE.phoneHref,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.address,
      addressLocality: SITE.city,
      postalCode: SITE.zip,
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
    sameAs: [
      'https://www.facebook.com/socoukraine',
      'https://www.instagram.com/socoukraine',
      'https://t.me/socoukraine',
      'https://www.youtube.com/@socoukraine',
    ],
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
    priceRange: '₴₴',
    currenciesAccepted: 'UAH',
    paymentAccepted: 'Готівка, Картка, Безготівковий розрахунок, Оплата частинами',
    address: org.address,
    geo: { '@type': 'GeoCoordinates', latitude: 50.4364, longitude: 30.5119 },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '19:00',
      },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '10:00', closes: '16:00' },
    ],
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

async function buildPage(file, layout, partials) {
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
    KEYWORDS: esc(meta.keywords || 'стоматологічні матеріали, стоматологічне обладнання, купити, Україна, SOCO Ukraine'),
    CANONICAL: canonical,
    OG_TYPE: meta.ogType || 'website',
    OG_IMAGE: `${SITE.url}${meta.ogImage || '/assets/img/og-cover.png'}`,
    OG_LOCALE: SITE.locale,
    SITE_NAME: SITE.name,
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

  // Отметить активный пункт меню
  if (meta.nav) {
    html = html.replaceAll(`data-nav="${meta.nav}"`, `data-nav="${meta.nav}" data-active="true"`);
  }

  await writeFile(path.join(ROOT, slug), html, 'utf8');
  return { slug, size: Buffer.byteLength(html) };
}

async function buildSitemap(pages) {
  const today = process.env.BUILD_DATE || '2026-07-26';
  const priority = { 'index.html': '1.0', 'catalog.html': '0.9', 'product.html': '0.8', 'contacts.html': '0.7' };
  const urls = pages
    .map(({ slug }) => {
      const loc = slug === 'index.html' ? `${SITE.url}/` : `${SITE.url}/${slug}`;
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority[slug] || '0.6'}</priority>\n  </url>`;
    })
    .join('\n');

  await writeFile(
    path.join(ROOT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    'utf8'
  );

  await writeFile(
    path.join(ROOT, 'robots.txt'),
    `User-agent: *\nAllow: /\nDisallow: /cart.html\nDisallow: /account.html\nDisallow: /compare.html\n\nSitemap: ${SITE.url}/sitemap.xml\n`,
    'utf8'
  );
}

async function build() {
  const t0 = performance.now();
  const layout = await readFile(path.join(SRC, 'layout.html'), 'utf8');
  const partials = await loadPartials();
  const files = (await readdir(PAGES)).filter((f) => f.endsWith('.html')).sort();

  const built = [];
  for (const f of files) {
    try {
      built.push(await buildPage(f, layout, partials));
    } catch (e) {
      console.error(`  ✗ ${f}: ${e.message}`);
    }
  }

  await buildSitemap(built);

  const ms = (performance.now() - t0).toFixed(0);
  console.log(`\n  SOCO Ukraine — зібрано ${built.length} сторінок за ${ms} мс\n`);
  for (const b of built) {
    console.log(`   ✓ ${b.slug.padEnd(22)} ${(b.size / 1024).toFixed(1).padStart(7)} KB`);
  }
  console.log(`   ✓ sitemap.xml, robots.txt\n`);
}

await mkdir(path.join(ROOT, 'assets', 'css'), { recursive: true });
await build();

if (process.argv.includes('--watch')) {
  console.log('  👀 Стежу за змінами в src/ …\n');
  let timer;
  watch(SRC, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => build().catch(console.error), 80);
  });
}
