/**
 * SOCO-SANI — сторінка товару.
 * Галерея, вкладки, кількість, схожі товари, відгуки, Product-розмітка Schema.org.
 */
(function () {
  'use strict';

  const S = window.SOCO;
  const D = window.SOCO_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const root = $('[data-product-root]');
  if (!root) return;

  const id = new URLSearchParams(location.search).get('id');
  const p = D.byId(id) || D.PRODUCTS[0];

  /* ======================================================================
     Якщо товар не знайдено
     ====================================================================== */
  if (!p) {
    root.innerHTML = `
      <div class="mx-auto max-w-lg py-24 text-center">
        <h1 class="text-2xl font-semibold text-ink-900">Товар не знайдено</h1>
        <p class="mt-3 text-ink-500">Можливо, позицію знято з продажу. Подивіться каталог або напишіть нам — підберемо аналог.</p>
        <div class="mt-7 flex justify-center gap-3">
          <a href="catalog.html" class="btn-primary">До каталогу</a>
          <a href="contacts.html" class="btn-secondary">Написати нам</a>
        </div>
      </div>`;
    return;
  }

  const cat = D.catById(p.cat);
  const brand = D.brandById(p.brand);

  /* ======================================================================
     Мета-дані сторінки
     ====================================================================== */
  document.title = `${p.name} — купити в Україні | SOCO-SANI`;
  $('meta[name="description"]').setAttribute('content', `${p.short} Ціна ${S.money(p.price)}. ${brand.name}. Доставка по Україні за 1–3 дні.`);
  const canonical = $('link[rel="canonical"]');
  if (canonical) canonical.href = `https://soco-sani.com.ua/product.html?id=${encodeURIComponent(p.id)}`;
  const ogTitle = $('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', p.name);

  // Schema.org Product
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    sku: p.sku,
    image: [`https://soco-sani.com.ua/${p.image}`],
    brand: { '@type': 'Brand', name: brand.name },
    category: cat.name,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: p.rating.toFixed(1),
      reviewCount: p.reviews,
      bestRating: '5',
    },
    offers: {
      '@type': 'Offer',
      url: `https://soco-sani.com.ua/product.html?id=${p.id}`,
      priceCurrency: 'UAH',
      price: p.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      seller: { '@type': 'Organization', name: 'SOCO-SANI' },
      priceValidUntil: '2026-12-31',
    },
  });
  document.head.appendChild(ld);

  /* ======================================================================
     Хлібні крихти
     ====================================================================== */
  const crumbs = $('[data-breadcrumbs]');
  crumbs.insertAdjacentHTML(
    'beforeend',
    `<li aria-hidden="true" class="text-ink-300">/</li>
     <li><a href="catalog.html?cat=${cat.id}" class="transition-colors hover:text-brand-700">${cat.name}</a></li>
     <li aria-hidden="true" class="text-ink-300">/</li>
     <li><span class="line-clamp-1 font-medium text-ink-900">${S.escapeHtml(p.name)}</span></li>`
  );

  /* ======================================================================
     Заповнення картки
     ====================================================================== */
  const img = $('[data-p-image]');
  img.src = p.image;
  img.alt = p.name;

  $('[data-p-badges]').innerHTML = S.badgeHtml(p);
  $('[data-p-brand]').textContent = brand.name;
  $('[data-p-brand]').href = `catalog.html?brand=${brand.id}`;
  $('[data-p-sku]').textContent = p.sku;
  $('[data-p-name]').textContent = p.name;
  $('[data-p-stars]').innerHTML = S.stars(p.rating, 'h-4 w-4');
  $('[data-p-rating]').textContent = p.rating.toFixed(1);
  $('[data-p-reviews]').textContent = `${p.reviews} ${S.plural(p.reviews, 'відгук', 'відгуки', 'відгуків')}`;
  $('[data-p-stock]').innerHTML = S.stockHtml(p);
  $('[data-p-short]').textContent = p.short;
  $('[data-p-price]').textContent = S.money(p.price);
  $('[data-p-unit]').textContent = p.unit;
  $('[data-p-desc]').textContent = p.description;

  if (p.oldPrice) {
    $('[data-p-old]').textContent = S.money(p.oldPrice);
    $('[data-p-save]').innerHTML = `<span class="badge bg-rose-500 text-white">Економія ${S.money(p.oldPrice - p.price)}</span>`;
  } else {
    $('[data-p-old]').remove();
    $('[data-p-save]').remove();
  }

  /* --- Переваги --- */
  $('[data-p-features]').innerHTML = p.features
    .map(
      (f) => `
      <li class="flex items-start gap-3">
        <span class="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
          <svg viewBox="0 0 24 24" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        <span class="text-[15px] text-ink-700">${S.escapeHtml(f)}</span>
      </li>`
    )
    .join('');

  /* --- Характеристики --- */
  $('[data-p-specs]').innerHTML =
    p.specs
      .map(
        ([k, v], i) => `
        <div class="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:gap-6 ${i % 2 ? 'bg-white' : 'bg-ink-50/70'}">
          <dt class="text-[14px] text-ink-500 sm:w-56 sm:shrink-0">${S.escapeHtml(k)}</dt>
          <dd class="text-[14px] font-medium text-ink-900">${S.escapeHtml(v)}</dd>
        </div>`
      )
      .join('') +
    `<div class="flex flex-col gap-1 bg-white px-5 py-3.5 sm:flex-row sm:gap-6">
       <dt class="text-[14px] text-ink-500 sm:w-56 sm:shrink-0">Виробник</dt>
       <dd class="text-[14px] font-medium text-ink-900">${brand.name}, ${brand.country}</dd>
     </div>
     <div class="flex flex-col gap-1 bg-ink-50/70 px-5 py-3.5 sm:flex-row sm:gap-6">
       <dt class="text-[14px] text-ink-500 sm:w-56 sm:shrink-0">Артикул</dt>
       <dd class="text-[14px] font-medium text-ink-900">${p.sku}</dd>
     </div>`;

  /* --- Галерея --- */
  const gallery = (p.gallery && p.gallery.length ? p.gallery : []).map((g) => `assets/img/products/${g}.svg`);
  if (!gallery.includes(p.image)) gallery.unshift(p.image);

  $('[data-p-thumbs]').innerHTML = gallery
    .map(
      (src, i) => `
      <button type="button" class="thumb-btn ${i === 0 ? 'is-active' : ''}" data-thumb="${src}" aria-label="Зображення ${i + 1}">
        <img src="${src}" alt="" width="160" height="160" loading="lazy" class="aspect-square w-full rounded-xl object-cover" />
      </button>`
    )
    .join('');

  $$('[data-thumb]').forEach((b) =>
    b.addEventListener('click', () => {
      img.style.opacity = '0';
      setTimeout(() => {
        img.src = b.dataset.thumb;
        img.style.opacity = '1';
      }, 160);
      $$('[data-thumb]').forEach((x) => x.classList.toggle('is-active', x === b));
    })
  );

  /* ======================================================================
     Кількість і кошик
     ====================================================================== */
  const qty = $('[data-qty]');
  const clamp = () => (qty.value = Math.min(99, Math.max(1, Number(qty.value) || 1)));

  $('[data-qty-minus]').addEventListener('click', () => {
    qty.value = Number(qty.value) - 1;
    clamp();
  });
  $('[data-qty-plus]').addEventListener('click', () => {
    qty.value = Number(qty.value) + 1;
    clamp();
  });
  qty.addEventListener('change', clamp);

  const addBtn = $('[data-p-add]');
  addBtn.addEventListener('click', () => {
    S.Cart.add(p.id, Number(qty.value));
    addBtn.innerHTML = `
      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      У кошику`;
    addBtn.classList.add('!bg-mint-500');
    setTimeout(() => {
      addBtn.innerHTML = `
        <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M3 4h2.2l2 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.5L20.5 8H6" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="10" cy="20" r="1.4" fill="currentColor" stroke="none"/><circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none"/>
        </svg>
        Додати в кошик`;
      addBtn.classList.remove('!bg-mint-500');
    }, 1800);
  });

  /* --- Обране / порівняння --- */
  const favBtn = $('[data-p-fav]');
  const cmpBtn = $('[data-p-compare]');

  const syncButtons = () => {
    const fav = S.Favorites.has(p.id);
    favBtn.classList.toggle('is-active', fav);
    $('svg', favBtn).setAttribute('fill', fav ? 'currentColor' : 'none');
    cmpBtn.classList.toggle('!bg-brand-600', S.Compare.has(p.id));
    cmpBtn.classList.toggle('!text-white', S.Compare.has(p.id));
  };

  favBtn.addEventListener('click', () => {
    S.Favorites.toggle(p.id);
    syncButtons();
  });
  cmpBtn.addEventListener('click', () => {
    S.Compare.toggle(p.id);
    syncButtons();
  });
  syncButtons();

  /* ======================================================================
     Вкладки
     ====================================================================== */
  $$('[data-ptab]').forEach((btn) =>
    btn.addEventListener('click', () => {
      $$('[data-ptab]').forEach((b) => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-selected', b === btn);
      });
      $$('[data-ptab-panel]').forEach((panel) =>
        panel.classList.toggle('hidden', panel.dataset.ptabPanel !== btn.dataset.ptab)
      );
    })
  );

  /* ======================================================================
     Схожі товари
     ====================================================================== */
  const related = D.PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 4);
  const pool = related.length >= 4 ? related : related.concat(D.PRODUCTS.filter((x) => x.id !== p.id && x.cat !== p.cat).slice(0, 4 - related.length));

  $('[data-related-grid]').innerHTML = pool.map((x, i) => S.renderCard(x, { reveal: true, delay: i + 1 })).join('');
  $('[data-related-all]').href = `catalog.html?cat=${cat.id}`;
  S.rendered();

  /* ======================================================================
     Відгуки
     ====================================================================== */
  (function reviews() {
    $('[data-p-rating-big]').textContent = p.rating.toFixed(1);
    $('[data-p-stars-big]').innerHTML = S.stars(p.rating, 'h-4 w-4');
    $('[data-p-reviews-count]').textContent = `${p.reviews} ${S.plural(p.reviews, 'відгук', 'відгуки', 'відгуків')}`;

    // Розподіл оцінок — детерміновано від рейтингу товару
    const five = Math.round(p.reviews * (p.rating >= 4.85 ? 0.9 : p.rating >= 4.7 ? 0.82 : 0.72));
    const four = Math.round(p.reviews * 0.15);
    const three = Math.max(0, p.reviews - five - four - 2);
    const dist = [five, four, three, 1, 1];

    $('[data-p-rating-bars]').innerHTML = dist
      .map((n, i) => {
        const starCount = 5 - i;
        const pct = p.reviews ? Math.round((n / p.reviews) * 100) : 0;
        return `
        <div class="flex items-center gap-2.5">
          <span class="w-3 text-xs font-medium text-ink-600">${starCount}</span>
          <svg viewBox="0 0 20 20" class="h-3 w-3 text-amber-400" fill="currentColor" aria-hidden="true"><path d="m10 1.8 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L2.2 7.5l5.4-.8z"/></svg>
          <span class="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-200">
            <span class="block h-full rounded-full bg-amber-400" style="width:${pct}%"></span>
          </span>
          <span class="w-8 text-right text-xs text-ink-400">${pct}%</span>
        </div>`;
      })
      .join('');

    // Три відгуки з загального пулу, привʼязані до товару за індексом
    const start = Math.abs(p.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % D.REVIEWS.length;
    const picked = [0, 1, 2].map((i) => D.REVIEWS[(start + i) % D.REVIEWS.length]);

    $('[data-p-review-list]').innerHTML = picked
      .map(
        (r) => `
      <article class="rounded-3xl bg-white p-6 ring-1 ring-ink-200/70">
        <div class="flex items-start gap-4">
          <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white">${S.escapeHtml(r.initials)}</span>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span class="text-sm font-semibold text-ink-900">${S.escapeHtml(r.name)}</span>
              <span class="badge-mint">
                <svg viewBox="0 0 24 24" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Перевірена покупка
              </span>
            </div>
            ${
              [r.role, r.city].filter(Boolean).length
                ? `<p class="mt-0.5 text-xs text-ink-500">${[r.role, r.city].filter(Boolean).map(S.escapeHtml).join(' · ')}</p>`
                : ''
            }
            <div class="mt-2.5 flex items-center gap-1">${S.stars(r.rating, 'h-3.5 w-3.5')}</div>
            <p class="mt-3 text-[14.5px] leading-relaxed text-ink-600">${S.escapeHtml(r.text)}</p>
          </div>
        </div>
      </article>`
      )
      .join('');
  })();

  /* Історія переглядів */
  const recent = S.state.recent.filter((x) => x !== p.id);
  recent.unshift(p.id);
  S.state.recent = recent.slice(0, 12);
  S.persist();
})();
