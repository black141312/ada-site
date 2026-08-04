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

// Install count, read from GitHub at page load.
//
// Counting every asset is wrong by a factor of three: electron-updater polls latest.yml on a timer
// and each update pulls a blockmap, so a release with 9 installs can show 25 "downloads". Only the
// installers are people.
//
// Unauthenticated GitHub allows 60 requests an hour per IP, which one page load per visitor will
// not trouble — but the answer is cached for an hour anyway, because the number does not move fast
// enough to be worth asking twice.
(() => {
  const el = document.getElementById('dl-count');
  if (!el) return;

  // v2: the old key cached the count alone. That made the cache a trap — a returning visitor took
  // the early return and never reached the code that moves the download buttons forward, so the
  // buttons stayed on whatever version was hardcoded in the HTML for everyone but a first-time
  // visitor. Whatever the fetch teaches us gets cached, not just the part that was visible.
  const KEY = 'ada.release.v2';
  const HOUR = 3600e3;
  const isInstaller = (n) => /Setup.*\.exe$/.test(n) || /\.dmg$/.test(n) || /\.AppImage$/.test(n);

  // Button order in the HTML. A build that did not produce one of these leaves that button alone,
  // still pointing at the working link the page shipped with.
  const WANTED = [/Setup.*\.exe$/, /-arm64\.dmg$/, /^Ada-[\d.]+\.dmg$/, /\.AppImage$/];

  const apply = ({ n, tag, links }) => {
    if (n) {
      // no number is better than a wrong one
      el.textContent = `${n.toLocaleString()} installs so far.`;
      el.hidden = false;
    }
    document.querySelectorAll('.grabs .grab').forEach((a, i) => {
      const asset = links?.[i];
      if (!asset) return;
      a.href = asset.url;
      const file = a.querySelector('.file');
      if (file) file.textContent = asset.name;
    });
    if (tag) document.querySelectorAll('[data-version]').forEach((v) => (v.textContent = tag));
  };

  const read = (releases) => {
    const latest = releases.filter((r) => !r.draft && !r.prerelease)[0];
    return {
      n: releases.reduce(
        (sum, rel) => sum + (rel.assets || []).reduce((a, x) => a + (isInstaller(x.name) ? x.download_count : 0), 0),
        0,
      ),
      tag: latest?.tag_name || null,
      links: WANTED.map((re) => {
        const asset = latest?.assets.find((a) => re.test(a.name));
        return asset ? { url: asset.browser_download_url, name: asset.name } : null;
      }),
    };
  };

  try {
    const hit = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (hit && Date.now() - hit.at < HOUR) return apply(hit);
  } catch {
    /* private mode, or someone put junk in localStorage — just refetch */
  }

  fetch('https://api.github.com/repos/black141312/ada-releases/releases?per_page=100')
    .then((r) => (r.ok ? r.json() : null))
    .then((releases) => {
      if (!Array.isArray(releases)) return;
      const data = read(releases);
      try {
        localStorage.setItem(KEY, JSON.stringify({ ...data, at: Date.now() }));
      } catch {
        /* storage full or blocked — everything still applies, it just refetches next time */
      }
      apply(data);
    })
    .catch(() => {
      /* offline, rate-limited, GitHub down: the page keeps the links it shipped with */
    });
})();
