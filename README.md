# Proxmiu website

Live at **<https://proxmiu.com/>**.

Presentation website for [Proxmiu](https://github.com/LasseSLambertsen/proxmiu), with an isolated read-only tour at `/demo/`. The real app and agent run on your network.

Proxmiu is evolving toward a full replacement for the Proxmox VE web interface in stages. The page distinguishes implemented daily guest operations and native text/graphical consoles from planned broader hardware editing, host storage/network/firewall controls, cluster management, backup administration, accounts/permissions, audit history and notifications. These are roadmap goals without promised release dates; full replacement and production readiness are not established. Verification uses synthetic fixtures first, with live Proxmox VE 8/9 and PBS checks pending on designated disposable infrastructure.

## Deploy on Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/LasseSLambertsen/proxmiu-site)

Or import the repository in Netlify with:

- **Build command:** `node tests/build.test.mjs && node scripts/build.mjs`
- **Publish directory:** `dist`

`netlify.toml` sets Node 22 and these build settings. The marketing page has no dependencies. The build fetches the fixed public app repository at the full commit in `demo-source.json`, installs its locked dependencies and runs only `npm run build:demo`. It stages an explicit marketing-file allowlist and the isolated static demo; app source, dependencies and environment files never enter the publish directory. The production site keeps its existing `proxmiu.com` domain and visitor access.

## Local preview

To preview the full website and demo, build with Git and Node 22+ available, then serve the output:

```bash
node tests/build.test.mjs
node scripts/build.mjs
python3 -m http.server 8080 --directory dist
```

For an already installed, clean app checkout at the exact pinned commit, `node scripts/build.mjs --source /path/to/proxmiu` uses it instead of fetching/installing a temporary source checkout. A mismatched or dirty checkout fails. The build prepares a complete replacement before switching generated `dist`; a build error preserves the prior output. Netlify Git deployment publishes complete successful builds atomically.

The demo uses fixed synthetic data, hash navigation and bundled app design components. It has no live agent/session/provider/terminal code, credentials or infrastructure actions. Only its separate theme preference persists. `/demo/build.json` records the exact app source SHA. CSP blocks network connections, and demo responses are marked noindex. Updating the tour requires pinning a reviewed, merged app revision and rerunning the checks; no floating branch is used.

## Content

- `index.html`, `styles.css`, `app.js` — the page.
- `screenshots/` — product screenshots pulled from the main repository.
- Guest workspaces include Proxmox history, shared notes in the existing Proxmox description field, and agent-persisted pins. Saved inventory views stay in each browser. Bulk requests have reviewed targets and individual outcomes.
- Snapshots, backups and migration start real Proxmox tasks and display their final results. Availability depends on the guest, storage and API role; existing agents may need their Proxmox role updated.
- Backup restore is implemented in app merge `acd5fc098b8a41eda632bbfb54494b0990d8d295` (PR #21). It restores a listed VM VMA/PBS or ordinary unprivileged LXC TAR/PBS archive on the same node into a new, unused guest ID. A reviewed five-minute single-use plan and typed destination ID precede submission. The source is retained; `force=0`, `unique=1`, `start=0` and `onboot=0` keep the destination distinct and stopped. The actual task belongs to the new ID, with native task-history recovery. Unsupported host dependencies are blocked. Live Proxmox VE 8/9 and PBS validation remains pending on designated disposable infrastructure; this is not a production-readiness claim.
- Optional OpenAI/Anthropic/OpenRouter optimization advice uses an encrypted token on the agent. Users preview numeric resource data and explicitly request a review. The preview excludes names, IP addresses, notes and secrets, and advice never triggers automatic infrastructure changes.
- `logo.png`, `apple-touch-icon.png` — amber robotic lynx branding.
- `logo.svg`, `favicon.svg` — simplified vector companions for small sizes.

The [MIT license](LICENSE) from Proxmiu applies.

## Your lynx companion

The hero features the same amber robotic lynx as the app. Choose **Meet your lynx** to wake the companion with a click or the keyboard. Five quick clicks on the Proxmiu logo still work as an Easter egg. Click the mascot to pet it; dismiss it with Escape or its close button. Focus returns to the control that opened it, and it respects reduced-motion preferences. On this presentation site the companion is decorative. In the app, a saved OpenAI, Anthropic or OpenRouter API key opens Lynx chat. Messages go to the configured provider when sent. Selected-guest setup help requires preview and consent before sharing settings and available recent usage; names, addresses, notes, logs and secrets stay out of that snapshot. Lynx can propose supported CPU, memory and boot settings, with before/after review and explicit confirmation through the existing stopped-guest editor. It never stops guests or applies changes automatically.

With Node.js and Playwright available, run `node tests/lynx.e2e.cjs` to check the interaction and `node tests/presentation.e2e.cjs` for actual desktop/390px page checks, loaded images, feature/privacy copy, restore limits and the implemented/planned roadmap distinction. Set `CHROMIUM_PATH` to use a system Chromium installation and `SITE_ROOT=dist` to check the staged publish output. Presentation captures, including the staged roadmap, are written to `/tmp/proxmiu-site-*.png`.

The app also offers an explicit **Plan a new guest** chat mode. Lynx suggests a built-in template and CPU/memory/disk values from public presets; no custom scripts, infrastructure data, destinations or credentials are sent in this mode. **Review in Create** validates the current template and opens a one-use memory draft in the normal creation form. Users review normal placement/network/access defaults and explicitly create the guest; the chat never provisions automatically.

Current guest workspace, operations and Settings screenshots were captured through the real local agent and bundled synthetic Proxmox mock (`scripts/capture-advanced.cjs` in the app repository). They do not show a real host; AI was unconfigured and no provider was contacted.

Guest maintenance also covers reviewed CPU/memory/start-at-boot edits for stopped guests, existing-backup browsing by storage, and paged diagnostics for Proxmiu-started tasks. Conflicting or pending configuration changes remain explicit.

Reviewed disk growth was merged in app PR #25 (`366a225a560349beaba299b0c286ab7f23beaf33`). It grows one supported existing storage-backed QEMU/LXC disk after preflight observes the guest stopped, with capacity/storage/filesystem review, typed guest-name confirmation, native resize-task results and observed capacity afterward. It does not stop the guest, shrink a disk, add/remove devices or expand VM partitions/filesystems. Container filesystem growth can warn or fail after the underlying volume has grown. External clients can change guest state after preflight; stopped-only execution is not atomic. Synthetic fixtures verify this scope; designated live Proxmox VE 8/9 allocation/filesystem validation remains pending. Broader hardware editing stays planned, and the read-only demo pin is unchanged.

Configured NIC link state was merged in app PR #26 (`836113c4f4c0bc0c44ab10b7d3edc8832246375f`). For a supported existing ordinary QEMU/LXC device, preflight observes the guest stopped before a five-minute single-use review and typed guest-name confirmation. Only connected/disconnected-on-next-start state changes; MAC, bridge, VLAN, addressing and unrelated settings stay fixed. Native config PUT is synchronous and has no native task ID or log; the app rereads configuration to verify the observed result. Unknown outcomes require inspection, with no automatic retry or rollback. This is not a live connectivity check, and stopped-only execution is not atomic against other clients. Broader device/bridge/VLAN/address editing remains planned. Fixture verification does not establish live Proxmox VE 8/9 network behavior or production readiness; the demo pin and companion remain unchanged.

Native Proxmox task history appears in Activity and guest workspaces, with connection/node selection, optional guest filtering, bounded paging and result/log inspection. History can reopen tasks after agent restarts, subject to Proxmox retention and permissions. Provisioning/update history remains separate and now survives restarts in an encrypted agent journal: up to 50 records with bounded diagnostic tails. Interrupted runs show last saved facts and manual recovery guidance, without automatic replay. Persistence failures and truncation are explicit; saved successes and addresses do not claim current guest health. Job history is never automatically attached to Lynx requests.

Demo release verification uses the app merge pinned in `demo-source.json`. Five build-boundary tests, the remote-source CLI build, staged desktop/390px presentation/companion checks and all six demo viewport/theme interaction/isolation cases pass. The staged runtime demo files are byte-identical to the browser-tested app artifact; `build.json` is the only additional demo file. Exact-head Netlify preview and production checks complete publication.

Guest workspaces offer native Proxmox console access: running QEMU guests with a graphical display can use **Graphical display** or **Serial text**; LXC guests use text consoles, and VM serial access needs configured serial sockets. Users connect deliberately; no guest IP or SSH service is needed, but guest login may be required. The agent retains native tickets, generated VNC passwords and upstream credentials server-side, using the saved connection's authentication/TLS policy. Existing installations need an agent update and explicit VM.Console permission; no host-shell permission or automatic role/hardware/login-service change is introduced.

Graphical consoles were merged in app PR #22 (`151c82ebd26372a0354de45b7cf3b6ce31160f81`). Focus the console before sending keyboard input; pointer input, phone keys, local scaling and manual clipboard transfers are available. System clipboard contents never sync automatically. Proxmiu never starts a guest, changes its display configuration or reconnects automatically. Console traffic is transient and never automatically attached to Lynx requests. Real noVNC browser fixtures verify rendered pixels, input and lifecycle behavior; designated live Proxmox VE 8/9 guest/display validation remains pending. The pinned read-only sample tour remains unchanged.

Saved connections can be renamed or have their credentials/certificate verification updated without losing identity, guest metadata or retained history. The destination stays fixed; failed verification and stale edits do not replace saved settings. Existing secrets never return to the browser. Open terminals keep their current session, and old tokens/passwords are revoked separately in Proxmox. No new privileges or demo capability are added.
