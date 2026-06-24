/* ================================================================
   NEW GEN — Core JavaScript
   Vanilla JS | No dependencies | Mobile-First
   ================================================================ */
(function () {
  'use strict';

  const cfg = window.NgTheme || {};

  /* ── Utils ──────────────────────────────────────────────────── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const off = (el, ev, fn) => el && el.removeEventListener(ev, fn);
  const emit = (el, name, detail = {}) => el && el.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));

  function formatMoney(cents) {
    const fmt = cfg.moneyFormat || '{{ amount }}';
    const amount = (cents / 100).toFixed(2);
    return fmt.replace('{{ amount }}', amount)
              .replace('{{ amount_no_decimals }}', Math.floor(cents / 100));
  }

  /* ── 1. Header scroll behavior ──────────────────────────────── */
  class Header {
    constructor() {
      this.el = $('.ng-header-wrap');
      if (!this.el) return;
      this.lastY = 0;
      this.ticking = false;
      this.init();
    }
    init() {
      on(window, 'scroll', () => this._onScroll(), { passive: true });
    }
    _onScroll() {
      if (this.ticking) return;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        this.el.classList.toggle('is-scrolled', y > 60);
        if (y > this.lastY + 5 && y > 200) {
          this.el.classList.add('is-hidden');
        } else if (y < this.lastY - 5 || y < 80) {
          this.el.classList.remove('is-hidden');
        }
        this.lastY = y;
        this.ticking = false;
      });
      this.ticking = true;
    }
  }

  /* ── 2. Mobile Navigation ───────────────────────────────────── */
  class MobileNav {
    constructor() {
      this.nav    = $('#ng-mobile-nav');
      this.burger = $('#ng-burger');
      this.close  = $('#ng-mobile-nav-close');
      if (!this.nav || !this.burger) return;
      this.isOpen = false;
      this.init();
    }
    init() {
      on(this.burger, 'click', () => this.open());
      on(this.close,  'click', () => this.close_());
      on($('.ng-mobile-nav__overlay', this.nav), 'click', () => this.close_());
      on(document, 'keydown', (e) => { if (e.key === 'Escape' && this.isOpen) this.close_(); });

      // Sub-menus toggle
      $$('.ng-mobile-nav__toggle').forEach(btn => {
        on(btn, 'click', () => {
          const item = btn.closest('.ng-mobile-nav__has-sub');
          item && item.classList.toggle('is-open');
        });
      });
    }
    open() {
      this.isOpen = true;
      this.nav.classList.add('is-open');
      this.burger.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      this.burger.setAttribute('aria-expanded', 'true');
    }
    close_() {
      this.isOpen = false;
      this.nav.classList.remove('is-open');
      this.burger.classList.remove('is-open');
      document.body.style.overflow = '';
      this.burger.setAttribute('aria-expanded', 'false');
    }
  }

  /* ── 3. Search Overlay ──────────────────────────────────────── */
  class Search {
    constructor() {
      this.overlay = $('#ng-search-overlay');
      this.input   = this.overlay && $('.ng-search-input', this.overlay);
      this.results = $('#ng-search-results');
      this.debounceTimer = null;
      if (!this.overlay) return;
      this.init();
    }
    init() {
      $$('[data-ng-search-open]').forEach(btn => on(btn, 'click', () => this.open()));
      on($('.ng-search-close', this.overlay), 'click', () => this.close());
      on(this.overlay, 'click', (e) => { if (e.target === this.overlay) this.close(); });
      on(document, 'keydown', (e) => { if (e.key === 'Escape') this.close(); });
      on(this.input, 'input', () => this._onInput());
    }
    open() {
      this.overlay.classList.add('is-open');
      this.overlay.removeAttribute('aria-hidden');
      document.body.style.overflow = 'hidden';
      setTimeout(() => this.input && this.input.focus(), 100);
    }
    close() {
      this.overlay.classList.remove('is-open');
      this.overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (this.results) this.results.innerHTML = '';
    }
    _onInput() {
      clearTimeout(this.debounceTimer);
      const q = this.input.value.trim();
      if (q.length < 2) { this.results && (this.results.innerHTML = ''); return; }
      this.debounceTimer = setTimeout(() => this._fetch(q), 280);
    }
    async _fetch(q) {
      try {
        const url = `/search/suggest.json?q=${encodeURIComponent(q)}&resources[type]=product&resources[limit]=6`;
        const res = await fetch(url);
        const data = await res.json();
        this._render(data.resources?.results?.products || []);
      } catch (e) {}
    }
    _render(products) {
      if (!this.results) return;
      if (!products.length) {
        this.results.innerHTML = '<p style="padding:2rem;text-align:center;color:#6b6b6b;font-size:1.4rem;">Aucun résultat trouvé.</p>';
        return;
      }
      this.results.innerHTML = products.map(p => `
        <a href="${p.url}" class="ng-search-result-item">
          <div class="ng-search-result-item__img">
            ${p.image ? `<img src="${p.image}" alt="${p.title}" loading="lazy">` : ''}
          </div>
          <div>
            <div class="ng-search-result-item__title">${p.title}</div>
            <div class="ng-search-result-item__price">${p.price ? formatMoney(p.price) : ''}</div>
          </div>
        </a>
      `).join('');
    }
  }

  /* ── 4. Cart Drawer ─────────────────────────────────────────── */
  class CartDrawer {
    constructor() {
      this.drawer  = $('#ng-cart-drawer');
      this.body    = $('#ng-cart-body');
      this.counter = $$('.ng-cart-count-val');
      if (!this.drawer) return;
      this.init();
    }
    init() {
      $$('[data-ng-cart-open]').forEach(btn => on(btn, 'click', () => this.open()));
      on($('.ng-cart-drawer__overlay', this.drawer), 'click', () => this.close());
      on($('[data-ng-cart-close]', this.drawer), 'click', () => this.close());
      on(document, 'keydown', (e) => {
        if (e.key === 'Escape' && this.drawer.classList.contains('is-open')) this.close();
      });
      on(document, 'ng:cart-updated', (e) => {
        this._updateCount(e.detail.count);
        if (this.drawer.classList.contains('is-open')) this.renderItems(e.detail.cart);
      });
    }
    open() {
      this.drawer.classList.add('is-open');
      this.drawer.removeAttribute('aria-hidden');
      document.body.style.overflow = 'hidden';
      this.load();
    }
    close() {
      this.drawer.classList.remove('is-open');
      this.drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
    async load() {
      try {
        const res = await fetch('/cart.js');
        const cart = await res.json();
        this._updateCount(cart.item_count);
        this.renderItems(cart);
      } catch(e) {}
    }
    renderItems(cart) {
      if (!this.body) return;
      if (!cart.item_count) {
        this.body.innerHTML = `
          <div class="ng-cart-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            <h3>Votre panier est vide</h3>
            <a href="/collections/all" class="ng-btn ng-btn--primary" onclick="NgCartDrawer.close()">Découvrir nos produits</a>
          </div>`;
        return;
      }
      const subtotalEl = this.drawer.querySelector('.ng-cart-drawer__subtotal-amount');
      if (subtotalEl) subtotalEl.textContent = formatMoney(cart.total_price);
      this.body.innerHTML = cart.items.map((item, i) => `
        <div class="ng-cart-item" data-key="${item.key}">
          <a href="${item.url}" class="ng-cart-item__img">
            <img src="${item.image}" alt="${item.product_title}" loading="${i < 3 ? 'eager' : 'lazy'}">
          </a>
          <div class="ng-cart-item__info">
            <a href="${item.url}" class="ng-cart-item__title">${item.product_title}</a>
            ${item.variant_title ? `<span class="ng-cart-item__variant">${item.variant_title}</span>` : ''}
            <div class="ng-cart-item__actions">
              <div class="ng-qty" style="transform:scale(0.85);transform-origin:left">
                <button class="ng-qty__btn" data-action="decrease" data-key="${item.key}" aria-label="Diminuer">−</button>
                <input class="ng-qty__input" type="number" value="${item.quantity}" min="0" data-key="${item.key}" aria-label="Quantité">
                <button class="ng-qty__btn" data-action="increase" data-key="${item.key}" aria-label="Augmenter">+</button>
              </div>
              <span class="ng-cart-item__price">${formatMoney(item.final_line_price)}</span>
            </div>
            <button class="ng-cart-item__remove" data-key="${item.key}" data-action="remove">Supprimer</button>
          </div>
        </div>
      `).join('');

      // Bind qty events
      this.body.querySelectorAll('[data-action="increase"]').forEach(btn =>
        on(btn, 'click', () => this._changeQty(btn.dataset.key, 1)));
      this.body.querySelectorAll('[data-action="decrease"]').forEach(btn =>
        on(btn, 'click', () => this._changeQty(btn.dataset.key, -1)));
      this.body.querySelectorAll('[data-action="remove"]').forEach(btn =>
        on(btn, 'click', () => this._removeItem(btn.dataset.key)));
      this.body.querySelectorAll('.ng-qty__input').forEach(input =>
        on(input, 'change', () => this._setQty(input.dataset.key, parseInt(input.value))));
    }
    _updateCount(count) {
      this.counter.forEach(el => { el.textContent = count; el.parentElement?.classList.toggle('ng-hidden', count === 0); });
    }
    async _changeQty(key, delta) {
      const input = this.body.querySelector(`input[data-key="${key}"]`);
      const current = parseInt(input?.value || 1);
      await this._setQty(key, current + delta);
    }
    async _setQty(key, qty) {
      try {
        const res = await fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: key, quantity: Math.max(0, qty) })
        });
        const cart = await res.json();
        emit(document, 'ng:cart-updated', { cart, count: cart.item_count });
      } catch(e) { Toast.show('Erreur lors de la mise à jour', 'error'); }
    }
    async _removeItem(key) { await this._setQty(key, 0); }
  }

  /* ── 5. Add to Cart ─────────────────────────────────────────── */
  class AddToCart {
    constructor() {
      on(document, 'submit', (e) => {
        const form = e.target.closest('[data-ng-product-form]');
        if (!form) return;
        e.preventDefault();
        this._submit(form);
      });
    }
    async _submit(form) {
      const btn = form.querySelector('[data-ng-atc-btn]');
      if (btn) btn.classList.add('is-loading');
      try {
        const data = new FormData(form);
        const res = await fetch('/cart/add.js', { method: 'POST', body: data });
        const item = await res.json();
        if (item.status === 422) throw new Error(item.description);
        const cartRes = await fetch('/cart.js');
        const cart = await cartRes.json();
        emit(document, 'ng:cart-updated', { cart, count: cart.item_count });
        if (cfg.cartType === 'drawer') {
          window.NgCartDrawer && window.NgCartDrawer.open();
        } else {
          Toast.show('Produit ajouté au panier ✓', 'success');
        }
      } catch(err) {
        Toast.show(err.message || 'Impossible d\'ajouter au panier', 'error');
      } finally {
        if (btn) btn.classList.remove('is-loading');
      }
    }
  }

  /* ── 6. Variant Picker ──────────────────────────────────────── */
  class VariantPicker {
    constructor(form) {
      this.form    = form;
      this.data    = JSON.parse(form.dataset.productJson || '{}');
      this.input   = form.querySelector('[name="id"]');
      this.priceEl = form.closest('[data-ng-product]')?.querySelector('[data-ng-price]');
      this.atcBtn  = form.querySelector('[data-ng-atc-btn]');
      this.selected = {};
      this.init();
    }
    init() {
      $$('[data-ng-option]', this.form).forEach(pill => {
        on(pill, 'click', () => {
          const { name, value } = pill.dataset;
          this.selected[name] = value;
          this._updatePills(name);
          this._findVariant();
        });
        // Pre-select first option
        if (!this.selected[pill.dataset.name]) {
          this.selected[pill.dataset.name] = pill.dataset.value;
          pill.classList.add('is-selected');
        }
      });
      this._findVariant();
    }
    _updatePills(name) {
      $$(`[data-ng-option][data-name="${name}"]`, this.form).forEach(p => {
        p.classList.toggle('is-selected', p.dataset.value === this.selected[name]);
      });
    }
    _findVariant() {
      const variant = this.data.variants?.find(v =>
        v.options.every((opt, i) => opt === this.selected[this.data.options?.[i]])
      );
      if (!variant) return;
      if (this.input) this.input.value = variant.id;
      this._updatePrice(variant);
      this._updateAvailability(variant);
      history.replaceState(null, '', `?variant=${variant.id}`);
    }
    _updatePrice(variant) {
      if (!this.priceEl) return;
      const price = formatMoney(variant.price);
      const compare = variant.compare_at_price > variant.price ? formatMoney(variant.compare_at_price) : null;
      this.priceEl.innerHTML = compare
        ? `<span class="ng-price ng-price--sale">${price}</span><span class="ng-price--compare">${compare}</span>`
        : `<span class="ng-price">${price}</span>`;
    }
    _updateAvailability(variant) {
      if (!this.atcBtn) return;
      if (!variant.available) {
        this.atcBtn.disabled = true;
        this.atcBtn.textContent = 'Épuisé';
      } else {
        this.atcBtn.disabled = false;
        this.atcBtn.textContent = this.atcBtn.dataset.defaultText || 'Ajouter au panier';
      }
    }
  }

  /* ── 7. Product Gallery ─────────────────────────────────────── */
  class ProductGallery {
    constructor(el) {
      this.main   = $('.ng-product-gallery__main', el);
      this.thumbs = $$('.ng-product-gallery__thumb', el);
      if (!this.main || !this.thumbs.length) return;
      this.init();
    }
    init() {
      this.thumbs.forEach((thumb, i) => {
        on(thumb, 'click', () => this._select(i));
      });
    }
    _select(i) {
      const src = this.thumbs[i]?.querySelector('img')?.src;
      const main = this.main.querySelector('img');
      if (src && main) { main.src = src; main.srcset = src; }
      this.thumbs.forEach((t, j) => t.classList.toggle('is-active', j === i));
    }
  }

  /* ── 8. Accordion / Tabs ────────────────────────────────────── */
  class Accordion {
    constructor() {
      on(document, 'click', (e) => {
        const trigger = e.target.closest('.ng-tab__trigger');
        if (!trigger) return;
        const tab = trigger.closest('.ng-tab');
        if (!tab) return;
        const isOpen = tab.classList.contains('is-open');
        // Close all in same group
        $$('.ng-tab', tab.closest('.ng-product-tabs')).forEach(t => t.classList.remove('is-open'));
        if (!isOpen) tab.classList.add('is-open');
      });
    }
  }

  /* ── 9. Sticky ATC ──────────────────────────────────────────── */
  class StickyAtc {
    constructor() {
      this.bar     = $('.ng-sticky-atc');
      this.trigger = $('[data-ng-atc-trigger]');
      if (!this.bar || !this.trigger) return;
      this.observer = new IntersectionObserver(([e]) => {
        this.bar.classList.toggle('is-visible', !e.isIntersecting);
      }, { threshold: 0 });
      this.observer.observe(this.trigger);
      const stickyBtn = this.bar.querySelector('[data-ng-sticky-atc-btn]');
      on(stickyBtn, 'click', () => {
        const mainForm = $('[data-ng-product-form]');
        mainForm && mainForm.dispatchEvent(new Event('submit', { bubbles: true }));
      });
    }
  }

  /* ── 10. Quantity Input ─────────────────────────────────────── */
  class QuantityInput {
    constructor() {
      on(document, 'click', (e) => {
        const btn = e.target.closest('.ng-qty__btn');
        if (!btn) return;
        const input = btn.closest('.ng-qty')?.querySelector('.ng-qty__input');
        if (!input) return;
        const val = parseInt(input.value) || 1;
        const min = parseInt(input.min) || 0;
        input.value = btn.textContent === '+' ? val + 1 : Math.max(min, val - 1);
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  }

  /* ── 11. Ripple Effect ──────────────────────────────────────── */
  class Ripple {
    constructor() {
      on(document, 'click', (e) => {
        const btn = e.target.closest('.ng-btn');
        if (!btn || btn.disabled) return;
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ng-ripple';
        ripple.style.cssText = `left:${e.clientX - rect.left}px;top:${e.clientY - rect.top}px`;
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      });
    }
  }

  /* ── 12. Toast Notification ─────────────────────────────────── */
  class ToastManager {
    constructor() {
      this.el = $('#ng-toast');
      this.timer = null;
    }
    show(msg, type = 'default') {
      if (!this.el) return;
      clearTimeout(this.timer);
      this.el.textContent = msg;
      this.el.className = `ng-toast ng-toast--${type}`;
      this.el.classList.add('is-visible');
      this.timer = setTimeout(() => this.el.classList.remove('is-visible'), 3500);
    }
  }
  const Toast = new ToastManager();
  window.NgToast = Toast;

  /* ── 13. Reveal on Scroll ───────────────────────────────────── */
  class RevealObserver {
    constructor() {
      if (!('IntersectionObserver' in window)) {
        $$('[data-ng-reveal]').forEach(el => el.classList.add('is-revealed'));
        return;
      }
      this.observer = new IntersectionObserver(
        (entries) => entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('is-revealed'); this.observer.unobserve(e.target); }
        }),
        { rootMargin: '0px 0px -60px 0px', threshold: 0.06 }
      );
      $$('[data-ng-reveal]').forEach(el => this.observer.observe(el));
    }
  }

  /* ── 14. Prefetch nav links ─────────────────────────────────── */
  class Prefetch {
    constructor() {
      if (!('requestIdleCallback' in window)) return;
      const seen = new Set();
      on(document, 'mouseover', (e) => {
        const a = e.target.closest('.ng-nav__link, .ng-mobile-nav__link');
        if (!a || seen.has(a.href)) return;
        seen.add(a.href);
        requestIdleCallback(() => {
          const link = document.createElement('link');
          link.rel = 'prefetch'; link.href = a.href;
          document.head.appendChild(link);
        });
      }, { passive: true });
    }
  }

  /* ── 15. Image Lazy Loading Enhancement ─────────────────────── */
  class LazyImages {
    constructor() {
      if (!('IntersectionObserver' in window)) return;
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          const img = e.target;
          if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
          if (img.dataset.srcset) { img.srcset = img.dataset.srcset; delete img.dataset.srcset; }
          obs.unobserve(img);
        });
      }, { rootMargin: '200px' });
      $$('img[data-src], img[data-srcset]').forEach(img => obs.observe(img));
    }
  }

  /* ── INIT ───────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    new Header();
    new MobileNav();
    new Search();
    const cart = new CartDrawer();
    window.NgCartDrawer = cart;
    new AddToCart();
    new Accordion();
    new QuantityInput();
    new Ripple();
    new RevealObserver();
    new Prefetch();
    new LazyImages();

    // Sticky ATC
    if ($('[data-ng-product]')) new StickyAtc();

    // Variant pickers
    $$('[data-ng-product-form]').forEach(form => new VariantPicker(form));

    // Product gallery
    $$('.ng-product-gallery').forEach(el => new ProductGallery(el));

    // Update cart count on load
    fetch('/cart.js').then(r => r.json()).then(cart => {
      $$('.ng-cart-count-val').forEach(el => {
        el.textContent = cart.item_count;
        el.closest('.ng-cart-badge')?.classList.toggle('ng-hidden', cart.item_count === 0);
      });
    }).catch(() => {});
  });

})();
