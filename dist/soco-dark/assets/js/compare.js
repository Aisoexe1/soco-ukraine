/**
 * SOCO-SANI — порівняння товарів.
 * Зводить характеристики різних позицій в одну таблицю, вміє ховати однакові рядки.
 * Рейтингу/бренду в реальному каталозі немає — рядки з них прибрані.
 */
(function () {
  'use strict';

  const S = window.SOCO;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const table = $('[data-cmp-table]');
  if (!table) return;

  let onlyDiff = false;

  /** Збирає всі назви характеристик у порядку появи */
  function specKeys(items) {
    const keys = [];
    items.forEach((p) => (p.specs || []).forEach(([k]) => !keys.includes(k) && keys.push(k)));
    return keys;
  }

  const specValue = (p, key) => {
    const found = (p.specs || []).find(([k]) => k === key);
    return found ? found[1] : '—';
  };

  async function render() {
    const items = await S.Compare.items();

    $('[data-cmp-empty]').classList.toggle('hidden', items.length > 0);
    $('[data-cmp-wrap]').classList.toggle('hidden', items.length === 0);
    $('[data-cmp-actions]').classList.toggle('hidden', items.length === 0);
    $('[data-cmp-actions]').classList.toggle('flex', items.length > 0);

    if (!items.length) return;

    // Порівняння показує повну картку — specs/description йдуть з детальної
    // сторінки, а не зі списку. Дотягуємо для тих, кого в реєстрі ще нема.
    const full = await Promise.all(items.map((p) => (p.specs !== undefined ? p : S.fetchProduct(p.sku))));

    /* --- Рядки характеристик --- */
    const rows = [
      {
        label: 'Ціна',
        cell: (p) => `
          <span class="block text-xl font-bold tracking-tight text-ink-900">${S.money(p.salePrice ?? p.price)}</span>
          ${p.salePrice ? `<span class="block text-xs text-ink-400 line-through">${S.money(p.price)}</span>` : ''}`,
        raw: (p) => String(p.salePrice ?? p.price),
        best: (p, all) => (p.salePrice ?? p.price) === Math.min(...all.map((x) => x.salePrice ?? x.price)),
      },
      { label: 'Категорія', cell: (p) => `<span class="text-sm text-ink-700">${S.escapeHtml((p.category && p.category.name) || p.categoryName || '')}</span>`, raw: (p) => (p.category && p.category.name) || p.categoryName || '' },
      { label: 'Наявність', cell: (p) => S.stockHtml(p), raw: (p) => (p.inStock ? 'in' : 'no') },
      { label: 'Артикул', cell: (p) => `<span class="text-sm text-ink-500">${p.sku}</span>`, raw: (p) => p.sku },
    ];

    specKeys(full).forEach((key) =>
      rows.push({
        label: key,
        cell: (p) => `<span class="text-sm text-ink-700">${S.escapeHtml(specValue(p, key))}</span>`,
        raw: (p) => specValue(p, key),
      }),
    );

    /* --- Шапка з картками --- */
    const head = `
      <thead>
        <tr>
          <th scope="col" class="sticky left-0 z-10 w-48 bg-white p-5 align-bottom">
            <span class="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">Характеристика</span>
          </th>
          ${full
            .map(
              (p) => `
            <th scope="col" class="border-l border-ink-100 p-5 align-top" style="width:${Math.floor(100 / full.length)}%">
              <div class="relative">
                <button type="button" class="absolute -right-1 -top-1 grid h-8 w-8 place-items-center rounded-full text-ink-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600" data-cmp-remove="${p.sku}" aria-label="Прибрати з порівняння">
                  <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke-linecap="round"/></svg>
                </button>
                <a href="product.html?sku=${encodeURIComponent(p.sku)}" class="block">
                  <img src="${(p.images && p.images[0]) || p.image || 'assets/img/logo.svg'}" alt="${S.escapeHtml(p.name)}" width="200" height="200" loading="lazy" class="mx-auto h-32 w-32 rounded-2xl bg-ink-50 object-cover" />
                  <span class="mt-1 block text-[14px] font-semibold leading-snug text-ink-900 transition-colors hover:text-brand-700">${S.escapeHtml(p.name)}</span>
                </a>
                <button type="button" class="btn-primary btn-sm mt-4 w-full" data-add="${p.sku}">
                  ${S.Cart.has(p.sku) ? 'У кошику' : 'В кошик'}
                </button>
              </div>
            </th>`,
            )
            .join('')}
          ${
            full.length < 4
              ? `<th scope="col" class="border-l border-ink-100 p-5 align-middle">
                   <a href="catalog.html" class="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-ink-200 p-6 text-ink-400 transition-colors hover:border-brand-300 hover:text-brand-600">
                     <svg viewBox="0 0 24 24" class="h-8 w-8" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>
                     <span class="text-sm font-medium">Додати товар</span>
                   </a>
                 </th>`
              : ''
          }
        </tr>
      </thead>`;

    /* --- Тіло --- */
    const body = rows
      .filter((r) => {
        if (!onlyDiff) return true;
        const vals = full.map((p) => r.raw(p));
        return new Set(vals).size > 1;
      })
      .map((r, i) => {
        const cells = full
          .map((p) => {
            const isBest = r.best && full.length > 1 && r.best(p, full);
            return `<td class="border-l border-ink-100 px-5 py-3.5 ${isBest ? 'bg-mint-500/[0.06]' : ''}">
                      ${r.cell(p)}
                      ${isBest ? '<span class="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600"><svg viewBox="0 0 24 24" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>краще</span>' : ''}
                    </td>`;
          })
          .join('');

        return `<tr class="${i % 2 ? 'bg-white' : 'bg-ink-50/50'}">
                  <th scope="row" class="sticky left-0 z-10 px-5 py-3.5 text-left text-[13px] font-medium text-ink-500 ${i % 2 ? 'bg-white' : 'bg-ink-50'}">${S.escapeHtml(r.label)}</th>
                  ${cells}
                  ${full.length < 4 ? '<td class="border-l border-ink-100"></td>' : ''}
                </tr>`;
      })
      .join('');

    table.innerHTML = head + `<tbody>${body}</tbody>`;
  }

  /* ======================================================================
     Обробники
     ====================================================================== */
  document.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-cmp-remove]');
    if (rm) {
      S.Compare.toggle(rm.dataset.cmpRemove);
      render();
      return;
    }
    if (e.target.closest('[data-cmp-clear]')) {
      S.state.compare = [];
      S.persist();
      render();
      S.toast('Список порівняння очищено', 'compare');
      return;
    }
    if (e.target.closest('[data-add]')) setTimeout(render, 60);
  });

  $('[data-cmp-diff]').addEventListener('change', (e) => {
    onlyDiff = e.target.checked;
    render();
  });

  render();
})();
