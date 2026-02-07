/**
 * Cloudflare Worker for Web Push notifications.
 * Uses Web Crypto API directly (no Node.js crypto dependency).
 *
 * Implements:
 * - VAPID (RFC 8292) JWT signing with ES256
 * - Web Push payload encryption (RFC 8291 / aes128gcm)
 */

interface Env {
  PUSH_KV: KVNamespace;
  VAPID_PRIVATE_KEY: string;
  VAPID_PUBLIC_KEY: string;
  CORS_ORIGIN: string;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// --- Base64 utilities ---

function base64UrlEncode(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// --- VAPID JWT ---

async function importVapidPrivateKey(base64PrivateKey: string, base64PublicKey: string): Promise<CryptoKey> {
  const privateKeyBytes = base64UrlDecode(base64PrivateKey);
  const publicKeyBytes = base64UrlDecode(base64PublicKey);

  // Public key is 65 bytes: 0x04 || x(32) || y(32)
  const x = publicKeyBytes.slice(1, 33);
  const y = publicKeyBytes.slice(33, 65);

  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: base64UrlEncode(privateKeyBytes),
    x: base64UrlEncode(x),
    y: base64UrlEncode(y),
  };

  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
}

async function createVapidJwt(
  audience: string,
  privateKey: CryptoKey,
  publicKeyBase64: string
): Promise<{ authorization: string }> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: 'mailto:push@storyworthy.app',
  };

  const encoder = new TextEncoder();
  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Web Crypto ECDSA returns IEEE P1363 format (raw r||s, 64 bytes) — no DER conversion needed
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    encoder.encode(unsignedToken)
  );

  const jwt = `${unsignedToken}.${base64UrlEncode(signature)}`;

  return { authorization: `vapid t=${jwt}, k=${publicKeyBase64}` };
}

// --- Web Push Encryption (RFC 8291 / aes128gcm) ---

function concat(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

async function encryptPayload(
  subscription: PushSubscription,
  payload: string
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(payload);

  // Decode subscriber keys
  const p256dhKey = base64UrlDecode(subscription.keys.p256dh);
  const authSecret = base64UrlDecode(subscription.keys.auth);

  // Generate local ECDH keypair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // Export local public key (uncompressed point)
  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', localKeyPair.publicKey)
  );

  // Import subscriber public key
  const subscriberKey = await crypto.subtle.importKey(
    'raw',
    p256dhKey,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: subscriberKey },
      localKeyPair.privateKey,
      256
    )
  );

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF to derive key material
  // IKM = HKDF(auth_secret, ecdh_secret, "WebPush: info\0" || client_public || server_public, 32)
  const authInfo = concat(
    encoder.encode('WebPush: info\0'),
    p256dhKey,
    localPublicKeyRaw
  );

  // Derive IKM from auth_secret + shared_secret
  const ikm = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: authSecret, info: authInfo },
      await crypto.subtle.importKey('raw', sharedSecret, { name: 'HKDF' }, false, ['deriveBits']),
      256
    )
  );

  // Derive CEK (Content Encryption Key) - 16 bytes
  const cekInfo = encoder.encode('Content-Encoding: aes128gcm\0');
  const ikmKey = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits']);
  const cekBits = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info: cekInfo },
      ikmKey,
      128
    )
  );

  // Derive nonce - 12 bytes
  const nonceInfo = encoder.encode('Content-Encoding: nonce\0');
  const ikmKey2 = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits']);
  const nonce = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info: nonceInfo },
      ikmKey2,
      96
    )
  );

  // Pad plaintext: content + 0x02 delimiter (RFC 8188)
  const padded = concat(plaintext, new Uint8Array([2]));

  // AES-128-GCM encrypt
  const cek = await crypto.subtle.importKey('raw', cekBits, { name: 'AES-GCM' }, false, ['encrypt']);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cek, padded)
  );

  // Build aes128gcm header:
  // salt (16) + rs (4, big-endian uint32) + idlen (1) + keyid (65 = uncompressed point)
  const rs = 4096;
  const header = new Uint8Array(16 + 4 + 1 + localPublicKeyRaw.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, rs, false);
  header[20] = localPublicKeyRaw.length;
  header.set(localPublicKeyRaw, 21);

  const encrypted = concat(header, ciphertext);

  return { encrypted, salt, localPublicKey: localPublicKeyRaw };
}

// --- Send push notification ---

async function sendPushNotification(
  subscription: PushSubscription,
  payload: string,
  env: Env
): Promise<{ status: number }> {
  const vapidKey = await importVapidPrivateKey(env.VAPID_PRIVATE_KEY, env.VAPID_PUBLIC_KEY);
  const audience = new URL(subscription.endpoint).origin;
  const vapid = await createVapidJwt(audience, vapidKey, env.VAPID_PUBLIC_KEY);

  const { encrypted } = await encryptPayload(subscription, payload);

  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      Authorization: vapid.authorization,
      TTL: '86400',
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'Content-Length': encrypted.byteLength.toString(),
    },
    body: encrypted,
  });

  return { status: response.status };
}

// --- Worker handlers ---

function corsHeaders(env: Env): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

async function handleSubscribe(request: Request, env: Env): Promise<Response> {
  const subscription = await request.json() as PushSubscription;
  const key = `sub:${subscription.endpoint}`;
  await env.PUSH_KV.put(key, JSON.stringify(subscription));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders(env) },
  });
}

async function handleTest(request: Request, env: Env): Promise<Response> {
  const { endpoint } = (await request.json()) as { endpoint: string };
  const key = `sub:${endpoint}`;
  const raw = await env.PUSH_KV.get(key);

  if (!raw) {
    return new Response(JSON.stringify({ error: 'Subscription not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(env) },
    });
  }

  const subscription = JSON.parse(raw) as PushSubscription;

  try {
    const result = await sendPushNotification(
      subscription,
      JSON.stringify({ title: 'Storyworthy', body: 'Test notification — push is working!' }),
      env
    );

    if (result.status === 410) {
      await env.PUSH_KV.delete(key);
      return new Response(JSON.stringify({ error: 'Subscription expired' }), {
        status: 410,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(env) },
      });
    }

    if (result.status >= 400) {
      return new Response(JSON.stringify({ error: `Push service returned ${result.status}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(env) },
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(env) },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders(env) },
  });
}

async function handleScheduled(env: Env): Promise<void> {
  const list = await env.PUSH_KV.list({ prefix: 'sub:' });

  for (const key of list.keys) {
    const raw = await env.PUSH_KV.get(key.name);
    if (!raw) continue;

    const subscription = JSON.parse(raw) as PushSubscription;

    try {
      const result = await sendPushNotification(
        subscription,
        JSON.stringify({ title: 'Storyworthy', body: 'How was your day? Take a moment to reflect.' }),
        env
      );

      if (result.status === 410) {
        await env.PUSH_KV.delete(key.name);
      }
    } catch {
      // Continue to next subscription
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/subscribe') {
      return handleSubscribe(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/test') {
      return handleTest(request, env);
    }

    return new Response('Not found', { status: 404 });
  },

  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    await handleScheduled(env);
  },
};
