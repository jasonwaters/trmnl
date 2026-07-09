# Guest Recommendation

A "things to do" screen for guests at **The Rad Retreat at Desert Color**. Each
refresh surfaces an amenity, feature, or nearby attraction with matching line art,
so guests are reminded of everything the home and resort offer.

Recommendations are stored in a **Google Sheet you control**, so you can edit them
without touching the plugin. A small **Google Apps Script Web App** reads the sheet
and returns one item per refresh — and, in sequential mode, remembers its place by
writing the last-shown row back to the sheet.

## Layouts

All four layouts share the same card: a line-art medallion, a small category tag,
a headline, and a short enticing blurb. A configurable `radretreat.com` title bar
sits at the bottom.

- `full` (800x480) — icon medallion beside a large headline and blurb
- `half_vertical` (400x480) — centered stack: icon on top, headline and blurb below
- `half_horizontal` (800x240) — icon beside a compact headline and blurb
- `quadrant` (400x240) — tightest: small icon beside a short headline and blurb

## How a recommendation is chosen

Selection happens entirely in the Apps Script (one source of truth), and the plugin
renders the single item it returns — server-side Liquid, **no client-side
JavaScript**. Two modes, set by the **Selection Order** field:

- **Sequential** — walks the `data` tab one row per refresh, in order. It stores the
  last-shown row index in the `state` tab and increments it each time. At the end of
  the list (or the first empty row) it wraps back to the first item.
- **Random** — returns any row each refresh.

Why a Web App instead of the read-only CSV export (used by the `quotes` plugin)?
Sequential mode needs to **write** its place back to the sheet. Google's CSV export
URL is read-only, and TRMNL polling only reads during rendering. A Web App runs as
you on Google's servers, so it can read *and* write your sheet without ever exposing
a credential in the plugin.

## Google Sheet setup

Create a spreadsheet with two tabs:

**`data`** — row 1 is the header; one recommendation per row after it:

| icon  | tag        | title                       | body                                    |
| ----- | ---------- | --------------------------- | --------------------------------------- |
| beach | Steps Away | Make a Splash at the Lagoon | Your stay includes full Desert Color… |

**`state`** — used by sequential mode to remember the last-shown item. The script
stores a single shared index in cell **`B2`** (and writes the label `shared` to
`A2`), advancing it by one on each poll and wrapping at the end of the list:

| A (label) | B (last_index) |
| --------- | -------------- |
| `shared`  | `4`            |

You don't need to pre-fill this tab — the script writes the cell itself (and creates
the `state` tab if it's missing).

Why a single shared counter instead of one per device? On TRMNL/LaraPaper, polling
runs at the plugin level and has **no device context** — the polling URL is resolved
only against your custom-field values, so the device's `friendly_id` isn't available
when the sheet is fetched. Device identity only exists at render time, which can't
write back to the sheet. A shared counter is therefore the correct model (and is
exactly right for a single device).

Each `data` row has four columns:

| Column  | Purpose                                                            |
| ------- | ------------------------------------------------------------------ |
| `icon`  | Which line-art icon to draw (see keys below). Unknown → palm tree. |
| `tag`   | Small uppercase eyebrow above the title (e.g. `Nearby`).           |
| `title` | The headline.                                                      |
| `body`  | One or two sentences of enticing copy.                             |

`recommendations.csv` in this folder is the current list, ready to paste/import into
the `data` tab. Fully empty rows are skipped, so sequential mode wraps cleanly.

## Apps Script setup

1. In your sheet, open **Extensions → Apps Script**.
2. Replace the default file contents with `apps-script/Code.gs` from this folder and
   **Save**.
3. **Deploy → New deployment → Web app**:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Copy the **Web app URL** (ends in `/exec`) into the plugin's **Apps Script Web App
   URL** setting.

The plugin polls `<web-app-url>?mode=sequence|random` and receives flat JSON:

```json
{
  "rec_icon": "beach",
  "rec_tag": "Steps Away",
  "rec_title": "Make a Splash at the Lagoon",
  "rec_body": "Your stay includes full Desert Color access — a 2.5-acre lagoon…",
  "rec_mode": "sequence",
  "rec_index": 0,
  "rec_count": 14,
  "rec_error": ""
}
```

`static_data` in `src/settings.yml` mirrors this shape so local preview renders a card
without a live sheet. `tmp/data.example.json` is a schema reference for the same
payload.

### If a refresh fails or times out

A cold Apps Script or a slow network can make a poll fail or time out. When that
happens the plugin does **not** replace a good screen with an error or empty-state
card — guests just keep seeing the last recommendation. `src/shared.liquid` detects
both the script's own `rec_error` and TRMNL's platform `{"error":"Failed to fetch
data"}` payload, and in either case sets `window.TRMNL_SKIP_DISPLAY = true` so the
device skips that refresh. The failure state resolves on the next successful poll.
(The friendly "Sheet unavailable" / "No recommendations yet" text is still rendered
for local preview and first-run setup, where there is no prior screen to keep.)

### Available icon keys

`beach` (lagoon / beach umbrella), `hottub` (pools / hot tubs), `paddleboard`,
`pickleball`, `disc` (disc golf), `kitchen`, `games` (game room), `fire` (rooftop fire
table), `charger` (bedroom chargers), `office`, `mountains` (excursions), `sleep`
(bedrooms), `sandals` (beach gear), `palm` (vacation vibes), `golf`. Any unrecognized
value falls back to a palm tree.

Icons are inline SVGs sourced from the [Iconify](https://iconify.design) catalog —
the same open-source library behind [iconbuddy.com](https://iconbuddy.com). The set is
mostly [Font Awesome 6 Solid](https://iconbuddy.com/collections/fa6-solid), plus
[Lineicons](https://iconbuddy.com/collections/lineicons) (`surfboard-2` for
paddleboard), [Game Icons](https://iconbuddy.com/collections/game-icons)
(`disc-golf-basket`, `palm-tree`), [Maki](https://iconbuddy.com/collections/maki)
(`beach-11` for the lagoon), [Fontisto](https://iconbuddy.com/collections/fontisto)
(`beach-slipper` for beach gear), and [Streamline](https://iconbuddy.com/collections/streamline)
(chef toque for the kitchen) — all MIT / CC-licensed and free for commercial use.
Each is a single-path glyph drawn with `currentColor`, so it thresholds to solid black
and stays crisp on 1-bit / 2-bit e-ink. Every glyph keeps its own `viewBox` and is
centered with its aspect ratio preserved, so the same markup scales across layouts.

To add or change an icon, grab the SVG from iconbuddy.com (or
`https://api.iconify.design/<set>/<name>.svg`), set its `width`/`height` to `100%`,
keep `fill="currentColor"`, and drop it into the matching `{% when "yourkey" %}` branch
of the icon `case` in `src/shared.liquid`.

## Custom fields

| Field             | Type       | Default    | Notes                                                              |
| ----------------- | ---------- | ---------- | ------------------------------------------------------------------ |
| `apps_script_url` | string     | —          | Web App deployment URL (ends in `/exec`)                           |
| `selection_mode`  | select     | `sequence` | `sequence` (in order, remembers place) or `random`                 |
| `show_title_bar`  | select     | `true`     | Toggle the bottom `radretreat.com` bar                             |
| `author_bio`      | author_bio | —          | Plugin description / links                                         |

## Styling

Matches the other Rad Retreat plugins (`guest-welcome`, `guest-promotion`):
Bricolage Grotesque for display type, Nunito Sans for body, pure black/white for
crisp e-ink. Headlines use the same 1-bit hardening (locked optical sizing plus a
hairline text stroke) so anti-aliased edges threshold to solid black.

## Local development

```bash
npm start        # start the local preview (http://localhost:4567)
npm run logs     # tail logs
npm stop         # stop
```

Local preview renders from `static_data` in `src/settings.yml` (a single sample
recommendation), since the Apps Script Web App is not polled locally. Edit
`static_data` to preview a different card. The live sheet + Web App drive the
published plugin.
