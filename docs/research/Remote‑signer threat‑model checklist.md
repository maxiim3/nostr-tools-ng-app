# Remote‑Signing Security: Pre‑Merge Checklist

## Deep‑link / intent hijack

* **Android**: Manifest includes `android:autoVerify="true"`; matching **`assetlinks.json`** served over HTTPS; **reject all unverified intents** (explicit component + package checks).
* **iOS**: **Universal Links** configured with valid **`apple-app-site-association`**; **fallbacks disabled** (no open‑URL without domain verification).
* **Web**: Only accept **origin‑strict** callbacks; **block `window.opener`** on popups (`rel="noopener"`), and verify **`state`** + **`origin`** on return.

## UI/consent spoofing

* Every signing prompt shows **explicit domain/app name**, **operation summary**, **amount/scope**, and **short TTL countdown**; **no hidden auto‑approve paths**.
* **Require user gesture** (tap/click) per high‑risk op; **block background auto‑approvals** and **rate‑limit prompts**.
* **Screens prevent overlay**: Android `setFilterTouchesWhenObscured=true` or `FLAG_SECURE` where applicable; web blocks full‑screen click‑throughs.

## Token replay

* All signature requests must include **`nonce + timestamp + singleUse=true`**; backend **rejects replays** (nonce store) and **old timestamps** (clock‑skew ≤ 2–5 min).
* **Short TTLs**: Ephemeral request tokens **expire ≤ 2–5 minutes**; cannot be refreshed.
* **Bind to audience & origin**: Tokens carry **audience (API)** and **origin (app/bundle id)**; mismatches are rejected.

## Relay MITM/tampering

* **TLS only**; **certificate pinning** (mobile) to the API/relay; **mutual‑TLS** for service‑to‑service paths.
* **Signed requests** end‑to‑end: Include **HMAC/EdDSA over (method, path, body, timestamp, nonce)**; server verifies signature before processing.
* **Downgrade/redirect hardening**: **HSTS** enabled; **no HTTP**, **no mixed content**; **strict redirect allow‑list**.

## Token theft / scope‑creep

* Use **attenuated per‑action tokens** (macaroons/agent tokens) with **caveats**: action, resource, max amount, TTL (minutes), and device/app binding.
* **Least privilege by default**: No long‑lived “sign‑anything” tokens; scopes are **narrow** and **non‑chainable**.
* **Revocation required**: **Revocation endpoint** must exist; each delegated session gets an **ID + audit log entry**; UI exposes **one‑tap revoke**.

## Device‑bound proof‑of‑possession (high‑risk ops)

* Require **DPoP/POP**: client proves possession of a private key per request; server validates **`jkt`**/**key thumbprint**.
* **Key storage**: Mobile keys in **Secure Enclave/Keystore** (non‑exportable); web uses **WebCrypto** + **persistent key handles** when available.
* **Transaction binding**: The **exact payload** to be signed (hash) is displayed to the user and **included in the proof**.

## Session linkage & state

* **`state` parameter** is **unguessable**, **single‑use**, and **bound** to user/session; server rejects mismatched or reused `state`.
* **PKCE (S256)** required on any OAuth‑like dance; **deny plain**; **rotate codes** per attempt.
* **Origin & Referer checks** enforced for web return flows; **double‑submit CSRF** or **SameSite=strict** on cookies.

## Transport & storage hygiene

* **No secrets in deep‑links/URLs** (ever); use **one‑time codes** exchanged over a pinned channel.
* **Logs scrubbed**: redact tokens, nonces, PII; **security events logged** with minimal sensitive data and **tamper‑evident** storage.
* **Clipboard blocked** for secrets; **screenshots disabled** on sensitive screens where platform allows.

## Failure & recovery paths

* **Hard fail closed**: On verification/pinning failure, **abort** with a clear error; **no silent fallback**.
* **User‑visible trace**: Show **who/what/where** (app id, domain, amount, time) for each approval; **receipt stored** client‑side.
* **Rate‑limits & anomaly detection**: lock or step‑up auth on **burst approvals**, **out‑of‑profile** origins, or **nonce collision**.

---

## What to enforce in code review (copy‑paste gate)

* “Manifest has `android:autoVerify` + working `assetlinks.json`; **reject unverified intents**.”
* “Every sign request requires **nonce+timestamp+singleUse**; server enforces **replay window ≤ 5 min**.”
* “Tokens are **per‑action** with **caveats** and **TTL ≤ 5 min**; **no broad persistent tokens**.”
* “High‑risk ops require **device‑bound proof‑of‑possession**; keys are **non‑exportable (Secure Enclave/Keystore)**.”
* “Relay calls use **TLS + pinning** (and **mTLS** service‑to‑service); **signed request envelope** verified server‑side.”
* “Web return flow validates **origin + state (single‑use) + PKCE S256**; **no secrets in URLs**.”
* “UI shows **domain/app, action, amount, TTL**; **tap required**; **overlay protection** enabled.”
* “**Revocation endpoint** exists; each delegated session creates an **audit log entry**; UI exposes **revoke**.”
* “Logs **redact secrets**; **HSTS** on; **no HTTP/mixed content**.”
* “On pin/verify failure: **fail closed**; no fallback.”
