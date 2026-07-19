# Xorazm.PravaUz - Frontend

React + Vite + Ant Design admin panel for a driving-school CRM (superadmin / teacher /
student roles - groups, billing, lesson schedule, insurance, cashflow, reports, notes,
branch transfers, statistics, Excel export).

## Structure

```
web/                React app
packages/shared/    TypeScript enums/types/constants shared with the backend
```

## Development

Requires the backend running (see the sibling `AvtoSchoole_backend` repo) at
`http://localhost:3000/api` by default.

```bash
npm install
npm run shared:build
cp web/.env.example web/.env    # points VITE_API_BASE_URL at the backend
npm run dev          # http://localhost:5173
```

## Production deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) - served by nginx in Docker on a VPS (same-origin
reverse proxy to the backend), with GitHub Actions auto-deploying on every push to `main`.

## Verification

```bash
npm run shared:build
cd web && npx tsc -b --noEmit && npm run lint && npm run build
```
