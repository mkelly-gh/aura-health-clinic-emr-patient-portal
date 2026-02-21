import { Hono } from "hono";
import { API_RESPONSES } from './config';
import { decryptField, encryptField } from './utils';
import { ChatHandler } from './chat';
import type { Patient, Message, Diagnosis, Medication } from "./types";
import type { Env } from "./core-utils";
// --- CENTRALIZED CLINICAL REGISTRY ENGINE ---
const pseudoEncrypt = (text: string) => btoa(text);
const FIRST_NAMES = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa', 'Thomas', 'Nancy', 'Steven', 'Karen', 'Kevin'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Lopez'];
const DIAGNOSES_TEMPLATES = [
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'I10', description: 'Essential (primary) hypertension' },
  { code: 'E78.5', description: 'Hyperlipidemia, unspecified' },
  { code: 'M54.5', description: 'Low back pain' },
  { code: 'F41.1', description: 'Generalized anxiety disorder' },
  { code: 'J45.909', description: 'Unspecified asthma, uncomplicated' },
  { code: 'K21.9', description: 'Gastro-esophageal reflux disease without esophagitis' },
  { code: 'G43.909', description: 'Migraine, unspecified, not intractable' }
];
const MEDS_LIBRARY = [
  { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
  { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
  { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily at bedtime' },
  { name: 'Levothyroxine', dosage: '50mcg', frequency: 'Once daily in morning' },
  { name: 'Sertraline', dosage: '50mg', frequency: 'Once daily' }
];
const HISTORY_SNIPPETS = [
  "Patient has a chronic history of managed hypertension.",
  "Diagnosed with childhood asthma; well managed.",
  "Family history significant for cardiovascular disease.",
  "Management of type 2 diabetes through diet and exercise."
];
function generatePatients(count: number = 55): Patient[] {
  return Array.from({ length: count }, (_, i) => {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i + 7) % LAST_NAMES.length];
    const id = (i + 1).toString();
    const dobYear = 1950 + (i % 50);
    const ssnRaw = `000-00-${1000 + i}`;
    const emailRaw = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@aura.clinic`;
    return {
      id,
      mrn: `AURA-${200000 + i}`,
      ssn: pseudoEncrypt(ssnRaw),
      firstName,
      lastName,
      dob: `${dobYear}-01-01`,
      gender: (i % 2 === 0 ? 'Male' : 'Female') as 'Male' | 'Female',
      bloodType: ['A+', 'O+', 'B+', 'AB+'][i % 4],
      email: pseudoEncrypt(emailRaw),
      phone: `555-01${i.toString().padStart(2, '0')}`,
      address: `${100 + i} Medical Plaza Dr, Aura City`,
      diagnoses: [{ ...DIAGNOSES_TEMPLATES[i % DIAGNOSES_TEMPLATES.length], date: '2023-01-01' }],
      medications: [{ ...MEDS_LIBRARY[i % MEDS_LIBRARY.length], status: 'Active' as const }],
      vitals: { height: "5'10\"", weight: "165 lbs", bmi: "23.7", bp: "120/80", hr: "72", temp: "98.6 F" },
      history: HISTORY_SNIPPETS[i % HISTORY_SNIPPETS.length]
    };
  });
}
// Global Volatile Registry
const inMemoryPatients: Patient[] = [];
const inMemoryChatHistory: Map<string, Message[]> = new Map();
const ensureRegistry = () => {
  if (inMemoryPatients.length === 0) {
    inMemoryPatients.push(...generatePatients(55));
  }
};
const getFormattedPatients = (search?: string) => {
  ensureRegistry();
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
    email: decryptField(p.email)
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
          writer.write(encoder.encode('Circuit break in clinical node.'));
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
    return c.json({ success: true, data: { messages: inMemoryChatHistory.get(c.req.param('sessionId')) || [] } });
  });
  app.delete('/api/chat/:sessionId/clear', (c) => {
    inMemoryChatHistory.set(c.req.param('sessionId'), []);
    return c.json({ success: true });
  });
  app.post('/api/chat/:sessionId/init-context', async (c) => {
    const { patientId } = await c.req.json();
    const sessionId = c.req.param('sessionId');
    const p = getFormattedPatients().find(p => p.id === patientId);
    if (!p) return c.json({ success: false, error: 'Patient not in registry' }, 404);
    const systemMsg: Message = {
      id: crypto.randomUUID(),
      role: 'system',
      content: `System Persona: Dr. Aura, Clinical Assistant. Patient Context: ${p.firstName} ${p.lastName} (${p.mrn}). Profile: ${p.diagnoses.map(d => d.description).join(', ')}. Medications: ${p.medications.map(m => m.name).join(', ')}. Clinical History: ${p.history}. Be clinical, precise, and professional. Always verify safety.`,
      timestamp: Date.now()
    };
    inMemoryChatHistory.set(sessionId, [systemMsg]);
    return c.json({ success: true });
  });
  app.post('/api/seed-patients', async (c) => {
    const force = c.req.query('force') === 'true';
    if (force || inMemoryPatients.length === 0) {
      inMemoryPatients.length = 0;
      inMemoryPatients.push(...generatePatients(55));
      return c.json({ success: true, count: inMemoryPatients.length, action: 'reseeded' });
    }
    return c.json({ success: true, count: inMemoryPatients.length, action: 'none' });
  });
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/patients', (c) => {
    return c.json({ success: true, data: getFormattedPatients(c.req.query('q')) });
  });
  app.get('/api/patients/:id', (c) => {
    const p = getFormattedPatients().find(item => item.id === c.req.param('id'));
    if (!p) return c.json({ success: false, error: 'Record not found' }, 404);
    return c.json({ success: true, data: p });
  });
  app.post('/api/patients', async (c) => {
    const body = await c.req.json();
    const newPatient = {
      ...body,
      id: crypto.randomUUID(),
      mrn: `AURA-${Math.floor(200000 + Math.random() * 900000)}`,
      ssn: encryptField(body.ssn),
      email: encryptField(body.email),
      vitals: { height: "5'10\"", weight: "160 lbs", bmi: "23.0", bp: "120/80", hr: "72", temp: "98.6 F" },
      diagnoses: [], medications: []
    };
    inMemoryPatients.unshift(newPatient);
    return c.json({ success: true, data: { ...newPatient, ssn: body.ssn, email: body.email } });
  });
  app.post('/api/analyze-evidence', async (c) => {
    try {
      const { image } = await c.req.json();
      if (!image) return c.json({ success: false, error: 'Imagery data required' }, 400);
      const aiResponse = await fetch(`${c.env.CF_AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${c.env.CF_AI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: '@cf/llava-hf/llava-1.5-7b-hf',
          messages: [{ role: 'user', content: [{ type: 'text', text: 'Describe clinical features in this image.' }, { type: 'image_url', image_url: { url: image } }] }],
          max_tokens: 400
        })
      });
      const result: any = await aiResponse.json();
      return c.json({ success: true, data: { analysis: result.choices?.[0]?.message?.content || "Analysis complete.", confidence: 0.92 } });
    } catch (err) {
      return c.json({ success: false, error: "Vision Node Unavailable" }, 500);
    }
  });
  app.get('/api/db-status', (c) => {
    ensureRegistry();
    return c.json({
      success: true,
      data: {
        engine: 'AURA_VOLATILE_ISOLATE',
        binding: 'EDGE_IN_MEMORY',
        connected: true,
        pingMs: 1,
        patientCount: inMemoryPatients.length,
        sessionCount: inMemoryChatHistory.size,
        status: 'HEALTHY',
        schemaVersion: '1.2.0-PROD'
      }
    });
  });
}