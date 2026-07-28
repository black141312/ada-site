// The only script on the page: play the request meter once it scrolls into view.
// Everything else is static HTML — the page reads fine with JS off (bars are drawn
// by CSS transform, which starts collapsed, so we reveal them here or immediately
// for anyone who prefers reduced motion).
(() => {
  const meter = document.getElementById('meter');
  if (!meter) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const totals = [...meter.querySelectorAll('.n')];

  const countTo = (el, ms) => {
    const end = Number(el.dataset.n);
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(end * eased).toLocaleString('en-US');
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const settle = () => {
    meter.classList.add('on');
    totals.forEach((el) => (el.textContent = Number(el.dataset.n).toLocaleString('en-US')));
  };

  if (reduced) {
    settle();
    return;
  }

  const play = () => {
    meter.classList.add('on');
    totals.forEach((el) => countTo(el, 1200));
  };

  if (!('IntersectionObserver' in window)) {
    settle();
    return;
  }
  new IntersectionObserver(
    (entries, obs) => {
      if (entries.some((e) => e.isIntersecting)) {
        play();
        obs.disconnect();
      }
    },
    { threshold: 0.3 },
  ).observe(meter);
})();
