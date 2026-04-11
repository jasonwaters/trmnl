# AGENTS.md

Shared agent instructions for `~/Development/trmnl-plugins`.
This is the canonical, cross-tool memory file for this repository.

## Project Context

Custom TRMNL plugin monorepo with shared tooling for local preview and publishing.

## Build and Run Commands

Use commands exactly as written.

Repo root:
- `npm run start:agenda`
- `npm run start:calendar`
- `npm run start:health`
- `npm run start:parcel`
- `npm run start:stock`

Plugin directory:
- `npm start` (start preview)
- `npm run webhook` (reload `tmp/data.json`)
- `npm run logs` (inspect logs)
- `npm stop` (stop local services)

## Architecture and Code Rules

- Plugin settings are declared in `plugins/<plugin>/src/settings.yml` under `custom_fields`.
- Shared template logic should live in `plugins/<plugin>/src/shared.liquid`.
- Keep existing display modes intact unless explicitly asked to change behavior.
- Prefer additive branches (for example `elsif`) over rewriting existing branches.

## Timezone and Date Rules

- Use `effective_utc_offset` from `shared.liquid` for local date/time derivation.
- Do not use raw `utc_offset` for event date bucketing.
- Compare dates using `%Y-%m-%d` strings.
- For ISO timestamps, convert with Liquid epoch math: `date: "%s"` -> `plus: effective_utc_offset` -> format with `date`.
- Default to server-side (Liquid) time formatting for text shown in rendered images; keep one timezone conversion path.
- Do not double-convert time values (for example Liquid conversion plus JS `toLocaleTimeString` on the same field).
- If JavaScript time formatting is required, always pass `timeZone: "{{ trmnl.user.time_zone_iana }}"` and `locale: "{{ trmnl.user.locale }}"`.
- Treat date-only values (`YYYY-MM-DD`) separately from datetime values to avoid unintended day shifts for users behind UTC.

Known-good Liquid patterns:
- Local epoch conversion from ISO datetime:
  - `{% assign local_epoch = iso_value | date: "%s" | plus: effective_utc_offset %}`
- 24-hour display:
  - `{{ local_epoch | date: "%H:%M" }}`
- 12-hour display:
  - `{{ local_epoch | date: "%-I:%M %p" }}`
- Safe branch for user-selected format:
  - `{% assign display_time = local_epoch | date: "%H:%M" %}`
  - `{% if time_format != "24hr" %}{% assign display_time = local_epoch | date: "%-I:%M %p" %}{% endif %}`
- Date-only value handling:
  - Keep `YYYY-MM-DD` values as dates unless product behavior explicitly requires timezone shifting.

## Data and Rendering Rules

- `tmp/data.json` must be valid JSON with one root object.
- Keep event schema stable (`uid`, `summary`, `start`, `end`, `all_day`, `start_date`, `end_date`).
- Preserve empty-state messaging when there are no events.
- If a setting is string-backed (`select`), handle both string and boolean forms when needed.

## Styling and UI Framework Rules

- All CSS styling must use TRMNL Framework v3 conventions (classes, utilities, components) first and by default.
- Do not introduce custom CSS unless every framework-native option has been exhausted.
- Custom CSS is allowed only with explicit approval or direct instruction from the prompt author.
- If custom CSS appears necessary, ask for permission before adding it and document why framework conventions were insufficient.

## Documentation and Scope

- Update plugin `README.md` when adding/changing settings or modes.
- Update `.trmnlp.yml` defaults only when needed for local preview.
- Do not modify unrelated plugins/files in the same change.
- Do not commit or push unless explicitly asked.
