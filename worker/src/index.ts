import webpush from 'web-push';

interface Env {
  PUSH_KV: KVNamespace;
  VAPID_PRIVATE_KEY: string;
  VAPID_PUBLIC_KEY: string;
  CORS_ORIGIN: string;
}

function corsHeaders(env: Env): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

async function handleSubscribe(request: Request, env: Env): Promise<Response> {
  const subscription = await request.json();
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

  const subscription = JSON.parse(raw);

  webpush.setVapidDetails(
    'mailto:push@storyworthy.app',
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title: 'Storyworthy', body: 'Test notification — push is working!' })
    );
  } catch (err: unknown) {
    const error = err as { statusCode?: number };
    if (error.statusCode === 410) {
      await env.PUSH_KV.delete(key);
      return new Response(JSON.stringify({ error: 'Subscription expired' }), {
        status: 410,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(env) },
      });
    }
    throw err;
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders(env) },
  });
}

async function handleScheduled(env: Env): Promise<void> {
  webpush.setVapidDetails(
    'mailto:push@storyworthy.app',
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );

  const list = await env.PUSH_KV.list({ prefix: 'sub:' });

  for (const key of list.keys) {
    const raw = await env.PUSH_KV.get(key.name);
    if (!raw) continue;

    const subscription = JSON.parse(raw);

    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({ title: 'Storyworthy', body: 'How was your day? Take a moment to reflect.' })
      );
    } catch (err: unknown) {
      const error = err as { statusCode?: number };
      if (error.statusCode === 410) {
        await env.PUSH_KV.delete(key.name);
      }
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
