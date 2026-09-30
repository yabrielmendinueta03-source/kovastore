/* =========================================================
   KOVA Essentials — ui.js  (fix: click en card)
   ========================================================= */
(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 0. Estilos ---------- */
  const SUPPORT_CSS = `
    body.kova-lock { overflow: hidden !important; overscroll-behavior: none; }

    .kova-blur {
      filter: blur(8px) saturate(.9);
      transition: filter .35s ease;
      pointer-events: none;
      user-select: none;
    }
    #detailModal, #cart, #overlay, #backToTop { filter: none !important; }
    #detailModal .modal-box { max-height: 90vh; overflow-y: auto; overscroll-behavior: contain; }
    #cart .cart-body         { overflow-y: auto; overscroll-behavior: contain; }

    .kova-reveal {
      opacity: 0;
      transform: translateY(16px) scale(.97);
      filter: blur(10px);
      transition:
        opacity .6s cubic-bezier(.22, 1, .36, 1),
        transform .6s cubic-bezier(.22, 1, .36, 1),
        filter .6s ease;
      will-change: opacity, transform, filter;
    }
    .kova-reveal.is-visible { opacity: 1; transform: none; filter: blur(0); }

    article.card { cursor: pointer; }
    article.card:focus-visible {
      outline: 2px solid var(--gold, #c8a96a);
      outline-offset: 3px;
      border-radius: 14px;
    }

    @media (prefers-reduced-motion: reduce) {
      .kova-reveal { opacity:1 !important; transform:none !important; filter:none !important; transition:none !important; }
      .kova-blur   { filter: none !important; }
    }
  `;

  function injectStyles() {
    if ($('#kova-ui-styles')) return;
    const tag = document.createElement('style');
    tag.id = 'kova-ui-styles';
    tag.textContent = SUPPORT_CSS;
    document.head.appendChild(tag);
  }

  /* ---------- 1. Blur + lock de scroll ---------- */
  const MODAL   = () => $('#detailModal');
  const CART    = () => $('#cart');
  const OVERLAY = () => $('#overlay');
  const EXCLUDE = new Set(['detailModal', 'cart', 'overlay', 'backToTop']);

  const isOpen = (el) => !!el && el.classList.contains('open');
  const overlayOpen = () => isOpen(MODAL()) || isOpen(CART());

  function applyBlur(active) {
    document.body.classList.toggle('kova-lock', active);
    [...document.body.children].forEach((child) => {
      if (EXCLUDE.has(child.id)) return;
      child.classList.toggle('kova-blur', active);
    });
  }
  const syncOverlayState = () => applyBlur(overlayOpen());

  function watchOverlay(el) {
    if (!el) return;
    new MutationObserver(syncOverlayState).observe(el, {
      attributes: true,
      attributeFilter: ['class', 'style', 'aria-hidden'],
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (isOpen(CART())) { $('#closeCart')?.click(); return; }
    if (isOpen(MODAL())) { $('#detailClose')?.click(); }
  });

  /* ---------- 2. Botón "volver arriba" ---------- */
  function setupBackToTop() {
    const btn = $('#backToTop');
    if (!btn) return;

    const SHOW_AFTER = 400;
    let ticking = false;

    const update = () => {
      const show = window.scrollY > SHOW_AFTER;
      btn.classList.toggle('opacity-0', !show);
      btn.classList.toggle('translate-y-4', !show);
      btn.classList.toggle('pointer-events-none', !show);
      btn.setAttribute('aria-hidden', String(!show));
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    update();
  }

  /* ---------- 3. Revelado de imágenes ---------- */
  /* let revealObserver = null;

  function getRevealObserver() {
    if (revealObserver || !('IntersectionObserver' in window)) return revealObserver;
    revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        const reveal = () => img.classList.add('is-visible');
        if (img.complete && img.naturalWidth > 0) reveal();
        else {
          img.addEventListener('load',  reveal, { once: true });
          img.addEventListener('error', reveal, { once: true });
          setTimeout(reveal, 1200);
        }
        obs.unobserve(img);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    return revealObserver;
  }

  function setupReveal(img) {
    if (!img || img.dataset.kovaReveal === '1') return;
    img.dataset.kovaReveal = '1';
    img.classList.add('kova-reveal');
    const obs = getRevealObserver();
    if (obs) obs.observe(img); else img.classList.add('is-visible');
  }

  function setupRevealIn(root) {
    if (!root) return;
    if (root.tagName === 'IMG') return setupReveal(root);
    $$('img', root).forEach(setupReveal);
  } */

    function setupFilterToggleArrow() {
        const btn    = $('#filterToggle');
        const drawer = $('#filterDrawer');
        if (!btn || !drawer) return;

        const sync = () => {
            const open = drawer.classList.contains('open');
            btn.classList.toggle('open', open);
            btn.setAttribute('aria-expanded', String(open));
        };

        new MutationObserver(sync).observe(drawer, {
            attributes: true,
            attributeFilter: ['class'],
        });

        sync(); // estado inicial
    }

  /* ---------- 4. Click en la card → openDetail(id) ---------- */

  // Extrae el id del DOM que genera app.js
  function extractProductId(card) {
    if (card.dataset.id) return Number(card.dataset.id);

    const btn = card.querySelector('button[onclick*="openDetail("]');
    if (btn) {
      const m = btn.getAttribute('onclick').match(/openDetail\((\d+)/);
      if (m) return Number(m[1]);
    }
    const fav = card.querySelector('button[onclick*="toggleFav("]');
    if (fav) {
      const m = fav.getAttribute('onclick').match(/toggleFav\((\d+)/);
      if (m) return Number(m[1]);
    }
    const sel = card.querySelector('select[id^="v-"]');
    if (sel) {
      const m = sel.id.match(/^v-(\d+)$/);
      if (m) return Number(m[1]);
    }
    return null;
  }

  function openCardDetail(card) {
    const id = extractProductId(card);
    if (id == null) return;
    if (typeof window.openDetail === 'function') window.openDetail(id);
  }

  const INTERACTIVE_SELECTOR =
    'button, a, input, select, textarea, label, option, [data-no-modal]';

  function isInteractive(target, card) {
    if (!card || !card.contains(target)) return false;
    if (target === card) return false;              // click directo en la card
    const hit = target.closest(INTERACTIVE_SELECTOR);
    return !!hit && hit !== card;                    // nunca la propia card
  }

  function setupClickableCards(root) {
    const cards = root.matches?.('article.card')
      ? [root, ...root.querySelectorAll('article.card')]
      : $$('article.card', root);

    cards.forEach((card) => {
      if (card.dataset.kovaClickable === '1') return;
      card.dataset.kovaClickable = '1';

      // Accesibilidad: focusable y sin role="button" (evita anidar interactivos)
      if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '0');
      if (!card.hasAttribute('aria-label')) {
        const title = card.querySelector('h3')?.textContent?.trim();
        if (title) card.setAttribute('aria-label', `Ver detalle de ${title}`);
      }

      card.addEventListener('click', (e) => {
        if (isInteractive(e.target, card)) return;                        // controles internos
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;     // atajos
        openCardDetail(card);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        if (isInteractive(e.target, card)) return;
        e.preventDefault();
        openCardDetail(card);
      });
    });
  }

  /* ---------- 5. Observador del catálogo ---------- */
  function observeCatalog() {
    const grid = $('#catalogGrid');
    if (!grid) return;

    const process = (node) => {
      if (node.nodeType !== 1) return;
      //setupRevealIn(node);
      setupClickableCards(node);
    };

    process(grid); // estado inicial

    new MutationObserver((mutations) => {
      mutations.forEach((m) => m.addedNodes.forEach(process));
      // red de seguridad si se reescribe el grid entero
      //setupRevealIn(grid);
      setupClickableCards(grid);
    }).observe(grid, { childList: true, subtree: true });
  }

  /* ---------- 6. Init ---------- */
  function init() {
    injectStyles();
    watchOverlay(MODAL());
    watchOverlay(CART());
    watchOverlay(OVERLAY());
    syncOverlayState();
    setupBackToTop();
    setupFilterToggleArrow();
    observeCatalog();

    // Debug: puedes quitarlo cuando confirmes que todo funciona
    console.log(
      '[KOVA_UI] ready · cards:',
      document.querySelectorAll('#catalogGrid article.card').length,
      '· openDetail global:',
      typeof window.openDetail
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.KOVA_UI = {
    openDetail: (el) => {
      const card = el?.closest?.('article.card');
      if (card) openCardDetail(card);
    },
    refresh: () => {
      syncOverlayState();
      const grid = $('#catalogGrid');
      //setupRevealIn(grid);
      setupClickableCards(grid);
    },
  };
})();