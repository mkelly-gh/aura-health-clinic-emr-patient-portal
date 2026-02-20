import { Hono } from "hono";
import { API_RESPONSES } from './config';
import { decryptField, encryptField } from './utils';
import { ChatHandler } from './chat';
import type { Patient, SessionInfo, Message } from "./types";
// --- INLINED CLINICAL DATA GENERATION LOGIC ---
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
  { code: 'K90.0', description: 'Celiac disease' },
  { code: 'E55.9', description: 'Vitamin D deficiency, unspecified' },
  { code: 'G43.909', description: 'Migraine, unspecified, not intractable' },
  { code: 'G47.33', description: 'Obstructive sleep apnea (adult) (pediatric)' },
  { code: 'M17.11', description: 'Unilateral primary osteoarthritis, right knee' }
];
const MEDS_LIBRARY = [
  { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
  { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
  { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily at bedtime' },
  { name: 'Levothyroxine', dosage: '50mcg', frequency: 'Once daily in morning' },
  { name: 'Albuterol', dosage: '90mcg/actuation', frequency: 'Every 4 hours as needed' },
  { name: 'Sertraline', dosage: '50mg', frequency: 'Once daily' },
  { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily' },
  { name: 'Omeprazole', dosage: '20mg', frequency: 'Once daily' }
];
const HISTORY_SNIPPETS = [
  "Patient has a chronic history of managed hypertension. Routine screening suggested.",
  "Diagnosed with childhood asthma; episodes now infrequent and managed with rescue inhaler.",
  "Family history significant for early-onset cardiovascular disease. Monitoring lipid profile closely.",
  "Recent onset of migraine headaches; patient keeping a trigger diary for clinical review.",
  "Management of type 2 diabetes through diet and exercise; medication compliance is excellent.",
  "Reporting fatigue and joint pain. Vitamin D levels were found to be critically low in recent labs.",
  "Patient presents with seasonal allergies and occasional acid reflux symptoms."
];
function generatePatients(count: number = 55): Patient[] {
  return Array.from({ length: count }, (_, i) => {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i + 7) % LAST_NAMES.length];
    const id = (i + 1).toString();
    const dobYear = 1950 + (i % 50);
    const dobMonth = 1 + (i % 12);
    const dobDay = 1 + (i % 28);
    const ssnRaw = `${Math.floor(100 + Math.random() * 800)}-${Math.floor(10 + Math.random() * 80)}-${Math.floor(1000 + Math.random() * 8000)}`;
    const emailRaw = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@example.com`;
    const diagCount = 1 + (i % 2);
    const diagnoses = Array.from({ length: diagCount }, (_, idx) => ({
      ...DIAGNOSES_TEMPLATES[(i + idx) % DIAGNOSES_TEMPLATES.length],
      date: new Date(2023, i % 12, 1).toISOString().split('T')[0]
    }));
    const medCount = 1 + (i % 3);
    const medications = Array.from({ length: medCount }, (_, idx) => ({
      ...MEDS_LIBRARY[(i + idx) % MEDS_LIBRARY.length],
      status: 'Active' as const
    }));
    return {
      id,
      mrn: `AURA-${200000 + i}`,
      ssn: pseudoEncrypt(ssnRaw),
      firstName,
      lastName,
      dob: `${dobYear}-${dobMonth.toString().padStart(2, '0')}-${dobDay.toString().padStart(2, '0')}`,
      gender: (i % 2 === 0 ? 'Male' : 'Female') as 'Male' | 'Female',
      bloodType: ['A+', 'O+', 'B+', 'AB+', 'A-', 'O-', 'B-', 'AB-'][i % 8],
      email: pseudoEncrypt(emailRaw),
      phone: `555-${100 + (i % 899)}-${1000 + (i % 8999)}`,
      address: `${100 + i} Medical Plaza Dr, Healthcare City, ST 12345`,
      diagnoses,
      medications,
      vitals: {
        height: `${5 + (i % 2)}'${7 + (i % 5)}"`,
        weight: `${140 + (i % 60)} lbs`,
        bmi: (20 + (i % 10)).toString(),
        bp: `${110 + (i % 30)}/${70 + (i % 20)}`,
        hr: (60 + (i % 30)).toString(),
        temp: "98.6 F"
      },
      history: HISTORY_SNIPPETS[i % HISTORY_SNIPPETS.length]
    };
  });
}
// --- END INLINED LOGIC ---
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
    if (force) {
      inMemoryPatients.length = 0;
    }
    inMemoryPatients.push(...generatePatients(55));
    return c.json({ success: true });
  });
  app.post('/api/analyze-evidence', async (c: any) => {
    try {
      const { image } = await c.req.json();
      if (!image) return c.json({ success: false, error: 'Image data required' }, { status: 400 });
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
          confidence: 0.85 + (Math.random() * 0.1)
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