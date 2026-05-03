# Operations Troubleshooting

## Local Zap API Port Conflict

Symptom: the zap modal opens after clicking support, but invoice generation fails.

Observed cause: the Bun API was not running at `http://127.0.0.1:3000`. Port `3000` was occupied by another process, so the expected project API call returned `404` instead of the health response.

Diagnostic:

```bash
curl http://127.0.0.1:3000/api/health
```

Expected response:

```json
{ "ok": true }
```

Resolution:

1. Free port `3000`.
2. Start the project API:

```bash
bun run api
```

Do not run the API on another port for this case unless the app config is changed too. Local zap invoice generation calls `http://127.0.0.1:3000/api/lnurl`.
