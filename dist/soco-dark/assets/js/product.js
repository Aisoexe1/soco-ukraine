/**
 * SOCO-SANI — сторінка товару.
 * Галерея, вкладки, кількість, схожі товари, Product-розмітка Schema.org.
 * Дані — з CRM (/api/storefront/products/:sku). Рейтингів/відгуків per-товар
 * і бренду в реальному каталозі немає (не було в джерелі) — відповідні блоки
 * ховаються, а не показують нулі чи вигадані цифри.
 */
(function () {
  'use strict';

  const S = window.SOCO;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const root = $('[data-product-root]');
  if (!root) return;

  const sku = (new URLSearchParams(location.search).get('sku') || new URLSearchParams(location.search).get('id') || '').toUpperCase();

  init();

  async function init() {
    const p = sku ? await S.fetchProduct(sku) : null;

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

    const shownPrice = p.salePrice ?? p.price;

    /* --- Мета-дані сторінки --- */
    document.title = `${p.name} — купити в Україні | SOCO-SANI`;
    $('meta[name="description"]')?.setAttribute('content', `${shortText(p)} Ціна ${S.money(shownPrice)}. Доставка по Україні за 1–3 дні.`);
    const canonical = $('link[rel="canonical"]');
    if (canonical) canonical.href = `https://soco.in.ua/product.html?sku=${encodeURIComponent(p.sku)}`;
    const ogTitle = $('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', p.name);

    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      description: p.description || p.name,
      sku: p.sku,
      image: p.images.length ? p.images.map((src) => `https://soco.in.ua${src}`) : undefined,
      category: p.category.name,
      offers: {
        '@type': 'Offer',
        url: `https://soco.in.ua/product.html?sku=${p.sku}`,
        priceCurrency: 'UAH',
        price: shownPrice,
        itemCondition: 'https://schema.org/NewCondition',
        availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
        seller: { '@type': 'Organization', name: 'SOCO-SANI' },
      },
    });
    document.head.appendChild(ld);

    /* --- Хлібні крихти --- */
    const crumbs = $('[data-breadcrumbs]');
    if (crumbs) {
      const catCrumb = p.category.parentSlug
        ? `<li><a href="catalog.html?cat=${p.category.parentSlug}" class="transition-colors hover:text-brand-700">${S.escapeHtml(p.category.parentName)}</a></li><li aria-hidden="true" class="text-ink-300">/</li>`
        : '';
      crumbs.insertAdjacentHTML(
        'beforeend',
        `<li aria-hidden="true" class="text-ink-300">/</li>
         ${catCrumb}
         <li><a href="catalog.html?cat=${p.category.slug}" class="transition-colors hover:text-brand-700">${S.escapeHtml(p.category.name)}</a></li>
         <li aria-hidden="true" class="text-ink-300">/</li>
         <li><span class="line-clamp-1 font-medium text-ink-900">${S.escapeHtml(p.name)}</span></li>`,
      );
    }

    /* --- Блоки без даних у реальному каталозі — ховаємо, не показуємо порожнє/вигадане --- */
    const brandEl = $('[data-p-brand]');
    brandEl?.nextElementSibling?.remove(); // "·" між брендом і артикулом
    brandEl?.remove();
    $('[data-p-stars]')?.closest('span.flex.items-center')?.remove();
    $('[data-p-reviews]')?.remove();
    $('[data-p-features]')?.remove();
    $('#reviews')?.remove();

    /* --- Заповнення картки --- */
    const img = $('[data-p-image]');
    const mainImage = p.images[0] || 'assets/img/logo.svg';
    img.src = mainImage;
    img.alt = p.name;

    $('[data-p-badges]').innerHTML = S.badgeHtml(p);
    $('[data-p-sku]').textContent = p.sku;
    $('[data-p-name]').textContent = p.name;
    $('[data-p-stock]').innerHTML = S.stockHtml(p);
    $('[data-p-short]').textContent = shortText(p);
    $('[data-p-price]').textContent = S.money(shownPrice);
    $('[data-p-unit]').textContent = 'шт.';
    $('[data-p-desc]').textContent = p.description || '';

    if (p.salePrice) {
      $('[data-p-old]').textContent = S.money(p.price);
      $('[data-p-save]').innerHTML = `<span class="badge bg-rose-500 text-white">Економія ${S.money(p.price - p.salePrice)}</span>`;
    } else {
      $('[data-p-old]')?.remove();
      $('[data-p-save]')?.remove();
    }

    /* --- Характеристики --- */
    $('[data-p-specs]').innerHTML =
      p.specs
        .map(
          ([k, v], i) => `
        <div class="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:gap-6 ${i % 2 ? 'bg-white' : 'bg-ink-50/70'}">
          <dt class="text-[14px] text-ink-500 sm:w-56 sm:shrink-0">${S.escapeHtml(k)}</dt>
          <dd class="text-[14px] font-medium text-ink-900">${S.escapeHtml(v)}</dd>
        </div>`,
        )
        .join('') +
      `<div class="flex flex-col gap-1 ${p.specs.length % 2 ? 'bg-white' : 'bg-ink-50/70'} px-5 py-3.5 sm:flex-row sm:gap-6">
         <dt class="text-[14px] text-ink-500 sm:w-56 sm:shrink-0">Артикул</dt>
         <dd class="text-[14px] font-medium text-ink-900">${p.sku}</dd>
       </div>`;

    /* --- Галерея --- */
    const gallery = p.images.length ? p.images : [mainImage];
    $('[data-p-thumbs]').innerHTML = gallery
      .map(
        (src, i) => `
        <button type="button" class="thumb-btn ${i === 0 ? 'is-active' : ''}" data-thumb="${src}" aria-label="Зображення ${i + 1}">
          <img src="${src}" alt="" width="160" height="160" loading="lazy" class="aspect-square w-full rounded-xl object-cover" />
        </button>`,
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
      }),
    );

    /* --- Кількість і кошик --- */
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
      S.Cart.add(p.sku, Number(qty.value));
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
      const fav = S.Favorites.has(p.sku);
      favBtn.classList.toggle('is-active', fav);
      $('svg', favBtn).setAttribute('fill', fav ? 'currentColor' : 'none');
      cmpBtn.classList.toggle('!bg-brand-600', S.Compare.has(p.sku));
      cmpBtn.classList.toggle('!text-white', S.Compare.has(p.sku));
    };

    favBtn.addEventListener('click', () => {
      S.Favorites.toggle(p.sku);
      syncButtons();
    });
    cmpBtn.addEventListener('click', () => {
      S.Compare.toggle(p.sku);
      syncButtons();
    });
    syncButtons();

    /* --- Вкладки --- */
    $$('[data-ptab]').forEach((btn) =>
      btn.addEventListener('click', () => {
        $$('[data-ptab]').forEach((b) => {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-selected', b === btn);
        });
        $$('[data-ptab-panel]').forEach((panel) => panel.classList.toggle('hidden', panel.dataset.ptabPanel !== btn.dataset.ptab));
      }),
    );

    /* --- Схожі товари (та ж підкатегорія) --- */
    const { data: related } = await S.fetchProducts({ category: p.category.slug, perPage: 5 });
    const relatedFiltered = related.filter((x) => x.sku !== p.sku).slice(0, 4);
    $('[data-related-grid]').innerHTML = relatedFiltered.map((x, i) => S.renderCard(x, { reveal: true, delay: i + 1 })).join('');
    const relatedAll = $('[data-related-all]');
    if (relatedAll) relatedAll.href = `catalog.html?cat=${p.category.slug}`;
    S.rendered();

    /* --- Історія переглядів --- */
    const recent = S.state.recent.filter((x) => x !== p.sku);
    recent.unshift(p.sku);
    S.state.recent = recent.slice(0, 12);
    S.persist();
  }

  function shortText(p) {
    if (!p.description) return '';
    return p.description.length > 160 ? `${p.description.slice(0, 157)}…` : p.description;
  }
})();
