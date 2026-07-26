/**
 * SOCO Ukraine — каталог: фільтри, сортування, пагінація.
 * Стан фільтрів синхронізується з адресним рядком — посилання можна надіслати колезі.
 */
(function () {
  'use strict';

  const S = window.SOCO;
  const D = window.SOCO_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const grid = $('[data-catalog-grid]');
  if (!grid) return;

  const PER_PAGE = 9;
  const MAX_PRICE = Math.ceil(Math.max(...D.PRODUCTS.map((p) => p.price)) / 1000) * 1000;

  /* ======================================================================
     Стан
     ====================================================================== */
  const state = {
    q: '',
    cats: new Set(),
    brands: new Set(),
    min: null,
    max: null,
    flags: new Set(),
    sort: 'popular',
    view: 'grid',
    page: 1,
  };

  /* --- Читання з URL --- */
  (function fromUrl() {
    const u = new URLSearchParams(location.search);
    state.q = u.get('q') || '';
    if (u.get('cat')) u.get('cat').split(',').forEach((c) => state.cats.add(c));
    if (u.get('brand')) u.get('brand').split(',').forEach((b) => state.brands.add(b));
    if (u.get('min')) state.min = Number(u.get('min'));
    if (u.get('max')) state.max = Number(u.get('max'));
    ['sale', 'new', 'hit', 'stock'].forEach((f) => u.get(f) === '1' && state.flags.add(f));
    if (u.get('sort')) state.sort = u.get('sort');
    if (u.get('page')) state.page = Math.max(1, Number(u.get('page')));
  })();

  const toUrl = (replace = true) => {
    const u = new URLSearchParams();
    if (state.q) u.set('q', state.q);
    if (state.cats.size) u.set('cat', [...state.cats].join(','));
    if (state.brands.size) u.set('brand', [...state.brands].join(','));
    if (state.min != null) u.set('min', state.min);
    if (state.max != null) u.set('max', state.max);
    state.flags.forEach((f) => u.set(f, '1'));
    if (state.sort !== 'popular') u.set('sort', state.sort);
    if (state.page > 1) u.set('page', state.page);
    const url = u.toString() ? `?${u}` : location.pathname;
    history[replace ? 'replaceState' : 'pushState'](null, '', url);
  };

  /* ======================================================================
     Фільтрація та сортування
     ====================================================================== */
  function filtered() {
    let list = D.PRODUCTS.slice();

    if (state.q.trim().length >= 2) {
      const words = state.q.trim().toLowerCase().split(/\s+/);
      list = list.filter((p) => {
        const hay = `${p.name} ${p.short} ${p.description} ${D.brandName(p.brand)} ${D.catName(p.cat)} ${p.sku}`.toLowerCase();
        return words.every((w) => hay.includes(w));
      });
    }
    if (state.cats.size) list = list.filter((p) => state.cats.has(p.cat));
    if (state.brands.size) list = list.filter((p) => state.brands.has(p.brand));
    if (state.min != null) list = list.filter((p) => p.price >= state.min);
    if (state.max != null) list = list.filter((p) => p.price <= state.max);
    if (state.flags.has('stock')) list = list.filter((p) => p.stock > 0);
    if (state.flags.has('sale')) list = list.filter((p) => p.oldPrice);
    if (state.flags.has('new')) list = list.filter((p) => p.badges.includes('new'));
    if (state.flags.has('hit')) list = list.filter((p) => p.badges.includes('hit'));

    const cmp = {
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
      new: (a, b) => (a.date < b.date ? 1 : -1),
      name: (a, b) => a.name.localeCompare(b.name, 'uk'),
      popular: (a, b) =>
        b.badges.includes('hit') - a.badges.includes('hit') || b.reviews - a.reviews || b.rating - a.rating,
    };
    return list.sort(cmp[state.sort] || cmp.popular);
  }

  /* ======================================================================
     Рендер керування
     ====================================================================== */
  function drawQuickCats() {
    const box = $('[data-quick-cats]');
    if (!box) return;
    const all = state.cats.size === 0;
    box.innerHTML =
      `<button type="button" class="quick-cat ${all ? 'is-active' : ''}" data-quick="">Усі товари</button>` +
      D.CATEGORIES.map(
        (c) =>
          `<button type="button" class="quick-cat ${state.cats.has(c.id) ? 'is-active' : ''}" data-quick="${c.id}">
             <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">${c.icon}</svg>
             ${c.short}
           </button>`
      ).join('');
  }

  function drawFilterCats() {
    const box = $('[data-filter-cats]');
    const counts = {};
    D.PRODUCTS.forEach((p) => (counts[p.cat] = (counts[p.cat] || 0) + 1));

    box.innerHTML = D.CATEGORIES.map(
      (c) => `
      <label class="filter-row">
        <input type="checkbox" class="filter-box" data-cat="${c.id}" ${state.cats.has(c.id) ? 'checked' : ''} />
        <span class="flex-1">${c.name}</span>
        <span class="text-xs text-ink-400">${counts[c.id] || 0}</span>
      </label>`
    ).join('');
  }

  function drawFilterBrands(query = '') {
    const box = $('[data-filter-brands]');
    const counts = {};
    D.PRODUCTS.forEach((p) => (counts[p.brand] = (counts[p.brand] || 0) + 1));

    const list = D.BRANDS.filter((b) => counts[b.id]).filter((b) =>
      b.name.toLowerCase().includes(query.trim().toLowerCase())
    );

    box.innerHTML = list.length
      ? list
          .map(
            (b) => `
        <label class="filter-row">
          <input type="checkbox" class="filter-box" data-brand="${b.id}" ${state.brands.has(b.id) ? 'checked' : ''} />
          <span class="flex-1">${b.name}<span class="ml-1.5 text-xs text-ink-400">${b.country}</span></span>
          <span class="text-xs text-ink-400">${counts[b.id]}</span>
        </label>`
          )
          .join('')
      : '<p class="px-1 py-3 text-sm text-ink-400">Бренд не знайдено</p>';
  }

  function drawChips() {
    const box = $('[data-active-chips]');
    const chips = [];

    if (state.q.trim())
      chips.push(['q', `Пошук: «${S.escapeHtml(state.q)}»`]);
    state.cats.forEach((c) => chips.push([`cat:${c}`, D.catName(c)]));
    state.brands.forEach((b) => chips.push([`brand:${b}`, D.brandName(b)]));
    if (state.min != null || state.max != null)
      chips.push(['price', `${state.min != null ? S.money(state.min) : '0 ₴'} — ${state.max != null ? S.money(state.max) : '∞'}`]);
    const flagNames = { stock: 'У наявності', sale: 'Зі знижкою', new: 'Новинки', hit: 'Хіти' };
    state.flags.forEach((f) => chips.push([`flag:${f}`, flagNames[f]]));

    box.innerHTML = chips.length
      ? chips
          .map(
            ([key, label]) => `
        <button type="button" class="inline-flex items-center gap-1.5 rounded-full bg-brand-50 py-1.5 pl-3.5 pr-2.5 text-[13px] font-medium text-brand-700 transition-colors hover:bg-brand-100" data-chip="${key}">
          ${label}
          <svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke-linecap="round"/></svg>
        </button>`
          )
          .join('') +
        `<button type="button" class="inline-flex items-center rounded-full px-3 py-1.5 text-[13px] font-medium text-ink-500 underline underline-offset-2 transition-colors hover:text-brand-700" data-filters-reset>Скинути все</button>`
      : '';

    $('[data-filters-count]').textContent = chips.length;
    $('[data-filters-count]').classList.toggle('hidden', chips.length === 0);
  }

  function drawPagination(total) {
    const nav = $('[data-pagination]');
    const pages = Math.ceil(total / PER_PAGE);
    if (pages <= 1) return (nav.innerHTML = '');

    const btn = (page, label, opts = {}) =>
      `<button type="button" class="page-btn ${opts.active ? 'is-active' : ''}" ${
        opts.disabled ? 'disabled' : ''
      } data-page="${page}" ${opts.label ? `aria-label="${opts.label}"` : ''}>${label}</button>`;

    const arrow = (d) =>
      `<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="${
        d === 'prev' ? 'M14 5.5 7.5 12 14 18.5' : 'M10 5.5 16.5 12 10 18.5'
      }" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    let out = btn(state.page - 1, arrow('prev'), { disabled: state.page === 1, label: 'Попередня сторінка' });

    const show = new Set([1, pages, state.page, state.page - 1, state.page + 1]);
    let prev = 0;
    for (let i = 1; i <= pages; i++) {
      if (!show.has(i)) continue;
      if (i - prev > 1) out += '<span class="px-1 text-ink-300">…</span>';
      out += btn(i, i, { active: i === state.page });
      prev = i;
    }

    out += btn(state.page + 1, arrow('next'), { disabled: state.page === pages, label: 'Наступна сторінка' });
    nav.innerHTML = out;
  }

  /* ======================================================================
     Головний рендер
     ====================================================================== */
  function render(scroll = false) {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    if (state.page > pages) state.page = pages;

    const slice = list.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE);

    grid.innerHTML = slice.map((p, i) => S.renderCard(p, { reveal: true, delay: (i % 3) + 1 })).join('');
    grid.classList.toggle('xl:grid-cols-3', state.view === 'grid');
    grid.classList.toggle('sm:grid-cols-2', state.view === 'grid');
    $('[data-catalog-empty]').classList.toggle('hidden', list.length > 0);
    grid.classList.toggle('hidden', list.length === 0);

    $('[data-result-count]').textContent = list.length;
    $('[data-result-word]').textContent = S.plural(list.length, 'товар', 'товари', 'товарів');
    const applyBtn = $('[data-filters-result]');
    if (applyBtn) applyBtn.textContent = list.length;

    drawChips();
    drawQuickCats();
    drawPagination(list.length);
    S.rendered();
    requestAnimationFrame(() => $$('.reveal', grid).forEach((el) => el.classList.add('is-visible')));

    toUrl();
    if (scroll) window.scrollTo({ top: grid.getBoundingClientRect().top + window.scrollY - 160, behavior: 'smooth' });
  }

  /* ======================================================================
     Заголовок сторінки під категорію / пошук
     ====================================================================== */
  (function headline() {
    const title = $('[data-catalog-title]');
    const desc = $('[data-catalog-desc]');
    const crumb = $('[data-crumb]');

    if (state.q.trim()) {
      title.textContent = `Пошук: «${state.q}»`;
      desc.textContent = 'Результати пошуку в каталозі SOCO Ukraine.';
      crumb.textContent = 'Пошук';
    } else if (state.cats.size === 1) {
      const c = D.catById([...state.cats][0]);
      if (c) {
        title.textContent = c.name;
        desc.textContent = c.desc + '. Оригінальна продукція із сертифікатами, доставка по Україні за 1–2 дні.';
        crumb.textContent = c.name;
        document.title = `${c.name} — купити в Україні | SOCO Ukraine`;
      }
    }
  })();

  /* ======================================================================
     Обробники
     ====================================================================== */
  const searchInputs = $$('[data-search-input]');
  searchInputs.forEach((i) => (i.value = state.q));

  // Категорії (чекбокси)
  $('[data-filter-cats]').addEventListener('change', (e) => {
    const cb = e.target.closest('[data-cat]');
    if (!cb) return;
    cb.checked ? state.cats.add(cb.dataset.cat) : state.cats.delete(cb.dataset.cat);
    state.page = 1;
    render();
  });

  // Бренди
  $('[data-filter-brands]').addEventListener('change', (e) => {
    const cb = e.target.closest('[data-brand]');
    if (!cb) return;
    cb.checked ? state.brands.add(cb.dataset.brand) : state.brands.delete(cb.dataset.brand);
    state.page = 1;
    render();
  });

  $('[data-brand-search]').addEventListener('input', S.debounce((e) => drawFilterBrands(e.target.value), 140));

  // Прапорці
  $$('[data-flag]').forEach((cb) => {
    cb.checked = state.flags.has(cb.dataset.flag);
    cb.addEventListener('change', () => {
      cb.checked ? state.flags.add(cb.dataset.flag) : state.flags.delete(cb.dataset.flag);
      state.page = 1;
      render();
    });
  });

  // Ціна
  const minI = $('[data-price-min]');
  const maxI = $('[data-price-max]');
  const range = $('[data-price-range]');
  const priceLabel = $('[data-price-label]');

  range.max = MAX_PRICE;
  range.value = state.max != null ? state.max : MAX_PRICE;
  priceLabel.textContent = S.money(range.value);
  if (state.min != null) minI.value = state.min;
  if (state.max != null) maxI.value = state.max;

  const applyPrice = S.debounce(() => {
    state.min = minI.value ? Number(minI.value) : null;
    state.max = maxI.value ? Number(maxI.value) : null;
    state.page = 1;
    render();
  }, 320);

  minI.addEventListener('input', applyPrice);
  maxI.addEventListener('input', applyPrice);

  range.addEventListener('input', () => {
    priceLabel.textContent = S.money(range.value);
    maxI.value = range.value;
  });
  range.addEventListener('change', applyPrice);

  $$('[data-price-preset]').forEach((b) =>
    b.addEventListener('click', () => {
      const [lo, hi] = b.dataset.pricePreset.split('-').map(Number);
      state.min = lo || null;
      state.max = hi;
      minI.value = lo || '';
      maxI.value = hi;
      range.value = Math.min(hi, MAX_PRICE);
      priceLabel.textContent = S.money(range.value);
      state.page = 1;
      render();
    })
  );

  // Сортування
  const sortSel = $('[data-sort]');
  sortSel.value = state.sort;
  sortSel.addEventListener('change', () => {
    state.sort = sortSel.value;
    state.page = 1;
    render(true);
  });

  // Вигляд
  $$('[data-view]').forEach((b) =>
    b.addEventListener('click', () => {
      state.view = b.dataset.view;
      $$('[data-view]').forEach((x) => x.classList.toggle('is-active', x === b));
      grid.classList.toggle('sm:grid-cols-2', state.view === 'grid');
      grid.classList.toggle('xl:grid-cols-3', state.view === 'grid');
    })
  );

  // Швидкі категорії
  document.addEventListener('click', (e) => {
    const q = e.target.closest('[data-quick]');
    if (q) {
      state.cats.clear();
      if (q.dataset.quick) state.cats.add(q.dataset.quick);
      state.page = 1;
      drawFilterCats();
      render(true);
      return;
    }

    // Зняття чипа
    const chip = e.target.closest('[data-chip]');
    if (chip) {
      const [type, val] = chip.dataset.chip.split(':');
      if (type === 'q') {
        state.q = '';
        searchInputs.forEach((i) => (i.value = ''));
      }
      if (type === 'cat') state.cats.delete(val);
      if (type === 'brand') state.brands.delete(val);
      if (type === 'price') {
        state.min = state.max = null;
        minI.value = maxI.value = '';
        range.value = MAX_PRICE;
        priceLabel.textContent = S.money(MAX_PRICE);
      }
      if (type === 'flag') state.flags.delete(val);
      state.page = 1;
      drawFilterCats();
      drawFilterBrands($('[data-brand-search]').value);
      $$('[data-flag]').forEach((cb) => (cb.checked = state.flags.has(cb.dataset.flag)));
      render();
      return;
    }

    // Скидання
    if (e.target.closest('[data-filters-reset]')) {
      state.q = '';
      state.cats.clear();
      state.brands.clear();
      state.flags.clear();
      state.min = state.max = null;
      state.page = 1;
      searchInputs.forEach((i) => (i.value = ''));
      minI.value = maxI.value = '';
      range.value = MAX_PRICE;
      priceLabel.textContent = S.money(MAX_PRICE);
      $('[data-brand-search]').value = '';
      drawFilterCats();
      drawFilterBrands();
      $$('[data-flag]').forEach((cb) => (cb.checked = false));
      render(true);
      return;
    }

    // Пагінація
    const page = e.target.closest('[data-page]');
    if (page && !page.disabled) {
      state.page = Number(page.dataset.page);
      render(true);
    }
  });

  /* ======================================================================
     Мобільна панель фільтрів
     ====================================================================== */
  (function mobileFilters() {
    const panel = $('[data-filters-panel]');
    const open = () => {
      panel.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      panel.classList.add('hidden');
      document.body.style.overflow = '';
    };
    $('[data-filters-open]').addEventListener('click', open);
    $('[data-filters-close]').addEventListener('click', close);
    $('[data-filters-apply]').addEventListener('click', () => {
      close();
      render(true);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.classList.contains('hidden') && window.innerWidth < 1024) close();
    });
  })();

  /* Навігація браузером «назад/вперед» */
  window.addEventListener('popstate', () => location.reload());

  /* ======================================================================
     Старт
     ====================================================================== */
  drawFilterCats();
  drawFilterBrands();
  render();
})();
