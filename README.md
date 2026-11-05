# Proxmiu website

Live at **<https://proxmiu.com/>**.

Presentation website for [Proxmiu](https://github.com/LasseSLambertsen/proxmiu), with an isolated read-only tour at `/demo/`. The real app and agent run on your network.

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
- Optional OpenAI/Anthropic/OpenRouter optimization advice uses an encrypted token on the agent. Users preview numeric resource data and explicitly request a review. The preview excludes names, IP addresses, notes and secrets, and advice never triggers automatic infrastructure changes.
- `logo.png`, `apple-touch-icon.png` — amber robotic lynx branding.
- `logo.svg`, `favicon.svg` — simplified vector companions for small sizes.

The [MIT license](LICENSE) from Proxmiu applies.

## Your lynx companion

The hero features the same amber robotic lynx as the app. Choose **Meet your lynx** to wake the companion with a click or the keyboard. Five quick clicks on the Proxmiu logo still work as an Easter egg. Click the mascot to pet it; dismiss it with Escape or its close button. Focus returns to the control that opened it, and it respects reduced-motion preferences. On this presentation site the companion is decorative. In the app, a saved OpenAI, Anthropic or OpenRouter API key opens Lynx chat. Messages go to the configured provider when sent. Selected-guest setup help requires preview and consent before sharing settings and available recent usage; names, addresses, notes, logs and secrets stay out of that snapshot. Lynx can propose supported CPU, memory and boot settings, with before/after review and explicit confirmation through the existing stopped-guest editor. It never stops guests or applies changes automatically.

With Node.js and Playwright available, run `node tests/lynx.e2e.cjs` to check the interaction and `node tests/presentation.e2e.cjs` for actual desktop/390px page checks, loaded images and feature/privacy copy. Set `CHROMIUM_PATH` to use a system Chromium installation and `SITE_ROOT=dist` to check the staged publish output. Presentation captures are written to `/tmp/proxmiu-site-*.png`.

The app also offers an explicit **Plan a new guest** chat mode. Lynx suggests a built-in template and CPU/memory/disk values from public presets; no custom scripts, infrastructure data, destinations or credentials are sent in this mode. **Review in Create** validates the current template and opens a one-use memory draft in the normal creation form. Users review normal placement/network/access defaults and explicitly create the guest; the chat never provisions automatically.

Current guest workspace, operations and Settings screenshots were captured through the real local agent and bundled synthetic Proxmox mock (`scripts/capture-advanced.cjs` in the app repository). They do not show a real host; AI was unconfigured and no provider was contacted.

Guest maintenance also covers reviewed CPU/memory/start-at-boot edits for stopped guests, existing-backup browsing by storage, and paged diagnostics for Proxmiu-started tasks. Conflicting or pending configuration changes remain explicit.

Native Proxmox task history appears in Activity and guest workspaces, with connection/node selection, optional guest filtering, bounded paging and result/log inspection. History can reopen tasks after agent restarts, subject to Proxmox retention and permissions. Provisioning/update history remains separate and now survives restarts in an encrypted agent journal: up to 50 records with bounded diagnostic tails. Interrupted runs show last saved facts and manual recovery guidance, without automatic replay. Persistence failures and truncation are explicit; saved successes and addresses do not claim current guest health. Job history is never automatically attached to Lynx requests.

Demo release verification uses the app merge pinned in `demo-source.json`. Five build-boundary tests, the remote-source CLI build, staged desktop/390px presentation/companion checks and all six demo viewport/theme interaction/isolation cases pass. The staged runtime demo files are byte-identical to the browser-tested app artifact; `build.json` is the only additional demo file. Exact-head Netlify preview and production checks complete publication.

Guest workspaces also offer native Proxmox console access for running LXC guests and configured QEMU serial sockets. Users connect deliberately; no guest IP or SSH service is needed, but guest login may be required. The agent retains native tickets and honors the saved connection's authentication/TLS policy. Existing installations need an agent update and explicit VM.Console permission; no host-shell permission or automatic role/hardware/login-service change is introduced. Console traffic is transient and never automatically attached to Lynx requests. The pinned read-only sample tour remains unchanged.
