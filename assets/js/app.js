/**
 * SOCO-SANI — клієнтська логіка вітрини.
 *
 * Кошик, обране, порівняння, пошук, чат, меню, анімації.
 * Стан зберігається в localStorage — без бекенда, але переживає перезавантаження.
 */
(function () {
  'use strict';

  const D = window.SOCO_DATA;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ======================================================================
     Сховище
     ====================================================================== */
  const KEY = 'soco:v1';

  const defaultState = () => ({
    cart: {}, // { productId: qty }
    favorites: [],
    compare: [],
    user: null,
    orders: [],
    chat: [],
    cookiesAccepted: false,
    recent: [],
  });

  let state = defaultState();

  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = Object.assign(defaultState(), JSON.parse(raw));
  } catch (e) {
    /* приватний режим або пошкоджені дані — працюємо на дефолтах */
  }

  const persist = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      /* квоту вичерпано — мовчки продовжуємо */
    }
    document.dispatchEvent(new CustomEvent('soco:change', { detail: state }));
  };

  /* ======================================================================
     Утиліти
     ====================================================================== */
  const money = (n) =>
    new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' ₴';

  const plural = (n, one, few, many) => {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  };

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const debounce = (fn, ms = 180) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };

  const storefrontLeadUrl = () => {
    const configuredUrl =
      window.SOCO_CRM_API_URL || document.querySelector('meta[name="soco-crm-api-url"]')?.getAttribute('content')?.trim();

    return configuredUrl ? new URL('/api/storefront/leads', configuredUrl).toString() : '/api/storefront/leads';
  };

  const createStorefrontLead = async (lead) => {
    let response;

    try {
      response = await fetch(storefrontLeadUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
    } catch {
      throw new Error('Storefront lead request failed');
    }

    if (!response.ok) {
      throw new Error(`Storefront lead request failed with status ${response.status}`);
    }

    return response.json();
  };

  /* ======================================================================
     API кошика / обраного / порівняння
     ====================================================================== */
  const Cart = {
    add(id, qty = 1) {
      state.cart[id] = (state.cart[id] || 0) + qty;
      persist();
      const p = D.byId(id);
      toast(`«${p ? p.name.split(' —')[0] : 'Товар'}» у кошику`, 'cart', qty > 1 ? `${qty} шт · ${money(p.price * qty)}` : money(p.price));
      bump('[data-count="cart"]');
    },
    set(id, qty) {
      if (qty <= 0) delete state.cart[id];
      else state.cart[id] = qty;
      persist();
    },
    remove(id) {
      delete state.cart[id];
      persist();
    },
    clear() {
      state.cart = {};
      persist();
    },
    has: (id) => !!state.cart[id],
    qty: (id) => state.cart[id] || 0,
    items() {
      return Object.entries(state.cart)
        .map(([id, qty]) => ({ product: D.byId(id), qty }))
        .filter((i) => i.product);
    },
    count() {
      return Object.values(state.cart).reduce((s, q) => s + q, 0);
    },
    subtotal() {
      return Cart.items().reduce((s, i) => s + i.product.price * i.qty, 0);
    },
    savings() {
      return Cart.items().reduce((s, i) => s + (i.product.oldPrice ? (i.product.oldPrice - i.product.price) * i.qty : 0), 0);
    },
  };

  const Favorites = {
    toggle(id) {
      const i = state.favorites.indexOf(id);
      const added = i === -1;
      if (added) state.favorites.push(id);
      else state.favorites.splice(i, 1);
      persist();
      toast(added ? 'Додано до обраного' : 'Прибрано з обраного', 'heart');
      if (added) bump('[data-count="favorites"]');
      return added;
    },
    has: (id) => state.favorites.includes(id),
    items: () => state.favorites.map(D.byId).filter(Boolean),
  };

  const Compare = {
    toggle(id) {
      const i = state.compare.indexOf(id);
      const added = i === -1;
      if (added) {
        if (state.compare.length >= 4) {
          toast('У порівнянні максимум 4 товари', 'info');
          return false;
        }
        state.compare.push(id);
      } else {
        state.compare.splice(i, 1);
      }
      persist();
      toast(added ? 'Додано до порівняння' : 'Прибрано з порівняння', 'compare');
      if (added) bump('[data-count="compare"]');
      return added;
    },
    has: (id) => state.compare.includes(id),
    items: () => state.compare.map(D.byId).filter(Boolean),
  };

  /* ======================================================================
     Лічильники в шапці
     ====================================================================== */
  function updateCounters() {
    const map = {
      cart: Cart.count(),
      favorites: state.favorites.length,
      compare: state.compare.length,
    };
    Object.entries(map).forEach(([key, n]) => {
      $$(`[data-count="${key}"]`).forEach((el) => {
        el.textContent = n > 99 ? '99+' : n;
        el.classList.toggle('hidden', n === 0);
        el.classList.toggle('flex', n > 0);
      });
    });
    $$('[data-cart-total]').forEach((el) => (el.textContent = money(Cart.subtotal())));
  }

  function bump(sel) {
    const el = $(sel);
    if (!el) return;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'pop .35s cubic-bezier(.34,1.56,.64,1)';
  }

  /* ======================================================================
     Сповіщення
     ====================================================================== */
  const TOAST_ICONS = {
    cart: '<path d="M3 4h2.2l2 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.5L20.5 8H6" stroke-linecap="round" stroke-linejoin="round"/>',
    heart: '<path d="M12 20.5s-7.5-4.7-7.5-10A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.9c0 5.3-7.5 10-7.5 10Z" stroke-linejoin="round"/>',
    compare: '<path d="M9 20V9m6 11V4M4 20v-6m16 6V12" stroke-linecap="round"/>',
    ok: '<path d="m5 12.5 4.5 4.5L19 7" stroke-linecap="round" stroke-linejoin="round"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5m0-8.2v.2" stroke-linecap="round"/>',
    error: '<circle cx="12" cy="12" r="8.5"/><path d="m9 9 6 6m0-6-6 6" stroke-linecap="round"/>',
  };

  function toast(message, icon = 'ok', sub = '') {
    const root = $('[data-toast-root]');
    if (!root) return;

    const el = document.createElement('div');
    el.className =
      'pointer-events-auto flex w-full max-w-sm translate-y-3 items-center gap-3 rounded-2xl bg-white p-3.5 pr-5 opacity-0 shadow-lg ring-1 ring-ink-200 transition-all duration-300 sm:w-auto sm:min-w-[300px]';
    el.innerHTML = `
      <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
        icon === 'error' ? 'bg-rose-500/10 text-rose-600' : 'bg-brand-50 text-brand-600'
      }">
        <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">${
          TOAST_ICONS[icon] || TOAST_ICONS.ok
        }</svg>
      </span>
      <span class="min-w-0">
        <span class="block text-sm font-medium leading-tight text-ink-900">${escapeHtml(message)}</span>
        ${sub ? `<span class="mt-0.5 block text-xs text-ink-500">${escapeHtml(sub)}</span>` : ''}
      </span>`;

    root.appendChild(el);
    requestAnimationFrame(() => el.classList.remove('translate-y-3', 'opacity-0'));

    setTimeout(() => {
      el.classList.add('opacity-0', 'translate-y-3');
      setTimeout(() => el.remove(), 320);
    }, 2800);
  }

  /* ======================================================================
     Картка товару (єдиний шаблон для всіх сторінок)
     ====================================================================== */
  function stars(rating, size = 'h-3.5 w-3.5') {
    let out = '';
    for (let i = 1; i <= 5; i++) {
      const full = rating >= i - 0.25;
      out += `<svg viewBox="0 0 20 20" class="${size} ${full ? 'text-amber-400' : 'text-ink-200'}" fill="currentColor" aria-hidden="true"><path d="m10 1.8 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L2.2 7.5l5.4-.8z"/></svg>`;
    }
    return out;
  }

  function badgeHtml(p) {
    const out = [];
    if (p.badges.includes('sale') && p.oldPrice)
      out.push(
        `<span class="badge bg-rose-500 text-white shadow-sm">−${Math.round((1 - p.price / p.oldPrice) * 100)}%</span>`
      );
    if (p.badges.includes('hit')) out.push('<span class="badge bg-brand-600 text-white shadow-sm">Хіт</span>');
    if (p.badges.includes('new')) out.push('<span class="badge bg-ink-900 text-white shadow-sm">Новинка</span>');
    return out.join('');
  }

  function stockHtml(p) {
    if (p.stock > 20)
      return '<span class="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600"><span class="h-1.5 w-1.5 rounded-full bg-mint-500"></span>В наявності</span>';
    if (p.stock > 0)
      return `<span class="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600"><span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>Залишилось ${p.stock} шт</span>`;
    return '<span class="inline-flex items-center gap-1.5 text-xs font-medium text-ink-400"><span class="h-1.5 w-1.5 rounded-full bg-ink-300"></span>Під замовлення</span>';
  }

  /**
   * @param {object} p товар
   * @param {{compact?: boolean, reveal?: boolean, delay?: number}} opts
   */
  function renderCard(p, opts = {}) {
    const href = `product.html?id=${encodeURIComponent(p.id)}`;
    const fav = Favorites.has(p.id);
    const cmp = Compare.has(p.id);
    const inCart = Cart.has(p.id);
    const delay = opts.delay ? ` reveal-d${Math.min(opts.delay, 6)}` : '';

    return `
    <article class="card-hover group relative flex flex-col overflow-hidden${opts.reveal ? ` reveal${delay}` : ''}" data-product="${p.id}">
      <!-- Бейджи -->
      <div class="absolute left-4 top-4 z-10 flex flex-col items-start gap-1.5">${badgeHtml(p)}</div>

      <!-- Быстрые действия -->
      <div class="absolute right-3.5 top-3.5 z-10 flex flex-col gap-1.5 opacity-0 transition-all duration-300 group-hover:opacity-100 max-lg:opacity-100">
        <button type="button" class="quick-btn ${fav ? 'is-active' : ''}" data-fav="${p.id}" aria-label="До обраного" aria-pressed="${fav}">
          <svg viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="${fav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
            <path d="M12 20.5s-7.5-4.7-7.5-10A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.9c0 5.3-7.5 10-7.5 10Z" stroke-linejoin="round"/>
          </svg>
        </button>
        <button type="button" class="quick-btn ${cmp ? 'is-active' : ''}" data-compare="${p.id}" aria-label="До порівняння" aria-pressed="${cmp}">
          <svg viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
            <path d="M9 20V9m6 11V4M4 20v-6m16 6V12" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- Изображение -->
      <a href="${href}" class="relative block overflow-hidden bg-ink-50/60" aria-label="${escapeHtml(p.name)}">
        <img src="${p.image}" alt="${escapeHtml(p.name)}" width="640" height="640" loading="lazy" decoding="async"
             class="aspect-square w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
      </a>

      <!-- Контент -->
      <div class="flex flex-1 flex-col p-5">
        <div class="mb-2 flex items-center justify-between gap-2">
          <span class="text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-600">${escapeHtml(D.brandName(p.brand))}</span>
          <span class="flex items-center gap-1">
            <span class="flex">${stars(p.rating)}</span>
            <span class="text-xs font-medium text-ink-400">${p.rating.toFixed(1)}</span>
          </span>
        </div>

        <h3 class="text-[15px] font-semibold leading-snug text-ink-900">
          <a href="${href}" class="transition-colors after:absolute after:inset-0 after:content-[''] hover:text-brand-700">${escapeHtml(p.name)}</a>
        </h3>

        <p class="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-500">${escapeHtml(p.short)}</p>

        <div class="mt-3">${stockHtml(p)}</div>

        <div class="mt-auto pt-4">
          <div class="flex items-end justify-between gap-3">
            <div>
              ${p.oldPrice ? `<span class="block text-[13px] text-ink-400 line-through">${money(p.oldPrice)}</span>` : ''}
              <span class="block text-xl font-bold tracking-tight text-ink-900">${money(p.price)}</span>
              <span class="text-[11px] text-ink-400">за ${escapeHtml(p.unit)}</span>
            </div>
            <button type="button"
              class="relative z-[1] inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-300 active:scale-90 ${
                inCart ? 'bg-mint-500 text-white' : 'bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white hover:shadow-brand'
              }"
              data-add="${p.id}" aria-label="Додати в кошик">
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                ${
                  inCart
                    ? '<path d="m5 12.5 4.5 4.5L19 7" stroke-linecap="round" stroke-linejoin="round"/>'
                    : '<path d="M3 4h2.2l2 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.5L20.5 8H6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="20" r="1.4" fill="currentColor" stroke="none"/><circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none"/>'
                }
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>`;
  }

  /** Оновлює вигляд кнопок картки без повного перемальовування */
  function syncCards() {
    $$('[data-product]').forEach((card) => {
      const id = card.dataset.product;
      const favBtn = $(`[data-fav="${id}"]`, card);
      if (favBtn) {
        const on = Favorites.has(id);
        favBtn.classList.toggle('is-active', on);
        favBtn.setAttribute('aria-pressed', on);
        $('svg', favBtn).setAttribute('fill', on ? 'currentColor' : 'none');
      }
      const cmpBtn = $(`[data-compare="${id}"]`, card);
      if (cmpBtn) {
        const on = Compare.has(id);
        cmpBtn.classList.toggle('is-active', on);
        cmpBtn.setAttribute('aria-pressed', on);
      }
      const addBtn = $(`[data-add="${id}"]`, card);
      if (addBtn) {
        const on = Cart.has(id);
        addBtn.className = addBtn.className
          .replace(/bg-(mint-500|brand-50) text-(white|brand-700)[^"]*?(?= |$)/, '')
          .trim();
        addBtn.classList.remove('bg-mint-500', 'bg-brand-50', 'text-white', 'text-brand-700', 'hover:bg-brand-600', 'hover:text-white', 'hover:shadow-brand');
        if (on) addBtn.classList.add('bg-mint-500', 'text-white');
        else addBtn.classList.add('bg-brand-50', 'text-brand-700', 'hover:bg-brand-600', 'hover:text-white', 'hover:shadow-brand');
        $('svg', addBtn).innerHTML = on
          ? '<path d="m5 12.5 4.5 4.5L19 7" stroke-linecap="round" stroke-linejoin="round"/>'
          : '<path d="M3 4h2.2l2 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.5L20.5 8H6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="20" r="1.4" fill="currentColor" stroke="none"/><circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none"/>';
      }
    });
  }

  /* ======================================================================
     Глобальні обробники карток
     ====================================================================== */
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) {
      e.preventDefault();
      Cart.add(add.dataset.add, Number(add.dataset.qty) || 1);
      syncCards();
      return;
    }
    const fav = e.target.closest('[data-fav]');
    if (fav) {
      e.preventDefault();
      Favorites.toggle(fav.dataset.fav);
      syncCards();
      return;
    }
    const cmp = e.target.closest('[data-compare]');
    if (cmp) {
      e.preventDefault();
      Compare.toggle(cmp.dataset.compare);
      syncCards();
    }
  });

  /* ======================================================================
     Шапка: тінь під час скролу
     ====================================================================== */
  const header = $('#site-header');
  if (header) {
    const onScroll = () => {
      const scrolled = window.scrollY > 12;
      header.classList.toggle('border-ink-100', scrolled);
      header.classList.toggle('border-transparent', !scrolled);
      header.classList.toggle('shadow-[0_4px_24px_-16px_rgba(15,28,51,0.3)]', scrolled);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ======================================================================
     Кнопка «вгору»
     ====================================================================== */
  const toTop = $('[data-to-top]');
  if (toTop) {
    const onScroll = () => {
      const on = window.scrollY > 700;
      toTop.classList.toggle('opacity-0', !on);
      toTop.classList.toggle('translate-y-4', !on);
      toTop.classList.toggle('pointer-events-none', !on);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ======================================================================
     Мега-меню
     ====================================================================== */
  (function megaMenu() {
    const root = $('[data-megamenu]');
    if (!root) return;
    const toggle = $('[data-megamenu-toggle]', root);
    const panel = $('[data-megamenu-panel]', root);
    const list = $('[data-megamenu-list]', root);

    list.innerHTML = D.CATEGORIES.map(
      (c) => `
      <a href="catalog.html?cat=${c.id}" class="group flex items-center gap-3.5 rounded-2xl p-3 transition-colors duration-250 hover:bg-brand-50">
        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
          <svg viewBox="0 0 24 24" class="h-[22px] w-[22px]" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${c.icon}</svg>
        </span>
        <span class="min-w-0">
          <span class="block truncate text-sm font-medium text-ink-900 transition-colors group-hover:text-brand-700">${c.name}</span>
          <span class="block text-xs text-ink-400">${c.count} товарів</span>
        </span>
      </a>`
    ).join('');

    let open = false;
    const set = (v) => {
      open = v;
      toggle.setAttribute('aria-expanded', v);
      panel.classList.toggle('invisible', !v);
      panel.classList.toggle('opacity-0', !v);
      panel.classList.toggle('translate-y-2', !v);
    };
    toggle.addEventListener('click', () => set(!open));
    document.addEventListener('click', (e) => {
      if (open && !root.contains(e.target)) set(false);
    });
    document.addEventListener('keydown', (e) => e.key === 'Escape' && open && set(false));
  })();

  /* ======================================================================
     Мобільне меню
     ====================================================================== */
  (function mobileMenu() {
    const root = $('[data-menu-root]');
    if (!root) return;
    const panel = $('[data-menu-panel]', root);
    const backdrop = $('[data-menu-backdrop]', root);
    const list = $('[data-menu-categories]', root);

    if (list) {
      list.innerHTML = D.CATEGORIES.map(
        (c) => `
        <li>
          <a href="catalog.html?cat=${c.id}" class="mobile-link">
            <span class="flex items-center gap-3">
              <span class="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${c.icon}</svg>
              </span>
              <span class="text-[15px]">${c.short}</span>
            </span>
            <span class="text-xs text-ink-400">${c.count}</span>
          </a>
        </li>`
      ).join('');
    }

    const open = () => {
      root.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        backdrop.classList.remove('opacity-0');
        panel.classList.remove('translate-x-full');
      });
      $$('[data-open-menu]').forEach((b) => b.setAttribute('aria-expanded', 'true'));
    };
    const close = () => {
      backdrop.classList.add('opacity-0');
      panel.classList.add('translate-x-full');
      document.body.style.overflow = '';
      $$('[data-open-menu]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
      setTimeout(() => root.classList.add('hidden'), 400);
    };

    $$('[data-open-menu]').forEach((b) => b.addEventListener('click', open));
    $$('[data-close-menu]').forEach((b) => b.addEventListener('click', close));
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', (e) => e.key === 'Escape' && !root.classList.contains('hidden') && close());
  })();

  /* ======================================================================
     Пошук: живі підказки + оверлей
     ====================================================================== */
  function searchProducts(q, limit = 6) {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [];
    const words = query.split(/\s+/);

    return D.PRODUCTS.map((p) => {
      const hay = `${p.name} ${p.short} ${p.description} ${D.brandName(p.brand)} ${D.catName(p.cat)} ${p.sku}`.toLowerCase();
      let score = 0;
      for (const w of words) {
        if (!hay.includes(w)) return null;
        if (p.name.toLowerCase().includes(w)) score += 3;
        if (D.brandName(p.brand).toLowerCase().includes(w)) score += 2;
        if (D.catName(p.cat).toLowerCase().includes(w)) score += 2;
        score += 1;
      }
      if (p.badges.includes('hit')) score += 0.5;
      return { p, score };
    })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.p);
  }

  function highlight(text, q) {
    const words = q.trim().toLowerCase().split(/\s+/).filter((w) => w.length > 1);
    let out = escapeHtml(text);
    for (const w of words) {
      const re = new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      out = out.replace(re, '<mark class="rounded bg-brand-100 text-brand-800">$1</mark>');
    }
    return out;
  }

  function resultsHtml(list, q) {
    if (!list.length) {
      return `
      <div class="px-4 py-10 text-center">
        <span class="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-ink-50 text-ink-400">
          <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4" stroke-linecap="round"/>
          </svg>
        </span>
        <p class="text-sm font-medium text-ink-900">Нічого не знайдено</p>
        <p class="mt-1 text-[13px] text-ink-500">Спробуйте змінити запит або напишіть нам — підберемо аналог.</p>
        <a href="contacts.html" class="btn-soft btn-sm mt-4">Запросити підбір</a>
      </div>`;
    }

    return (
      list
        .map(
          (p) => `
      <a href="product.html?id=${encodeURIComponent(p.id)}" class="flex items-center gap-3.5 rounded-2xl p-2.5 transition-colors duration-200 hover:bg-brand-50" role="option">
        <img src="${p.image}" alt="" width="64" height="64" loading="lazy" class="h-14 w-14 shrink-0 rounded-xl bg-ink-50 object-cover" />
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-medium text-ink-900">${highlight(p.name, q)}</span>
          <span class="mt-0.5 block text-xs text-ink-400">${escapeHtml(D.brandName(p.brand))} · ${escapeHtml(D.catName(p.cat))}</span>
        </span>
        <span class="shrink-0 text-sm font-semibold text-ink-900">${money(p.price)}</span>
      </a>`
        )
        .join('') +
      `<a href="catalog.html?q=${encodeURIComponent(q)}" class="mt-1 flex items-center justify-center gap-2 rounded-2xl bg-ink-50 px-4 py-3 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50">
        Показати всі результати
        <svg viewBox="0 0 20 20" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 10h11m0 0-4-4m4 4-4 4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>`
    );
  }

  (function desktopSearch() {
    const root = $('[data-search-root]');
    if (!root) return;
    const input = $('[data-search-input]', root);
    const box = $('[data-search-results]', root);

    const show = (v) => {
      box.classList.toggle('invisible', !v);
      box.classList.toggle('opacity-0', !v);
      box.classList.toggle('translate-y-2', !v);
    };

    const run = debounce(() => {
      const q = input.value;
      if (q.trim().length < 2) return show(false);
      box.innerHTML = resultsHtml(searchProducts(q), q);
      show(true);
    }, 160);

    input.addEventListener('input', run);
    input.addEventListener('focus', () => input.value.trim().length >= 2 && show(true));
    document.addEventListener('click', (e) => !root.contains(e.target) && show(false));
    document.addEventListener('keydown', (e) => e.key === 'Escape' && show(false));
  })();

  (function overlaySearch() {
    const root = $('[data-search-overlay]');
    if (!root) return;
    const panel = $('[data-search-panel]', root);
    const backdrop = $('[data-search-backdrop]', root);
    const input = $('[data-search-input]', root);
    const box = $('[data-search-results-mobile]', root);
    const sugg = $('[data-search-suggestions]', root);
    const cats = $('[data-search-categories]', root);

    if (cats) {
      cats.innerHTML = D.CATEGORIES.map(
        (c) => `
        <a href="catalog.html?cat=${c.id}" class="flex items-center gap-3 rounded-2xl p-3 ring-1 ring-ink-200 transition-all duration-250 hover:ring-brand-300 hover:bg-brand-50">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${c.icon}</svg>
          </span>
          <span class="min-w-0">
            <span class="block truncate text-sm font-medium text-ink-900">${c.short}</span>
            <span class="block text-xs text-ink-400">${c.count} товарів</span>
          </span>
        </a>`
      ).join('');
    }

    const open = () => {
      root.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        backdrop.classList.remove('opacity-0');
        panel.classList.remove('opacity-0', '-translate-y-6');
        input.focus();
      });
    };
    const close = () => {
      backdrop.classList.add('opacity-0');
      panel.classList.add('opacity-0', '-translate-y-6');
      document.body.style.overflow = '';
      setTimeout(() => root.classList.add('hidden'), 300);
    };

    $$('[data-open-search]').forEach((b) => b.addEventListener('click', open));
    $$('[data-close-search]').forEach((b) => b.addEventListener('click', close));
    backdrop.addEventListener('click', close);

    const run = debounce(() => {
      const q = input.value;
      const active = q.trim().length >= 2;
      sugg.classList.toggle('hidden', active);
      box.innerHTML = active ? resultsHtml(searchProducts(q, 8), q) : '';
    }, 160);
    input.addEventListener('input', run);

    $$('[data-suggest]', root).forEach((b) =>
      b.addEventListener('click', () => {
        input.value = b.dataset.suggest;
        input.dispatchEvent(new Event('input'));
        input.focus();
      })
    );

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        root.classList.contains('hidden') ? open() : close();
      }
      if (e.key === 'Escape' && !root.classList.contains('hidden')) close();
    });
  })();

  /* ======================================================================
     Поява під час скролу
     ====================================================================== */
  (function reveal() {
    const els = $$('.reveal');
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('is-visible');
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
    );
    els.forEach((el) => io.observe(el));

    // Спостерігати за картками, доданими пізніше
    document.addEventListener('soco:rendered', () => {
      $$('.reveal:not(.is-visible)').forEach((el) => io.observe(el));
    });
  })();

  /* ======================================================================
     Онлайн-чат
     ====================================================================== */
  (function chat() {
    const toggle = $('[data-chat-toggle]');
    const panel = $('[data-chat-panel]');
    if (!toggle || !panel) return;

    const log = $('[data-chat-log]');
    const form = $('[data-chat-form]');
    const input = $('[data-chat-input]');
    const badge = $('[data-chat-badge]');
    const contactForm = $('[data-chat-contact-form]');
    const contactSubmit = $('[data-chat-contact-submit]');
    let pendingLeadMessage = '';
    let leadSubmitted = false;
    let isSubmittingContact = false;

    const GREETING = {
      from: 'bot',
      text: 'Вітаю! Мене звати Анна, я менеджерка SOCO-SANI. Підберу матеріали, розрахую вартість і відповім щодо термінів доставки. Чим допомогти?',
    };

    if (!state.chat.length) state.chat = [GREETING];

    const REPLIES = [
      [/(замовлен|статус|де|відстеж)/i, 'Уточніть, будь ласка, номер замовлення або телефон, на який його оформлено — подивлюся статус і назву дату доставки.'],
      [/(доставк|відправ|нова пошта|самовив)/i, 'Нова Пошта до відділення — від 50 ₴, 1–3 дні. Курʼєр Нової Пошти по Україні — від 85 ₴, 1–3 дні. У Києві доступний самовивіз.'],
      [/(рахун|оплат|фоп|реквізит|передоплат)/i, 'Оплата на картку або реквізити ФОП, готівкою при самовивозі, післяплата. Доставка — тільки по передоплаті, 200 ₴.'],
      [/(гарант|поверн|обмін|брак)/i, 'Гарантія залежить від сервісної політики виробника й вказана в описі товару. Повернення та обмін — протягом 14 днів після отримання.'],
      [/(аналог|підбер|замін|поради|який|що краще)/i, 'Опишіть задачу: який протокол використовуєте і що не влаштовує в поточному матеріалі. Підберу 2–3 варіанти з цінами та характеристиками.'],
      [/(гаранті|сертифікат|оригінал|справжн)/i, 'Усі товари оригінальні, постачання напряму від виробників та офіційних дистрибʼюторів. На обладнання — гарантія від 12 до 24 місяців із сервісом у Києві. Сертифікати надаємо на запит.'],
      [/(поверн|обмін|брак)/i, 'Повернення протягом 14 днів, якщо упаковку не розкрито. За заводського браку міняємо за наш рахунок — просто надішліть фото.'],
      [/(привіт|вітаю|добрий|hi|hello)/i, 'Вітаю! Готова допомогти з підбором матеріалів або розрахунком замовлення.'],
      [/(дякую|спасибі|вдячн)/i, 'Будь ласка! Якщо зʼявляться питання — пишіть, я на звʼязку.'],
    ];

    const answer = (text) => {
      for (const [re, reply] of REPLIES) if (re.test(text)) return reply;
      return 'Дякую за повідомлення! Передаю його менеджеру — відповімо протягом кількох хвилин. Якщо питання термінове, телефонуйте: +380 (98) 755-55-88.';
    };

    const bubble = (m) =>
      m.from === 'bot'
        ? `<div class="flex gap-2.5">
             <span class="mt-auto grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
               <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8.5" r="3.2"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0" stroke-linecap="round"/></svg>
             </span>
             <p class="max-w-[80%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-ink-700 shadow-sm ring-1 ring-ink-100">${escapeHtml(m.text)}</p>
           </div>`
        : `<div class="flex justify-end">
             <p class="max-w-[80%] rounded-2xl rounded-br-md bg-brand-600 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white shadow-sm">${escapeHtml(m.text)}</p>
           </div>`;

    const draw = () => {
      log.innerHTML = state.chat.map(bubble).join('');
      log.scrollTop = log.scrollHeight;
    };

    const typing = () => {
      const el = document.createElement('div');
      el.className = 'flex gap-2.5';
      el.dataset.typing = '';
      el.innerHTML = `
        <span class="mt-auto grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8.5" r="3.2"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0" stroke-linecap="round"/></svg>
        </span>
        <span class="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3.5 shadow-sm ring-1 ring-ink-100">
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300 [animation-delay:-0.3s]"></span>
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300 [animation-delay:-0.15s]"></span>
          <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300"></span>
        </span>`;
      log.appendChild(el);
      log.scrollTop = log.scrollHeight;
      return el;
    };

    const send = (text) => {
      text = text.trim();
      if (!text) return;
      state.chat.push({ from: 'me', text });
      if (!leadSubmitted) {
        pendingLeadMessage = [pendingLeadMessage, text].filter(Boolean).join('\n\n').slice(0, 4000);
        contactForm.classList.remove('hidden');
        contactForm.setAttribute('aria-hidden', 'false');
      }
      persist();
      draw();

      const t = typing();
      setTimeout(() => {
        t.remove();
        state.chat.push({ from: 'bot', text: answer(text) });
        persist();
        draw();
      }, 900 + Math.min(text.length * 18, 900));
    };

    let open = false;
    const set = (v) => {
      open = v;
      toggle.setAttribute('aria-expanded', v);
      toggle.toggleAttribute('data-open', v);
      panel.setAttribute('aria-hidden', !v);
      panel.classList.toggle('invisible', !v);
      panel.style.pointerEvents = v ? 'auto' : 'none';
      panel.classList.toggle('opacity-0', !v);
      panel.classList.toggle('translate-y-4', !v);
      panel.classList.toggle('scale-95', !v);
      if (v) {
        badge.classList.add('scale-0');
        draw();
        setTimeout(() => input.focus(), 260);
      }
    };

    toggle.addEventListener('click', () => set(!open));
    $('[data-chat-close]').addEventListener('click', () => set(false));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      send(input.value);
      input.value = '';
    });
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isSubmittingContact || !pendingLeadMessage) return;

      let bad = null;
      $$('[required]', contactForm).forEach((field) => {
        const invalid =
          field.type === 'checkbox'
            ? !field.checked
            : !field.value.trim() || (field.type === 'email' && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(field.value));
        field.classList.toggle('!ring-rose-400', invalid);
        field.classList.toggle('!ring-2', invalid);
        if (invalid && !bad) bad = field;
      });

      if (bad) {
        toast('Заповніть контакти для відповіді', 'error');
        bad.focus();
        return;
      }

      const formData = new FormData(contactForm);
      const value = (name) => String(formData.get(name) || '').trim();
      isSubmittingContact = true;
      contactSubmit.disabled = true;
      contactSubmit.textContent = 'Передаємо…';

      try {
        await createStorefrontLead({
          name: value('name'),
          phone: value('phone'),
          email: value('email'),
          topic: 'Онлайн-чат',
          message: pendingLeadMessage,
          consent: true,
          source: 'CHAT',
          landingPage: window.location.href,
          referrer: document.referrer || undefined,
          website: value('website'),
        });

        leadSubmitted = true;
        contactForm.classList.add('hidden');
        contactForm.setAttribute('aria-hidden', 'true');
        state.chat.push({ from: 'bot', text: 'Дякуємо! Менеджер отримав ваше звернення та зв’яжеться найближчим часом.' });
        persist();
        draw();
        toast('Звернення передано менеджеру', 'ok');
      } catch {
        toast('Не вдалося передати звернення. Спробуйте ще раз.', 'error');
      } finally {
        isSubmittingContact = false;
        contactSubmit.disabled = false;
        contactSubmit.textContent = 'Передати менеджеру';
      }
    });
    $$('[data-chat-preset]').forEach((b) => b.addEventListener('click', () => send(b.dataset.chatPreset)));
    document.addEventListener('keydown', (e) => e.key === 'Escape' && open && set(false));

    draw();
  })();

  /* ======================================================================
     Cookie-банер
     ====================================================================== */
  (function cookies() {
    const banner = $('[data-cookie-banner]');
    if (!banner || state.cookiesAccepted) return;

    setTimeout(() => {
      banner.hidden = false;
      requestAnimationFrame(() => banner.classList.remove('translate-y-6', 'opacity-0'));
    }, 1600);

    $('[data-cookie-accept]').addEventListener('click', () => {
      state.cookiesAccepted = true;
      persist();
      banner.classList.add('translate-y-6', 'opacity-0');
      setTimeout(() => (banner.hidden = true), 500);
    });
  })();

  /* ======================================================================
     Підписка у футері
     ====================================================================== */
  $$('[data-subscribe]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]');
      if (!email.value || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email.value)) {
        toast('Перевірте адресу електронної пошти', 'error');
        email.focus();
        return;
      }
      toast('Підписку оформлено', 'ok', 'Перший лист надійде в понеділок');
      form.reset();
    });
  });

  /* ======================================================================
     Експорт для сторінкових скриптів
     ====================================================================== */
  window.SOCO = {
    state,
    persist,
    money,
    plural,
    escapeHtml,
    debounce,
    Cart,
    Favorites,
    Compare,
    renderCard,
    syncCards,
    stars,
    stockHtml,
    badgeHtml,
    toast,
    createStorefrontLead,
    searchProducts,
    updateCounters,
    rendered: () => document.dispatchEvent(new CustomEvent('soco:rendered')),
  };

  document.addEventListener('soco:change', updateCounters);
  updateCounters();
})();
