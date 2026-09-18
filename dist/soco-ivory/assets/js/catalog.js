/**
 * SOCO-SANI — каталог: фільтри, сортування, пагінація.
 * Дані йдуть з CRM (/api/storefront/products) — сторінка більше не тримає
 * повний каталог у пам'яті (9000+ товарів), кожна зміна фільтра йде в мережу.
 * Стан фільтрів синхронізується з адресним рядком — посилання можна надіслати колезі.
 */
(function () {
  'use strict';

  const S = window.SOCO;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const grid = $('[data-catalog-grid]');
  if (!grid) return;

  const PER_PAGE = 24;
  const MAX_PRICE = 200000;

  /* ======================================================================
     Стан
     ====================================================================== */
  const state = {
    q: '',
    cat: '',
    brand: '',
    min: null,
    max: null,
    inStock: false,
    sort: 'popular',
    view: 'grid',
    page: 1,
  };

  /* --- Читання з URL --- */
  (function fromUrl() {
    const u = new URLSearchParams(location.search);
    state.q = u.get('q') || '';
    state.cat = u.get('cat') || '';
    state.brand = u.get('brand') || '';
    if (u.get('min')) state.min = Number(u.get('min'));
    if (u.get('max')) state.max = Number(u.get('max'));
    state.inStock = u.get('stock') === '1';
    if (u.get('sort')) state.sort = u.get('sort');
    if (u.get('page')) state.page = Math.max(1, Number(u.get('page')));
  })();

  const toUrl = (replace = true) => {
    const u = new URLSearchParams();
    if (state.q) u.set('q', state.q);
    if (state.cat) u.set('cat', state.cat);
    if (state.brand) u.set('brand', state.brand);
    if (state.min != null) u.set('min', state.min);
    if (state.max != null) u.set('max', state.max);
    if (state.inStock) u.set('stock', '1');
    if (state.sort !== 'popular') u.set('sort', state.sort);
    if (state.page > 1) u.set('page', state.page);
    const url = u.toString() ? `?${u}` : location.pathname;
    history[replace ? 'replaceState' : 'pushState'](null, '', url);
  };

  const SORT_MAP = { 'price-asc': 'price_asc', 'price-desc': 'price_desc', name: 'name' };

  /* ======================================================================
     Категорії (дерево з API, кешується на все життя вкладки)
     ====================================================================== */
  let categories = [];
  let categoryBySlug = new Map();

  async function loadCategories() {
    categories = await S.fetchCategories();
    categoryBySlug = new Map();
    categories.forEach((c) => {
      categoryBySlug.set(c.slug, c);
      (c.children || []).forEach((child) => categoryBySlug.set(child.slug, child));
    });
  }

  function drawQuickCats() {
    const box = $('[data-quick-cats]');
    if (!box) return;
    box.innerHTML =
      `<button type="button" class="quick-cat ${!state.cat ? 'is-active' : ''}" data-quick="">Усі товари</button>` +
      categories
        .map(
          (c) => `<button type="button" class="quick-cat ${state.cat === c.slug ? 'is-active' : ''}" data-quick="${c.slug}">${S.escapeHtml(c.name)}</button>`,
        )
        .join('');
  }

  function drawFilterCats() {
    const box = $('[data-filter-cats]');
    if (!box) return;
    box.innerHTML = categories
      .map((parent) => {
        const parentRow = `
        <label class="filter-row">
          <input type="radio" name="cat" class="filter-box" data-cat="${parent.slug}" ${state.cat === parent.slug ? 'checked' : ''} />
          <span class="flex-1 font-medium">${S.escapeHtml(parent.name)}</span>
          <span class="text-xs text-ink-400">${parent.productCount}</span>
        </label>`;
        const children = (parent.children || [])
          .map(
            (child) => `
        <label class="filter-row pl-4">
          <input type="radio" name="cat" class="filter-box" data-cat="${child.slug}" ${state.cat === child.slug ? 'checked' : ''} />
          <span class="flex-1">${S.escapeHtml(child.name)}</span>
          <span class="text-xs text-ink-400">${child.productCount}</span>
        </label>`,
          )
          .join('');
        return parentRow + children;
      })
      .join('');
  }

  function drawChips() {
    const box = $('[data-active-chips]');
    if (!box) return;
    const chips = [];

    if (state.q.trim()) chips.push(['q', `Пошук: «${S.escapeHtml(state.q)}»`]);
    if (state.cat) chips.push(['cat', (categoryBySlug.get(state.cat) || {}).name || state.cat]);
    if (state.brand) chips.push(['brand', `Бренд: ${S.escapeHtml(state.brand)}`]);
    if (state.min != null || state.max != null)
      chips.push(['price', `${state.min != null ? S.money(state.min) : '0 ₴'} — ${state.max != null ? S.money(state.max) : '∞'}`]);
    if (state.inStock) chips.push(['stock', 'У наявності']);

    box.innerHTML = chips.length
      ? chips
          .map(
            ([key, label]) => `
        <button type="button" class="inline-flex items-center gap-1.5 rounded-full bg-brand-50 py-1.5 pl-3.5 pr-2.5 text-[13px] font-medium text-brand-700 transition-colors hover:bg-brand-100" data-chip="${key}">
          ${label}
          <svg viewBox="0 0 20 20" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke-linecap="round"/></svg>
        </button>`,
          )
          .join('') +
        `<button type="button" class="inline-flex items-center rounded-full px-3 py-1.5 text-[13px] font-medium text-ink-500 underline underline-offset-2 transition-colors hover:text-brand-700" data-filters-reset>Скинути все</button>`
      : '';

    const countEl = $('[data-filters-count]');
    if (countEl) {
      countEl.textContent = chips.length;
      countEl.classList.toggle('hidden', chips.length === 0);
    }
  }

  function drawPagination(totalPages) {
    const nav = $('[data-pagination]');
    if (!nav) return;
    if (totalPages <= 1) return (nav.innerHTML = '');

    const btn = (page, label, opts = {}) =>
      `<button type="button" class="page-btn ${opts.active ? 'is-active' : ''}" ${
        opts.disabled ? 'disabled' : ''
      } data-page="${page}" ${opts.label ? `aria-label="${opts.label}"` : ''}>${label}</button>`;

    const arrow = (d) =>
      `<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="${
        d === 'prev' ? 'M14 5.5 7.5 12 14 18.5' : 'M10 5.5 16.5 12 10 18.5'
      }" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    let out = btn(state.page - 1, arrow('prev'), { disabled: state.page === 1, label: 'Попередня сторінка' });

    const show = new Set([1, totalPages, state.page, state.page - 1, state.page + 1]);
    let prev = 0;
    for (let i = 1; i <= totalPages; i++) {
      if (!show.has(i)) continue;
      if (i - prev > 1) out += '<span class="px-1 text-ink-300">…</span>';
      out += btn(i, i, { active: i === state.page });
      prev = i;
    }

    out += btn(state.page + 1, arrow('next'), { disabled: state.page === totalPages, label: 'Наступна сторінка' });
    nav.innerHTML = out;
  }

  /* ======================================================================
     Головний рендер
     ====================================================================== */
  let requestToken = 0;

  async function render(scroll = false) {
    const token = ++requestToken;
    grid.classList.add('opacity-50');

    const { data, meta } = await S.fetchProducts({
      category: state.cat || undefined,
      brand: state.brand || undefined,
      q: state.q.trim() || undefined,
      min: state.min ?? undefined,
      max: state.max ?? undefined,
      inStock: state.inStock ? '1' : undefined,
      sort: SORT_MAP[state.sort],
      page: state.page,
      perPage: PER_PAGE,
    });

    if (token !== requestToken) return; // новіший запит уже в дорозі

    if (state.page > meta.totalPages) {
      state.page = meta.totalPages;
      return render(scroll);
    }

    grid.innerHTML = data.map((p, i) => S.renderCard(p, { reveal: true, delay: (i % 3) + 1 })).join('');
    grid.classList.remove('opacity-50');
    grid.classList.toggle('xl:grid-cols-3', state.view === 'grid');
    grid.classList.toggle('sm:grid-cols-2', state.view === 'grid');
    const emptyEl = $('[data-catalog-empty]');
    if (emptyEl) emptyEl.classList.toggle('hidden', data.length > 0);
    grid.classList.toggle('hidden', data.length === 0);

    const countEl = $('[data-result-count]');
    if (countEl) countEl.textContent = meta.total;
    const wordEl = $('[data-result-word]');
    if (wordEl) wordEl.textContent = S.plural(meta.total, 'товар', 'товари', 'товарів');
    const applyBtn = $('[data-filters-result]');
    if (applyBtn) applyBtn.textContent = meta.total;

    drawChips();
    drawQuickCats();
    drawPagination(meta.totalPages);
    S.rendered();
    requestAnimationFrame(() => $$('.reveal', grid).forEach((el) => el.classList.add('is-visible')));

    toUrl();
    if (scroll) window.scrollTo({ top: grid.getBoundingClientRect().top + window.scrollY - 160, behavior: 'smooth' });
  }

  /* ======================================================================
     Заголовок сторінки під категорію / пошук
     ====================================================================== */
  function headline() {
    const title = $('[data-catalog-title]');
    const desc = $('[data-catalog-desc]');
    const crumb = $('[data-crumb]');
    if (!title) return;

    if (state.q.trim()) {
      title.textContent = `Пошук: «${state.q}»`;
      desc.textContent = 'Результати пошуку в каталозі SOCO-SANI.';
      crumb.textContent = 'Пошук';
    } else if (state.cat) {
      const c = categoryBySlug.get(state.cat);
      if (c) {
        title.textContent = c.name;
        desc.textContent = 'Офіційна гарантія виробника, доставка по Україні за 1–3 дні.';
        crumb.textContent = c.name;
        document.title = `${c.name} — купити в Україні | SOCO-SANI`;
      }
    } else if (state.brand) {
      title.textContent = state.brand;
      desc.textContent = 'Офіційна гарантія виробника, доставка по Україні за 1–3 дні.';
      crumb.textContent = state.brand;
      document.title = `${state.brand} — купити в Україні | SOCO-SANI`;
    }
  }

  /* ======================================================================
     Обробники
     ====================================================================== */
  const searchInputs = $$('[data-search-input]');
  searchInputs.forEach((i) => (i.value = state.q));

  const searchDebounced = S.debounce((value) => {
    state.q = value;
    state.page = 1;
    render();
  }, 320);
  searchInputs.forEach((i) =>
    i.addEventListener('input', (e) => {
      const value = e.target.value;
      searchInputs.forEach((other) => other !== e.target && (other.value = value));
      searchDebounced(value);
    }),
  );

  // Категорії (радіо — товар лежить лише в одній категорії)
  const catsBox = $('[data-filter-cats]');
  if (catsBox)
    catsBox.addEventListener('change', (e) => {
      const input = e.target.closest('[data-cat]');
      if (!input) return;
      state.cat = input.checked ? input.dataset.cat : '';
      state.page = 1;
      render();
    });

  const stockFlag = $('[data-flag="stock"]');
  if (stockFlag) {
    stockFlag.checked = state.inStock;
    stockFlag.addEventListener('change', () => {
      state.inStock = stockFlag.checked;
      state.page = 1;
      render();
    });
  }

  // Ціна
  const minI = $('[data-price-min]');
  const maxI = $('[data-price-max]');
  const range = $('[data-price-range]');
  const priceLabel = $('[data-price-label]');

  if (range) {
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
      }),
    );
  }

  // Сортування
  const sortSel = $('[data-sort]');
  if (sortSel) {
    sortSel.value = state.sort;
    sortSel.addEventListener('change', () => {
      state.sort = sortSel.value;
      state.page = 1;
      render(true);
    });
  }

  // Вигляд
  $$('[data-view]').forEach((b) =>
    b.addEventListener('click', () => {
      state.view = b.dataset.view;
      $$('[data-view]').forEach((x) => x.classList.toggle('is-active', x === b));
      grid.classList.toggle('sm:grid-cols-2', state.view === 'grid');
      grid.classList.toggle('xl:grid-cols-3', state.view === 'grid');
    }),
  );

  // Швидкі категорії, чипи, скидання, пагінація
  document.addEventListener('click', (e) => {
    const quick = e.target.closest('[data-quick]');
    if (quick) {
      state.cat = quick.dataset.quick || '';
      state.page = 1;
      drawFilterCats();
      render(true);
      return;
    }

    const chip = e.target.closest('[data-chip]');
    if (chip) {
      const type = chip.dataset.chip;
      if (type === 'q') {
        state.q = '';
        searchInputs.forEach((i) => (i.value = ''));
      }
      if (type === 'cat') state.cat = '';
      if (type === 'brand') state.brand = '';
      if (type === 'price') {
        state.min = state.max = null;
        if (minI) minI.value = maxI.value = '';
        if (range) {
          range.value = MAX_PRICE;
          priceLabel.textContent = S.money(MAX_PRICE);
        }
      }
      if (type === 'stock') {
        state.inStock = false;
        if (stockFlag) stockFlag.checked = false;
      }
      state.page = 1;
      drawFilterCats();
      render();
      return;
    }

    if (e.target.closest('[data-filters-reset]')) {
      state.q = '';
      state.cat = '';
      state.brand = '';
      state.min = state.max = null;
      state.inStock = false;
      state.page = 1;
      searchInputs.forEach((i) => (i.value = ''));
      if (minI) minI.value = maxI.value = '';
      if (range) {
        range.value = MAX_PRICE;
        priceLabel.textContent = S.money(MAX_PRICE);
      }
      if (stockFlag) stockFlag.checked = false;
      drawFilterCats();
      render(true);
      return;
    }

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
    if (!panel) return;
    const open = () => {
      panel.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      panel.classList.add('hidden');
      document.body.style.overflow = '';
    };
    $('[data-filters-open]')?.addEventListener('click', open);
    $('[data-filters-close]')?.addEventListener('click', close);
    $('[data-filters-apply]')?.addEventListener('click', () => {
      close();
      render(true);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.classList.contains('hidden') && window.innerWidth < 1024) close();
    });
  })();

  window.addEventListener('popstate', () => location.reload());

  /* ======================================================================
     Старт
     ====================================================================== */
  loadCategories().then(() => {
    drawFilterCats();
    drawQuickCats();
    headline();
  });
  render();
})();
