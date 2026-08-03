/**
 * SOCO-SANI — форма зворотного звʼязку.
 */
(function () {
  'use strict';
  const S = window.SOCO;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const form = $('[data-contact-form]');
  if (!form) return;
  const success = $('[data-contact-success]');
  const submit = $('[type="submit"]', form);
  const submitLabel = submit.textContent;
  let isSubmitting = false;

  const value = (formData, name) => String(formData.get(name) || '').trim();

  const setSubmitting = (next) => {
    isSubmitting = next;
    submit.disabled = next;
    submit.textContent = next ? 'Надсилаємо…' : submitLabel;
    submit.setAttribute('aria-busy', String(next));
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
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

    const formData = new FormData(form);
    setSubmitting(true);

    try {
      await S.createStorefrontLead({
        name: value(formData, 'name'),
        phone: value(formData, 'phone'),
        email: value(formData, 'email'),
        company: value(formData, 'company'),
        topic: value(formData, 'topic'),
        message: value(formData, 'message'),
        consent: true,
        source: 'CONTACT_FORM',
        landingPage: window.location.href,
        referrer: document.referrer || undefined,
        website: value(formData, 'website'),
      });

      form.classList.add('hidden');
      success.classList.remove('hidden');
      S.toast('Заявку надіслано', 'ok', 'Менеджер звʼяжеться з вами найближчим часом');
    } catch {
      S.toast('Не вдалося надіслати заявку. Спробуйте ще раз.', 'error');
    } finally {
      setSubmitting(false);
    }
  });

  $('[data-contact-reset]').addEventListener('click', () => {
    form.reset();
    form.classList.remove('hidden');
    success.classList.add('hidden');
  });
})();
