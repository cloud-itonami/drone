# etzhayyim-project-drone

Autonomous drone operation AI agent platform (drone.etzhayyim.com). Matrix protocol for command/video/telemetry, XRPC for queries.

## Frontend UI

- **UI**: Mobile-first 5 tab (Dashboard, Map, Mission, Log, Chat)
- **UIKit**: `@etzhayyimcojp/design-system` mandatory. Map overlay uses `Card`, `Badge`, `ActionSheet`
- **Matrix UI**: Telemetry timeline + chat via `@etzhayyimcojp/appshell/matrix`

## CRITICAL: XRPC URL Pattern

→ `etzhayyim dodaf tv1 query --id etzhayyim-project-drone-xrpc-url-pattern` / MCP `etzhayyim.dodaf.tv1.query`

## Architecture

- **Runtime**: TS Native + Lexicon Contract + Native Go service (drone-bridge)
- **Domain**: `drone.etzhayyim.com`
- **nanoid**: `dr0n3x8k` (main), `msnp1an2` (mission planner)
- **Static**: static delivery for `svelte/build/`
- **Structured reads/writes**: `G()` builder (squirrel 互換 SQL builder)

## Components

| Component | Type | Purpose |
|---|---|---|
| `etzhayyim-wasm-drone-dr0n3x8k` | App | UI + Command/Query facade |
| `etzhayyim-wasm-drone-msnp1an2` | App | Mission planner (LLM agent) |
| `provider/drone-bridge` | Native Go | MAVLink, WebRTC, telemetry ingest |

## Matrix Protocol Integration

- Each drone = Matrix appservice user (`@drone_{id}:etzhayyim.com`)
- Commands: `org.etzhayyim.command.drone.*` events
- Telemetry: `org.etzhayyim.telemetry.drone.*` events
- Video: `m.call.*` (WebRTC signaling via Matrix VoIP)
- Fleet room: `!fleet_{org_id}:etzhayyim.com`
- Per-drone room: `!drone_{drone_id}:etzhayyim.com`

## Tables (Arrow schema, RLS mandatory)

- `drone_registry` — org_id, user_id, actor_id, drone_id, name, model, status, home coords
- `drone_mission` — org_id, user_id, actor_id, mission_id, drone_id, waypoints, status
- `drone_telemetry` — org_id, user_id, actor_id, drone_id, ts, lat/lng/alt, battery, mode
- `drone_geofence` — org_id, user_id, actor_id, geofence_id, geometry (GeoJSON), action
- `drone_flight_log` — org_id, user_id, actor_id, log_id, drone_id, event_type, ts
