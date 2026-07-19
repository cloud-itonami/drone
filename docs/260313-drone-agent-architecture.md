# drone.etzhayyim.com — Architecture Design

## Overview

Autonomous drone operation AI agent platform.
Matrix protocol for command/video/telemetry, XRPC for queries.

## Transport Design

```
┌─────────────────────────────────────────────────┐
│ Matrix Protocol Layer (unified communication)    │
│                                                  │
│  Command:    org.etzhayyim.command.drone.*            │
│  Telemetry:  org.etzhayyim.telemetry.drone.*          │
│  Video:      m.call.* (WebRTC signaling)         │
│  Log:        org.etzhayyim.event.drone.*              │
│  Auth:       Room membership + power_level       │
│  E2EE:       MLS (command + signaling)           │
├─────────────────────────────────────────────────┤
│ XRPC (Query only — read-only)            │
│  DroneQueryService: fleet info, history, stats   │
├─────────────────────────────────────────────────┤
│ MAVLink (drone-bridge ↔ Hardware only)           │
│  Internal, not exposed outside cluster           │
└─────────────────────────────────────────────────┘
```

## Drone = Matrix User

Each drone is registered as a Matrix appservice user:
- `@drone_{drone_id}:etzhayyim.com`
- Room membership controls access (power_level: operator=50, viewer=0)
- E2EE via MLS for command + signaling
- All events form tamper-evident DAG (audit log)

## Room Structure

```
!fleet_{org_id}:etzhayyim.com          — Fleet management (all drone status)
!drone_{drone_id}:etzhayyim.com        — Per-drone (telemetry + commands)
  └── Thread: mission_{mission_id}  — Mission-scoped logs
```

## Video via Matrix VoIP

Signaling through Matrix m.call.* events, media via WebRTC (P2P or TURN):

1. User sends `m.call.invite` with SDP offer to drone's room
2. drone-bridge (as drone's appservice user) answers with `m.call.answer`
3. ICE candidates exchanged via `m.call.candidates`
4. Video stream flows over WebRTC DTLS/SRTP (not through Matrix)
5. Session ends with `m.call.hangup`

## Components

| Component | Type | nanoid | Purpose |
|---|---|---|---|
| dr0n3x8k | App | dr0n3x8k | UI + Command/Query facade |
| msnp1an2 | App | msnp1an2 | AI mission planner (LLM Tool Use) |
| drone-bridge | Native Go | — | MAVLink, WebRTC, telemetry ingest |

## Data Flow

```
User → XRPC (DroneCommandService/StartMission)
     → App dr0n3x8k (authz, normalize)
     → Matrix event (org.etzhayyim.command.drone.start_mission)
     → drone-bridge (appservice subscribe)
     → MAVLink → Drone Hardware

Drone Hardware → MAVLink → drone-bridge
     → Arrow batch → Tonbo Flight SQL (drone_telemetry table)
     → Matrix event (org.etzhayyim.telemetry.drone.position)
     → AppShell Matrix client → Svelte UI (reactive)
```

## Arrow Schema (Tonbo Flight SQL)

5 tables, all with mandatory RLS columns (org_id, user_id, actor_id):
- `drone_registry` — Fleet registration
- `drone_mission` — Mission definitions + status
- `drone_telemetry` — High-frequency time-series
- `drone_geofence` — GeoJSON flight restriction zones
- `drone_flight_log` — Event-sourced flight events

## AI Agent (Mission Planner)

LLM Tool Use pattern with Murakumo (qwen3-vl-8b):
- `plan_survey_mission` — Grid survey waypoint generation
- `plan_inspection_route` — Orbital inspection path
- `estimate_battery` — Flight feasibility check
- Natural language interface via `AgentChat` command

## Safety

- Geofence: Software (drone-bridge) + hardware (MAVLink fence) dual check
- Failsafe: comm loss → RTL, battery low → LAND, GPS lost → LAND
- MAVLink signing: SHA-256 HMAC
- Video: DTLS (WebRTC standard)
