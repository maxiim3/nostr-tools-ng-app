import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { nip19, verifyEvent } from 'nostr-tools';
import { unpackEventFromToken, validateEvent as validateNip98Event } from 'nostr-tools/nip98';

if (typeof Bun === 'undefined') {
  throw new Error('server.mjs must run with Bun.');
}

const PORT = Number.parseInt(process.env.PORT ?? '4444', 10);
const MAX_JSON_BODY_BYTES = 50 * 1024;
const MEMBERS_TABLE =
  process.env.SUPABASE_FRANCOPHONE_PACK_MEMBERS_TABLE ?? 'francophone_pack_members';
const FRANCOPHONE_PACK_URL =
  process.env.FRANCOPHONE_PACK_URL ??
  'https://following.space/d/xd0520r38aua?p=15a1989c2c483f6c6f18f2dda1033897a003669f449fc2fda4fa2fb6c9210900';
const ADMIN_NPUBS = new Set(
  (process.env.ADMIN_NPUBS ?? 'npub1zkse38pvfqlkcmcc7tw6zqecj7sqxe5lgj0u9ldylghmdjfppyqqtsa4du')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);
const MEMBER_STATUS_PENDING = 'pending';
const MEMBER_STATUS_SUCCESS = 'success';
const MEMBER_STATUS_REJECTED = 'rejected';
const MEMBER_STATUSES = new Set([
  MEMBER_STATUS_PENDING,
  MEMBER_STATUS_SUCCESS,
  MEMBER_STATUS_REJECTED,
]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const browserDistDir = path.join(__dirname, 'dist', 'nostr-tools-ng-app', 'browser');
const browserDistRoot = path.resolve(browserDistDir);
const indexFilePath = path.join(browserDistDir, 'index.html');
const DEFAULT_PUBLIC_PACK_RELAY_URLS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nostr.oxtr.dev',
  'wss://nostr-pub.wellorder.net',
  'wss://nos.lol',
  'wss://relay.primal.net',
];
const PUBLIC_PACK_RELAY_URLS = resolvePublicPackRelayUrls({
  explicitRelayList:
    readOptionalString(process.env.FRANCOPHONE_PACK_RELAYS) ??
    readOptionalString(process.env.PUBLIC_PACK_RELAY_URLS),
  bunkerUrl: readOptionalString(process.env.FRANCOPHONE_PACK_BUNKER_URL),
  fallbackRelayUrls: DEFAULT_PUBLIC_PACK_RELAY_URLS,
});
const PUBLIC_PACK_EVENT_KIND = 39089;
const PUBLIC_PACK_FETCH_TIMEOUT_MS = readPositiveIntegerEnv('PUBLIC_PACK_FETCH_TIMEOUT_MS', 8_000);
const PUBLIC_PACK_PUBLISH_TIMEOUT_MS = readPositiveIntegerEnv(
  'PUBLIC_PACK_PUBLISH_TIMEOUT_MS',
  8_000
);
const PUBLIC_PACK_CONFIRM_ATTEMPTS = readPositiveIntegerEnv('PUBLIC_PACK_CONFIRM_ATTEMPTS', 5);
const PUBLIC_PACK_CONFIRM_DELAY_MS = readPositiveIntegerEnv('PUBLIC_PACK_CONFIRM_DELAY_MS', 1_000);
const PUBLIC_PACK_REQUIRED_RELAY_ACKS = readPositiveIntegerEnv(
  'PUBLIC_PACK_REQUIRED_RELAY_ACKS',
  1
);
const PUBLIC_PACK_ACCEPT_SKIP_NETWORK =
  process.env.NODE_ENV === 'test' && process.env.PUBLIC_PACK_ACCEPT_SKIP_NETWORK === 'true';
const ndkModulePromise = import('@nostr-dev-kit/ndk');
const configuredPackReference = parsePackReference(FRANCOPHONE_PACK_URL);

const memberStorage = createFrancophonePackMemberStorage();
let publicPackNdkPromise = null;

const server = Bun.serve({
  port: PORT,
  fetch: handleRequest,
});

console.log(`Server listening on http://127.0.0.1:${server.port}`);
console.log(`Public pack relays: ${PUBLIC_PACK_RELAY_URLS.join(', ')}`);

export { server };

async function handleRequest(request) {
  const requestUrl = buildRequestUrl(request);
  const corsHeaders = createCorsHeaders(request);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/health') {
    return jsonResponse({ ok: true }, { headers: corsHeaders });
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/lnurl') {
    try {
      const address = requestUrl.searchParams.get('address');
      const amount = Number.parseInt(requestUrl.searchParams.get('amount') ?? '', 10);

      if (!address || !amount || Number.isNaN(amount)) {
        return jsonResponse({ error: 'Invalid parameters' }, { status: 400, headers: corsHeaders });
      }

      const { name, domain } = parseLightningAddress(address);
      const metadataResponse = await fetch(
        `https://${domain}/.well-known/lnurlp/${encodeURIComponent(name)}`
      );

      if (!metadataResponse.ok) {
        throw new Error('Lightning address lookup failed');
      }

      const metadata = await metadataResponse.json();
      if (typeof metadata.callback !== 'string' || !metadata.callback) {
        throw new Error('Missing LNURL callback');
      }

      if (typeof metadata.minSendable === 'number' && amount < metadata.minSendable) {
        throw new Error('Amount below minimum');
      }

      if (typeof metadata.maxSendable === 'number' && amount > metadata.maxSendable) {
        throw new Error('Amount above maximum');
      }

      const url = new URL(metadata.callback);
      url.searchParams.set('amount', amount.toString());

      const lnurlResponse = await fetch(url.toString());
      if (!lnurlResponse.ok) {
        throw new Error('LNURL request failed');
      }

      const data = await lnurlResponse.json();
      if (typeof data.pr !== 'string' || !data.pr) {
        throw new Error('Invalid invoice response');
      }

      return jsonResponse({ pr: data.pr }, { headers: corsHeaders });
    } catch (error) {
      console.error('LNURL error:', error);
      return jsonResponse(
        { error: 'Failed to generate invoice' },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/public-pack-members') {
    try {
      const packUrl = readOptionalString(requestUrl.searchParams.get('packUrl'));
      if (!packUrl) {
        throw createHttpError(400, 'Missing packUrl query parameter.');
      }

      const members = await listPublicPackMembers(packUrl);
      return jsonResponse(members, { headers: corsHeaders });
    } catch (error) {
      return handleApiError(error, corsHeaders);
    }
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/pack-members/me') {
    try {
      const auth = await requireNostrAuth(request, undefined, false, requestUrl);
      const member = await memberStorage.findByPubkey(auth.pubkey);
      const status = resolveUserMemberStatus(member);

      return jsonResponse(
        {
          status,
          member: status === 'idle' ? null : mapMemberRecord(member),
        },
        { headers: corsHeaders }
      );
    } catch (error) {
      return handleApiError(error, corsHeaders);
    }
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/pack-members') {
    try {
      const body = await readJsonBody(request);
      const auth = await requireNostrAuth(request, body, false, requestUrl);
      const now = new Date().toISOString();
      const existingMember = await memberStorage.findByPubkey(auth.pubkey);
      const existingStatus = resolveUserMemberStatus(existingMember);
      const memberProfile = {
        username: readProfileName(body, auth.npub),
        description: readOptionalString(body?.description),
        avatarUrl: readOptionalString(body?.avatarUrl) ?? readOptionalString(body?.imageUrl),
        followerCount: readOptionalNumber(body?.followerCount, 'followerCount'),
        followingCount: readOptionalNumber(body?.followingCount, 'followingCount'),
        accountCreatedAt: readOptionalIsoString(body?.accountCreatedAt, 'accountCreatedAt'),
        postCount: readOptionalNumber(body?.postCount, 'postCount'),
        zapCount: readOptionalNumber(body?.zapCount, 'zapCount'),
      };

      if (existingStatus === MEMBER_STATUS_SUCCESS && existingMember) {
        return jsonResponse(
          {
            status: MEMBER_STATUS_SUCCESS,
            member: mapMemberRecord(existingMember),
          },
          { headers: corsHeaders }
        );
      }

      const member = await memberStorage.upsert({
        pubkey: auth.pubkey,
        username: memberProfile.username,
        description: memberProfile.description,
        avatarUrl: memberProfile.avatarUrl,
        joinedAt: existingMember?.joinedAt ?? now,
        followerCount: memberProfile.followerCount,
        followingCount: memberProfile.followingCount,
        accountCreatedAt: memberProfile.accountCreatedAt,
        postCount: memberProfile.postCount,
        zapCount: memberProfile.zapCount,
        requestedFromApp: true,
        requestedAt: now,
        removedAt: null,
        status: MEMBER_STATUS_PENDING,
      });

      return jsonResponse(
        {
          status: MEMBER_STATUS_PENDING,
          member: mapMemberRecord(member),
        },
        { status: 202, headers: corsHeaders }
      );
    } catch (error) {
      return handleApiError(error, corsHeaders);
    }
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/admin/pack-members') {
    try {
      await requireNostrAuth(request, undefined, true, requestUrl);

      const records = await memberStorage.listActive();

      return jsonResponse(records.map(mapMemberRecord), { headers: corsHeaders });
    } catch (error) {
      return handleApiError(error, corsHeaders);
    }
  }

  const removeMatch = matchAdminMemberRemoveRoute(requestUrl.pathname);
  if (request.method === 'POST' && removeMatch) {
    try {
      const body = await readJsonBody(request);
      await requireNostrAuth(request, body, true, requestUrl);
      await memberStorage.removeIfExists(removeMatch.pubkey, new Date().toISOString());

      return new Response(null, { status: 204, headers: corsHeaders });
    } catch (error) {
      return handleApiError(error, corsHeaders);
    }
  }

  const statusMatch = matchAdminMemberStatusRoute(requestUrl.pathname);
  if (request.method === 'POST' && statusMatch) {
    try {
      const body = await readJsonBody(request);
      const auth = await requireNostrAuth(request, body, true, requestUrl);

      const nextStatus = statusMatch.status;
      if (!MEMBER_STATUSES.has(nextStatus)) {
        throw createHttpError(400, 'Invalid status update.');
      }

      if (nextStatus === MEMBER_STATUS_SUCCESS) {
        assertPackOwnerAuth(auth.pubkey);
        const signedPackEvent = readSignedPackEventInput(body?.packEvent);
        assertValidPackAcceptanceEvent(signedPackEvent, statusMatch.pubkey);
        await publishPackAcceptanceEvent(signedPackEvent, statusMatch.pubkey);
      }

      const updatedMember = await memberStorage.updateStatus(
        statusMatch.pubkey,
        nextStatus,
        new Date().toISOString()
      );

      if (!updatedMember) {
        throw createHttpError(404, 'Member not found.');
      }

      return jsonResponse(mapMemberRecord(updatedMember), { headers: corsHeaders });
    } catch (error) {
      return handleApiError(error, corsHeaders);
    }
  }

  if (requestUrl.pathname.startsWith('/api/')) {
    return jsonResponse({ message: 'Not found.' }, { status: 404, headers: corsHeaders });
  }

  return serveClientApp(requestUrl.pathname);
}

async function requireNostrAuth(
  request,
  body,
  requireAdmin = false,
  requestUrl = buildRequestUrl(request)
) {
  const authorization = request.headers.get('authorization');
  if (!authorization) {
    throw createHttpError(401, 'Missing Nostr authorization header.');
  }

  let event;
  try {
    event = await unpackEventFromToken(authorization);
  } catch {
    throw createHttpError(401, 'Invalid Nostr authorization token.');
  }

  const requestUrls = buildCandidateAuthUrls(requestUrl);
  const isValid = await validateNostrRequest(event, requestUrls, request.method, body);

  if (!isValid) {
    throw createHttpError(401, 'Invalid Nostr authorization token.');
  }

  const npub = nip19.npubEncode(event.pubkey);
  if (requireAdmin && !ADMIN_NPUBS.has(npub)) {
    throw createHttpError(403, 'Admin permissions are required.');
  }

  return {
    pubkey: event.pubkey,
    npub,
  };
}

async function validateNostrRequest(event, requestUrls, method, body) {
  if (!verifyEvent(event)) {
    return false;
  }

  for (const requestUrl of requestUrls) {
    try {
      await validateNip98Event(event, requestUrl, method, body);
      return true;
    } catch {
      continue;
    }
  }

  return false;
}

function buildRequestUrl(request) {
  const url = new URL(request.url);
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host');

  if (forwardedProto) {
    url.protocol = `${forwardedProto}:`;
  }

  if (host) {
    url.host = host;
  }

  return url;
}

function buildCandidateAuthUrls(requestUrl) {
  const primaryUrl = requestUrl.toString();

  try {
    if (!isLoopbackHost(requestUrl.hostname)) {
      return [primaryUrl];
    }

    const alternateUrl = new URL(primaryUrl);
    alternateUrl.hostname = requestUrl.hostname === 'localhost' ? '127.0.0.1' : 'localhost';

    return [primaryUrl, alternateUrl.toString()];
  } catch {
    return [primaryUrl];
  }
}

function isLoopbackHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function mapMemberRecord(record) {
  return {
    pubkey: record.pubkey,
    username: record.username,
    description: record.description,
    avatarUrl: record.avatarUrl,
    joinedAt: record.joinedAt,
    followerCount: record.followerCount,
    followingCount: record.followingCount,
    accountCreatedAt: record.accountCreatedAt,
    postCount: record.postCount,
    zapCount: record.zapCount,
    requestedFromApp: record.requestedFromApp,
    requestedAt: record.requestedAt,
    removedAt: record.removedAt,
    status: record.status,
  };
}

function resolveUserMemberStatus(member) {
  if (!member || member.removedAt) {
    return 'idle';
  }

  if (member.status === MEMBER_STATUS_PENDING) {
    return MEMBER_STATUS_PENDING;
  }

  if (member.status === MEMBER_STATUS_SUCCESS) {
    return MEMBER_STATUS_SUCCESS;
  }

  return 'idle';
}

function readProfileName(body, fallbackNpub) {
  const username = readOptionalString(body?.username) ?? readOptionalString(body?.displayName);
  return username ?? `${fallbackNpub.slice(0, 12)}...`;
}

function readOptionalString(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  return value.trim();
}

function readPositiveIntegerEnv(name, fallbackValue) {
  const rawValue = readOptionalString(process.env[name]);
  if (!rawValue) {
    return fallbackValue;
  }

  const parsedValue = Number.parseInt(rawValue, 10);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallbackValue;
}

function resolvePublicPackRelayUrls({ explicitRelayList, bunkerUrl, fallbackRelayUrls }) {
  const relayUrls = [
    ...readRelayUrlsFromList(explicitRelayList),
    ...readRelayUrlsFromBunkerUrl(bunkerUrl),
  ];
  const dedupedRelayUrls = dedupeRelayUrls(relayUrls);

  if (dedupedRelayUrls.length > 0) {
    return dedupedRelayUrls;
  }

  return [...fallbackRelayUrls];
}

function readRelayUrlsFromList(value) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((entry) => normalizeRelayUrl(entry))
    .filter((entry) => entry !== null);
}

function readRelayUrlsFromBunkerUrl(bunkerUrl) {
  if (!bunkerUrl) {
    return [];
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(bunkerUrl);
  } catch {
    return [];
  }

  return parsedUrl.searchParams
    .getAll('relay')
    .map((relayUrl) => normalizeRelayUrl(relayUrl))
    .filter((relayUrl) => relayUrl !== null);
}

function normalizeRelayUrl(value) {
  const trimmedValue = readOptionalString(value);
  if (!trimmedValue) {
    return null;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(trimmedValue);
  } catch {
    return null;
  }

  if (parsedUrl.protocol !== 'wss:' && parsedUrl.protocol !== 'ws:') {
    return null;
  }

  return parsedUrl.toString();
}

function dedupeRelayUrls(relayUrls) {
  const dedupedRelayUrls = [];
  const seenRelayUrls = new Set();

  for (const relayUrl of relayUrls) {
    if (!relayUrl || seenRelayUrls.has(relayUrl)) {
      continue;
    }

    seenRelayUrls.add(relayUrl);
    dedupedRelayUrls.push(relayUrl);
  }

  return dedupedRelayUrls;
}

function readOptionalNumber(value, fieldName) {
  if (value === null || typeof value === 'undefined') {
    return null;
  }

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw createHttpError(400, `Invalid ${fieldName}.`);
  }

  return Math.trunc(value);
}

function readOptionalIsoString(value, fieldName) {
  const isoString = readOptionalString(value);
  if (!isoString) {
    return null;
  }

  if (Number.isNaN(new Date(isoString).getTime())) {
    throw createHttpError(400, `Invalid ${fieldName}.`);
  }

  return isoString;
}

async function readJsonBody(request) {
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number.parseInt(contentLength, 10) > MAX_JSON_BODY_BYTES) {
    throw createHttpError(413, 'Request body too large.');
  }

  const rawBody = await request.text();
  if (!rawBody) {
    return {};
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_JSON_BODY_BYTES) {
    throw createHttpError(413, 'Request body too large.');
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw createHttpError(400, 'Invalid JSON body.');
  }
}

function createCorsHeaders(request) {
  const headers = new Headers();
  const origin = request.headers.get('origin');

  if (origin === 'http://localhost:4200' || origin === 'http://127.0.0.1:4200') {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Vary', 'Origin');
  }

  return headers;
}

function parseLightningAddress(address) {
  if (typeof address !== 'string') {
    throw new Error('Invalid lightning address');
  }

  const [name, domain] = address.trim().split('@');
  if (!name || !domain) {
    throw new Error('Invalid lightning address');
  }

  return { name, domain };
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function handleApiError(error, corsHeaders) {
  const status = typeof error?.status === 'number' ? error.status : 500;
  const message = error instanceof Error ? error.message : 'Unexpected server error.';

  if (status >= 500) {
    console.error(error);
  }

  return jsonResponse({ message }, { status, headers: corsHeaders });
}

function jsonResponse(body, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

function matchAdminMemberRemoveRoute(pathname) {
  const pattern = /^\/api\/admin\/pack-members\/([^/]+)\/remove$/;
  const match = pathname.match(pattern);

  if (!match) {
    return null;
  }

  return {
    pubkey: decodeURIComponent(match[1]),
  };
}

function matchAdminMemberStatusRoute(pathname) {
  const pattern = /^\/api\/admin\/pack-members\/([^/]+)\/(accept|reject)$/;
  const match = pathname.match(pattern);

  if (!match) {
    return null;
  }

  return {
    pubkey: decodeURIComponent(match[1]),
    status: match[2] === 'accept' ? MEMBER_STATUS_SUCCESS : MEMBER_STATUS_REJECTED,
  };
}

function assertPackOwnerAuth(authPubkey) {
  const normalizedPubkey = normalizeHexPubkey(authPubkey);
  if (!normalizedPubkey || normalizedPubkey !== configuredPackReference.authorPubkey) {
    throw createHttpError(403, 'Only the pack owner can approve pending requests.');
  }
}

function readSignedPackEventInput(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw createHttpError(400, 'A signed pack event is required to approve a request.');
  }

  const id = readRequiredHex(value.id, 64, 'Invalid signed pack event id.');
  const pubkey = readRequiredHex(value.pubkey, 64, 'Invalid signed pack event pubkey.');
  const sig = readRequiredHex(value.sig, 128, 'Invalid signed pack event signature.');
  const kind = readRequiredInteger(value.kind, 'Invalid signed pack event kind.');
  const createdAt = readRequiredInteger(value.created_at, 'Invalid signed pack event created_at.');
  const content = readRequiredEventContent(value.content);
  const tags = readRequiredEventTags(value.tags);

  const event = {
    id,
    pubkey,
    sig,
    kind,
    created_at: createdAt,
    content,
    tags,
  };

  if (!verifyEvent(event)) {
    throw createHttpError(400, 'Signed pack event signature verification failed.');
  }

  return event;
}

function readRequiredHex(value, length, errorMessage) {
  if (typeof value !== 'string') {
    throw createHttpError(400, errorMessage);
  }

  const normalized = value.trim().toLowerCase();
  if (!new RegExp(`^[0-9a-f]{${length}}$`).test(normalized)) {
    throw createHttpError(400, errorMessage);
  }

  return normalized;
}

function readRequiredInteger(value, errorMessage) {
  if (!Number.isInteger(value) || value <= 0) {
    throw createHttpError(400, errorMessage);
  }

  return value;
}

function readRequiredEventContent(value) {
  if (typeof value !== 'string') {
    throw createHttpError(400, 'Invalid signed pack event content.');
  }

  return value;
}

function readRequiredEventTags(value) {
  if (!Array.isArray(value)) {
    throw createHttpError(400, 'Invalid signed pack event tags.');
  }

  return value.map((tag) => {
    if (!Array.isArray(tag)) {
      throw createHttpError(400, 'Invalid signed pack event tags.');
    }

    if (!tag.every((entry) => typeof entry === 'string')) {
      throw createHttpError(400, 'Invalid signed pack event tags.');
    }

    return [...tag];
  });
}

function assertValidPackAcceptanceEvent(event, memberPubkey) {
  const normalizedMemberPubkey = normalizeHexPubkey(memberPubkey);
  if (!normalizedMemberPubkey) {
    throw createHttpError(400, 'Invalid member pubkey.');
  }

  if (event.kind !== PUBLIC_PACK_EVENT_KIND) {
    throw createHttpError(400, 'Signed pack event kind does not match the configured pack kind.');
  }

  if (event.pubkey !== configuredPackReference.authorPubkey) {
    throw createHttpError(403, 'Signed pack event must be authored by the pack owner.');
  }

  const hasPackDTag = event.tags.some(
    (tag) => tag[0] === 'd' && readOptionalString(tag[1]) === configuredPackReference.dTag
  );
  if (!hasPackDTag) {
    throw createHttpError(400, 'Signed pack event does not target the configured pack.');
  }

  if (!hasMemberTag(event.tags, normalizedMemberPubkey)) {
    throw createHttpError(400, 'Signed pack event must include the accepted member pubkey.');
  }
}

async function publishPackAcceptanceEvent(event, memberPubkey) {
  if (PUBLIC_PACK_ACCEPT_SKIP_NETWORK) {
    return;
  }

  const ndk = await ensurePublicPackNdk();
  const { NDKEvent, NDKRelaySet } = await ndkModulePromise;
  const relaySet = NDKRelaySet.fromRelayUrls(PUBLIC_PACK_RELAY_URLS, ndk, true);
  const ndkEvent = new NDKEvent(ndk, event);

  try {
    await ndkEvent.publish(
      relaySet,
      PUBLIC_PACK_PUBLISH_TIMEOUT_MS,
      resolveRequiredRelayAcks(PUBLIC_PACK_RELAY_URLS.length)
    );
  } catch {
    throw createHttpError(503, 'Unable to publish the signed pack event.');
  }

  const normalizedMemberPubkey = normalizeHexPubkey(memberPubkey);
  if (!normalizedMemberPubkey) {
    throw createHttpError(400, 'Invalid member pubkey.');
  }

  const confirmed = await confirmPublicPackMemberState(
    configuredPackReference,
    normalizedMemberPubkey,
    true
  );
  if (!confirmed) {
    throw createHttpError(502, 'Unable to confirm the public pack update.');
  }
}

function resolveRequiredRelayAcks(relayCount) {
  return Math.max(1, Math.min(PUBLIC_PACK_REQUIRED_RELAY_ACKS, relayCount));
}

function hasMemberTag(tags, memberPubkey) {
  return tags.some((tag) => tag[0] === 'p' && normalizeHexPubkey(tag[1] ?? '') === memberPubkey);
}

async function confirmPublicPackMemberState(packReference, memberPubkey, expectedMembership) {
  for (let attempt = 0; attempt < PUBLIC_PACK_CONFIRM_ATTEMPTS; attempt += 1) {
    const currentPackEvent = await findCurrentPackEvent(packReference).catch(() => null);

    if (
      currentPackEvent &&
      hasMemberTag(currentPackEvent.tags, memberPubkey) === expectedMembership
    ) {
      return true;
    }

    if (attempt < PUBLIC_PACK_CONFIRM_ATTEMPTS - 1) {
      await delay(PUBLIC_PACK_CONFIRM_DELAY_MS);
    }
  }

  return false;
}

function createFrancophonePackMemberStorage() {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const serverKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serverKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required.');
  }

  const tableUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent(MEMBERS_TABLE)}`;
  const baseHeaders = {
    apikey: serverKey,
    Authorization: `Bearer ${serverKey}`,
  };

  return {
    async findByPubkey(pubkey) {
      const url = new URL(tableUrl);
      url.searchParams.set('pubkey', `eq.${pubkey}`);
      url.searchParams.set('select', '*');
      url.searchParams.set('limit', '1');

      const rows = await supabaseRequest(url, { headers: baseHeaders });
      return rows[0] ? mapSupabaseRow(rows[0]) : null;
    },

    async listActive() {
      const url = new URL(tableUrl);
      url.searchParams.set('removed_at', 'is.null');
      url.searchParams.set('select', '*');
      url.searchParams.set('order', 'joined_at.desc');

      const rows = await supabaseRequest(url, { headers: baseHeaders });
      return rows.map(mapSupabaseRow);
    },

    async upsert(member) {
      const url = new URL(tableUrl);
      url.searchParams.set('on_conflict', 'pubkey');

      const rows = await supabaseRequest(url, {
        method: 'POST',
        headers: {
          ...baseHeaders,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(mapMemberToSupabaseRow(member)),
      });

      return rows[0] ? mapSupabaseRow(rows[0]) : member;
    },

    async updateStatus(pubkey, status, changedAt) {
      const existingMember = await this.findByPubkey(pubkey);
      if (!existingMember) {
        return null;
      }

      const updates = {
        status,
        removed_at: null,
      };

      if (status === MEMBER_STATUS_SUCCESS) {
        updates.joined_at = changedAt;
      }

      const url = new URL(tableUrl);
      url.searchParams.set('pubkey', `eq.${pubkey}`);

      const rows = await supabaseRequest(url, {
        method: 'PATCH',
        headers: {
          ...baseHeaders,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(updates),
      });

      return rows[0] ? mapSupabaseRow(rows[0]) : null;
    },

    async removeIfExists(pubkey, removedAt) {
      const existingMember = await this.findByPubkey(pubkey);
      if (!existingMember || existingMember.removedAt) {
        return false;
      }

      const url = new URL(tableUrl);
      url.searchParams.set('pubkey', `eq.${pubkey}`);

      await supabaseRequest(url, {
        method: 'PATCH',
        headers: {
          ...baseHeaders,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ removed_at: removedAt }),
      });

      return true;
    },
  };
}

async function supabaseRequest(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw createHttpError(502, message || 'Supabase request failed.');
  }

  if (response.status === 204) {
    return [];
  }

  return response.json();
}

function mapSupabaseRow(row) {
  return {
    pubkey: row.pubkey,
    username: row.username,
    description: row.description ?? null,
    avatarUrl: row.avatar_url ?? null,
    joinedAt: row.joined_at,
    followerCount: row.follower_count ?? null,
    followingCount: row.following_count ?? null,
    accountCreatedAt: row.account_created_at ?? null,
    postCount: row.post_count ?? null,
    zapCount: row.zap_count ?? null,
    requestedFromApp: Boolean(row.requested_from_app),
    requestedAt: row.requested_at ?? null,
    removedAt: row.removed_at ?? null,
    status: readStoredMemberStatus(row.status),
  };
}

function mapMemberToSupabaseRow(member) {
  return {
    pubkey: member.pubkey,
    username: member.username,
    description: member.description,
    avatar_url: member.avatarUrl,
    joined_at: member.joinedAt,
    follower_count: member.followerCount,
    following_count: member.followingCount,
    account_created_at: member.accountCreatedAt,
    post_count: member.postCount,
    zap_count: member.zapCount,
    requested_from_app: member.requestedFromApp,
    requested_at: member.requestedAt,
    removed_at: member.removedAt,
    status: readStoredMemberStatus(member.status),
  };
}

function readStoredMemberStatus(value) {
  if (
    value === MEMBER_STATUS_PENDING ||
    value === MEMBER_STATUS_SUCCESS ||
    value === MEMBER_STATUS_REJECTED
  ) {
    return value;
  }

  return MEMBER_STATUS_SUCCESS;
}

async function listPublicPackMembers(packUrl) {
  const packReference = parsePackReference(packUrl);
  const currentPackEvent = await findCurrentPackEvent(packReference);

  if (!currentPackEvent) {
    throw createHttpError(404, 'Public pack event not found.');
  }

  const pubkeys = uniquePublicMemberPubkeys(currentPackEvent.tags);
  const members = await Promise.all(pubkeys.map((pubkey) => loadPublicPackProfile(pubkey)));
  return members.sort((left, right) => left.username.localeCompare(right.username));
}

async function findCurrentPackEvent(packReference) {
  const ndk = await ensurePublicPackNdk();
  const events = await Promise.race([
    ndk.fetchEvents([
      {
        kinds: [PUBLIC_PACK_EVENT_KIND],
        authors: [packReference.authorPubkey],
        '#d': [packReference.dTag],
        limit: 1,
      },
      {
        '#d': [packReference.dTag],
        limit: 20,
      },
    ]),
    new Promise((resolve) => setTimeout(() => resolve(new Set()), PUBLIC_PACK_FETCH_TIMEOUT_MS)),
  ]);

  return (
    [...events]
      .filter((event) => {
        if (event.kind !== PUBLIC_PACK_EVENT_KIND) {
          return false;
        }

        if (event.pubkey !== packReference.authorPubkey) {
          return false;
        }

        return event.tags.some((tag) => tag[0] === 'd' && tag[1] === packReference.dTag);
      })
      .sort((left, right) => (right.created_at ?? 0) - (left.created_at ?? 0))[0] ?? null
  );
}

async function loadPublicPackProfile(pubkey) {
  const ndk = await ensurePublicPackNdk();
  const { NDKUser } = await ndkModulePromise;
  const user = new NDKUser({ pubkey });
  user.ndk = ndk;

  const profile = await withTimeout(
    user.fetchProfile().catch(() => null),
    2500,
    null
  );
  const npub = typeof user.npub === 'string' && user.npub ? user.npub : pubkey;
  const username =
    profile?.displayName?.trim() || profile?.name?.trim() || `${npub.slice(0, 12)}...`;

  return {
    pubkey,
    username,
    description: profile?.about?.trim() || null,
    avatarUrl: profile?.picture ?? profile?.image ?? null,
  };
}

async function ensurePublicPackNdk() {
  if (!publicPackNdkPromise) {
    publicPackNdkPromise = createPublicPackNdk().catch((error) => {
      publicPackNdkPromise = null;
      throw error;
    });
  }

  return publicPackNdkPromise;
}

async function createPublicPackNdk() {
  const { default: NDK } = await ndkModulePromise;
  const ndk = new NDK({
    explicitRelayUrls: PUBLIC_PACK_RELAY_URLS,
  });

  await ndk.connect(4000);
  return ndk;
}

function parsePackReference(packUrl) {
  let parsedUrl;

  try {
    parsedUrl = new URL(packUrl);
  } catch {
    throw createHttpError(400, 'Invalid pack URL.');
  }

  const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
  const dTag = pathSegments[0] === 'd' ? pathSegments[1]?.trim() : '';
  if (!dTag) {
    throw createHttpError(400, 'Pack URL is missing the d tag reference.');
  }

  const authorPubkey = normalizeHexPubkey(parsedUrl.searchParams.get('p') ?? '');
  if (!authorPubkey) {
    throw createHttpError(400, 'Pack URL is missing the owner pubkey reference.');
  }

  return {
    authorPubkey,
    dTag,
  };
}

function uniquePublicMemberPubkeys(tags) {
  const pubkeys = new Set();

  for (const tag of tags) {
    if (tag[0] !== 'p') {
      continue;
    }

    const pubkey = normalizeHexPubkey(tag[1] ?? '');
    if (pubkey) {
      pubkeys.add(pubkey);
    }
  }

  return [...pubkeys];
}

function normalizeHexPubkey(pubkey) {
  const trimmedPubkey = String(pubkey).trim().toLowerCase();
  return /^[0-9a-f]{64}$/.test(trimmedPubkey) ? trimmedPubkey : null;
}

function delay(timeoutMs) {
  return new Promise((resolve) => setTimeout(resolve, timeoutMs));
}

async function withTimeout(promise, timeoutMs, fallbackValue) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallbackValue), timeoutMs)),
  ]);
}

async function serveClientApp(pathname) {
  const assetPath = resolveAssetPath(pathname);

  if (assetPath) {
    const assetFile = Bun.file(assetPath);
    if (await assetFile.exists()) {
      return fileResponse(assetFile);
    }
  }

  if (path.extname(pathname)) {
    return new Response('Not found.', { status: 404 });
  }

  return fileResponse(Bun.file(indexFilePath));
}

function resolveAssetPath(pathname) {
  const relativePath = pathname === '/' ? 'index.html' : normalizePathname(pathname);
  if (!relativePath) {
    return null;
  }

  const assetPath = path.resolve(browserDistRoot, relativePath);
  if (assetPath !== browserDistRoot && !assetPath.startsWith(`${browserDistRoot}${path.sep}`)) {
    return null;
  }

  return assetPath;
}

function normalizePathname(pathname) {
  try {
    return decodeURIComponent(pathname).replace(/^\/+/, '');
  } catch {
    return null;
  }
}

function fileResponse(file) {
  const headers = new Headers();
  if (file.type) {
    headers.set('Content-Type', file.type);
  }

  return new Response(file, { headers });
}
