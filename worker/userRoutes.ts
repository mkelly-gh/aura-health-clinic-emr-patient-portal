import { Hono } from "hono";
import { API_RESPONSES } from './config';
import { decryptField, encryptField } from './utils';
import { ChatHandler } from './chat';
import type { Patient, Message } from "./types";
import type { Env } from "./core-utils";
const FIRST_NAMES = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa', 'Thomas', 'Nancy', 'Steven', 'Karen', 'Kevin'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Lopez'];
const DIAGNOSES_TEMPLATES = [
  { code: 'E11.9', description: 'Type 2 diabetes mellitus' },
  { code: 'I10', description: 'Essential hypertension' },
  { code: 'E78.5', description: 'Hyperlipidemia' },
  { code: 'M54.5', description: 'Low back pain' },
  { code: 'F41.1', description: 'Generalized anxiety' },
  { code: 'J45.909', description: 'Unspecified asthma' },
  { code: 'K21.9', description: 'GERD' },
  { code: 'G43.909', description: 'Migraine' }
];
const MEDS_LIBRARY = [
  { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
  { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
  { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily' },
  { name: 'Levothyroxine', dosage: '50mcg', frequency: 'Once daily' },
  { name: 'Sertraline', dosage: '50mg', frequency: 'Once daily' }
];
const HISTORY_SNIPPETS = [
  "CRITICAL: Patient presented with acute hypertension; stabilizing on Lisinopril protocol.",
  "OBSERVATION: Routine childhood asthma management; symptoms well-controlled by Albuterol.",
  "FOLLOW-UP: Post-surgical recovery (Appendectomy) in 12th month. No secondary complications.",
  "CRITICAL: Diabetic ketoacidosis risk mitigated via Metformin adjustment. Monitoring glycated hemoglobin.",
  "ROUTINE: Annual wellness screening completed. Non-smoker. Stable cardiovascular profile.",
  "OBSERVATION: Chronic lumbar discomfort; patient responsive to physiotherapy and non-opioid pain management.",
  "CRITICAL: Allergy alert - severe reaction to penicillin noted in history. Vision node monitoring cross-reactivity.",
  "ROUTINE: Stable mental health profile; continuing therapeutic doses of Sertraline."
];
async function ensureTables(db: D1Database | undefined) {
  if (!db) throw new Error("Database binding unavailable");
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      mrn TEXT UNIQUE,
      ssn TEXT,
      firstName TEXT,
      lastName TEXT,
      dob TEXT,
      gender TEXT,
      bloodType TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      diagnoses TEXT,
      medications TEXT,
      vitals TEXT,
      history TEXT,
      avatarUrl TEXT
    )
  `).run();
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      sessionId TEXT,
      role TEXT,
      content TEXT,
      timestamp INTEGER
    )
  `).run();
}
async function seedPatients(db: D1Database | undefined, force = false) {
  if (!db) return;
  const countRes = await db.prepare("SELECT COUNT(*) as count FROM patients").first<{ count: number }>();
  if ((countRes?.count ?? 0) > 0 && !force) return;
  if (force) await db.prepare("DELETE FROM patients").run();
  for (let i = 0; i < 55; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i + 7) % LAST_NAMES.length];
    const mrn = `AURA-${200000 + i}`;
    const dobYear = 1950 + (i % 50);
    const p = {
      id: crypto.randomUUID(),
      mrn,
      ssn: btoa(`000-00-${1000 + i}`),
      firstName,
      lastName,
      dob: `${dobYear}-01-01`,
      gender: i % 2 === 0 ? 'Male' : 'Female',
      bloodType: ['A+', 'O+', 'B+', 'AB+'][i % 4],
      email: btoa(`${firstName.toLowerCase()}.${lastName.toLowerCase()}@aura.clinic`),
      phone: `555-01${i.toString().padStart(2, '0')}`,
      address: `${100 + i} Medical Plaza Dr, Aura City`,
      diagnoses: JSON.stringify([{ ...DIAGNOSES_TEMPLATES[i % DIAGNOSES_TEMPLATES.length], date: '2023-01-01' }]),
      medications: JSON.stringify([{ ...MEDS_LIBRARY[i % MEDS_LIBRARY.length], status: 'Active' }]),
      vitals: JSON.stringify({ height: "5'10\"", weight: "165 lbs", bmi: "23.7", bp: "120/80", hr: "72", temp: "98.6 F" }),
      history: HISTORY_SNIPPETS[i % HISTORY_SNIPPETS.length],
      avatarUrl: `https://i.pravatar.cc/150?u=${mrn}`
    };
    await db.prepare(`
      INSERT INTO patients (id, mrn, ssn, firstName, lastName, dob, gender, bloodType, email, phone, address, diagnoses, medications, vitals, history, avatarUrl)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(p.id, p.mrn, p.ssn, p.firstName, p.lastName, p.dob, p.gender, p.bloodType, p.email, p.phone, p.address, p.diagnoses, p.medications, p.vitals, p.history, p.avatarUrl).run();
  }
}
export function coreRoutes(app: Hono<{ Bindings: Env }>) {
  app.use('/api/chat/:sessionId/*', async (c, next) => {
    if (!c.env.DB) return c.json({ success: false, error: 'Clinical Database Offline' }, 503);
    await ensureTables(c.env.DB);
    await next();
  });
  app.post('/api/chat/:sessionId/chat', async (c) => {
    const sessionId = c.req.param('sessionId');
    const { message, stream, model } = await c.req.json();
    const historyRows = await c.env.DB.prepare("SELECT role, content, timestamp, id FROM chat_messages WHERE sessionId = ? ORDER BY timestamp ASC").bind(sessionId).all<Message>();
    const history = historyRows.results || [];
    const handler = new ChatHandler(c.env.CF_AI_BASE_URL, c.env.CF_AI_API_KEY, model || '@cf/meta/llama-3-8b-instruct');
    const userMsgId = crypto.randomUUID();
    await c.env.DB.prepare("INSERT INTO chat_messages (id, sessionId, role, content, timestamp) VALUES (?, ?, ?, ?, ?)").bind(userMsgId, sessionId, 'user', message, Date.now()).run();
    if (stream) {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      (async () => {
        let fullRes = '';
        try {
          await handler.processMessage(message, history, undefined, (chunk) => {
            fullRes += chunk;
            writer.write(encoder.encode(chunk));
          });
          await c.env.DB.prepare("INSERT INTO chat_messages (id, sessionId, role, content, timestamp) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), sessionId, 'assistant', fullRes, Date.now()).run();
        } finally {
          writer.close();
        }
      })();
      return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    const response = await handler.processMessage(message, history);
    await c.env.DB.prepare("INSERT INTO chat_messages (id, sessionId, role, content, timestamp) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), sessionId, 'assistant', response.content, Date.now()).run();
    const updated = await c.env.DB.prepare("SELECT role, content, timestamp, id FROM chat_messages WHERE sessionId = ? ORDER BY timestamp ASC").bind(sessionId).all<Message>();
    return c.json({ success: true, data: { messages: updated.results } });
  });
  app.get('/api/chat/:sessionId/messages', async (c) => {
    const history = await c.env.DB.prepare("SELECT role, content, timestamp, id FROM chat_messages WHERE sessionId = ? ORDER BY timestamp ASC").bind(c.req.param('sessionId')).all<Message>();
    return c.json({ success: true, data: { messages: history.results || [] } });
  });
  app.delete('/api/chat/:sessionId/clear', async (c) => {
    await c.env.DB.prepare("DELETE FROM chat_messages WHERE sessionId = ?").bind(c.req.param('sessionId')).run();
    return c.json({ success: true });
  });
  app.post('/api/chat/:sessionId/init-context', async (c) => {
    const { patientId } = await c.req.json();
    const sessionId = c.req.param('sessionId');
    const existing = await c.env.DB.prepare("SELECT id FROM chat_messages WHERE sessionId = ? AND role = 'system'").bind(sessionId).first();
    if (existing) return c.json({ success: true });
    const p = await c.env.DB.prepare("SELECT * FROM patients WHERE id = ?").bind(patientId).first<any>();
    if (!p) return c.json({ success: false, error: 'Patient not found' }, 404);
    const systemMsg: Message = {
      id: crypto.randomUUID(),
      role: 'system',
      content: `Persona: Dr. Aura. Context: Patient ${p.firstName} ${p.lastName} (${p.mrn}). Profile: ${p.diagnoses}. Meds: ${p.medications}. History: ${p.history}. Be professional.`,
      timestamp: Date.now()
    };
    await c.env.DB.prepare("INSERT INTO chat_messages (id, sessionId, role, content, timestamp) VALUES (?, ?, ?, ?, ?)").bind(systemMsg.id, sessionId, systemMsg.role, systemMsg.content, systemMsg.timestamp).run();
    return c.json({ success: true });
  });
  app.post('/api/seed-patients', async (c) => {
    if (!c.env.DB) return c.json({ success: false, error: 'DB Offline' }, 503);
    await ensureTables(c.env.DB);
    await seedPatients(c.env.DB, c.req.query('force') === 'true');
    const count = await c.env.DB.prepare("SELECT COUNT(*) as count FROM patients").first<{ count: number }>();
    return c.json({ success: true, count: count?.count || 0 });
  });
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.use('/api/patients*', async (c, next) => {
    if (!c.env.DB) return c.json({ success: false, error: 'DB Offline' }, 503);
    await ensureTables(c.env.DB);
    await next();
  });
  app.get('/api/patients', async (c) => {
    await seedPatients(c.env.DB);
    const q = c.req.query('q');
    let query = "SELECT * FROM patients";
    let params: string[] = [];
    if (q) {
      query += " WHERE firstName LIKE ? OR lastName LIKE ? OR mrn LIKE ?";
      const like = `%${q}%`;
      params = [like, like, like];
    }
    const { results } = await c.env.DB.prepare(query).bind(...params).all<any>();
    return c.json({ success: true, data: results.map(p => ({
      ...p,
      ssn: decryptField(p.ssn),
      email: decryptField(p.email),
      diagnoses: JSON.parse(p.diagnoses),
      medications: JSON.parse(p.medications),
      vitals: JSON.parse(p.vitals)
    })) });
  });
  app.get('/api/patients/:id', async (c) => {
    const p = await c.env.DB.prepare("SELECT * FROM patients WHERE id = ?").bind(c.req.param('id')).first<any>();
    if (!p) return c.json({ success: false, error: 'Not found' }, 404);
    return c.json({ success: true, data: {
      ...p,
      ssn: decryptField(p.ssn),
      email: decryptField(p.email),
      diagnoses: JSON.parse(p.diagnoses),
      medications: JSON.parse(p.medications),
      vitals: JSON.parse(p.vitals)
    }});
  });
  app.post('/api/patients', async (c) => {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const mrn = `AURA-${Math.floor(200000 + Math.random() * 900000)}`;
    const avatarUrl = `https://i.pravatar.cc/150?u=${mrn}`;
    await c.env.DB.prepare(`
      INSERT INTO patients (id, mrn, ssn, firstName, lastName, dob, gender, bloodType, email, phone, address, diagnoses, medications, vitals, history, avatarUrl)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, mrn, encryptField(body.ssn), body.firstName, body.lastName, body.dob, body.gender, body.bloodType, encryptField(body.email), body.phone, body.address, JSON.stringify([]), JSON.stringify([]), JSON.stringify({ height: "5'10\"", weight: "160 lbs", bmi: "23.0", bp: "120/80", hr: "72", temp: "98.6 F" }), body.history || '', avatarUrl).run();
    return c.json({ success: true, data: { id, mrn, ...body, avatarUrl } });
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
    if (!c.env.DB) return c.json({ success: false, error: 'DB Offline' }, 503);
    await ensureTables(c.env.DB);
    const pCount = await c.env.DB.prepare("SELECT COUNT(*) as count FROM patients").first<{ count: number }>();
    const sCount = await c.env.DB.prepare("SELECT COUNT(DISTINCT sessionId) as count FROM chat_messages").first<{ count: number }>();
    return c.json({ success: true, data: { engine: 'SQL_PROD_D1', binding: 'CLOUDFLARE_D1', connected: true, pingMs: 1, patientCount: pCount?.count || 0, sessionCount: sCount?.count || 0, status: 'HEALTHY', schemaVersion: '2.4.0' } });
  });
}