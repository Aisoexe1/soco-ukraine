/**
 * SOCO-SANI — порівняння товарів.
 * Зводить характеристики різних позицій в одну таблицю, вміє ховати однакові рядки.
 */
(function () {
  'use strict';

  const S = window.SOCO;
  const D = window.SOCO_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const table = $('[data-cmp-table]');
  if (!table) return;

  let onlyDiff = false;

  /** Збирає всі назви характеристик у порядку появи */
  function specKeys(items) {
    const keys = [];
    items.forEach((p) => p.specs.forEach(([k]) => !keys.includes(k) && keys.push(k)));
    return keys;
  }

  const specValue = (p, key) => {
    const found = p.specs.find(([k]) => k === key);
    return found ? found[1] : '—';
  };

  function render() {
    const items = S.Compare.items();

    $('[data-cmp-empty]').classList.toggle('hidden', items.length > 0);
    $('[data-cmp-wrap]').classList.toggle('hidden', items.length === 0);
    $('[data-cmp-actions]').classList.toggle('hidden', items.length === 0);
    $('[data-cmp-actions]').classList.toggle('flex', items.length > 0);

    if (!items.length) return;

    /* --- Рядки характеристик --- */
    const rows = [
      {
        label: 'Ціна',
        cell: (p) => `
          <span class="block text-xl font-bold tracking-tight text-ink-900">${S.money(p.price)}</span>
          ${p.oldPrice ? `<span class="block text-xs text-ink-400 line-through">${S.money(p.oldPrice)}</span>` : ''}`,
        raw: (p) => String(p.price),
        best: (p, all) => p.price === Math.min(...all.map((x) => x.price)),
      },
      {
        label: 'Рейтинг',
        cell: (p) => `<span class="flex items-center gap-1.5">${S.stars(p.rating)}<span class="text-sm font-medium text-ink-700">${p.rating.toFixed(1)}</span></span>`,
        raw: (p) => p.rating.toFixed(1),
        best: (p, all) => p.rating === Math.max(...all.map((x) => x.rating)),
      },
      { label: 'Відгуків', cell: (p) => `<span class="text-sm text-ink-700">${p.reviews}</span>`, raw: (p) => String(p.reviews) },
      { label: 'Бренд', cell: (p) => `<span class="text-sm text-ink-700">${S.escapeHtml(D.brandName(p.brand))}</span>`, raw: (p) => D.brandName(p.brand) },
      { label: 'Країна', cell: (p) => `<span class="text-sm text-ink-700">${S.escapeHtml(D.brandById(p.brand).country)}</span>`, raw: (p) => D.brandById(p.brand).country },
      { label: 'Категорія', cell: (p) => `<span class="text-sm text-ink-700">${S.escapeHtml(D.catName(p.cat))}</span>`, raw: (p) => D.catName(p.cat) },
      { label: 'Наявність', cell: (p) => S.stockHtml(p), raw: (p) => (p.stock > 20 ? 'in' : p.stock > 0 ? 'low' : 'no') },
      { label: 'Артикул', cell: (p) => `<span class="text-sm text-ink-500">${p.sku}</span>`, raw: (p) => p.sku },
      { label: 'Одиниця', cell: (p) => `<span class="text-sm text-ink-700">${S.escapeHtml(p.unit)}</span>`, raw: (p) => p.unit },
    ];

    specKeys(items).forEach((key) =>
      rows.push({
        label: key,
        cell: (p) => `<span class="text-sm text-ink-700">${S.escapeHtml(specValue(p, key))}</span>`,
        raw: (p) => specValue(p, key),
      })
    );

    /* --- Шапка з картками --- */
    const head = `
      <thead>
        <tr>
          <th scope="col" class="sticky left-0 z-10 w-48 bg-white p-5 align-bottom">
            <span class="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">Характеристика</span>
          </th>
          ${items
            .map(
              (p) => `
            <th scope="col" class="border-l border-ink-100 p-5 align-top" style="width:${Math.floor(100 / items.length)}%">
              <div class="relative">
                <button type="button" class="absolute -right-1 -top-1 grid h-8 w-8 place-items-center rounded-full text-ink-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600" data-cmp-remove="${p.id}" aria-label="Прибрати з порівняння">
                  <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke-linecap="round"/></svg>
                </button>
                <a href="product.html?id=${p.id}" class="block">
                  <img src="${p.image}" alt="${S.escapeHtml(p.name)}" width="200" height="200" loading="lazy" class="mx-auto h-32 w-32 rounded-2xl bg-ink-50 object-cover" />
                  <span class="mt-3 block text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-600">${S.escapeHtml(D.brandName(p.brand))}</span>
                  <span class="mt-1 block text-[14px] font-semibold leading-snug text-ink-900 transition-colors hover:text-brand-700">${S.escapeHtml(p.name)}</span>
                </a>
                <button type="button" class="btn-primary btn-sm mt-4 w-full" data-add="${p.id}">
                  ${S.Cart.has(p.id) ? 'У кошику' : 'В кошик'}
                </button>
              </div>
            </th>`
            )
            .join('')}
          ${
            items.length < 4
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
        const vals = items.map((p) => r.raw(p));
        return new Set(vals).size > 1;
      })
      .map((r, i) => {
        const cells = items
          .map((p) => {
            const isBest = r.best && items.length > 1 && r.best(p, items);
            return `<td class="border-l border-ink-100 px-5 py-3.5 ${isBest ? 'bg-mint-500/[0.06]' : ''}">
                      ${r.cell(p)}
                      ${isBest ? '<span class="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600"><svg viewBox="0 0 24 24" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>краще</span>' : ''}
                    </td>`;
          })
          .join('');

        return `<tr class="${i % 2 ? 'bg-white' : 'bg-ink-50/50'}">
                  <th scope="row" class="sticky left-0 z-10 px-5 py-3.5 text-left text-[13px] font-medium text-ink-500 ${i % 2 ? 'bg-white' : 'bg-ink-50'}">${S.escapeHtml(r.label)}</th>
                  ${cells}
                  ${items.length < 4 ? '<td class="border-l border-ink-100"></td>' : ''}
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
