/**
 * SOCO Ukraine — сторінка «Обране».
 */
(function () {
  'use strict';

  const S = window.SOCO;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const grid = $('[data-fav-grid]');
  if (!grid) return;

  function render() {
    const items = S.Favorites.items();

    $('[data-fav-empty]').classList.toggle('hidden', items.length > 0);
    grid.classList.toggle('hidden', items.length === 0);
    $('[data-fav-actions]').classList.toggle('hidden', items.length === 0);
    $('[data-fav-actions]').classList.toggle('flex', items.length > 0);

    $('[data-fav-sub]').textContent = items.length
      ? `${items.length} ${S.plural(items.length, 'товар', 'товари', 'товарів')} у списку.`
      : 'Товари, які ви відклали на потім.';

    grid.innerHTML = items.map((p, i) => S.renderCard(p, { reveal: true, delay: (i % 4) + 1 })).join('');
    S.rendered();
    requestAnimationFrame(() => $$('.reveal', grid).forEach((el) => el.classList.add('is-visible')));
  }

  $('[data-fav-add-all]').addEventListener('click', () => {
    const items = S.Favorites.items().filter((p) => !S.Cart.has(p.id));
    if (!items.length) return S.toast('Усі обрані товари вже в кошику', 'info');
    items.forEach((p) => (S.state.cart[p.id] = (S.state.cart[p.id] || 0) + 1));
    S.persist();
    S.syncCards();
    S.toast(`Додано в кошик: ${items.length} ${S.plural(items.length, 'товар', 'товари', 'товарів')}`, 'cart');
  });

  $('[data-fav-clear]').addEventListener('click', () => {
    S.state.favorites = [];
    S.persist();
    render();
    S.toast('Список обраного очищено', 'heart');
  });

  // Перемальовувати при знятті сердечка на самій сторінці
  document.addEventListener('soco:change', () => {
    if (S.Favorites.items().length !== $$('[data-product]', grid).length) render();
  });

  render();
})();
