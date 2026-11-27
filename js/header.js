/**
 * EasyHealth — Adaptive Navigation Bar Controller
 * Uses a single semantic nav + native Popover API when inline links do not fit.
 */
(function () {
  'use strict';

  function initHeaderNav() {
    var header = document.querySelector('.site-header');
    if (!header) return;

    var menu = header.querySelector('#site-menu');
    var menuButton = header.querySelector('.menu-button');
    if (!menu || !menuButton) return;

    var lastCollapsedWidth = 0;
    var rafId = 0;

    function isPopoverOpen() {
      try {
        return menu.matches(':popover-open');
      } catch (e) {
        return menu.classList.contains(':popover-open');
      }
    }

    function updateLayout(forceMeasure) {
      var wasWide = header.classList.contains('is-wide');
      var currentWidth = header.clientWidth;

      if (!wasWide && !forceMeasure && currentWidth <= lastCollapsedWidth) {
        return;
      }

      var wasOpen = isPopoverOpen();

      header.classList.add('is-measuring');
      header.classList.add('is-wide');
      menu.removeAttribute('popover');

      var fits = header.scrollWidth <= header.clientWidth + 1;

      if (fits) {
        lastCollapsedWidth = 0;
      } else {
        header.classList.remove('is-wide');
        menu.setAttribute('popover', 'auto');
        lastCollapsedWidth = currentWidth;
        if (wasOpen && typeof menu.showPopover === 'function') {
          try {
            menu.showPopover();
          } catch (e) {}
        }
      }

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(function () {
        header.classList.remove('is-measuring');
      });
    }

    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(function () {
        updateLayout(false);
      });
      ro.observe(header);
      ro.observe(menu);
    } else {
      window.addEventListener('resize', function () {
        updateLayout(true);
      });
    }

    window.addEventListener('easyhealth:langchange', function () {
      updateLayout(true);
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        updateLayout(true);
      });
    }

    updateLayout(true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeaderNav);
  } else {
    initHeaderNav();
  }
})();
