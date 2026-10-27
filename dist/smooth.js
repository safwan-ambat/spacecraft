// Weighted, gliding wheel scrolling (Lenis, loaded before this file), in the spirit of ribbit.dk.
// Lenis moves the real page scroll, so the sticky header, pinned hero and other scroll code keep working.
// Off for reduced motion; touch devices keep their native scrolling (Lenis only smooths wheel and trackpad).
(function () {
  if (!window.Lenis || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true });
  window.siteScroll = lenis;
  const frame = time => { lenis.raf(time); requestAnimationFrame(frame); };
  requestAnimationFrame(frame);

  // Areas with their own scrolling keep native wheel behaviour.
  const prevent = () => document.querySelectorAll('#mobile-nav, textarea, select, .suggest, dialog')
    .forEach(el => el.setAttribute('data-lenis-prevent', ''));
  prevent();
  new MutationObserver(prevent).observe(document.body, { childList: true, subtree: true });

  // In-page links glide to their target, clear of the sticky header (whose height is --header-h).
  const headerOffset = () => (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 68) + 24;
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href*="#"]');
    if (!link || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const url = new URL(link.href, location.href);
    if (url.pathname !== location.pathname || !url.hash || url.hash === '#') return;
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    history.pushState(null, '', url.hash);
    lenis.scrollTo(target, { offset: -headerOffset(), duration: 1.2 });
  });
  if (location.hash) {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) addEventListener('load', () => lenis.scrollTo(target, { offset: -headerOffset(), immediate: true }));
  }

  // Hold the page still while a modal dialog is open.
  document.querySelectorAll('dialog').forEach(dialog => {
    new MutationObserver(() => (dialog.open ? lenis.stop() : lenis.start()))
      .observe(dialog, { attributes: true, attributeFilter: ['open'] });
  });
})();
