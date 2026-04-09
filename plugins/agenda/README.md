# Agenda Plugin for TRMNL

Daily schedule plugin for TRMNL e-ink displays with three view modes: day grid, upcoming list, or framework-native basic list.

## Features

- **Three view modes** - Choose between SimpleCalendarJS day/list views or framework-native basic list
- **Multiple event sources** with color coding for e-ink
- **Webhook-based updates** - receives JSON via POST
- **2 layouts** - full (800x480) and half_vertical (800x240)
- **E-ink optimized** - grayscale rendering, readable fonts, no animations

## View Modes

### Basic List (Default)
Pure TRMNL framework implementation using [Item components](https://trmnl.com/framework/docs/v3/item) with [Clamp](https://trmnl.com/framework/docs/v3/clamp) for text truncation. Shows today's events as a numbered list with:
- Indexed events with emphasis levels per source
- Title, description (clamped), time range, source, and location labels
- Zero JavaScript libraries - lightest weight, most e-ink native
- Best for: Simple daily schedule display

### Day
SimpleCalendarJS day view showing today's schedule as a time grid with hour slots. Events positioned by time with visual duration.
- Best for: Seeing the shape of your day at a glance
- Shows: Today only, 7am-8pm

### List
SimpleCalendarJS list view showing upcoming events grouped by date headers.
- Best for: Upcoming events over multiple days
- Shows: Next 7 days (full) / 3 days (half_vertical)
- Displays: 15 events max (full) / 6 events max (half_vertical)

## Event Sources

The plugin supports multiple event sources (e.g., "Family", "Work", "Personal") and displays them with distinct visual markers optimized for e-ink:
- Source 0: Black background / white text
- Source 1: Light gray background / black text
- Source 2: Dark gray background / white text
- Source 3: Very light gray background / black text

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

This starts the trmnlp server on http://localhost:4567 and automatically loads test data from `tmp/data.json`.

### Available Commands

```bash
npm start            # Start services (trmnlp + webhook loader) in foreground
npm run start:detached  # Start services in background (-d)
npm run stop         # Stop all services
npm run restart      # Restart services
npm run logs         # Follow trmnlp logs
npm run webhook      # Manually reload webhook data
```

### Available Views

- `/full` - Full screen (800x480)
- `/half_vertical` - Half screen vertical (800x240)

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
     - name: My Agenda
       trmnlp_id: your-agenda-recipe-id
   ```
   - The `trmnlp_id` must match the "TRMNL Recipe ID" field in each recipe's settings
   - Find this in LaraPaper: Recipe page → Recipe Settings modal → TRMNL Recipe ID field

3. **Create `.env` file** (shared with other plugins at `plugins/.env`)
   ```bash
   cd ../
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
4. Preserve existing configuration fields in each recipe
5. Update all layouts (full, half_vertical)
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

### Webhook Integration

Once deployed, events are POSTed to your TRMNL webhook endpoint. The plugin expects this JSON structure:

```json
{
  "events": [
    {
      "uid": "event-123",
      "summary": "Event Title",
      "description": "Event details",
      "status": "CONFIRMED",
      "location": "Conference Room A",
      "start": "2026-04-06T15:00:00.000Z",
      "end": "2026-04-06T16:00:00.000Z",
      "all_day": false,
      "start_date": "2026-04-06",
      "end_date": "2026-04-06",
      "source": "Work"
    }
  ],
  "calendar_name": "My Calendar",
  "sources": ["Work", "Personal", "Family"],
  "generated_at": "2026-04-06T12:00:00.000Z"
}
```

## File Structure

```
agenda/
├── .trmnlp.yml            # trmnlp server config
├── publish.config.yml     # Multi-recipe publishing config
├── .env                   # API credentials (git-ignored, shared at plugins/.env)
├── README.md              # This file
├── package.json           # npm scripts
├── tmp/
│   └── data.json         # Test data for local dev
└── src/
    ├── settings.yml      # Plugin metadata (id auto-injected on publish)
    ├── full.liquid       # Full screen (800x480)
    └── half_vertical.liquid  # Half screen vertical (800x240)
```

## Configuration Options

### View Mode

Select from three rendering modes:
- **Basic List** - Framework-native Item components (default)
- **Day** - SimpleCalendarJS day view with time grid
- **List** - SimpleCalendarJS upcoming events list

## Related Projects

- **calendar-webhook** - Node.js script for fetching ICS calendars and POSTing to webhooks
- **@trmnl/calendar** - FullCalendar-based calendar plugin with month/week views

## License

MIT
