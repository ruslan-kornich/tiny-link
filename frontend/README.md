# frontend

React SPA for tiny-link: auth, link management, and click analytics on top of
the REST contract described in [`docs/api.md`](../docs/api.md).

Stack: Vite + React + TypeScript, Tailwind CSS v4, TanStack Query, react-router,
Recharts, lucide-react.

## Development

```bash
npm install
npm run dev
```

The dev server proxies `/api` and `/healthz` to the backend
(`http://localhost:3000` by default; override with `VITE_API_PROXY_TARGET`).
