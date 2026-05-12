import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { nip19, verifyEvent } from 'nostr-tools';
import { unpackEventFromToken, validateEvent as validateNip98Event } from 'nostr-tools/nip98';

if (typeof Bun === 'undefined') {
  throw new Error('server.mjs must run with Bun.');
}

const PORT = Number.parseInt(process.env.PORT ?? '3000', 10);
const MAX_JSON_BODY_BYTES = 50 * 1024;
const MEMBERS_TABLE =
  process.env.SUPABASE_FRANCOPHONE_PACK_MEMBERS_TABLE ?? 'francophone_pack_members';
const FRANCOPHONE_PACK_URL =
  process.env.FRANCOPHONE_PACK_URL ??
  'https://following.space/d/xd0520r38aua?p=15a1989c2c483f6c6f18f2dda1033897a003669f449fc2fda4fa2fb6c9210900';
const FRANCOPHONE_PACK_SIGNER_MODE = process.env.FRANCOPHONE_PACK_SIGNER_MODE ?? '';
const FRANCOPHONE_PACK_BUNKER_URL = process.env.FRANCOPHONE_PACK_BUNKER_URL ?? '';
const FRANCOPHONE_PACK_OWNER_NSEC = process.env.FRANCOPHONE_PACK_OWNER_NSEC ?? '';
const FRANCOPHONE_PACK_PUBLISHER_MODE = process.env.FRANCOPHONE_PACK_PUBLISHER_MODE ?? 'nostr';
const ADMIN_NPUBS = new Set(
  (process.env.ADMIN_NPUBS ?? 'npub1zkse38pvfqlkcmcc7tw6zqecj7sqxe5lgj0u9ldylghmdjfppyqqtsa4du')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const browserDistDir = path.join(__dirname, 'dist', 'nostr-tools-ng-app', 'browser');
const browserDistRoot = path.resolve(browserDistDir);
const indexFilePath = path.join(browserDistDir, 'index.html');
const PUBLIC_PACK_RELAY_URLS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nostr.oxtr.dev',
  'wss://nostr-pub.wellorder.net',
  'wss://nos.lol',
  'wss://relay.primal.net',
];
const PUBLIC_PACK_EVENT_KIND = 39089;
const PUBLIC_PACK_UPDATE_ATTEMPTS = 3;
const PUBLIC_PACK_CONFIRM_ATTEMPTS = 5;
const PUBLIC_PACK_CONFIRM_DELAY_MS = 1000;
const PUBLIC_PACK_SIGNER_READY_TIMEOUT_MS = 120_000;
const ndkModulePromise = import('@nostr-dev-kit/ndk');

const memberStorage = createFrancophonePackMemberStorage();
const packPublisher = createFrancophonePackPublisher();
let publicPackNdkPromise = null;

const server = Bun.serve({
  port: PORT,
  fetch: handleRequest,
});

console.log(`Server listening on http://127.0.0.1:${server.port}`);

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

      const members =
        packUrl === FRANCOPHONE_PACK_URL && typeof packPublisher.listMembers === 'function'
          ? await packPublisher.listMembers()
          : await listPublicPackMembers(packUrl);
      return jsonResponse(members, { headers: corsHeaders });
    } catch (error) {
      return handleApiError(error, corsHeaders);
    }
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/pack-members/me') {
    try {
      const auth = await requireNostrAuth(request, undefined, false, requestUrl);
      const member = await memberStorage.findByPubkey(auth.pubkey);
      const isStoredMember = Boolean(member && !member.removedAt);
      const isPublicPackMember = isStoredMember
        ? true
        : await packPublisher.hasMember(auth.pubkey).catch(() => false);

      return jsonResponse(
        {
          status: isStoredMember || isPublicPackMember ? 'joined' : 'idle',
          member: isStoredMember ? mapMemberRecord(member) : null,
          publicPackMember: isPublicPackMember,
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
      const packUpdate = await packPublisher.addMember(auth.pubkey);

      const member = await memberStorage.upsert({
        pubkey: auth.pubkey,
        username: memberProfile.username,
        description: memberProfile.description,
        avatarUrl: memberProfile.avatarUrl,
        joinedAt: existingMember && !existingMember.removedAt ? existingMember.joinedAt : now,
        followerCount: memberProfile.followerCount,
        followingCount: memberProfile.followingCount,
        accountCreatedAt: memberProfile.accountCreatedAt,
        postCount: memberProfile.postCount,
        zapCount: memberProfile.zapCount,
        requestedFromApp: true,
        requestedAt: existingMember && !existingMember.removedAt ? existingMember.requestedAt : now,
        removedAt: null,
      });

      return jsonResponse(
        {
          ...mapMemberRecord(member),
          packEventId: packUpdate.eventId,
          packChanged: packUpdate.changed,
        },
        { status: 201, headers: corsHeaders }
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
      await packPublisher.removeMember(removeMatch.pubkey);
      await memberStorage.removeIfExists(removeMatch.pubkey, new Date().toISOString());

      return new Response(null, { status: 204, headers: corsHeaders });
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
  };
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

function createFrancophonePackPublisher() {
  const packReference = parsePackReference(FRANCOPHONE_PACK_URL);

  if (FRANCOPHONE_PACK_PUBLISHER_MODE === 'memory') {
    return createMemoryPackPublisher(packReference);
  }

  return createNostrPackPublisher(packReference);
}

function createMemoryPackPublisher(packReference) {
  let tags = [['d', packReference.dTag]];
  let revision = 0;

  return {
    async addMember(pubkey) {
      const memberPubkey = requireHexPubkey(pubkey, 'Invalid member pubkey.');
      if (hasMemberTag(tags, memberPubkey)) {
        return { changed: false, eventId: `memory-${revision}` };
      }

      revision += 1;
      tags = addMemberTag(tags, memberPubkey, packReference.dTag);
      return { changed: true, eventId: `memory-${revision}` };
    },

    async removeMember(pubkey) {
      const memberPubkey = requireHexPubkey(pubkey, 'Invalid member pubkey.');
      const nextTags = removeMemberTag(tags, memberPubkey);

      if (nextTags.length === tags.length) {
        return { changed: false, eventId: `memory-${revision}` };
      }

      revision += 1;
      tags = nextTags;
      return { changed: true, eventId: `memory-${revision}` };
    },

    async hasMember(pubkey) {
      const memberPubkey = normalizeHexPubkey(pubkey);
      return Boolean(memberPubkey && hasMemberTag(tags, memberPubkey));
    },

    async listMembers() {
      return uniquePublicMemberPubkeys(tags).map((pubkey) => ({
        pubkey,
        username: `${pubkey.slice(0, 12)}...`,
        description: null,
        avatarUrl: null,
      }));
    },
  };
}

function createNostrPackPublisher(packReference) {
  let signerPromise = null;

  const resolveSigner = () => {
    signerPromise ??= createPackOwnerSigner(packReference).catch((error) => {
      signerPromise = null;
      throw error;
    });

    return signerPromise;
  };

  return {
    async addMember(pubkey) {
      const memberPubkey = requireHexPubkey(pubkey, 'Invalid member pubkey.');

      for (let attempt = 0; attempt < PUBLIC_PACK_UPDATE_ATTEMPTS; attempt += 1) {
        const currentPackEvent = await loadCurrentPublicPackEvent(packReference);

        if (hasMemberTag(currentPackEvent.tags, memberPubkey)) {
          return { changed: attempt > 0, eventId: currentPackEvent.id ?? null };
        }

        const tags = addMemberTag(currentPackEvent.tags, memberPubkey, packReference.dTag);
        const eventId = await publishPackEvent(
          packReference,
          tags,
          currentPackEvent.content,
          resolveSigner
        );
        const confirmed = await confirmPublicPackMemberState(packReference, memberPubkey, true);

        if (confirmed) {
          return { changed: true, eventId };
        }
      }

      throw createHttpError(502, 'Unable to confirm public pack member addition.');
    },

    async removeMember(pubkey) {
      const memberPubkey = requireHexPubkey(pubkey, 'Invalid member pubkey.');

      for (let attempt = 0; attempt < PUBLIC_PACK_UPDATE_ATTEMPTS; attempt += 1) {
        const currentPackEvent = await loadCurrentPublicPackEvent(packReference);
        const tags = removeMemberTag(currentPackEvent.tags, memberPubkey);

        if (tags.length === currentPackEvent.tags.length) {
          return { changed: attempt > 0, eventId: currentPackEvent.id ?? null };
        }

        const eventId = await publishPackEvent(
          packReference,
          tags,
          currentPackEvent.content,
          resolveSigner
        );
        const confirmed = await confirmPublicPackMemberState(packReference, memberPubkey, false);

        if (confirmed) {
          return { changed: true, eventId };
        }
      }

      throw createHttpError(502, 'Unable to confirm public pack member removal.');
    },

    async hasMember(pubkey) {
      const memberPubkey = normalizeHexPubkey(pubkey);
      if (!memberPubkey) {
        return false;
      }

      const currentPackEvent = await loadCurrentPublicPackEvent(packReference);
      return hasMemberTag(currentPackEvent.tags, memberPubkey);
    },
  };
}

async function loadCurrentPublicPackEvent(packReference) {
  const currentPackEvent = await findCurrentPackEvent(packReference);

  if (!currentPackEvent) {
    throw createHttpError(502, 'Public pack event not found.');
  }

  return currentPackEvent;
}

async function publishPackEvent(packReference, tags, content, resolveSigner) {
  const ndk = await ensurePublicPackNdk();
  const signer = await resolveSigner();
  const { NDKEvent } = await ndkModulePromise;
  const event = new NDKEvent(ndk);
  ndk.signer = signer;
  event.kind = PUBLIC_PACK_EVENT_KIND;
  event.tags = tags;
  event.content = typeof content === 'string' ? content : '';
  event.created_at = Math.floor(Date.now() / 1000);

  await event.sign(signer);
  await event.publish();

  return event.id ?? `${packReference.authorPubkey}:${event.created_at}`;
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

async function createPackOwnerSigner(packReference) {
  const signerMode = readPackSignerMode();

  if (signerMode === 'nip46') {
    return createPackOwnerBunkerSigner(packReference);
  }

  if (signerMode !== 'nsec') {
    throw createHttpError(503, 'Pack signer mode is invalid.');
  }

  return createPackOwnerPrivateKeySigner(packReference);
}

async function createPackOwnerPrivateKeySigner(packReference) {
  const privateKey = readOptionalString(FRANCOPHONE_PACK_OWNER_NSEC);
  if (!privateKey) {
    throw createHttpError(503, 'Automatic pack publishing is not configured.');
  }

  const ndk = await ensurePublicPackNdk();
  const { NDKPrivateKeySigner } = await ndkModulePromise;
  const signer = new NDKPrivateKeySigner(privateKey, ndk);
  const user = await signer.user();
  assertPackSignerPubkey(user.pubkey, packReference);

  return signer;
}

async function createPackOwnerBunkerSigner(packReference) {
  const connectionToken = readOptionalString(FRANCOPHONE_PACK_BUNKER_URL);
  if (!connectionToken) {
    throw createHttpError(503, 'Pack bunker signer is not configured.');
  }

  const ndk = await ensurePublicPackNdk();
  const { NDKNip46Signer } = await ndkModulePromise;
  let signer;

  try {
    signer = NDKNip46Signer.bunker(ndk, connectionToken);
  } catch {
    throw createHttpError(503, 'Pack bunker signer is misconfigured.');
  }

  try {
    const user = await waitForPackBunkerSignerReady(signer);
    assertPackSignerPubkey(user.pubkey, packReference);
  } catch (error) {
    signer.stop();

    if (typeof error?.status === 'number') {
      throw error;
    }

    throw createHttpError(503, 'Pack bunker signer is unavailable.');
  }

  return signer;
}

function readPackSignerMode() {
  const configuredMode = readOptionalString(FRANCOPHONE_PACK_SIGNER_MODE)?.toLowerCase();

  if (!configuredMode) {
    return readOptionalString(FRANCOPHONE_PACK_BUNKER_URL) ? 'nip46' : 'nsec';
  }

  if (configuredMode === 'nip46' || configuredMode === 'nsec') {
    return configuredMode;
  }

  return configuredMode;
}

async function waitForPackBunkerSignerReady(signer) {
  let timeoutId;

  try {
    return await Promise.race([
      signer.blockUntilReady(),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(createHttpError(503, 'Pack bunker signer connection timed out.'));
        }, PUBLIC_PACK_SIGNER_READY_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function assertPackSignerPubkey(pubkey, packReference) {
  const signerPubkey = normalizeHexPubkey(pubkey);

  if (signerPubkey !== packReference.authorPubkey) {
    throw createHttpError(500, 'Pack publisher key does not match the configured pack owner.');
  }
}

function requireHexPubkey(pubkey, message) {
  const normalizedPubkey = normalizeHexPubkey(pubkey);
  if (!normalizedPubkey) {
    throw createHttpError(400, message);
  }

  return normalizedPubkey;
}

function hasMemberTag(tags, memberPubkey) {
  return tags.some((tag) => tag[0] === 'p' && normalizeHexPubkey(tag[1] ?? '') === memberPubkey);
}

function addMemberTag(tags, memberPubkey, dTag) {
  const nextTags = tags.map((tag) => [...tag]);

  if (!nextTags.some((tag) => tag[0] === 'd' && readOptionalString(tag[1]))) {
    nextTags.unshift(['d', dTag]);
  }

  nextTags.push(['p', memberPubkey]);
  return nextTags;
}

function removeMemberTag(tags, memberPubkey) {
  return tags.filter(
    (tag) => !(tag[0] === 'p' && normalizeHexPubkey(tag[1] ?? '') === memberPubkey)
  );
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
  };
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
    new Promise((resolve) => setTimeout(() => resolve(new Set()), 10_000)),
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
