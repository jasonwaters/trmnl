# Health Chart Plugin for TRMNL

Track your health metrics with beautiful charts optimized for e-ink displays.

## Features

- **Multiple metrics** - Track weight, fat mass, muscle mass, hydration, bone mass, body fat %, lean mass, and BMI
- **Trend visualization** - See your progress over time with Highcharts
- **E-ink optimized** - Grayscale rendering with clear, readable fonts
- **Webhook-based updates** - Receives JSON data via POST

## Configuration

### Custom Fields

- **Metric to Display** - Choose which metric to track:
  - Body Weight (lbs)
  - Fat Mass (lbs)
  - Muscle Mass (lbs)
  - Hydration (lbs)
  - Bone Mass (lbs)
  - Body Fat (%)
  - Lean Body Mass (lbs)
  - BMI

- **Profile Name** - Name displayed in the chart title

## Local Development

### Prerequisites

```bash
docker pull trmnl/trmnlp:v0.6.0
docker pull curlimages/curl:latest
```

### Quick Start

```bash
npm start
```

This starts the trmnlp server with Docker Compose on http://localhost:4567 and automatically loads test data.

### Available Commands

```bash
npm start            # Start services (trmnlp + webhook loader)
npm run start:detached  # Start services in background
npm run stop         # Stop all services
npm run restart      # Restart services
npm run logs         # Follow trmnlp logs
npm run webhook      # Manually reload webhook data
```

### Test Data

Copy the example data to get started:

```bash
cp tmp/data.example.json tmp/data.json
```

Edit `tmp/data.json` to add your own measurements. Expected JSON structure:

```json
{
  "measurements": [
    {
      "date": "2026-04-03T14:00:00.000Z",
      "timestamp": 1775224800,
      "timezone": "America/Denver",
      "measures": {
        "weight_lbs": 175.2,
        "fat_mass_lbs": 33.5,
        "muscle_mass_lbs": 134.8,
        "hydration_lbs": 96.9,
        "bone_mass_lbs": 7.1,
        "fat_ratio_pct": 19.1,
        "fat_free_mass_lbs": 141.7,
        "bmi": 24.8
      }
    }
  ],
  "profileName": "demo"
}
```

## Publishing to LaraPaper

### First Time Setup

1. **Configure recipes** - Create `publish.config.yml` from example:
   ```bash
   cp publish.config.yml.example publish.config.yml
   ```
   
   Edit `publish.config.yml`:
   ```yaml
   recipes:
     - name: Health Chart
       trmnlp_id: your-plugin-id-here
   ```

2. **Create shared `.env` file** (recommended):
   
   For shared credentials across all plugins:
   ```bash
   cd plugins
   cp health-chart/.env.example .env
   ```
   
   Or for plugin-specific credentials:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```env
   LARAPAPER_URL=https://your-larapaper-instance.com
   LARAPAPER_TOKEN=your-api-token-here
   ```
   
   **Note**: The `.env` file can be placed in:
   - `plugins/.env` - Shared across all plugins (recommended)
   - `plugins/health-chart/.env` - Plugin-specific (overrides shared)

### Publishing Commands

```bash
# Publish to configured recipes
npm run publish

# Publish to production TRMNL
npm run publish:prod
```

## Data Integration

This plugin expects webhook POSTs with the following structure:

- `measurements` - Array of measurement objects sorted oldest to newest
- Each measurement includes:
  - `date` - ISO 8601 timestamp
  - `measures` - Object with metric values (weight_lbs, fat_mass_lbs, etc.)
- `profileName` - User's name for display

## File Structure

```
health-chart/
├── docker-compose.yml      # Docker Compose for local dev
├── .trmnlp.yml            # trmnlp configuration
├── publish.config.yml     # Publishing configuration
├── package.json           # npm scripts
├── tmp/
│   ├── data.example.json # Demo data (committed)
│   └── data.json         # Your test data (git-ignored)
└── src/
    ├── settings.yml      # Plugin metadata
    └── full.liquid       # Full screen chart view
```

## License

MIT
