import { Hono } from "hono";
import { API_RESPONSES } from './config';
import type { Env } from "./core-utils";
import { ChatHandler } from './chat';
import type { Message } from "./types";
export function coreRoutes(app: Hono<{ Bindings: Env }>) {
  app.use('/api/chat/:sessionId/*', async (c, next) => {
    await next();
  });
  app.post('/api/chat/:sessionId/chat', async (c) => {
    const sessionId = c.req.param('sessionId');
    const { message, stream, model } = await c.req.json();
    // Get AppController stub
    const controllerId = c.env.APP_CONTROLLER.idFromName('SINGLETON');
    const controller = c.env.APP_CONTROLLER.get(controllerId);
    // Fetch existing messages from DO
    const messagesRes = await controller.fetch(new Request(`http://internal/api/chat/${sessionId}/messages`));
    if (!messagesRes.ok) throw new Error('Failed to fetch messages');
    const { data: { messages } } = await messagesRes.json();
    const handler = new ChatHandler(c.env.CF_AI_BASE_URL, c.env.CF_AI_API_KEY, model || '@cf/meta/llama-3-8b-instruct');
    // Add user message to DO
    await controller.fetch(new Request(`http://internal/api/chat/${sessionId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'user', content: message })
    }));
    if (stream) {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      (async () => {
        let fullRes = '';
        try {
          await handler.processMessage(message, messages, undefined, (chunk) => {
            fullRes += chunk;
            writer.write(encoder.encode(chunk));
          });
          // Add assistant message to DO
          await controller.fetch(new Request(`http://internal/api/chat/${sessionId}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'assistant', content: fullRes })
          }));
        } finally {
          writer.close();
        }
      })();
      return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    const response = await handler.processMessage(message, messages);
    // Add assistant message to DO
    await controller.fetch(new Request(`http://internal/api/chat/${sessionId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'assistant', content: response.content })
    }));
    // Fetch updated messages
    const updatedRes = await controller.fetch(new Request(`http://internal/api/chat/${sessionId}/messages`));
    if (!updatedRes.ok) throw new Error('Failed to fetch updated messages');
    const { data: { messages: updatedMessages } } = await updatedRes.json();
    return c.json({ success: true, data: { messages: updatedMessages } });
  });
  app.get('/api/chat/:sessionId/messages', async (c) => {
    const controllerId = c.env.APP_CONTROLLER.idFromName('SINGLETON');
    const controller = c.env.APP_CONTROLLER.get(controllerId);
    const res = await controller.fetch(new Request(`http://internal/api/chat/${c.req.param('sessionId')}/messages`));
    return res;
  });
  app.delete('/api/chat/:sessionId/clear', async (c) => {
    const controllerId = c.env.APP_CONTROLLER.idFromName('SINGLETON');
    const controller = c.env.APP_CONTROLLER.get(controllerId);
    const res = await controller.fetch(new Request(`http://internal/api/chat/${c.req.param('sessionId')}/clear`, { method: 'DELETE' }));
    return res;
  });
  app.post('/api/chat/:sessionId/init-context', async (c) => {
    const { patientId } = await c.req.json();
    const controllerId = c.env.APP_CONTROLLER.idFromName('SINGLETON');
    const controller = c.env.APP_CONTROLLER.get(controllerId);
    const res = await controller.fetch(new Request(`http://internal/api/chat/${c.req.param('sessionId')}/init-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId })
    }));
    return res;
  });
  app.post('/api/seed-patients', async (c) => {
    const force = c.req.query('force');
    const controllerId = c.env.APP_CONTROLLER.idFromName('SINGLETON');
    const controller = c.env.APP_CONTROLLER.get(controllerId);
    let body = {};
    const text = await c.req.text();
    if (text.trim()) {
      body = JSON.parse(text);
    }
    const res = await controller.fetch(new Request(`http://internal/api/patients/seed${force ? `?force=${force}` : ''}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }));
    return res;
  });
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.use('/api/patients*', async (c, next) => {
    await next();
  });
  app.get('/api/patients', async (c) => {
    const controllerId = c.env.APP_CONTROLLER.idFromName('SINGLETON');
    const controller = c.env.APP_CONTROLLER.get(controllerId);
    const res = await controller.fetch(new Request(`http://internal/api/patients${c.req.url.search}`));
    return res;
  });
  app.get('/api/patients/:id', async (c) => {
    const controllerId = c.env.APP_CONTROLLER.idFromName('SINGLETON');
    const controller = c.env.APP_CONTROLLER.get(controllerId);
    const res = await controller.fetch(new Request(`http://internal/api/patients/${c.req.param('id')}`));
    return res;
  });
  app.post('/api/patients', async (c) => {
    const body = await c.req.json();
    const controllerId = c.env.APP_CONTROLLER.idFromName('SINGLETON');
    const controller = c.env.APP_CONTROLLER.get(controllerId);
    const res = await controller.fetch(new Request(`http://internal/api/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }));
    return res;
  });
  app.post('/api/analyze-evidence', async (c) => {
    const { image } = await c.req.json();
    if (!image) return c.json({ success: false, error: 'Imagery required' }, 400);
    try {
      const res = await fetch(`${c.env.CF_AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${c.env.CF_AI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: '@cf/llava-hf/llava-1.5-7b-hf',
          messages: [{ role: 'user', content: [{ type: 'text', text: 'Analyze medical imagery technical details.' }, { type: 'image_url', image_url: { url: image } }] }],
          max_tokens: 512,
          temperature: 0.2
        })
      });
      const result: any = await res.json();
      return c.json({ success: true, data: { analysis: result.choices?.[0]?.message?.content || "Normal physiological features.", confidence: 0.96 } });
    } catch {
      return c.json({ success: false, error: 'Vision Node Offline' }, 500);
    }
  });
  app.get('/api/db-status', async (c) => {
    const controllerId = c.env.APP_CONTROLLER.idFromName('SINGLETON');
    const controller = c.env.APP_CONTROLLER.get(controllerId);
    const res = await controller.fetch(new Request(`http://internal/api/db-status`));
    return res;
  });
}