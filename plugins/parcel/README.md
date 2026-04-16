# Parcel - Delivery Tracking Plugin for TRMNL

Track your package deliveries on a TRMNL e-ink display using the [Parcel](https://parcelapp.net/) app.

Based on the [open-source Parcel plugin](https://github.com/usetrmnl/trmnl_plugins/tree/master/lib/parcel) for TRMNL, adapted for polling-based BYOS deployment.

## Features

- **App-style day counter rail** with large days-to-delivery and delivered checkmark
- **All, active, recent, or completed filters**
- **Configurable sorting** (last updated, date added, estimated delivery date, name)
- **Configurable day counter** (none, days till delivery, days after postage)
- **Expected delivery dates** with relative labels (Today, Tomorrow, day of week)
- **Latest tracking events** for each package
- **Two display styles**: Detailed (with tracking events) or Compact
- **Polling-based** -- TRMNL server fetches data directly from the Parcel API
- **E-ink optimized** rendering

## Prerequisites

- A [Parcel](https://parcelapp.net/) premium account
- A Parcel API key (generate at [web.parcelapp.net](https://web.parcelapp.net))

## How It Works

This is a **polling** plugin. The TRMNL server calls the [Parcel API](https://parcelapp.net/help/api-view-deliveries.html) directly on a schedule using your API key. No external webhook service is needed.

The polling URL and headers are configured in `settings.yml`:

```
GET https://api.parcel.app/external/deliveries/?filter_mode={% if filter_mode == "active" %}active{% else %}recent{% endif %}
Header: api-key: {{ parcel_api_key }}
```

The API endpoint only supports `active` and `recent`, so plugin modes are mapped as:

- `active` -> API `active`
- `recent`, `all`, `delivered` -> API `recent` with client-side filtering

The custom field values are interpolated at runtime.

### Parcel API

Rate limit: 20 requests per hour. The plugin's default refresh interval is 360 minutes (6 hours), well within this limit. See [API documentation](https://parcelapp.net/help/api-view-deliveries.html) for full details.

### Response Structure

The Parcel API returns:

```json
{
  "success": true,
  "deliveries": [
    {
      "carrier_code": "ups",
      "description": "Package Name",
      "status_code": 2,
      "tracking_number": "1Z999AA10123456784",
      "events": [
        {
          "event": "In transit to destination",
          "date": "2026-04-05 14:22",
          "location": "Sort Facility"
        }
      ],
      "date_expected": "2026-04-08T20:00:00"
    }
  ]
}
```

### Status Codes

| Code | Status |
|------|--------|
| 0 | Delivered |
| 1 | Frozen |
| 2 | In Transit |
| 3 | Pickup Available |
| 4 | Out for Delivery |
| 5 | Not Found |
| 6 | Failed Attempt |
| 7 | Exception |
| 8 | Info Received |

## Custom Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `parcel_api_key` | text | - | Your Parcel API key |
| `filter_mode` | select | `active` | All, Active, Recent, or Completed deliveries |
| `style` | select | `detailed` | Detailed (with events) or Compact |
| `sort_by` | select | `estimated_delivery_date` | Last updated, date added, estimated delivery date, or name |
| `day_counter` | select | `days_till_delivery` | None, days till delivery, or days after postage |

## Local Development

### Quick Start

```bash
cp tmp/data.example.json tmp/data.json
npm start
```

View at http://localhost:4567/full

For local development, trmnlp uses the webhook loader to POST `tmp/data.json` as test data (since trmnlp can't poll external APIs). You can fetch live data from the Parcel API to use as test data:

```bash
curl "https://api.parcel.app/external/deliveries/?filter_mode=active" \
  -H "api-key: YOUR_API_KEY" > tmp/data.json
```

### Available Commands

```bash
npm start              # Start trmnlp dev server
npm run start:detached # Start in background
npm stop               # Stop services
npm run restart        # Restart services
npm run logs           # Follow server logs
npm run webhook        # Reload test data
```

## Publishing

### First Time Setup

1. **Configure recipes** - Create `publish.config.yml` from example:
   ```bash
   cp publish.config.yml.example publish.config.yml
   ```

   Edit `publish.config.yml`:
   ```yaml
   recipes:
     - name: Parcel Deliveries
       trmnlp_id: your-parcel-plugin-id
   ```

2. **Ensure shared `.env` exists** in the `plugins/` directory with your BYOS credentials.

### Publish

```bash
npm run publish          # Publish to your BYOS instance
npm run publish:prod     # Publish to production TRMNL
```

After publishing, configure the `parcel_api_key` custom field in your BYOS recipe settings.

## File Structure

```
parcel/
├── .trmnlp.yml            # trmnlp server config
├── .env.example           # Environment variable template
├── .gitignore
├── publish.config.yml     # Publishing configuration (git-ignored)
├── package.json           # npm scripts
├── tmp/
│   ├── data.example.json  # Demo data (committed)
│   └── data.json          # Your test data (git-ignored)
└── src/
    ├── settings.yml       # Plugin metadata, polling config, and custom fields
    └── full.liquid        # Full screen delivery list
```

## Credits

Based on the [Parcel plugin](https://github.com/usetrmnl/trmnl_plugins/tree/master/lib/parcel) from the official TRMNL plugins repository.

## Mashup Safety Checklist

When using multiple instances in one mashup:

- Generate per-instance IDs for all JS targets (containers, title bars, counters, labels)
- Keep shared logic in `src/shared.liquid`; pass IDs from each layout to shared initializers
- Avoid hardcoded `document.getElementById(...)` defaults unless overridden per instance
- Avoid top-level global declarations that can redeclare in concatenated mashup scripts

## License

MIT
