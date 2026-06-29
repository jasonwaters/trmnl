# Guest Recommendation

A rotating "things to do" screen for guests at **The Rad Retreat at Desert Color**.
Each refresh surfaces a different amenity, feature, or nearby attraction with matching
line art, so guests are reminded of everything the home and resort offer.

No external data source is required — every recommendation is stored right in the
plugin settings, and the plugin picks one to show on each render.

## Layouts

All four layouts share the same card: a line-art medallion, a small category tag,
a headline, and a short enticing blurb. A configurable `radretreat.com` title bar
sits at the bottom.

- `full` (800x480) — icon medallion beside a large headline and blurb
- `half_vertical` (400x480) — centered stack: icon on top, headline and blurb below
- `half_horizontal` (800x240) — icon beside a compact headline and blurb
- `quadrant` (400x240) — tightest: small icon beside a short headline and blurb

## How a recommendation is chosen

Selection is **time-seeded in Liquid** (server-side), so:

- every device refresh rotates to a different card,
- the rendered e-ink image is correct with **no client-side JavaScript**, and
- a prime multiplier spreads consecutive seeds across the list for variety.

If the system render time is unavailable (e.g. local preview), it falls back to the
Liquid `now` filter.

## Editing the recommendations

The list is the single thing you maintain. It lives in **`src/settings.yml`** under
`static_data` as plain JSON. This same data is used for **both** local preview and the
published plugin, so there is only one place to edit.

```json
{
  "recommendations": [
    {
      "icon": "beach",
      "tag": "Steps Away",
      "title": "Make a Splash at the Lagoon",
      "body": "Your stay includes full Desert Color access — a 2.5-acre lagoon..."
    }
  ]
}
```

Each item has four fields:

| Field   | Purpose                                                            |
| ------- | ------------------------------------------------------------------ |
| `icon`  | Which line-art icon to draw (see keys below). Unknown → palm tree. |
| `tag`   | Small uppercase eyebrow above the title (e.g. `Nearby`).           |
| `title` | The headline.                                                      |
| `body`  | One or two sentences of enticing copy.                             |

To add or remove a recommendation, just add or delete an object in the array.

`tmp/data.example.json` is a short schema reference only; it is **not** read at render
time for this static plugin.

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

| Field            | Type        | Default  | Notes                                  |
| ---------------- | ----------- | -------- | -------------------------------------- |
| `show_title_bar` | select      | `true`   | Toggle the bottom `radretreat.com` bar |
| `author_bio`     | author_bio  | —        | Plugin description / links             |

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

Because this is a `static` plugin, edits to `static_data` in `src/settings.yml`
show up in the preview on the next render.
