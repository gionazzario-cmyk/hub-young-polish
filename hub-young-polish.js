/*!
 * HUB Young Polish — piccoli miglioramenti funzionali.
 *
 * 1. Marca <html> con .ny-polish (attiva il CSS).
 * 2. Modalità lettura "zen": nasconde barre, si riaprono passando il mouse
 *    sui bordi. Toggle con il tasto Z (fuori dai campi di testo).
 * 3. Aggiunge title/aria-label mancanti ai pulsanti della toolbar.
 * 4. Scorciatoia F per schermo intero.
 *
 * Non tocca il contenuto dei libri né le annotazioni.
 */
(function () {
  'use strict';

  var TOAST_MS = 2200;
  var toastEl = null;
  var toastTimer = null;

  function isTypingTarget(el) {
    if (!el) return false;
    var tag = (el.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    return !!(el.isContentEditable || el.closest('[contenteditable="true"]'));
  }

  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'ny-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    /* forza il reflow per far ripartire la transizione */
    void toastEl.offsetWidth;
    toastEl.classList.add('ny-toast--show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('ny-toast--show');
    }, TOAST_MS);
  }

  /* ---------------- modalità zen ---------------- */
  var zen = false;
  var peekTimer = null;

  function headerEl() {
    return document.querySelector('.reader-header-wrapper');
  }
  function footerEl() {
    return (
      document.querySelector('.bottom-toolbar') ||
      document.querySelector('.module-reader-bottom-bar-reader')
    );
  }

  function setZen(on) {
    zen = on;
    document.documentElement.classList.toggle('ny-zen', on);
    var h = headerEl();
    var f = footerEl();
    if (h) h.classList.remove('ny-peek');
    if (f) f.classList.remove('ny-peek');
    toast(on ? 'Modalità lettura attiva · Z per uscire' : 'Modalità lettura disattivata');
  }

  function onMove(e) {
    if (!zen) return;
    var h = headerEl();
    var f = footerEl();
    var H = window.innerHeight;
    var nearTop = e.clientY <= 64;
    var nearBottom = e.clientY >= H - 96;
    if (h) h.classList.toggle('ny-peek', nearTop);
    if (f) f.classList.toggle('ny-peek', nearBottom);
    clearTimeout(peekTimer);
    if (!nearTop && !nearBottom) {
      peekTimer = setTimeout(function () {
        if (h) h.classList.remove('ny-peek');
        if (f) f.classList.remove('ny-peek');
      }, 900);
    }
  }

  /* ---------------- scorciatoie ---------------- */
  function toggleFullscreen() {
    var nw = window.nw;
    try {
      if (nw && nw.Window && nw.Window.get) {
        var win = nw.Window.get();
        if (window.__nyFullscreen) {
          win.leaveFullscreen();
          window.__nyFullscreen = false;
          toast('Schermo intero disattivato');
        } else {
          win.enterFullscreen();
          window.__nyFullscreen = true;
          toast('Schermo intero · F per uscire');
        }
        return;
      }
    } catch (err) {
      /* ignora */
    }
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        window.__nyFullscreen = true;
        toast('Schermo intero · F per uscire');
      } else {
        document.exitFullscreen();
        window.__nyFullscreen = false;
        toast('Schermo intero disattivato');
      }
    } catch (err) {
      /* ignora */
    }
  }

  function onKeydown(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (isTypingTarget(e.target)) return;
    var k = (e.key || '').toLowerCase();
    if (k === 'f') {
      e.preventDefault();
      toggleFullscreen();
    } else if (k === 'z') {
      e.preventDefault();
      setZen(!zen);
    }
  }

  /* ---------------- tooltip / etichette ---------------- */
  function labelTools() {
    var buttons = document.querySelectorAll(
      '.footer-container .footer-body .tools-container li button, .toolbar-body .tool-container button'
    );
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      if (b.getAttribute('data-ny-labeled')) continue;
      var labelEl = b.querySelector('.menu-icon-name');
      var label = labelEl && labelEl.textContent ? labelEl.textContent.trim() : '';
      if (!label) continue;
      if (!b.getAttribute('title')) b.setAttribute('title', label);
      if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', label);
      b.setAttribute('data-ny-labeled', '1');
    }
  }

  /* ---------------- avvio ---------------- */
  function boot() {
    document.documentElement.classList.add('ny-polish');
    labelTools();
    document.addEventListener('keydown', onKeydown, true);
    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('click', function () {
      setTimeout(labelTools, 60);
    }, true);

    /* l'app Angular ricostruisce pezzi di DOM: ri-etichetta quando cambia */
    var mo = new MutationObserver(function () {
      labelTools();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.nyPolish = { toast: toast, zen: setZen, refreshLabels: labelTools };
})();
