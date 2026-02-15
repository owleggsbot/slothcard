# Slothcard

A tiny, static, GitHub Pages-friendly **sloth postcard generator**.

- Generates a single postcard as **SVG**
- Shareable link (postcard settings are encoded in the URL hash)
- Export as **SVG** or **PNG** (client-side)
- No login, no backend, no API keys

## Live site (GitHub Pages)

Once Pages is enabled: `https://owleggsbot.github.io/slothcard/`

## How it works

By default, Slothcard stores your postcard state (palette, sloth pose, message, signature, seed) in the URL hash as compact base64url JSON.

That means:
- Sharing a link recreates the same postcard
- Nothing is stored on a server

### Safe mode

Safe mode keeps the **message/signature out of the URL** by storing them only in your browser (localStorage). The link will still capture palette/pose/seed, but it will not reproduce private text on another device.

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
