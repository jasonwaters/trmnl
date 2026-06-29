# Guest Promotion - TRMNL Plugin

A return-stay promotion screen for guests at [The Rad Retreat at Desert Color](https://radretreat.com). It shows a discount offer, a promo code, and a scannable QR code that opens the booking page - encouraging guests to book their next stay before they leave.

## What It Does

- Displays a big **discount headline** (e.g. **"10% OFF"**).
- Shows the **promo code** to use at checkout (e.g. **RADMX2P4V**).
- Renders a **QR code** that opens the configured **booking URL** when scanned.
- Optional title bar reads **radretreat.com** (toggle with the `show_title_bar` setting).

Everything is driven by plugin settings - there is **no external data source** (`strategy: static`), so the screen always renders, regardless of network or webhook state.

## Layouts

- `full` (800x480) - tear-off coupon: solid black offer + promo code panel beside a white QR stub
- `half_vertical` (400x480) - stacked offer, code, and QR
- `half_horizontal` (800x240) - offer + code beside a compact QR
- `quadrant` (400x240) - compact offer + code + small QR

## QR Code

The QR code is generated **at render time** in the browser by
[paulmillr/qr](https://github.com/paulmillr/qr) - a 0-dependency, auditable,
spec-cross-tested library - emitted as an **SVG** so it stays crisp as vector
artwork on e-ink (no rasterized canvas).

- Loaded as an ES module from a **pinned, immutable** jsDelivr version URL (the
  published `index.min.js`, not the dynamically-generated `+esm` bundle).
- The booking URL is passed via an HTML `data-url` attribute (HTML-escaped) and
  read back in JS - it is never concatenated into a script string.
- The URL is normalized to **HTTPS** before use.
- The module runs in its own (module) scope and the QR element id is generated
  per-instance with `append_random`, so the plugin is **mashup-safe** (no global
  or id collisions when shown alongside other tiles).
- The SVG uses `shape-rendering: crispEdges` so module borders stay sharp on
  1-bit and 2-bit e-ink displays. If generation ever fails, the discount, promo
  code, and title bar still render.

## Styling

Layout and structure use TRMNL Framework v3 classes. A single small `<style>`
block in `shared.liquid` adds brand styling aligned to
[radretreat.com](https://radretreat.com) - brand fonts (Bricolage Grotesque
display + Nunito Sans body), a wide-tracked eyebrow, a hairline rule, and a
dashed "coupon" outline around the promo code. The big offer text uses the same
1-bit hardening as the Guest Welcome plugin (locked optical sizing + a hairline
glyph stroke) so it thresholds to solid black.

## Custom Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `discount_amount` | string | `10%` | Shown big as "`<value>` OFF". Accepts `10%`, `$100`, `2 nights`, etc. |
| `promo_code` | string | `RADMX2P4V` | The code guests enter at checkout. |
| `booking_url` | string | `https://radretreat.com` | Where the QR code sends guests. Forced to HTTPS. |
| `show_title_bar` | select | `true` | Show or hide the bottom `radretreat.com` title bar. |

## Local Development

### Quick Start

```bash
npm start
```

View at http://localhost:4567/full. Other views: `/half_vertical`, `/half_horizontal`, `/quadrant`.
Edit values in `.trmnlp.yml` (`custom_fields`) to preview different offers, codes, and URLs.

### Available Commands

```bash
npm start              # Start trmnlp dev server
npm run start:detached # Start in background
npm stop               # Stop services
npm run restart        # Restart services
npm run logs           # Follow server logs
```

## Publishing

```bash
cp publish.config.yml.example publish.config.yml   # first time only
npm run publish          # Publish to your BYOS instance
npm run publish:prod     # Publish to production TRMNL
```

Requires a shared `.env` in the `plugins/` directory with your BYOS credentials.

## File Structure

```
guest-promotion/
├── .trmnlp.yml            # trmnlp server config + preview defaults
├── publish.config.yml     # Publishing configuration (git-ignored)
├── package.json           # npm scripts
├── tmp/
│   └── data.example.json  # Unused placeholder (static strategy)
└── src/
    ├── settings.yml          # Plugin metadata and custom fields
    ├── shared.liquid         # Settings, QR generation, and styling
    ├── full.liquid           # Full screen (800x480)
    ├── half_vertical.liquid  # Half screen vertical (400x480)
    ├── half_horizontal.liquid# Half screen horizontal (800x240)
    └── quadrant.liquid       # Quadrant (400x240)
```

## License

MIT
