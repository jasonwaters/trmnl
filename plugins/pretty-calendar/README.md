# Pretty Calendar

Webhook-powered TRMNL calendar plugin based on recipe `210616`.

## Data Source

This plugin expects webhook data in the same shape used by `plugins/agenda/tmp/data.json`.

### Required payload shape

```json
{
  "generated_at": "2026-04-09T19:00:00.000Z",
  "events": [
    {
      "uid": "event-1",
      "summary": "Meeting",
      "description": "Optional",
      "start": "2026-04-09T20:00:00.000Z",
      "end": "2026-04-09T21:00:00.000Z",
      "all_day": false,
      "start_date": "2026-04-09",
      "end_date": "2026-04-09",
      "source": "Work"
    }
  ]
}
```

### Field notes

- `generated_at` anchors the plugin "today" date. This avoids day rollover bugs caused by timezone differences.
- `events[]` is the calendar event list.
- `all_day: true` events are treated as date-range events using `start_date`/`end_date`.
- For timed events, `start` and `end` should be ISO timestamps.

## Plugin Settings

- `show_calendar_items`
  - `today`: show only today's agenda list
  - `all`: show multiple upcoming day columns
- `show_weeks`
  - `7`: render 1 week of day bubbles
  - `14`: render 2 weeks of day bubbles
- `first_day`
  - `0`: Sunday-first week
  - `1`: Monday-first week
- `time_format`
  - `am/pm`: 12-hour display
  - `24hr`: 24-hour display

## Local Development

From `plugins/pretty-calendar`:

- `npm run start` - run dev preview
- `npm run webhook` - load `tmp/data.json` into local webhook endpoint
- `npm run stop` - stop local containers

You can copy sample input from:

- `plugins/agenda/tmp/data.json`

## TRMNLP defaults

In `.trmnlp.yml`, `custom_fields` sets local preview defaults only.
For example:

- `show_weeks: '7'` means 1 week in the day grid.
- `first_day: 0` means Sunday is the first day column.
