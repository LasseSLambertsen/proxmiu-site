# Proxmiu website

Live at **<https://proxmiu.com/>**.

Static presentation page for [Proxmiu](https://github.com/LasseSLambertsen/proxmiu). It is not the app.

## Deploy on Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/LasseSLambertsen/proxmiu-site)

Or import the repository in Netlify with:

- **Build command:** none
- **Publish directory:** `.`

`netlify.toml` already sets the publish directory. There are no dependencies and nothing to build. The production site uses the custom domain `proxmiu.com`.

## Local preview

Open `index.html` directly, or run a static server from this directory:

```bash
python3 -m http.server 8080
```

## Content

- `index.html`, `styles.css`, `app.js` — the page.
- `screenshots/` — product screenshots pulled from the main repository.
- Guest workspaces include Proxmox history, shared notes in the existing Proxmox description field, and agent-persisted pins. Saved inventory views stay in each browser. Bulk requests have reviewed targets and individual outcomes.
- Snapshots, backups and migration start real Proxmox tasks and display their final results. Availability depends on the guest, storage and API role; existing agents may need their Proxmox role updated.
- Optional OpenAI/Anthropic optimization advice uses an encrypted token on the agent. Users preview numeric resource data and explicitly request a review. The preview excludes names, IP addresses, notes and secrets, and advice never triggers automatic infrastructure changes.
- `logo.png`, `apple-touch-icon.png` — amber robotic lynx branding.
- `logo.svg`, `favicon.svg` — simplified vector companions for small sizes.

The [MIT license](LICENSE) from Proxmiu applies.

## Your lynx companion

The hero features the same amber robotic lynx as the app. Choose **Meet your lynx** to wake the companion with a click or the keyboard. Five quick clicks on the Proxmiu logo still work as an Easter egg. Click the mascot to pet it; dismiss it with Escape or its close button. Focus returns to the control that opened it, and it respects reduced-motion preferences. The companion is decorative and does not monitor or operate infrastructure.

With Node.js and Playwright available, run `node tests/lynx.e2e.cjs` to check the interaction and `node tests/presentation.e2e.cjs` for actual desktop/390px page checks, loaded images and feature/privacy copy. Set `CHROMIUM_PATH` to use a system Chromium installation. Presentation captures are written to `/tmp/proxmiu-site-*.png`.

Current guest workspace, operations and Settings screenshots were captured through the real local agent and bundled synthetic Proxmox mock (`scripts/capture-advanced.cjs` in the app repository). They do not show a real host; AI was unconfigured and no provider was contacted.
