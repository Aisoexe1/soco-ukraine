/**
 * SOCO-SANI — кошик і оформлення замовлення.
 */
(function () {
  'use strict';

  const S = window.SOCO;
  const D = window.SOCO_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const list = $('[data-cart-list]');
  if (!list) return;



  /* ======================================================================
     Рядок товару
     ====================================================================== */
  function row({ product: p, qty }, i) {
    return `
    <div class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5 ${i > 0 ? 'border-t border-ink-100' : ''}" data-row="${p.id}">
      <a href="product.html?id=${p.id}" class="shrink-0">
        <img src="${p.image}" alt="${S.escapeHtml(p.name)}" width="128" height="128" loading="lazy"
             class="h-24 w-24 rounded-2xl bg-ink-50 object-cover sm:h-28 sm:w-28" />
      </a>

      <div class="min-w-0 flex-1">
        <span class="text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-600">${S.escapeHtml(D.brandName(p.brand))}</span>
        <h3 class="mt-1 text-[15px] font-semibold leading-snug text-ink-900">
          <a href="product.html?id=${p.id}" class="transition-colors hover:text-brand-700">${S.escapeHtml(p.name)}</a>
        </h3>
        <p class="mt-1.5 text-xs text-ink-400">Артикул: ${p.sku} · ${S.escapeHtml(D.catName(p.cat))}</p>
        <div class="mt-2">${S.stockHtml(p)}</div>
      </div>

      <div class="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-3">
        <!-- Кількість -->
        <div class="flex h-11 items-center rounded-full bg-ink-50 ring-1 ring-ink-200">
          <button type="button" class="grid h-11 w-10 place-items-center rounded-l-full text-ink-600 transition-colors hover:text-brand-700 active:scale-90" data-dec="${p.id}" aria-label="Зменшити">
            <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M6 12h12" stroke-linecap="round"/></svg>
          </button>
          <input type="number" min="1" max="99" value="${qty}" class="h-11 w-10 border-0 bg-transparent p-0 text-center text-sm font-semibold text-ink-900 focus:outline-none" data-qty-input="${p.id}" aria-label="Кількість" />
          <button type="button" class="grid h-11 w-10 place-items-center rounded-r-full text-ink-600 transition-colors hover:text-brand-700 active:scale-90" data-inc="${p.id}" aria-label="Збільшити">
            <svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M12 6v12M6 12h12" stroke-linecap="round"/></svg>
          </button>
        </div>

        <!-- Ціна -->
        <div class="text-right">
          ${p.oldPrice ? `<span class="block text-xs text-ink-400 line-through">${S.money(p.oldPrice * qty)}</span>` : ''}
          <span class="block text-lg font-bold tracking-tight text-ink-900">${S.money(p.price * qty)}</span>
          ${qty > 1 ? `<span class="block text-[11px] text-ink-400">${S.money(p.price)} × ${qty}</span>` : ''}
        </div>

        <button type="button" class="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-400 transition-all duration-250 hover:bg-rose-500/10 hover:text-rose-600 active:scale-90" data-remove="${p.id}" aria-label="Прибрати товар">
          <svg viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
            <path d="M5 7h14M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7m2 0v12a1.5 1.5 0 0 1-1.5 1.5H9A1.5 1.5 0 0 1 7.5 19V7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>`;
  }

  /* ======================================================================
     Підсумок
     ====================================================================== */
  function deliveryCost(subtotal) {
    const sel = $('[data-delivery]:checked');
    const base = sel ? Number(sel.dataset.price) : 0;
    return base;
  }

  function render() {
    const items = S.Cart.items();
    const count = S.Cart.count();

    $('[data-cart-empty]').classList.toggle('hidden', items.length > 0);
    $('[data-cart-body]').classList.toggle('hidden', items.length === 0);
    $('[data-cart-body]').classList.toggle('lg:grid', items.length > 0);
    $('[data-cart-clear]').classList.toggle('hidden', items.length === 0);
    $('[data-steps]').classList.toggle('hidden', items.length === 0);

    $('[data-cart-count-label]').textContent = count
      ? `${count} ${S.plural(count, 'товар', 'товари', 'товарів')}`
      : '';

    if (!items.length) {
      // Підказки в порожньому кошику
      const suggest = $('[data-cart-suggest]');
      if (suggest && !suggest.dataset.filled) {
        suggest.innerHTML = D.PRODUCTS.filter((p) => p.badges.includes('hit'))
          .slice(0, 4)
          .map((p) => S.renderCard(p))
          .join('');
        suggest.dataset.filled = '1';
      }
      return;
    }

    list.innerHTML = `<div class="bg-white">${items.map(row).join('')}</div>`;

    const subtotal = S.Cart.subtotal();
    const savings = S.Cart.savings();
    const delivery = deliveryCost(subtotal);
    const total = subtotal + delivery;

    $('[data-sum-count]').textContent = `(${count})`;
    $('[data-sum-subtotal]').textContent = S.money(subtotal);

    $('[data-sum-savings-row]').classList.toggle('hidden', savings === 0);
    $('[data-sum-savings-row]').classList.toggle('flex', savings > 0);
    $('[data-sum-savings]').textContent = `−${S.money(savings)}`;


    $('[data-sum-delivery]').textContent = delivery ? 'від ' + S.money(delivery) : 'Безкоштовно';
    $('[data-sum-delivery]').classList.toggle('text-emerald-600', delivery === 0);
    $('[data-sum-total]').textContent = S.money(total);

    S.rendered();
  }

  /* ======================================================================
     Обробники
     ====================================================================== */
  document.addEventListener('click', (e) => {
    const inc = e.target.closest('[data-inc]');
    if (inc) {
      S.Cart.set(inc.dataset.inc, S.Cart.qty(inc.dataset.inc) + 1);
      return render();
    }
    const dec = e.target.closest('[data-dec]');
    if (dec) {
      S.Cart.set(dec.dataset.dec, S.Cart.qty(dec.dataset.dec) - 1);
      return render();
    }
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      const el = $(`[data-row="${rm.dataset.remove}"]`);
      if (el) {
        el.style.transition = 'opacity .25s, transform .25s';
        el.style.opacity = '0';
        el.style.transform = 'translateX(-16px)';
      }
      setTimeout(() => {
        S.Cart.remove(rm.dataset.remove);
        render();
      }, 220);
      S.toast('Товар прибрано з кошика', 'cart');
      return;
    }
    if (e.target.closest('[data-cart-clear]')) {
      S.Cart.clear();
      render();
      S.toast('Кошик очищено', 'cart');
    }
  });

  list.addEventListener('change', (e) => {
    const inp = e.target.closest('[data-qty-input]');
    if (!inp) return;
    S.Cart.set(inp.dataset.qtyInput, Math.min(99, Math.max(1, Number(inp.value) || 1)));
    render();
  });

  $$('[data-delivery]').forEach((r) => r.addEventListener('change', render));


  /* --- Оформлення --- */

  /// Розбиває ПІБ на імʼя/прізвище — CRM веде їх окремими полями.
  /// Перше слово завжди імʼя, решта (якщо є) — прізвище.
  function splitName(full) {
    const parts = full.trim().split(/\s+/);
    return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || undefined };
  }

  /// Версія угоди — з CRM (`/api/storefront/legal`), щоб у картці клієнта
  /// зберігся текст, на який він реально погодився. Кешується на сторінці:
  /// текст оновлюється рідко, а два запити на одне оформлення не потрібні.
  let consentVersionPromise = null;
  async function getConsentVersion() {
    if (!consentVersionPromise) {
      consentVersionPromise = fetch(
        (function () {
          const configured =
            window.SOCO_CRM_API_URL || document.querySelector('meta[name="soco-crm-api-url"]')?.getAttribute('content')?.trim();
          return configured ? new URL('/api/storefront/legal', configured).toString() : '/api/storefront/legal';
        })(),
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => json?.data?.version || 'unknown')
        .catch(() => 'unknown');
    }
    return consentVersionPromise;
  }

  const ORDER_ERROR_MESSAGES = {
    'Товару недостатньо на складі': 'На жаль, частина товару вже розкуплена — зменшіть кількість або оберіть інший варіант.',
    'Невідомий товар': 'Один із товарів більше не в каталозі. Оновіть сторінку кошика і спробуйте ще раз.',
    'Сума замовлення менша за мінімальну': 'Мінімальна сума замовлення — 400 ₴. Додайте ще товарів у кошик.',
    'Invalid order payload': 'Перевірте правильність заповнення полів.',
  };

  $('[data-checkout-submit]').addEventListener('click', async () => {
    const form = $('[data-checkout]');
    // Не лише нащадки form у DOM, а й усі елементи, зв'язані через form="checkout-form"
    // (кнопка й чекбокс згоди фізично лежать у сайдбарі підсумку).
    const required = Array.from(document.querySelectorAll('[required]')).filter((el) => el.form === form);
    let firstBad = null;

    required.forEach((f) => {
      const bad =
        f.type === 'checkbox'
          ? !f.checked
          : !f.value.trim() || (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(f.value));
      f.classList.toggle('!ring-rose-400', bad);
      f.classList.toggle('!ring-2', bad);
      if (bad && !firstBad) firstBad = f;
    });

    if (firstBad) {
      S.toast('Заповніть обовʼязкові поля', 'error');
      firstBad.scrollIntoView({ block: 'center', behavior: 'smooth' });
      firstBad.focus({ preventScroll: true });
      return;
    }

    const btn = $('[data-checkout-submit]');
    if (btn.disabled) return;
    btn.disabled = true;
    const btnLabel = btn.textContent;
    btn.textContent = 'Оформлюємо…';

    const data = Object.fromEntries(new FormData(form));
    const { firstName, lastName } = splitName(data.name || '');
    const items = S.Cart.items().map((i) => ({ sku: i.product.sku, quantity: i.qty }));

    try {
      const consentVersion = await getConsentVersion();
      const result = await S.createStorefrontOrder({
        firstName,
        lastName,
        phone: data.phone,
        email: data.email || undefined,
        region: data.region,
        city: data.city,
        warehouse: data.warehouse,
        comment: data.comment || undefined,
        items,
        consent: true,
        consentVersion,
        website: data.website || undefined,
      });

      const code = 'SO-' + String(result.data.orderNumber).padStart(6, '0');

      // Локальний запис лишається для екрана «Мої замовлення» в кабінеті —
      // сам факт замовлення й реальний номер тепер завжди з CRM.
      S.state.orders.unshift({
        number: code,
        date: new Date().toISOString(),
        items: S.Cart.items().map((i) => ({ id: i.product.id, name: i.product.name, qty: i.qty, price: i.product.price })),
        total: S.Cart.subtotal(),
        status: 'Очікує підтвердження',
        contact: { name: data.name, phone: data.phone, email: data.email, company: data.company || '' },
      });

      S.Cart.clear();
      S.persist();

      $('[data-cart-body]').classList.add('hidden');
      $('[data-cart-body]').classList.remove('lg:grid');
      $('[data-cart-empty]').classList.add('hidden');
      $('[data-steps]').classList.add('hidden');
      $('[data-cart-clear]').classList.add('hidden');
      $('[data-order-number]').textContent = code;
      $('[data-cart-success]').classList.remove('hidden');

      window.scrollTo({ top: 0, behavior: 'smooth' });
      S.toast('Замовлення оформлено', 'ok', `Номер ${code}`);
    } catch (err) {
      const message = err && err.data && err.data.error;
      S.toast(ORDER_ERROR_MESSAGES[message] || 'Не вдалося оформити замовлення. Спробуйте ще раз або зателефонуйте нам.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = btnLabel;
    }
  });

  render();
})();
