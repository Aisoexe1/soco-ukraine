/**
 * SOCO-SANI — особистий кабінет (демо, дані в localStorage).
 */
(function () {
  'use strict';

  const S = window.SOCO;
  const D = window.SOCO_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const auth = $('[data-auth]');
  if (!auth) return;
  const acc = $('[data-account]');

  const initials = (name) =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'SC';

  const dateFmt = (iso) =>
    new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });

  /* ======================================================================
     Перемикання екранів
     ====================================================================== */
  function show() {
    const u = S.state.user;
    auth.classList.toggle('hidden', !!u);
    acc.classList.toggle('hidden', !u);
    if (u) fillAccount(u);
  }

  /* ======================================================================
     Вхід / реєстрація
     ====================================================================== */
  $$('[data-auth-tab]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const tab = btn.dataset.authTab;
      $$('[data-auth-tab]').forEach((b) => b.classList.toggle('is-active', b.dataset.authTab === tab));
      $$('[data-auth-panel]').forEach((p) => p.classList.toggle('hidden', p.dataset.authPanel !== tab));
    })
  );

  const validate = (form) => {
    let bad = null;
    $$('[required]', form).forEach((f) => {
      const invalid =
        f.type === 'checkbox'
          ? !f.checked
          : !f.value.trim() || (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(f.value));
      f.classList.toggle('!ring-rose-400', invalid);
      f.classList.toggle('!ring-2', invalid);
      if (invalid && !bad) bad = f;
    });
    return bad;
  };

  $('[data-auth-panel="login"]').addEventListener('submit', (e) => {
    e.preventDefault();
    const bad = validate(e.target);
    if (bad) return (S.toast('Перевірте заповнені поля', 'error'), bad.focus());

    const email = e.target.email.value.trim();
    S.state.user = {
      name: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
      phone: '',
      company: '',
    };
    S.persist();
    S.toast('Вітаємо у кабінеті', 'ok');
    show();
  });

  $('[data-auth-panel="register"]').addEventListener('submit', (e) => {
    e.preventDefault();
    const bad = validate(e.target);
    if (bad) return (S.toast('Перевірте заповнені поля', 'error'), bad.focus());

    const f = e.target;
    S.state.user = {
      name: f.name.value.trim(),
      email: f.email.value.trim(),
      phone: f.phone.value.trim(),
      company: f.company.value.trim(),
    };
    S.persist();
    S.toast('Акаунт створено', 'ok', 'Менеджер звʼяжеться щодо персональних умов');
    show();
  });

  $('[data-logout]').addEventListener('click', () => {
    S.state.user = null;
    S.persist();
    S.toast('Ви вийшли з кабінету', 'info');
    show();
  });

  /* ======================================================================
     Наповнення кабінету
     ====================================================================== */
  function fillAccount(u) {
    $('[data-user-initials]').textContent = initials(u.name);
    $('[data-user-name]').textContent = u.name;
    $('[data-user-meta]').textContent = [u.company, u.email].filter(Boolean).join(' · ');

    const orders = S.state.orders || [];
    const spent = orders.reduce((s, o) => s + o.total, 0);

    $('[data-stat-orders]').textContent = orders.length;
    $('[data-stat-total]').textContent = S.money(spent);

    /* --- Замовлення --- */
    const list = $('[data-orders-list]');
    $('[data-orders-empty]').classList.toggle('hidden', orders.length > 0);

    list.innerHTML = orders
      .map(
        (o) => `
      <article class="overflow-hidden rounded-3xl bg-white ring-1 ring-ink-200/80">
        <header class="flex flex-wrap items-center justify-between gap-4 border-b border-ink-100 bg-ink-50/60 px-6 py-4">
          <div>
            <span class="text-[15px] font-semibold text-ink-900">Замовлення ${o.number}</span>
            <span class="ml-3 text-[13px] text-ink-500">від ${dateFmt(o.date)}</span>
          </div>
          <div class="flex items-center gap-4">
            <span class="badge-amber">${S.escapeHtml(o.status)}</span>
            <span class="text-lg font-bold tracking-tight text-ink-900">${S.money(o.total)}</span>
          </div>
        </header>

        <div class="divide-y divide-ink-100">
          ${o.items
            .map(
              (i) => `
            <div class="flex items-center gap-4 px-6 py-3.5">
              <img src="${(D.byId(i.id) || {}).image || 'assets/img/logo.svg'}" alt="" width="56" height="56" loading="lazy" class="h-14 w-14 shrink-0 rounded-xl bg-ink-50 object-cover" />
              <a href="product.html?id=${i.id}" class="min-w-0 flex-1 text-[14px] font-medium text-ink-800 transition-colors hover:text-brand-700">${S.escapeHtml(i.name)}</a>
              <span class="shrink-0 text-[13px] text-ink-500">${i.qty} × ${S.money(i.price)}</span>
            </div>`
            )
            .join('')}
        </div>

        <footer class="flex flex-wrap gap-2 border-t border-ink-100 px-6 py-4">
          <button type="button" class="btn-soft btn-sm" data-reorder="${o.number}">Повторити замовлення</button>
          <a href="contacts.html" class="btn-ghost btn-sm rounded-full ring-1 ring-ink-200">Запросити документи</a>
        </footer>
      </article>`
      )
      .join('');

    /* --- Профіль --- */
    const pf = $('[data-profile-form]');
    pf.name.value = u.name || '';
    pf.phone.value = u.phone || '';
    pf.email.value = u.email || '';
    pf.company.value = u.company || '';
    pf.edrpou.value = u.edrpou || '';
    pf.iban.value = u.iban || '';

    /* --- Адреси --- */
    const addresses = [
      { title: 'Клініка, основна', text: 'м. Київ, вул. Куренівська, 5/7, 3 поверх, офіс 105', note: 'Курʼєр, Пн–Пт 9:00–18:00', main: true },
      { title: 'Нова Пошта', text: 'м. Київ, відділення №12', note: 'Отримувач: ' + u.name, main: false },
      { title: 'Філія на Печерську', text: 'м. Київ, вул. Богдана Хмельницького, 16', note: 'Тільки після 14:00', main: false },
    ];

    $('[data-addresses]').innerHTML =
      addresses
        .map(
          (a) => `
      <div class="relative rounded-3xl bg-white p-6 ring-1 ${a.main ? 'ring-2 ring-brand-600' : 'ring-ink-200/80'}">
        ${a.main ? '<span class="badge-brand absolute right-5 top-5">Основна</span>' : ''}
        <span class="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
            <path d="M12 21s6.5-5.5 6.5-10a6.5 6.5 0 1 0-13 0c0 4.5 6.5 10 6.5 10Z" stroke-linejoin="round"/><circle cx="12" cy="11" r="2.4"/>
          </svg>
        </span>
        <p class="mt-4 text-[15px] font-semibold text-ink-900">${a.title}</p>
        <p class="mt-1.5 text-[14px] leading-relaxed text-ink-600">${S.escapeHtml(a.text)}</p>
        <p class="mt-2 text-[12.5px] text-ink-400">${S.escapeHtml(a.note)}</p>
      </div>`
        )
        .join('') +
      `<a href="contacts.html" class="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-ink-200 p-6 text-ink-400 transition-colors hover:border-brand-300 hover:text-brand-600">
         <svg viewBox="0 0 24 24" class="h-8 w-8" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>
         <span class="text-sm font-medium">Додати адресу</span>
       </a>`;

    /* --- Переглянуті --- */
    const viewed = (S.state.recent || []).map(D.byId).filter(Boolean);
    $('[data-viewed-empty]').classList.toggle('hidden', viewed.length > 0);
    $('[data-viewed-grid]').innerHTML = viewed.slice(0, 8).map((p) => S.renderCard(p)).join('');
    S.rendered();
  }

  /* --- Збереження профілю --- */
  $('[data-profile-form]').addEventListener('submit', (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    S.state.user = Object.assign({}, S.state.user, d);
    S.persist();
    fillAccount(S.state.user);
    S.toast('Зміни збережено', 'ok');
  });

  /* --- Повтор замовлення --- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-reorder]');
    if (!b) return;
    const o = (S.state.orders || []).find((x) => x.number === b.dataset.reorder);
    if (!o) return;
    o.items.forEach((i) => (S.state.cart[i.id] = (S.state.cart[i.id] || 0) + i.qty));
    S.persist();
    S.toast('Товари додано в кошик', 'cart', `Замовлення ${o.number}`);
  });

  /* --- Вкладки кабінету --- */
  $$('[data-acc-tab]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const tab = btn.dataset.accTab;
      $$('[data-acc-tab]').forEach((b) => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-selected', b === btn);
      });
      $$('[data-acc-panel]').forEach((p) => p.classList.toggle('hidden', p.dataset.accPanel !== tab));
    })
  );

  show();
})();
