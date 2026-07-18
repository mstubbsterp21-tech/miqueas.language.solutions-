# Portal widgets and interpreter readiness upgrade

## Database

- Added `widget_order`, `enabled_widgets`, and `tab_card_preferences` to `portal_layout_preferences`.
- Preferences remain server-managed and scoped to the signed-in Clerk user and portal role.

## Portal behavior

- Added optional date/time, local weather, GPS map, and interpreter-industry news widgets.
- Added validated per-tab card density and shape preferences. Grid widths remain responsive.
- Added list/calendar controls for recommended interpreter opportunities.
- Fully staffed opportunities are excluded from interpreter recommendations, and bid submission rechecks staffing.
- Required interpreter documents now gate opportunity broadcasts and recommendations.
- Split interpreter documents into Required and Optional sections, with named custom uploads.
- Renamed the interpreter Schedule navigation item to Availability.

## Feedback delivery

- Feedback email sending no longer fails when Gmail label-management permission is unavailable.
- The existing MLS Portal Feedback label ID is reused at send time when possible; sending retries without the label if Gmail rejects it.
- Repaired and filed the three previously failed feedback submissions.
