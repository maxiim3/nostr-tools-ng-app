# LNURL Pay + Nostr Wallet Connect Checkout

## High-Level Snapshot

This document describes a lightweight, privacy-respecting checkout flow for selling a 90-minute audit or similar service using Lightning payments, LNURL-pay, and optional Nostr Wallet Connect.

The goal is to accept sats without holding custodial keys on the web server.

At its core, LNURL and related documents such as LUD-06 define how static links or QR codes can signal payment intent to Lightning wallets. The wallet can choose an amount, fetch payment metadata, and request a real Lightning invoice dynamically.

Your site serves metadata and invoices. It does not need to custody keys.

## Key Technical Pieces

### LNURL-pay / LUD-06

LNURL-pay lets a wallet fetch payment metadata from a static URL.

Typical metadata includes:

- minimum amount
- maximum amount
- description
- callback URL
- optional comment support
- metadata hash used in the invoice

The wallet then calls the callback URL with an amount, and the server returns a Lightning invoice.

This makes it possible to use stable QR codes or payment links instead of generating one invoice in advance.

## Nostr Wallet Connect / NWC / NIP-47

Nostr Wallet Connect is similar in spirit to “Connect Wallet” for Lightning.

It standardizes how applications and Lightning wallets communicate through Nostr relays.

The important property is that the user’s wallet signs and sends payments. The web server does not hold the user’s private keys.

This enables a smoother user experience than QR-only flows, especially for repeat or connected-wallet payments.

## Alby SDK and Related Tools

Alby provides developer tooling around Lightning, LNURL-pay, and Nostr Wallet Connect.

It can reduce implementation friction by providing SDKs and wallet-connection flows for web and mobile applications.

## Why This Matters For A Checkout

A Lightning checkout can be implemented with a small API surface.

The minimum useful backend only needs to:

1. serve LNURL-pay metadata
2. generate or fetch Lightning invoices
3. verify payment settlement
4. unlock the product or confirm the booking

The server does not need to store private wallet keys.

This reduces the attack surface compared to a custodial payment server.

## Example Checkout Flow

### 1. Product Page

The user lands on a product page, for example:

```txt
90-minute product / UX / frontend audit
Price: 150,000 sats
```

The page displays:

- a “Pay with Lightning” button
- an LNURL-pay QR code
- optionally a “Connect Lightning Wallet” button using NWC

### 2. LNURL Metadata Request

The user’s wallet scans the QR code or opens the lightning link.

The wallet requests metadata from the LNURL endpoint.

Example endpoint:

```txt
GET /api/lnurl/audit
```

Example response shape:

```json
{
  "tag": "payRequest",
  "callback": "https://example.com/api/lnurl/audit/callback",
  "minSendable": 150000000,
  "maxSendable": 150000000,
  "metadata": "[[\"text/plain\",\"90-minute product audit\"]]"
}
```

Amounts are usually expressed in millisatoshis.

Here, `150000000` millisatoshis equals `150000` sats.

### 3. Invoice Callback

The wallet calls the callback with the selected amount.

```txt
GET /api/lnurl/audit/callback?amount=150000000
```

The server asks a Lightning node or provider to generate an invoice for that amount.

Example response:

```json
{
  "pr": "lnbc1500u1...",
  "routes": []
}
```

The wallet pays the invoice.

### 4. Payment Verification

The server needs to verify that the invoice was settled.

Depending on the Lightning backend, this can be done by:

- webhook
- polling
- websocket/subscription
- invoice lookup by payment hash

Once settled, the system can:

- mark the order as paid
- send a confirmation email
- show a success page
- unlock booking/calendar access

## Optional Nostr Wallet Connect Flow

NWC can improve UX when the user connects their wallet.

A simplified flow:

1. the frontend shows a wallet connection request
2. the wallet approves a scoped NWC connection
3. the frontend or backend sends payment requests through the NWC connection
4. the user’s wallet signs and sends payment
5. your app receives confirmation

The main advantage is that the user does not need to scan a QR code every time.

## Security Notes

Nostr Wallet Connect must be handled carefully.

A bad permission model can allow unwanted payment requests.

Recommended constraints:

- request the minimum permissions needed
- prefer explicit user approval for payments
- set spending limits where possible
- avoid long-lived broad permissions
- never store wallet secrets in frontend-accessible storage unless the design explicitly accepts that risk
- treat NWC connection strings as sensitive credentials
- rotate or revoke connections when no longer needed

For LNURL-pay:

- validate amount server-side
- bind invoices to an order ID
- prevent replay or double-confirmation bugs
- verify settlement before granting access
- avoid trusting client-side success states
- log payment hash and invoice state
- keep metadata deterministic enough to avoid invoice mismatch issues

## Minimal Backend Responsibilities

A practical MVP backend should handle:

- product price configuration
- order creation
- LNURL metadata endpoint
- invoice generation endpoint
- payment status endpoint
- webhook or settlement listener
- paid order confirmation

## Possible Architecture

```txt
Frontend
  |
  |-- displays audit offer
  |-- shows LNURL QR / Lightning button
  |-- optionally connects NWC wallet
  |
Backend API
  |
  |-- creates pending order
  |-- serves LNURL-pay metadata
  |-- creates invoice via Lightning provider
  |-- verifies settlement
  |
Lightning Provider / Node
  |
  |-- generates invoice
  |-- reports payment settlement
  |
Booking / Delivery System
  |
  |-- unlocks calendar link
  |-- sends confirmation
```

## MVP Implementation Plan

### Phase 1: LNURL-pay Only

Implement the static LNURL-pay flow first.

This is simpler and works with many Lightning wallets.

Core endpoints:

```txt
GET  /api/lnurl/audit
GET  /api/lnurl/audit/callback?amount=...
GET  /api/orders/:id/status
POST /api/lightning/webhook
```

### Phase 2: Payment Confirmation

Add a proper paid-state workflow.

Required data:

```txt
order_id
invoice_payment_hash
invoice_pr
amount_msat
status: pending | paid | expired | failed
created_at
paid_at
```

### Phase 3: Nostr Wallet Connect

Add NWC as a UX improvement.

Use it for:

- connected-wallet payment
- one-click Lightning checkout
- optional future subscriptions or repeat purchases

Do not make NWC mandatory at first.

## Productized Use Case: 90-Minute Audit

Offer:

```txt
90-minute product / UX / frontend audit
Delivery: video call + written recommendations
Payment: Lightning
Price: fixed sats amount or fiat-indexed sats amount
```

Flow:

```txt
Landing page
  -> User clicks Pay with Lightning
  -> Wallet pays LNURL invoice
  -> Payment confirmed
  -> User receives booking link
  -> Audit happens
  -> User receives summary document
```

## Key Benefits

- no card processor dependency
- instant settlement
- global payment rail
- low-friction checkout
- no private keys on the server
- compatible with Bitcoin/Nostr-native users
- good fit for digital services, audits, consulting, content, and micro-SaaS

## Main Risks

- Lightning UX still varies by wallet
- inbound liquidity and channel management may matter depending on provider
- NWC permissions must be scoped carefully
- accounting and tax handling still need normal business rigor
- fiat volatility may require dynamic pricing if the service is priced in euros

## Recommended First Version

Start with LNURL-pay.

Use a Lightning provider that can generate invoices and notify settlement.

Keep the product simple:

- one product
- one fixed sats price
- one payment flow
- one booking link unlocked after payment

Then add NWC only after the base checkout works reliably.
