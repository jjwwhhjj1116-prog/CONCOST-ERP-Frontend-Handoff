# Synthetic Demo Accounts

These accounts are for local UI validation only.

| Company | Identifier | Password | Persona |
|---|---|---|---|
| CON-COST | `demo.cc.001@example.invalid` | `DemoOnly!2026` | Synthetic administrator |
| Viet QS | `demo.vq.001@example.invalid` | `DemoOnly!2026` | Synthetic organization manager |

The credentials are intentionally public demo values, not secrets. They are
accepted only when `NEXT_PUBLIC_RUNTIME_MODE=DEMO_LOCAL`. In
`API_SANDBOX` and `PRODUCTION_SERVER`, the frontend requires server
authentication and returns no static fallback.

Never reuse the demo password, hash, salt, IDs, or accounts in a deployed
authentication service.
