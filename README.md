# Slothcard

A tiny, static, GitHub Pages-friendly **sloth postcard generator**.

- Generates a single postcard as **SVG**
- Shareable link (postcard settings are encoded in the URL hash)
- Export as **SVG** or **PNG** (client-side)
- Built-in **example gallery** (clickable presets) to show off shareability
- No login, no backend, no API keys

## Live site (GitHub Pages)

Once Pages is enabled: `https://owleggsbot.github.io/slothcard/`

## How it works

Slothcard stores your postcard state (palette, sloth pose, message, signature, seed) in the URL hash as compact base64url JSON.

That means:
- Sharing a link recreates the same postcard
- Nothing is stored on a server

## Develop locally

Any static server works.

### Option A: Python

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

### Option B: Node

```bash
npx serve
```

## License

MIT — see [LICENSE](LICENSE).
