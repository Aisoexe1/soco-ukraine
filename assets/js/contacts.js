/**
 * SOCO Ukraine — форма зворотного звʼязку.
 */
(function () {
  'use strict';
  const S = window.SOCO;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const form = $('[data-contact-form]');
  if (!form) return;
  const success = $('[data-contact-success]');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
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

    if (bad) {
      S.toast('Перевірте обовʼязкові поля', 'error');
      bad.scrollIntoView({ block: 'center', behavior: 'smooth' });
      bad.focus({ preventScroll: true });
      return;
    }

    form.classList.add('hidden');
    success.classList.remove('hidden');
    S.toast('Заявку надіслано', 'ok', 'Менеджер відповість протягом 15 хвилин');
  });

  $('[data-contact-reset]').addEventListener('click', () => {
    form.reset();
    form.classList.remove('hidden');
    success.classList.add('hidden');
  });
})();
