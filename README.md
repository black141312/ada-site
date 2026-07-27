# ada-site

The marketing site for **Ada** — an agent-first desktop code editor.

Static HTML, CSS and one small script. **No build step, no framework, no CDN** — the
IBM Plex fonts are served from `assets/fonts/`, so the page renders identically offline
and on a first visit with a cold cache. (Ada's benchmark criticises builds that link
Google Fonts; its own site had better not.)

## Files

| Path            | What                                                           |
| --------------- | -------------------------------------------------------------- |
| `index.html`    | The page                                                       |
| `style.css`     | Design system — tokens at the top, sections in source order    |
| `app.js`        | One job: play the request meter when it scrolls into view      |
| `report.html`   | The full product & benchmark report, self-contained            |
| `assets/fonts/` | IBM Plex Sans 400/600, Plex Mono 400/500 (woff2, latin subset) |
| `assets/img/`   | App screenshots, brand mark, icon                              |

## Run it locally

Open `index.html` in a browser — it works from `file://`. For a server:

```bash
python -m http.server 8000
```

## Deploy

Any static host. The site is the repository root, so there's nothing to configure:

- **GitHub Pages** — push, then Settings → Pages → deploy from `main` / root
- **Cloudflare Pages / Netlify / Vercel** — connect the repo, leave the build command
  empty and the output directory as `/`

## Updating for a new release

Version and download links appear in exactly two places, both in `index.html`: the hero
eyebrow and the `.grabs` block. After cutting a release:

```bash
sed -i 's/0\.1\.23/0.1.24/g' index.html
```

Then refresh `report.html` from the report builder if the numbers changed.

## Facts on the page

Every figure comes from the benchmark runs recorded in the report — per-task tokens and
costs are each tool's own reported usage, cross-checked against provider billing. If a
number changes, change it in `report.html` too so the two never disagree.
