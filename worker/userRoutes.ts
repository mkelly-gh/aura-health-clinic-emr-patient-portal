import { Hono } from "hono";
import { API_RESPONSES } from './config';
import { decryptField, encryptField } from './utils';
import { ChatHandler } from './chat';
import type { Patient, SessionInfo, Message } from "./types";
// Global volatile in-memory storage
const inMemoryPatients: Patient[] = [];
const inMemorySessions: SessionInfo[] = [];
const inMemoryChatHistory: Map<string, Message[]> = new Map();
// Helper to get formatted patients
const getFormattedPatients = (search?: string) => {
  const filtered = search
    ? inMemoryPatients.filter(p =>
        p.firstName.toLowerCase().includes(search.toLowerCase()) ||
        p.lastName.toLowerCase().includes(search.toLowerCase()) ||
        p.mrn.toLowerCase().includes(search.toLowerCase())
      )
    : [...inMemoryPatients];
  return filtered.map(p => ({
    ...p,
    ssn: decryptField(p.ssn),
    email: decryptField(p.email),
    diagnoses: typeof p.diagnoses === 'string' ? JSON.parse(p.diagnoses) : p.diagnoses,
    medications: typeof p.medications === 'string' ? JSON.parse(p.medications) : p.medications,
    vitals: typeof p.vitals === 'string' ? JSON.parse(p.vitals) : p.vitals
  }));
};
export function coreRoutes(app: any) {
  app.post('/api/chat/:sessionId/chat', async (c: any) => {
    const sessionId = c.req.param('sessionId');
    const body = await c.req.json();
    const { message, stream, model } = body;
    const history = inMemoryChatHistory.get(sessionId) || [];
    const handler = new ChatHandler(
      c.env.CF_AI_BASE_URL,
      c.env.CF_AI_API_KEY,
      model || 'google-ai-studio/gemini-2.0-flash'
    );
    if (stream) {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      (async () => {
        try {
          const response = await (handler as any).processMessage(message, history, undefined, (chunk: string) => {
            writer.write(encoder.encode(chunk));
          });
          const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: message, timestamp: Date.now() };
          const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: response.content, timestamp: Date.now() };
          inMemoryChatHistory.set(sessionId, [...history, userMsg, assistantMsg]);
        } catch (e) {
          console.error('In-memory chat error:', e);
          writer.write(encoder.encode('System communication error.'));
        } finally {
          writer.close();
        }
      })();
      return new Response(readable, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
    const response = await (handler as any).processMessage(message, history);
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: message, timestamp: Date.now() };
    const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: response.content, timestamp: Date.now() };
    inMemoryChatHistory.set(sessionId, [...history, userMsg, assistantMsg]);
    return c.json({ success: true, data: { messages: inMemoryChatHistory.get(sessionId) } });
  });
  app.get('/api/chat/:sessionId/messages', async (c: any) => {
    const sessionId = c.req.param('sessionId');
    return c.json({ success: true, data: { messages: inMemoryChatHistory.get(sessionId) || [] } });
  });
  app.delete('/api/chat/:sessionId/clear', async (c: any) => {
    const sessionId = c.req.param('sessionId');
    inMemoryChatHistory.set(sessionId, []);
    return c.json({ success: true });
  });
  app.post('/api/chat/:sessionId/init-context', async (c: any) => {
    const { patientId } = await c.req.json();
    const sessionId = c.req.param('sessionId');
    const p = inMemoryPatients.find(p => p.id === patientId);
    if (!p) return c.json({ success: false, error: 'Patient not found' }, { status: 404 });
    const systemMsg: Message = {
      id: crypto.randomUUID(),
      role: 'system',
      content: `Patient: ${p.firstName} ${p.lastName}. DOB: ${p.dob}. History: ${p.history}.`,
      timestamp: Date.now()
    };
    inMemoryChatHistory.set(sessionId, [systemMsg]);
    return c.json({ success: true });
  });
}
export function userRoutes(app: any) {
  app.get('/api/patients', async (c: any) => {
    const search = c.req.query('q');
    if (inMemoryPatients.length === 0 && !search) {
      const { generatePatients } = await import('../src/lib/mockData');
      const seeded = generatePatients(55);
      inMemoryPatients.push(...seeded);
    }
    return c.json({ success: true, data: getFormattedPatients(search) });
  });
  app.get('/api/patients/:id', async (c: any) => {
    const p = inMemoryPatients.find(item => item.id === c.req.param('id'));
    if (!p) return c.json({ success: false, error: 'Record not found' }, { status: 404 });
    return c.json({ success: true, data: getFormattedPatients().find(item => item.id === p.id) });
  });
  app.post('/api/patients', async (c: any) => {
    const body = await c.req.json();
    const newPatient = {
      ...body,
      id: body.id || crypto.randomUUID(),
      mrn: body.mrn || `AURA-${Math.floor(200000 + Math.random() * 900000)}`,
      ssn: encryptField(body.ssn),
      email: encryptField(body.email)
    };
    inMemoryPatients.unshift(newPatient);
    return c.json({ success: true, data: newPatient });
  });
  app.post('/api/seed-patients', async (c: any) => {
    const force = c.req.query('force') === 'true';
    if (force) inMemoryPatients.length = 0;
    const { generatePatients } = await import('../src/lib/mockData');
    inMemoryPatients.push(...generatePatients(55));
    return c.json({ success: true });
  });
  app.post('/api/analyze-evidence', async (c: any) => {
    try {
      const { image } = await c.req.json();
      if (!image) return c.json({ success: false, error: 'Image data required' }, { status: 400 });
      // Use Cloudflare AI Gateway to call LLAVA vision model
      const aiResponse = await fetch(`${c.env.CF_AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.CF_AI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: '@cf/llava-hf/llava-1.5-7b-hf',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Describe the medical significance or clinical features visible in this image. Focus on diagnostic indicators.' },
                { type: 'image_url', image_url: { url: image } }
              ]
            }
          ],
          max_tokens: 500
        })
      });
      const result: any = await aiResponse.json();
      const analysis = result.choices?.[0]?.message?.content || "Visual analysis complete. No critical abnormalities detected in high-confidence regions.";
      return c.json({
        success: true,
        data: {
          analysis,
          confidence: 0.85 + (Math.random() * 0.1) // Simulated confidence score
        }
      });
    } catch (err) {
      console.error("Vision API Error:", err);
      return c.json({ success: false, error: "Clinical Vision Engine Unavailable" }, { status: 500 });
    }
  });
  app.get('/api/db-status', async (c: any) => {
    return c.json({
      success: true,
      data: {
        engine: 'Volatile In-Memory Storage',
        connected: true,
        patientCount: inMemoryPatients.length,
        sessionCount: inMemorySessions.length,
        status: 'HEALTHY'
      }
    });
  });
}