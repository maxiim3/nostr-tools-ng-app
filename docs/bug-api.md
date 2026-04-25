# Bug API locale et generation invoice zap

## Symptome

Le zap modal s'ouvre apres un clic sur **Soutenir**, mais affiche une erreur de generation d'invoice.

## Cause observee

L'API Bun locale n'etait pas lancee sur `http://127.0.0.1:3000`.

Le port `3000` etait deja occupe par un process `next-server`, donc l'appel attendu vers l'API du projet ne repondait pas correctement :

```bash
curl http://127.0.0.1:3000/api/health
```

repondait `404` au lieu de la reponse de health check attendue.

## Diagnostic

Verifier quel process occupe le port `3000` :

```bash
ss -ltnp | grep :3000
```

Verifier si l'API Bun du projet repond :

```bash
curl http://127.0.0.1:3000/api/health
```

Reponse attendue :

```json
{ "ok": true }
```

## Relance

Liberer le port `3000`, puis lancer l'API du projet :

```bash
bun run api
```

Ne pas lancer l'API sur un autre port pour ce cas precis : en local, la generation d'invoice zap appelle explicitement `http://127.0.0.1:3000/api/lnurl`.
