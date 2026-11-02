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
- `logo.png`, `apple-touch-icon.png` — amber robotic lynx branding.
- `logo.svg`, `favicon.svg` — simplified vector companions for small sizes.

The [MIT license](LICENSE) from Proxmiu applies.
