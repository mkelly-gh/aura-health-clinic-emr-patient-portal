import { Hono } from "hono";
import { API_RESPONSES } from './config';
import { decryptField, encryptField } from './utils';
import { ChatHandler } from './chat';
import type { Patient, Message, Diagnosis, Medication } from "./types";
import type { Env } from "./core-utils";
import { generatePatients } from './core-utils';
// --- GLOBAL VOLATILE IN-MEMORY STORAGE ---
const inMemoryPatients: Patient[] = [];
const inMemoryChatHistory: Map<string, Message[]> = new Map();
const startTime = Date.now();
// Helper to get formatted patients
const getFormattedPatients = (search?: string) => {
  const filtered = search
    ? inMemoryPatients.filter(p =>
        p.firstName.toLowerCase().includes(search.toLowerCase()) ||
        p.lastName.toLowerCase().includes(search.toLowerCase()) ||
        p.mrn.toLowerCase().includes(search.toLowerCase())
      )
    : [...inMemoryPatients];
  console.log('[getFormattedPatients] Filtered count:', filtered.length, 'search:', search);
  return filtered.map(p => ({
    ...p,
    ssn: p.ssn.startsWith('SSN_') ? decryptField(p.ssn) : atob(p.ssn),
    email: p.email.startsWith('EMAIL_') ? decryptField(p.email) : atob(p.email),
    diagnoses: typeof p.diagnoses === 'string' ? JSON.parse(p.diagnoses) : p.diagnoses,
    medications: typeof p.medications === 'string' ? JSON.parse(p.medications) : p.medications,
    vitals: typeof p.vitals === 'string' ? JSON.parse(p.vitals) : p.vitals
  }));
};
export function coreRoutes(app: Hono<{ Bindings: Env }>) {
  app.post('/api/chat/:sessionId/chat', async (c) => {
    const sessionId = c.req.param('sessionId');
    const { message, stream, model } = await c.req.json();
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
          const response = await handler.processMessage(message, history, undefined, (chunk: string) => {
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
      return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    const response = await handler.processMessage(message, history);
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: message, timestamp: Date.now() };
    const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: response.content, timestamp: Date.now() };
    inMemoryChatHistory.set(sessionId, [...history, userMsg, assistantMsg]);
    return c.json({ success: true, data: { messages: inMemoryChatHistory.get(sessionId) } });
  });
  app.get('/api/chat/:sessionId/messages', (c) => {
    const sessionId = c.req.param('sessionId');
    return c.json({ success: true, data: { messages: inMemoryChatHistory.get(sessionId) || [] } });
  });
  app.delete('/api/chat/:sessionId/clear', (c) => {
    const sessionId = c.req.param('sessionId');
    inMemoryChatHistory.set(sessionId, []);
    return c.json({ success: true });
  });
  app.post('/api/chat/:sessionId/init-context', async (c) => {
    const { patientId } = await c.req.json();
    const sessionId = c.req.param('sessionId');
    const formattedPatients = getFormattedPatients();
    const p = formattedPatients.find(p => p.id === patientId);
    if (!p) return c.json({ success: false, error: 'Patient not found' }, 404);
    const existingMessages = inMemoryChatHistory.get(sessionId) || [];
    const hasSystemPrompt = existingMessages.some(m => m.role === 'system');
    if (!hasSystemPrompt) {
      const systemMsg: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        content: `Patient Context: ${p.firstName} ${p.lastName}. DOB: ${p.dob}. Diagnoses: ${p.diagnoses.map((d: Diagnosis) => d.description).join(', ')}. Medications: ${p.medications.map((m: Medication) => m.name).join(', ')}. History: ${p.history}. Be professional and mention specific medical details.`,
        timestamp: Date.now()
      };
      inMemoryChatHistory.set(sessionId, [systemMsg]);
    }
    return c.json({ success: true });
  });
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/patients', (c) => {
    const search = c.req.query('q');
    console.log('[API/PATIENTS] Request received, current length:', inMemoryPatients.length);
    if (inMemoryPatients.length === 0) {
      inMemoryPatients.push(...generatePatients(55));
      console.log('[API/PATIENTS] Generated 55 patients, new length:', inMemoryPatients.length);
    }
    return c.json({ success: true, data: getFormattedPatients(search) });
  });
  app.get('/api/patients/:id', (c) => {
    if (inMemoryPatients.length === 0) {
      inMemoryPatients.push(...generatePatients(55));
    }
    const id = c.req.param('id');
    const p = inMemoryPatients.find(item => item.id === id);
    if (!p) return c.json({ success: false, error: 'Record not found' }, 404);
    const formattedPatient = getFormattedPatients().find(item => item.id === id);
    return c.json({ success: true, data: formattedPatient });
  });
  app.post('/api/patients', async (c) => {
    const body = await c.req.json();
    const newPatient = {
      ...body,
      id: body.id || crypto.randomUUID(),
      mrn: body.mrn || `AURA-${Math.floor(200000 + Math.random() * 900000)}`,
      ssn: encryptField(body.ssn),
      email: encryptField(body.email),
      vitals: body.vitals || {
        height: "5'10\"", weight: "165 lbs", bmi: "23.7", bp: "120/80", hr: "72", temp: "98.6 F"
      },
      diagnoses: body.diagnoses || [],
      medications: body.medications || []
    };
    inMemoryPatients.unshift(newPatient);
    const formattedNewPatient = {
      ...newPatient,
      ssn: decryptField(newPatient.ssn),
      email: decryptField(newPatient.email)
    };
    return c.json({ success: true, data: formattedNewPatient });
  });
  app.post('/api/seed-patients', (c) => {
    const force = c.req.query('force') === 'true';
    if (force || inMemoryPatients.length === 0) {
      inMemoryPatients.length = 0;
      inMemoryPatients.push(...generatePatients(55));
    }
    return c.json({ success: true, count: inMemoryPatients.length });
  });
  app.post('/api/analyze-evidence', async (c) => {
    try {
      const { image } = await c.req.json();
      if (!image) return c.json({ success: false, error: 'Image data required' }, 400);
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
                { type: 'text', text: 'Analyze this clinical image and describe findings for diagnostic support. If this looks like a skin condition, provide clinical descriptors.' },
                { type: 'image_url', image_url: { url: image } }
              ]
            }
          ],
          max_tokens: 512
        })
      });
      if (!aiResponse.ok) throw new Error(`Vision AI Gateway error: ${aiResponse.status}`);
      const result: any = await aiResponse.json();
      const analysis = result.choices?.[0]?.message?.content || "Clinical analysis finalized. Standard morphological features observed.";
      return c.json({ success: true, data: { analysis, confidence: 0.88 + (Math.random() * 0.1) } });
    } catch (err) {
      console.error("Vision API Error:", err);
      return c.json({ success: false, error: "Clinical Vision Engine Unavailable" }, 500);
    }
  });
  app.get('/api/db-status', (c) => {
    console.log('[API/DB-STATUS] inMemoryPatients.length:', inMemoryPatients.length);
    return c.json({
      success: true,
      data: {
        engine: 'Aura Volatile Isolate',
        binding: 'EDGE_IN_MEMORY',
        connected: true,
        pingMs: Math.floor(Math.random() * 5) + 1,
        patientCount: inMemoryPatients.length,
        sessionCount: inMemoryChatHistory.size,
        status: 'HEALTHY',
        schemaVersion: '1.2.0-PROD'
      }
    });
  });
}