/**
 * SOCO-SANI — скрипт головної сторінки.
 * Таби вітрини, карусель відгуків, анімація лічильників.
 */
(function () {
  'use strict';

  const S = window.SOCO;
  const D = window.SOCO_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ======================================================================
     Банери (автопрокрутка)
     Слайди беруться з розмітки: кожен <article> у [data-banner-track].
     Якщо слайдів немає — секція лишається прихованою.
     ====================================================================== */
  (function banners() {
    const root = $('[data-banners]');
    if (!root) return;

    const track = $('[data-banner-track]', root);
    const placeholder = $('[data-banner-placeholder]', track);
    const slides = $$('article:not([data-banner-placeholder])', track);

    // Поки справжніх банерів немає — показуємо лише заглушку без керування
    if (!slides.length) {
      if (!placeholder) return;
      root.hidden = false;
      [$('[data-banner-dots]', root), $('[data-banner-prev]', root), $('[data-banner-next]', root)]
        .forEach((el) => el && el.remove());
      return;
    }

    if (placeholder) placeholder.remove();
    root.hidden = false;

    const dots = $('[data-banner-dots]', root);
    const prev = $('[data-banner-prev]', root);
    const next = $('[data-banner-next]', root);
    const single = slides.length === 1;

    let idx = 0;
    const DELAY = 6000;

    /* --- Один банер: без стрілок, точок і автопрокрутки --- */
    if (single) {
      [dots, prev, next].forEach((el) => el && el.remove());
      return;
    }

    slides.forEach((s, i) => s.setAttribute('aria-label', `${i + 1} з ${slides.length}`));

    dots.innerHTML = slides
      .map(
        (_, i) =>
          `<button type="button" role="tab" class="h-2 rounded-full bg-ink-300 transition-all duration-300" data-banner-dot="${i}" aria-label="Банер ${i + 1}"></button>`
      )
      .join('');
    const dotEls = $$('[data-banner-dot]', dots);

    const sync = () => {
      track.style.transform = `translateX(-${idx * 100}%)`;
      slides.forEach((s, i) => s.toggleAttribute('inert', i !== idx));
      dotEls.forEach((d, i) => {
        const on = i === idx;
        d.style.width = on ? '26px' : '8px';
        d.classList.toggle('bg-brand-600', on);
        d.classList.toggle('bg-ink-300', !on);
        d.setAttribute('aria-selected', on);
      });
    };

    const go = (n) => {
      idx = (n + slides.length) % slides.length;
      sync();
    };

    prev.addEventListener('click', () => {
      go(idx - 1);
      restart();
    });
    next.addEventListener('click', () => {
      go(idx + 1);
      restart();
    });
    dotEls.forEach((d) =>
      d.addEventListener('click', () => {
        go(Number(d.dataset.bannerDot));
        restart();
      })
    );

    /* --- Свайп на тачі --- */
    let x0 = null;
    track.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
    track.addEventListener(
      'touchend',
      (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 45) {
          go(dx < 0 ? idx + 1 : idx - 1);
          restart();
        }
        x0 = null;
      },
      { passive: true }
    );

    /* --- Автопрокрутка: пауза на наведенні, фокусі та у фоновій вкладці --- */
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let timer = null;
    const stop = () => {
      clearInterval(timer);
      timer = null;
    };
    const start = () => {
      if (reduced || timer) return;
      timer = setInterval(() => {
        if (!document.hidden) go(idx + 1);
      }, DELAY);
    };
    const restart = () => {
      stop();
      start();
    };

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    sync();
    start();
  })();

  /* ======================================================================
     Вітрина популярних товарів
     ====================================================================== */
  (function popular() {
    const grid = $('[data-popular-grid]');
    if (!grid) return;

    const pick = (tab) => {
      if (tab === 'new')
        return [...D.PRODUCTS].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);
      if (tab === 'sale')
        return D.PRODUCTS.filter((p) => p.oldPrice)
          .sort((a, b) => b.oldPrice - b.price - (a.oldPrice - a.price))
          .slice(0, 8);
      return D.PRODUCTS.filter((p) => p.badges.includes('hit'))
        .concat(D.PRODUCTS.filter((p) => !p.badges.includes('hit') && p.reviews > 140))
        .slice(0, 8);
    };

    const draw = (tab) => {
      const list = pick(tab);
      grid.innerHTML = list.map((p, i) => S.renderCard(p, { reveal: true, delay: (i % 4) + 1 })).join('');
      S.rendered();
      // Картки першого екрана показуємо одразу
      requestAnimationFrame(() => $$('.reveal', grid).forEach((el) => el.classList.add('is-visible')));
    };

    draw('hit');

    $$('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('[data-tab]').forEach((b) => {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-selected', b === btn);
        });
        grid.style.opacity = '0';
        grid.style.transform = 'translateY(8px)';
        setTimeout(() => {
          draw(btn.dataset.tab);
          grid.style.transition = 'opacity .35s ease, transform .35s ease';
          grid.style.opacity = '1';
          grid.style.transform = 'none';
        }, 180);
      });
    });
  })();

  /* ======================================================================
     Карусель відгуків
     ====================================================================== */
  (function reviews() {
    const track = $('[data-rev-track]');
    if (!track) return;

    const dots = $('[data-rev-dots]');
    const prev = $('[data-rev-prev]');
    const next = $('[data-rev-next]');

    const dateFmt = (iso) =>
      new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });

    track.innerHTML = D.REVIEWS.map(
      (r) => `
      <article class="snap-start-always flex w-[86vw] shrink-0 flex-col rounded-3xl bg-white p-7 ring-1 ring-ink-200/80 transition-shadow duration-400 hover:shadow-lg sm:w-[420px] lg:w-[440px]">
        <div class="flex items-center gap-1">${S.stars(r.rating, 'h-4 w-4')}</div>

        <blockquote class="mt-5 flex-1">
          <svg viewBox="0 0 24 24" class="mb-3 h-7 w-7 text-brand-100" fill="currentColor" aria-hidden="true">
            <path d="M9.4 5.5c-3.6 1.7-5.9 5-5.9 9.2 0 2.6 1.6 4.3 3.9 4.3 2 0 3.6-1.5 3.6-3.5s-1.4-3.4-3.2-3.4c-.3 0-.7 0-1 .1.5-1.9 2-3.5 4-4.4l-1.4-2.3Zm9.2 0c-3.6 1.7-5.9 5-5.9 9.2 0 2.6 1.6 4.3 3.9 4.3 2 0 3.6-1.5 3.6-3.5s-1.4-3.4-3.2-3.4c-.3 0-.7 0-1 .1.5-1.9 2-3.5 4-4.4l-1.4-2.3Z"/>
          </svg>
          <p class="text-[15px] leading-relaxed text-ink-600">${S.escapeHtml(r.text)}</p>
        </blockquote>

        <footer class="mt-6 flex items-center gap-3.5 border-t border-ink-100 pt-5">
          <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white">
            ${S.escapeHtml(r.initials)}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-semibold text-ink-900">${S.escapeHtml(r.name)}</span>
            ${
              [r.role, r.city].filter(Boolean).length
                ? `<span class="block truncate text-xs text-ink-500">${[r.role, r.city].filter(Boolean).map(S.escapeHtml).join(' · ')}</span>`
                : ''
            }
          </span>
          <span class="shrink-0 text-[11px] text-ink-400">${dateFmt(r.date)}</span>
        </footer>
      </article>`
    ).join('');

    const cards = $$('article', track);
    if (!cards.length) return;

    /* --- Точки --- */
    dots.innerHTML = cards
      .map(
        (_, i) =>
          `<button type="button" class="h-2 rounded-full bg-ink-200 transition-all duration-300 hover:bg-brand-300" style="width:${
            i === 0 ? '28px' : '8px'
          }" data-rev-dot="${i}" aria-label="Відгук ${i + 1}"></button>`
      )
      .join('');

    const step = () => cards[0].offsetWidth + 16;

    const syncDots = () => {
      const idx = Math.round(track.scrollLeft / step());
      $$('[data-rev-dot]').forEach((d, i) => {
        const on = i === idx;
        d.style.width = on ? '28px' : '8px';
        d.classList.toggle('bg-brand-600', on);
        d.classList.toggle('bg-ink-200', !on);
      });
      prev.disabled = track.scrollLeft < 8;
      next.disabled = track.scrollLeft > track.scrollWidth - track.clientWidth - 8;
    };

    const go = (dir) => track.scrollBy({ left: dir * step(), behavior: 'smooth' });

    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    $$('[data-rev-dot]').forEach((d) =>
      d.addEventListener('click', () => track.scrollTo({ left: Number(d.dataset.revDot) * step(), behavior: 'smooth' }))
    );
    track.addEventListener('scroll', S.debounce(syncDots, 90), { passive: true });
    syncDots();

    /* --- Автопрокрутка (зупиняється при наведенні та фокусі) --- */
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      let timer = setInterval(tick, 5500);
      function tick() {
        if (document.hidden) return;
        const atEnd = track.scrollLeft > track.scrollWidth - track.clientWidth - 8;
        atEnd ? track.scrollTo({ left: 0, behavior: 'smooth' }) : go(1);
      }
      const pause = () => clearInterval(timer);
      const resume = () => {
        clearInterval(timer);
        timer = setInterval(tick, 5500);
      };
      track.addEventListener('mouseenter', pause);
      track.addEventListener('mouseleave', resume);
      track.addEventListener('focusin', pause);
      track.addEventListener('touchstart', pause, { passive: true });
    }
  })();

  /* ======================================================================
     Анімація числових лічильників
     ====================================================================== */
  (function counters() {
    const els = $$('[data-counter]');
    if (!els.length || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const fmt = (n) => new Intl.NumberFormat('uk-UA').format(n);

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          io.unobserve(en.target);

          const target = Number(en.target.dataset.counter);
          const t0 = performance.now();
          const dur = 1400;

          const tick = (t) => {
            const p = Math.min((t - t0) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            en.target.textContent = fmt(Math.round(target * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.5 }
    );
    els.forEach((el) => io.observe(el));
  })();
})();
