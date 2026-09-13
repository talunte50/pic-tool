(function () {
  try {
    var locales = ['en','pt-br','es','fr','de','ja','en-in','hi','ko','id','vn','uk','ru','zh-CN'];
    var lowerLocales = locales.map(function (l) { return l.toLowerCase(); });

    function matchLocale(code) {
      if (!code) return null;
      var s = String(code).toLowerCase().replace(/_/g, '-');
      var idx = lowerLocales.indexOf(s);
      if (idx !== -1) return locales[idx];
      var base = s.split('-')[0];
      if (base === 'pt') return 'pt-br';
      if (base === 'en') return s.indexOf('en-in') === 0 ? 'en-in' : 'en';
      for (var i = 0; i < lowerLocales.length; i++) {
        if (lowerLocales[i].indexOf(base) === 0) return locales[i];
      }
      return null;
    }

    // current path already on a localized prefix?
    function currentLocaleFromPath(pathname) {
      var parts = pathname.split('/').filter(Boolean);
      var first = parts[0] ? parts[0].toLowerCase() : '';
      for (var i = 0; i < lowerLocales.length; i++) {
        if (first === lowerLocales[i]) return locales[i];
      }
      return 'en';
    }

    // same path under a different locale
    function buildHref(pathname, targetLocale) {
      var parts = pathname.split('/').filter(Boolean);
      var first = parts[0] ? parts[0].toLowerCase() : '';
      if (lowerLocales.indexOf(first) !== -1) parts.shift();
      var rest = parts.join('/');
      var prefix = targetLocale && targetLocale !== 'en' ? targetLocale.toLowerCase() : '';
      return '/' + (prefix ? prefix + '/' : '') + rest;
    }

    // only index pages redirect — tool pages must stay stable for bookmarks
    function shouldRedirect(pathname) {
      var parts = pathname.split('/').filter(Boolean);
      if (parts.length === 0) return true;
      if (parts.length === 1 && lowerLocales.indexOf(parts[0].toLowerCase()) !== -1) return true;
      return false;
    }

    var pathname = location.pathname;
    if (!shouldRedirect(pathname)) return;

    var current = currentLocaleFromPath(pathname);
    if (current !== 'en') return; // already localized, never redirect away

    // 1. explicit user choice (footer switcher writes localStorage) wins
    var stored = null;
    try { stored = localStorage.getItem('pic-tool-lang'); } catch (e) {}
    var target = matchLocale(stored);

    // 2. otherwise follow browser languages, first match wins
    if (!target) {
      var codes = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language];
      for (var i = 0; i < codes.length; i++) {
        target = matchLocale(codes[i]);
        if (target) break;
      }
    }

    if (!target || target === 'en') return;

    var href = buildHref(pathname, target);
    if (href !== pathname) window.location.replace(href);
  } catch (e) { /* never break the page */ }
})();
