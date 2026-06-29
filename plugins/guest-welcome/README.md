# Guest Welcome - TRMNL Plugin

A friendly welcome screen for guests staying at [The Rad Retreat at Desert Color](https://radretreat.com). It greets the guest whose stay covers today by name and shows their stay dates on a TRMNL e-ink display.

## What It Does

- Reads a reservation **smart-window** POSTed to the plugin webhook (the upcoming and recent reservations).
- Features the reservation **active at the exact render time** (`start <= now < end`, comparing the
  reservation's check-in/check-out **timestamps** against the server clock).
- Greets them warmly, e.g. **"Welcome to Rad Retreat" / "Nelson Family" / "July 3 – 5, 2026"**.
- Shows **stay dates only** (no check-in/out times).
- Title bar reads **radretreat.com**.

**Active reservations only.** If no reservation is active at render time, the plugin
sets `window.TRMNL_SKIP_DISPLAY = true` so TRMNL skips it in the playlist rather than
showing an empty screen. Owner/maintenance stays count as active reservations and are shown.

### Same-day turnover safety

Selection keys off **time of day**, not just the calendar date, using each reservation's
`start` (check-in) and `end` (check-out) timestamps. On a turnover day this means:

| Time (example: 11am checkout / 4pm check-in) | What shows |
|----------------------------------------------|------------|
| Before 11am | Departing guest |
| 11am – 4pm (turnover gap) | Nothing — plugin is skipped |
| After 4pm | Arriving guest |

So a newly arrived guest can never be greeted by the previous guest's name.

### About caching / staleness (important)

TRMNL/BYOS servers like [larapaper](https://github.com/usetrmnl/larapaper) use a **deep-sleep
polling** model: the e-ink device wakes on its `refresh_interval`, fetches a server-rendered
image, displays it, then sleeps. There is **no push and no exact-wall-clock cache
invalidation** — the only control is how often the device refreshes.

Each fresh render is always computed against the server clock, so it is correct for the
moment it is generated. The residual risk is purely staleness: a cached image can lag reality
by up to one `refresh_interval`. This plugin mitigates that two ways:

1. **Time-precise selection + skip-in-gap** (above), so a render is never ambiguous.
2. **Short `refresh_interval` (15 min)** to bound how long any stale image can persist.

With the standard ~5-hour gap between an 11am checkout and a 4pm check-in, the wrong-name
scenario is eliminated in practice. The only way it could occur is a turnover where the next
check-in falls within one refresh interval of the previous checkout (e.g. back-to-back same
hour) — for that, lower `refresh_interval` further. No plugin on this platform can do better,
because the device itself is asleep between refreshes.

## Layouts

- `full` (800x480) - hero welcome
- `half_vertical` (400x480)
- `half_horizontal` (800x240)
- `quadrant` (400x240)

All layouts are pure TRMNL Framework v3 markup - no JavaScript and no custom CSS - so multiple instances are mashup-safe by construction.

## Custom Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `property_name` | string | `Rad Retreat` | Shown in the "Welcome to ..." line. |
| `greeting_style` | select | `family` | `Nelson Family`, `Nelson`, or the full name as booked. |

## Greeting Logic

The guest name is read from the reservation `description` (`Guest: <name>`). Bookings typically provide a last name only.

- `family` (default): the last word of the name, title-cased, plus "Family" -> `Nelson` becomes **Nelson Family**, `Jason WATERS` becomes **Waters Family**.
- `surname`: just the surname -> **Nelson**.
- `full_name`: the name exactly as booked -> **Jason WATERS**.

## Webhook Payload

The plugin expects the reservation smart-window structure (see `tmp/data.example.json`):

```json
{
  "events": [
    {
      "uid": "reservation-510146@trackhs",
      "summary": "✅ Nelson",
      "description": "Guest: Nelson\nBooking Source: Guest\nProperty: The Rad Retreat at Desert Color\nNights: 2\nStatus: Confirmed\nReservation ID: 510146",
      "status": "CONFIRMED",
      "location": "The Rad Retreat at Desert Color",
      "start": "2026-07-03T22:00:00.000Z",
      "end": "2026-07-05T17:00:00.000Z",
      "all_day": false,
      "start_date": "2026-07-03",
      "end_date": "2026-07-05",
      "source": "Reservations 2026"
    }
  ],
  "calendar_name": "Reservations 2026",
  "generated_at": "2026-06-29T17:23:01.695Z"
}
```

Only `description`, `start_date`, and `end_date` are required for the welcome screen. Dates are treated as date-only values and are never timezone-shifted.

## Local Development

### Quick Start

```bash
cp tmp/data.example.json tmp/data.json
npm start
```

View at http://localhost:4567/full (add `?png=1` to render as PNG). Other views: `/half_vertical`, `/half_horizontal`, `/quadrant`.

### Available Commands

```bash
npm start              # Start trmnlp dev server
npm run start:detached # Start in background
npm stop               # Stop services
npm run restart        # Restart services
npm run logs           # Follow server logs
npm run webhook        # Reload tmp/data.json as webhook data
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
guest-welcome/
├── .trmnlp.yml            # trmnlp server config + preview defaults
├── publish.config.yml     # Publishing configuration (git-ignored)
├── package.json           # npm scripts
├── tmp/
│   ├── data.example.json  # Demo reservation window (committed)
│   └── data.json          # Your test data (git-ignored)
└── src/
    ├── settings.yml          # Plugin metadata and custom fields
    ├── shared.liquid         # Guest selection, name, and date logic
    ├── full.liquid           # Full screen (800x480)
    ├── half_vertical.liquid  # Half screen vertical (400x480)
    ├── half_horizontal.liquid# Half screen horizontal (800x240)
    └── quadrant.liquid       # Quadrant (400x240)
```

## License

MIT
