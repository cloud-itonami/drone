# drone

**The design record for an autonomous drone operation platform.** Fleet registry,
mission planning, telemetry and geofencing for `drone.etzhayyim.com` — architecture,
component descriptors, and a UI scaffold.

The name says "drone" and nothing else, so state the important part first: **nothing
in this repository flies anything.** There is no flight controller here, no MAVLink
bridge, no compiled component, and no deployed surface. What migrated out of
`etzhayyim/root` was the *design* — 16 files, 16 KB — and the design is what this
repo holds.

That is not a defect to be apologised for; it is what the repo is for. But a reader
who skims `docs/260313-drone-agent-architecture.md` will find MAVLink signing, Matrix
E2EE rooms, WebRTC video relay and an LLM mission planner described in the present
tense, and will reasonably conclude that some of it exists. It does not. The
[Known state](#known-state) section below is the measured truth.

## Layout

```
CLAUDE.md                        architecture summary + the five Arrow table schemas
docs/260313-drone-agent-architecture.md
                                 the design: transport split, room structure,
                                 data flow, safety model
PROJECT.jsonld                   DoDAF capability/performer model (5 capabilities,
                                 3 performers)
appview/etzhayyim-wasm-drone-dr0n3x8k/
  kotodama.jsonld                component descriptor — routes, channels, governance
  svelte/                        Vite + Svelte 5 scaffold (a placeholder page)
appview/etzhayyim-wasm-drone-msnp1an2/
  kotodama.jsonld                component descriptor for the mission planner.
                                 Descriptor only — no code migrated for this one.
README.edn / migration.edn       machine-readable identity and the extraction record
scripts/verify-repo-contract.cljs
                                 checks the migrated payload is still intact
```

## The design, in one paragraph

Each drone is a Matrix appservice user (`@drone_{id}:etzhayyim.com`); room membership
and power levels *are* the authorization model. Commands, telemetry and flight events
travel as Matrix events, video signalling as `m.call.*` with media over WebRTC, and
queries go over a separate read-only path. A native Go service (`drone-bridge`) is the
only thing that speaks MAVLink to hardware, and it stays inside the cluster. Five
Arrow tables with mandatory RLS columns hold registry, missions, telemetry, geofences
and flight logs. Safety is dual-checked — software geofence in the bridge plus a
hardware MAVLink fence — with comm-loss → RTL and low-battery → LAND failsafes.

Read `docs/260313-drone-agent-architecture.md` for the whole thing.

## Known state

Measured on 2026-08-12 against commit `4fd91c6`. Every line here is an observation,
not an estimate.

| Claim in the repo | What is actually there |
|---|---|
| `drone.etzhayyim.com` (PROJECT.jsonld `schema:url`, and the `did:web:` identity in `kotodama.jsonld`) | **NXDOMAIN.** The host does not resolve. `etzhayyim.com` itself answers 200; the `drone` subdomain has never been published. |
| `component.wasm` (`kotodama.jsonld` → `component.path`) | Not in the tree. No `.wasm` file exists in this repo. |
| `msnp1an2` — the AI mission planner | Descriptor only. No source, no scaffold, no prompt — one 1.4 KB JSON-LD file. |
| The Svelte appview builds | **It does not.** Three independent blockers, below. |
| Queries go over "XRPC" (CLAUDE.md, architecture doc) / "Connect gRPC" (PROJECT.jsonld) | Both vocabularies are present and neither is implemented. The descriptor routes name `/api/grpc/...`. Treat the query transport as undecided. |

### The appview does not build

Reproduced from a clean copy — see [the quickstart](docs/operator-quickstart.md) for
the transcript. Three blockers, each independent of the others:

1. **`npm install` refuses outright.** `package.json` depends on
   `@etzhayyimcojp/design-system: workspace:*`. That protocol only means something
   inside the pnpm workspace this app used to live in. Outside it:
   `npm error code EUNSUPPORTEDPROTOCOL`.
2. **The dev dependencies contradict each other.** `@sveltejs/vite-plugin-svelte@^4.0.4`
   peer-requires `vite@^5.0.0`; the same file pins `vite@^6.4.2`. Removing the
   workspace dependency just moves you to `npm error code ERESOLVE`.
3. **The design system is load-bearing, not decorative.** `tailwind.config.js` opens
   with `import { etzhayyimUIKit } from '@etzhayyimcojp/design-system/plugin'`, so even
   with the dependency deleted and peers forced, the build dies at
   `[vite:css] [postcss] Cannot find module '@etzhayyimcojp/design-system/plugin'`.

The design system did survive the migration, under a different scope: it is
**`kotoba-lang/svelte-design-system`**, published as `@etzhayyim/design-system` (not
`@etzhayyimcojp/`), and it does export `./plugin` with exactly the `etzhayyimUIKit`
symbol `tailwind.config.js` imports. So the fix is a re-point rather than a rewrite —
with one caveat measured at the same time: that package ships no `dist/` (it is
gitignored), so it has to be built before anything here can consume it.

None of that is done in this repo, and doing it is a change to the app, not to its
documentation.

## The migrated payload is checkable

`migration.edn` records what the extraction from `etzhayyim/root` moved: 14 tracked
files totalling 15,537 bytes, plus a named list of files the extraction was allowed to
add. That claim is arithmetic, so it can be checked rather than believed:

```bash
nbb scripts/verify-repo-contract.cljs
```

It reads sizes from the committed blobs, subtracts the recorded additions, and exits
non-zero if the count or the byte total has moved. A one-byte edit to a migrated file
fails it; so does committing a file without recording it in
`:identity :allowed-additions`.

## Boundary with nearby repos

- **`etzhayyim/root`** — where this came from (`60-apps/etzhayyim-project-drone` at
  revision `afe5f1d9`). The source path no longer holds this app.
- **`kotoba-lang/svelte-design-system`** — the `@etzhayyim/design-system` package the
  appview scaffold still names under its old scope.
- The MAVLink bridge, the Matrix homeserver and the query service described in the
  architecture are not repos in this workspace. They are design, not deployment.

## If you are here to make it real

In dependency order, and none of it is started:

1. Re-point the appview at `@etzhayyim/design-system`, align the vite/plugin peers,
   and get `npm run build` green. That is the smallest step that turns this repo from
   a document into something that runs.
2. Give `msnp1an2` a body, or drop its descriptor.
3. Decide the query transport — XRPC or Connect gRPC — and delete the losing
   vocabulary from the docs.
4. Publish the domain, or change the `did:web:` identity to one that resolves.
