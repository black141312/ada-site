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

  const KEY = 'ada.installs';
  const HOUR = 3600e3;
  const isInstaller = (n) => /Setup.*\.exe$/.test(n) || /\.dmg$/.test(n) || /\.AppImage$/.test(n);

  const show = (n) => {
    if (!n) return; // no number is better than a wrong one
    el.textContent = `${n.toLocaleString()} installs so far.`;
    el.hidden = false;
  };

  try {
    const hit = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (hit && Date.now() - hit.at < HOUR) return show(hit.n);
  } catch {
    /* private mode, or someone put junk in localStorage — just refetch */
  }

  // The download buttons are hardcoded to a version, which means they are wrong the moment the next
  // release ships — they sat on v0.1.28 for seven releases. Since the count is already fetching
  // every release, point them at the newest one while we are here. The HTML keeps a real, working
  // link so the page is never broken with JS off; this only ever moves it forward.
  const pointAtLatest = (releases) => {
    const latest = releases.filter((r) => !r.draft && !r.prerelease)[0];
    if (!latest) return;
    const pick = (re) => latest.assets.find((a) => re.test(a.name));
    const wanted = [
      ['win', /Setup.*\.exe$/],
      ['mac-arm', /-arm64\.dmg$/],
      ['mac-intel', /^Ada-[\d.]+\.dmg$/],
      ['linux', /\.AppImage$/],
    ];
    document.querySelectorAll('.grabs .grab').forEach((a, i) => {
      const asset = pick(wanted[i]?.[1] ?? /$^/);
      if (!asset) return; // a build that did not produce this platform: leave the working link alone
      a.href = asset.browser_download_url;
      const file = a.querySelector('.file');
      if (file) file.textContent = asset.name;
    });
    document.querySelectorAll('[data-version]').forEach((el) => (el.textContent = latest.tag_name));
  };

  fetch('https://api.github.com/repos/black141312/ada-releases/releases?per_page=100')
    .then((r) => (r.ok ? r.json() : null))
    .then((releases) => {
      if (!Array.isArray(releases)) return;
      const n = releases.reduce(
        (sum, rel) => sum + (rel.assets || []).reduce((a, x) => a + (isInstaller(x.name) ? x.download_count : 0), 0),
        0,
      );
      try {
        localStorage.setItem(KEY, JSON.stringify({ n, at: Date.now() }));
      } catch {
        /* storage full or blocked — the number still shows, it just refetches next time */
      }
      show(n);
      pointAtLatest(releases);
    })
    .catch(() => {
      /* offline, rate-limited, GitHub down: the line stays hidden, the page is unchanged */
    });
})();
