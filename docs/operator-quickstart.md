# Operator quickstart

There is no service to start here. This repository is a design record: the thing you
can actually *do* with it is confirm that what it claims about itself is still true,
read the design in a sensible order, and see for yourself which parts do not run.

Every command below was executed on 2026-08-12 against commit `4fd91c6`. The outputs
are transcribed, not predicted. No credentials and no deployed environment are
needed; step 4 wants outbound HTTPS and everything else works offline.

## 0. Prerequisites

Verified with:

| | version |
|---|---|
| nbb | v1.4.210 |
| node | v26.3.0 |
| npm | 11.16.0 |

Only `nbb` is needed for step 1. `node` and `npm` are needed for step 3, and only if
you want to reproduce a failure.

## 1. Check the repo is still what it says it is

```bash
kbb --backend sci scripts/verify-repo-contract.cljk
```

```
migrated payload   14 files / 15537 bytes
migration.edn says 14 files / 15537 bytes
post-migration additions (6): .gitignore, README.edn, README.md, docs/operator-quickstart.md, migration.edn, scripts/verify-repo-contract.cljk
PASS  migrated payload matches migration.edn
```

Exit code 0. This repo was extracted out of `etzhayyim/root`, and `migration.edn`
records the size of what moved. The script subtracts the files that were added *after*
the extraction (the ones named in `:identity :allowed-additions`) and checks that
what remains still weighs exactly what the extraction recorded.

It is worth knowing what this does and does not catch, because a check nobody has
tried to break is not a check:

| Change | Result |
|---|---|
| One byte appended to a migrated file | `FAIL … byte total drifted by 1`, exit 1 |
| A file committed without recording it | `FAIL … file count drifted by 1`, exit 1 |
| A migrated file deleted | `FAIL … file count drifted by -1`, exit 1 |
| Unmodified tree | `PASS`, exit 0 |

All four were run against throwaway clones. If you add a file to this repo, you must
add its path to `:identity :allowed-additions` in `migration.edn` — otherwise this
step goes red, which is the intended behaviour, not a bug to route around.

## 2. Read the design in this order

1. `README.md` — the [Known state](../README.md#known-state) table first. It tells you
   which parts of the design are still only design.
2. `docs/260313-drone-agent-architecture.md` — transport split, why each drone is a
   Matrix user, room structure, the data-flow diagram, and the safety model.
3. `CLAUDE.md` — the same architecture in summary, plus the five Arrow table schemas
   (`drone_registry`, `drone_mission`, `drone_telemetry`, `drone_geofence`,
   `drone_flight_log`) with their mandatory RLS columns.
4. `PROJECT.jsonld` — the DoDAF view: five capabilities against three performers.
   Note it says "Connect gRPC" where the two documents above say "XRPC". That
   disagreement is real and unresolved.
5. `appview/*/kotodama.jsonld` — the runtime descriptors: HTTP routes, static dir,
   the Matrix channels each component joins, and the `subscribeRepos` collections.

## 3. Reproduce the build failure (optional)

Skip unless you are about to work on the appview. **Do this in a copy, not in the
repo** — `npm install` writes `node_modules/` and a lockfile, and a failed install
leaves partial state behind.

```bash
cp -R appview/etzhayyim-wasm-drone-dr0n3x8k/svelte /tmp/drone-scratch
cd /tmp/drone-scratch
npm install
```

```
npm error code EUNSUPPORTEDPROTOCOL
npm error Unsupported URL Type "workspace:": workspace:*
```

That is blocker 1: `@etzhayyimcojp/design-system` is declared with pnpm's
`workspace:*` protocol, which only resolves inside the monorepo this app was
extracted from.

Delete that one dependency from the scratch copy's `package.json` and install again:

```
npm error code ERESOLVE
npm error Found: vite@6.4.3
npm error Could not resolve dependency:
npm error peer vite@"^5.0.0" from @sveltejs/vite-plugin-svelte@4.0.4
```

Blocker 2 — the dev dependencies contradict each other. Force past it with
`npm install --legacy-peer-deps` (0 vulnerabilities, installs fine) and build. The
workspace requires heavy builds to be serialised through the shared resource
governor rather than started directly:

```bash
node <workspace-root>/scripts/resource-guard.mjs run build -- npm run build
```

```
vite v6.4.3 building for production...
✓ 5 modules transformed.
✗ Build failed in 406ms
error during build:
[vite:css] [postcss] Cannot find module '@etzhayyimcojp/design-system/plugin'
```

Blocker 3, and the one that matters: `tailwind.config.js` imports `etzhayyimUIKit`
from that package, so the dependency is not removable — it is load-bearing. Five
modules transform cleanly before it dies, which tells you the scaffold itself is
sound and the problem is entirely the missing package.

The successor package exists: `kotoba-lang/svelte-design-system`, published as
`@etzhayyim/design-system`, exporting `./plugin` with the same `etzhayyimUIKit`
symbol. It ships no `dist/` (gitignored), so it needs building before it can be
consumed. Repointing and building is app work; it has not been done.

## 4. Confirm the declared endpoints (optional)

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://drone.etzhayyim.com/
```

```
curl: (6) Could not resolve host: drone.etzhayyim.com
```

NXDOMAIN, likewise for `dr0n3x8k.etzhayyim.com`. `https://etzhayyim.com/` answers
`200`, so this is a subdomain that was never published rather than a dead parent.
The `did:web:drone.etzhayyim.com` identity in `kotodama.jsonld` does not resolve
either, for the same reason.

## 5. Leave the tree clean

Steps 1, 2 and 4 write nothing. Step 3 writes only inside `/tmp`. `git status` should
report nothing after following this document — `node_modules/`, `dist/` and
`.svelte-kit/` are gitignored as insurance, but if you followed step 3 as written
there is nothing for them to catch. Anything else `git status` shows is your change.

Then re-run step 1: it is the cheapest way to notice that you edited a migrated file
by accident.
