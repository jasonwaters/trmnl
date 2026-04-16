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
- Keep `APP_TIMEZONE` (application/server timezone) at `UTC`; do not set it to user-specific timezones.
- For JS-rendered calendars, prefer server-anchored local wall-clock dates and precomputed Liquid labels over runtime `Date`/`Intl` formatting when possible.
- When troubleshooting image-vs-browser mismatches, compare Liquid timezone context (`trmnl.user.time_zone_iana` / `utc_offset`) against JS runtime (`Intl.DateTimeFormat().resolvedOptions().timeZone` / `getTimezoneOffset()`).

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
- Prefer TRMNL utility naming exactly (for example `w--full` / `h--full`), not lookalike utility names like `w-full`.
- Avoid adding top-level `.view view--*` wrappers unless the specific plugin already requires them; prefer starting templates at `.layout`.

## Shared Template Reuse Rules

- Put reusable Liquid/JS logic in `plugins/<plugin>/src/shared.liquid` and keep layout files thin.
- Keep layout templates focused on structure and layout-specific options only (for example sizing, column count, minor label differences).
- When multiple layouts share JS rendering, use one initializer function in `shared.liquid` with optional config arguments.
- Keep shared initializers resilient to missing DOM nodes (check element existence before writing text/content).
- Reuse stable element IDs across layouts when possible to minimize per-layout branching in shared code.
- If a layout intentionally omits a UI block (for example summary stats), pass config flags to shared initializers instead of forking logic.

## Mashup-Safe JS and ID Rules (Critical)

When the same plugin can appear multiple times in a mashup, treat the page as a shared global JS/DOM environment.

- Assume mashup rendering concatenates plugin markup/scripts into a single document; duplicate global symbols (`const foo`) and duplicate DOM IDs (`id="chart"`) will collide.
- Never hardcode IDs for JS-driven elements in reusable plugins (`chart`, `title`, `value`, etc). Generate per-instance IDs once in `shared.liquid`, then consume them from each layout.
- Use TRMNL's documented uniqueness filter for per-instance suffixes:
  - `{% assign instance_suffix = "plugin" | append_random %}`
  - Build every JS target ID from that suffix in one place.
- Keep ID definitions DRY in `shared.liquid`, not repeated at the top of every layout.
- Use consistent instance naming across plugins:
  - `*_instance_suffix` for the random Liquid suffix (for example `{% assign stock_instance_suffix = "stock" | append_random %}`)
  - `*_instance_key` when passing that suffix into JS registries/selectors
  - `*_..._id` for all DOM IDs derived from the suffix
  - Prefer one shared base ID per plugin feature (for example `weather_chart_id`) and reuse it across layouts.
- Prefer instance-scoped JS over global functions/variables:
  - Wrap shared JS in an IIFE.
  - Register per-instance initializer in a keyed registry (for example `window.__pluginInstances[instance_suffix]`).
  - In each layout, call only that instance's initializer.
- Avoid exposing mutable top-level globals (`var/let/const`) for instance data; keep data/config inside the IIFE closure.

Health chart reference pattern (known-good):
- In `shared.liquid`, define:
  - `instance_suffix` via `append_random`
  - all related IDs (`chart_element_id`, `title_id`, stats IDs) derived from suffix
  - IIFE that captures data/config and registers `initialize` at `window.__healthChartInstances[instance_suffix]`
- In each layout file, keep only:
  - DOM structure using precomputed IDs
  - a tiny bootstrap script that fetches `window.__healthChartInstances[instance_suffix]` and calls `.initialize({...})`

Troubleshooting mashup duplicates:
- If two tiles show the same data, check for:
  - duplicate `id=` values across instances
  - global function name collisions
  - top-level `const` redeclaration failures halting second script execution
  - shared state accidentally stored on `window` without instance keys

## Documentation and Scope

- Update plugin `README.md` when adding/changing settings or modes.
- Update `.trmnlp.yml` defaults only when needed for local preview.
- Do not modify unrelated plugins/files in the same change.
- Do not commit or push unless explicitly asked.
