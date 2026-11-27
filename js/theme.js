/**
 * EasyHealth — Shared Theme Toggle
 * Reads/writes `eh-theme` in localStorage; respects prefers-color-scheme on
 * first visit. Works on any page that includes this script and has an element
 * with id="themeToggleBtn".
 */
(function () {
  'use strict';

  function toggleTheme() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    var next = isDark ? 'light' : 'dark';
    if (next === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('eh-theme', next);
  }

  var btn = document.getElementById('themeToggleBtn');
  if (btn) {
    btn.addEventListener('click', toggleTheme);
  }
})();
