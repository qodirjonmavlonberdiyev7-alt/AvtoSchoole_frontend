# Deployment - AvtoSchoole Frontend

This repo deploys as an nginx Docker container on the same VPS as the sibling
`AvtoSchoole_backend` repo. nginx serves the built React app and reverse-proxies
`/api` and `/uploads` to the backend container - same origin, so the browser never
needs CORS. Every push to `main` (after lint/build pass) automatically redeploys via
GitHub Actions over SSH.

**Deploy the backend first** - this repo's nginx config expects a running `backend`
container on the shared `avtoschoole-net` network. See `AvtoSchoole_backend/DEPLOYMENT.md`
for the one-time network + VPS setup (`docker network create avtoschoole-net` etc.) - do
that once, before either repo's first deploy.

## 1. One-time VPS setup

```bash
mkdir -p /opt/avtoschoole
cd /opt/avtoschoole
git clone <your-frontend-repo-url> frontend
cd frontend
```

Default config serves the API at the relative path `/api` (same-origin via nginx) - no
`.env` file is required unless you want to override the build-time API URL. If you ever
deploy the frontend on a *different* host than the backend, override it instead:

```bash
echo "VITE_API_BASE_URL=https://api.yourdomain.com/api" > .env
```

First deploy:

```bash
docker compose up -d --build
curl -I http://localhost   # expect 200
```

## 2. GitHub repo + auto-deploy setup

1. Create a new GitHub repository (e.g. `avtoschoole-frontend`) and push this folder's
   contents to it as the initial commit.
2. Reuse the same deploy SSH keypair from the backend repo (or generate a separate one -
   either works, they just need to be authorized on the same VPS user).
3. In the GitHub repo's Settings -> Secrets and variables -> Actions, add the same four
   secrets as the backend repo: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PORT` (optional).

From the next push to `main` onward: it lints and builds first; only if that passes does
it SSH into the VPS, `git pull`, rebuild the nginx image, and restart just the frontend
container.

## Rolling back

```bash
cd /opt/avtoschoole/frontend
git checkout <previous-good-commit>
docker compose build frontend && docker compose up -d frontend
```

## Notes

- **HTTPS**: this setup serves plain HTTP on port 80. Once you have a real domain pointed
  at the VPS, the cleanest addition is Caddy (or certbot) in front of this nginx container
  for automatic Let's Encrypt TLS - not included here since no domain was specified yet.
- **Bundle size**: the production build is a single ~2.6MB JS bundle (~790KB gzipped).
  It works fine, but if load time on slow connections becomes a concern later, route-based
  code-splitting (`React.lazy`) is the standard follow-up - not done here to keep this pass
  scoped to deployment, not a performance refactor.
