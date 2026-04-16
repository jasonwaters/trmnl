# Calendar - FullCalendar Plugin for TRMNL

This plugin displays calendar events on TRMNL e-ink displays using the [FullCalendar](https://fullcalendar.io/) library.

## Features

- **Multiple event sources** with color coding for e-ink
- **Webhook-based updates** - receives JSON via POST
- **4 standard layouts** - full, half_horizontal, half_vertical, quadrant
- **Bonus week view** - `full_week.liquid` for weekly calendar grid
- **E-ink optimized** - grayscale rendering, readable fonts, no animations

## Event Sources

The plugin supports multiple event sources (e.g., "Family", "School Calendar", "On-call Schedule") and displays them with distinct visual markers optimized for e-ink displays.

## Local Development with trmnlp

### Prerequisites

Install Docker:
```bash
docker pull trmnl/trmnlp:v0.6.0
docker pull curlimages/curl:latest
```

### Quick Start

```bash
npm start
```

This starts the trmnlp server with Docker Compose on http://localhost:4567 and automatically loads test data from `tmp/data.json`.

### Available Commands

```bash
npm start            # Start services (trmnlp + webhook loader) in foreground
npm run start:detached  # Start services in background (-d)
npm run stop         # Stop all services
npm run restart      # Restart services
npm run logs         # Follow trmnlp logs
npm run webhook      # Manually reload webhook data
```

### Architecture

The Docker Compose setup includes:
- **trmnlp** service - TRMNL plugin development server
- **webhook-loader** service - Automatically POSTs `tmp/data.json` to `/webhook` on startup

To modify test data, edit `tmp/data.json` and run `npm run webhook` to reload it.

### Manual Docker Commands

If you prefer running Docker directly:
```bash
docker run -p 4567:4567 -v "$(pwd):/plugin" trmnl/trmnlp:v0.6.0 serve
```

Then open: http://localhost:4567

### Available Views

- `/full` - Full screen month calendar (FullCalendar)
- `/half_horizontal` - Half screen horizontal list
- `/half_vertical` - Half screen vertical list
- `/quadrant` - Quadrant-sized list
- `/full_week` - Full screen week calendar (bonus view)

Add `?png=1` to any URL to render as PNG instead of HTML.

### Test Data

Copy the example data to get started:

```bash
cp tmp/data.example.json tmp/data.json
```

Edit `tmp/data.json` to add your own events. The JSON structure:

```json
{
  "events": [...],
  "calendar_name": "My Calendar",
  "sources": ["Work", "Personal", "Family"],
  "generated_at": "2026-04-06T12:00:00.000Z"
}
```

## Deployment to TRMNL

### Publishing to LaraPaper

This plugin can be automatically published to LaraPaper (or TRMNL cloud) using the built-in npm scripts.

#### First Time Setup

1. **Get your API token**
   - Login to your LaraPaper instance
   - Navigate to "Plugins & Recipes" → "API" tab (URL: `/plugins/api`)
   - Copy the displayed Bearer token

2. **Configure your recipes**
   - Create `publish.config.yml` from example:
   ```bash
   cp publish.config.yml.example publish.config.yml
   ```
   - Edit `publish.config.yml` and add each recipe you want to publish to:
   ```yaml
   recipes:
     - name: Family Calendar
       trmnlp_id: your-family-calendar-id
     - name: Reservations Calendar
       trmnlp_id: your-reservations-calendar-id
   ```
   - The `trmnlp_id` must match the "TRMNL Recipe ID" field in each recipe's settings
   - Find this in LaraPaper: Recipe page → Recipe Settings modal → TRMNL Recipe ID field

3. **Create `.env` file**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your values:
   ```env
   LARAPAPER_URL=https://your-larapaper-instance.com
   LARAPAPER_TOKEN=your-api-token-here
   ```

#### Publishing Commands

```bash
# Publish to ALL configured recipes in publish.config.yml
npm run publish

# Publish to production TRMNL
npm run publish:prod
```

The publish script will:
1. Read all recipes from `publish.config.yml`
2. Create recipe-specific packages (injecting correct `id` and `name` for each)
3. Upload via API to each recipe sequentially
4. **Preserve existing configuration fields** in each recipe
5. Update all layouts (full, half_horizontal, half_vertical, quadrant, full_week)
6. Display success summary for all recipes

#### Development Workflow

```bash
# 1. Develop and test locally
npm start              # Start trmnlp dev server
# View at http://localhost:4567

# 2. Make changes to templates in src/
# Changes auto-reload in browser

# 3. Publish to LaraPaper
npm run publish

# 4. Verify in LaraPaper UI
# Navigate to your recipe page to see updates
```

#### Troubleshooting

**"No recipes configured"**
- Add at least one recipe to `publish.config.yml`
- Each recipe needs both `name` and `trmnlp_id` fields

**"LARAPAPER_TOKEN not set"**
- Create `.env` file from `.env.example`
- Add your API token from `/plugins/api` page

**"Publishing failed: 401"**
- Token may be expired or invalid
- Regenerate token in LaraPaper UI and update `.env`

**"Publishing failed: 404"**
- Recipe ID in `publish.config.yml` doesn't exist or doesn't belong to your account
- Verify each `trmnlp_id` matches the "TRMNL Recipe ID" field in that recipe's settings

#### Publishing to Multiple Recipes

The plugin supports publishing to multiple recipes at once (e.g., family calendar, work calendar, reservations). Simply add all recipes to `publish.config.yml`:

```yaml
recipes:
  - name: Family Calendar
    trmnlp_id: your-family-calendar-id
  - name: Work Calendar  
    trmnlp_id: your-work-calendar-id
  - name: Reservations
    trmnlp_id: your-reservations-id
```

When you run `npm run publish`, it will update ALL recipes in the list. Each recipe maintains its own configuration values (webhook URLs, settings, etc.) - only the templates are updated.

### Alternative: Manual TRMNL Push (Legacy)

```bash
trmnlp login  # Saves API key to ~/.config/trmnlp/config.yml
```

### Push to TRMNL Server

```bash
trmnlp push
```

This uploads:
- `src/settings.yml` - plugin configuration
- `src/*.liquid` - all layout templates

### Webhook Integration

Once deployed, events are POSTed to your TRMNL webhook endpoint (via LaraPaper or similar). The plugin expects this JSON structure at the root level:

```json
{
  "events": [ /* array of events */ ],
  "calendar_name": "string",
  "sources": [ /* array of source names */ ],
  "generated_at": "ISO 8601 timestamp"
}
```

## File Structure

```
calendar/
├── docker-compose.yml      # Docker Compose config for local dev
├── .trmnlp.yml            # trmnlp server config
├── publish.config.yml     # Multi-recipe publishing config
├── .env                   # API credentials (git-ignored)
├── README.md              # This file
├── package.json           # npm scripts
├── tmp/
│   └── data.json         # Test data for local dev
└── src/
    ├── settings.yml      # Plugin metadata (id auto-injected on publish)
    ├── full.liquid       # Full screen - month view
    ├── half_horizontal.liquid
    ├── half_vertical.liquid
    ├── quadrant.liquid
    └── full_week.liquid  # Bonus: week view
```

## Related Plugins

This is the **FullCalendar** implementation. Other calendar library implementations may be added in the future.

## Mashup Safety Checklist

When this plugin appears more than once in a mashup:

- Use unique per-instance root IDs instead of fixed IDs
- Keep CSS selectors scoped to those same dynamic IDs
- Resolve DOM elements with instance-specific IDs in JS
- Avoid shared global symbols across layout scripts

## License

See parent repository for license information.
