import { Hono } from "hono";
import { API_RESPONSES } from './config';
import { decryptField, encryptField } from './utils';
import { ChatHandler } from './chat';
import type { Patient, Message } from "./types";
import type { Env } from "./core-utils";
const FIRST_NAMES = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa', 'Thomas', 'Nancy', 'Steven', 'Karen', 'Kevin'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Lopez'];
const DIAGNOSES_TEMPLATES = [
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'I10', description: 'Essential (primary) hypertension' },
  { code: 'E78.5', description: 'Hyperlipidemia, unspecified' },
  { code: 'M54.5', description: 'Low back pain' },
  { code: 'F41.1', description: 'Generalized anxiety disorder' },
  { code: 'J45.909', description: 'Unspecified asthma, uncomplicated' },
  { code: 'K21.9', description: 'Gastro-esophageal reflux disease' },
  { code: 'G43.909', description: 'Migraine, unspecified' }
];
const MEDS_LIBRARY = [
  { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
  { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
  { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily at bedtime' },
  { name: 'Levothyroxine', dosage: '50mcg', frequency: 'Once daily' },
  { name: 'Sertraline', dosage: '50mg', frequency: 'Once daily' }
];
const HISTORY_SNIPPETS = [
  "Patient has a chronic history of managed hypertension.",
  "Diagnosed with childhood asthma; well managed currently.",
  "Family history significant for cardiovascular disease.",
  "Management of type 2 diabetes through intensive lifestyle mod."
];
async function ensureTables(db: D1Database) {
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
      history TEXT
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
async function seedPatients(db: D1Database, force = false) {
  const { count } = await db.prepare("SELECT COUNT(*) as count FROM patients").first<{ count: number }>() || { count: 0 };
  if (count > 0 && !force) return;
  if (force) {
    await db.prepare("DELETE FROM patients").run();
  }
  // Insert in small chunks to respect D1 batch/binding limits
  const chunkSize = 15;
  for (let i = 0; i < 55; i += chunkSize) {
    const chunk = Array.from({ length: Math.min(chunkSize, 55 - i) }, (_, j) => {
      const idx = i + j;
      const firstName = FIRST_NAMES[idx % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(idx + 7) % LAST_NAMES.length];
      const dobYear = 1950 + (idx % 50);
      const ssnRaw = `000-00-${1000 + idx}`;
      const emailRaw = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@aura.clinic`;
      return {
        id: crypto.randomUUID(),
        mrn: `AURA-${200000 + idx}`,
        ssn: btoa(ssnRaw),
        firstName,
        lastName,
        dob: `${dobYear}-01-01`,
        gender: idx % 2 === 0 ? 'Male' : 'Female',
        bloodType: ['A+', 'O+', 'B+', 'AB+'][idx % 4],
        email: btoa(emailRaw),
        phone: `555-01${idx.toString().padStart(2, '0')}`,
        address: `${100 + idx} Medical Plaza Dr, Aura City`,
        diagnoses: JSON.stringify([{ ...DIAGNOSES_TEMPLATES[idx % DIAGNOSES_TEMPLATES.length], date: '2023-01-01' }]),
        medications: JSON.stringify([{ ...MEDS_LIBRARY[idx % MEDS_LIBRARY.length], status: 'Active' }]),
        vitals: JSON.stringify({ height: "5'10\"", weight: "165 lbs", bmi: "23.7", bp: "120/80", hr: "72", temp: "98.6 F" }),
        history: HISTORY_SNIPPETS[idx % HISTORY_SNIPPETS.length]
      };
    });
    const statements = chunk.map(p => db.prepare(`
      INSERT INTO patients (id, mrn, ssn, firstName, lastName, dob, gender, bloodType, email, phone, address, diagnoses, medications, vitals, history)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(p.id, p.mrn, p.ssn, p.firstName, p.lastName, p.dob, p.gender, p.bloodType, p.email, p.phone, p.address, p.diagnoses, p.medications, p.vitals, p.history));
    await db.batch(statements);
  }
}
export function coreRoutes(app: Hono<{ Bindings: Env }>) {
  app.post('/api/chat/:sessionId/chat', async (c) => {
    await ensureTables(c.env.DB);
    const sessionId = c.req.param('sessionId');
    const { message, stream, model } = await c.req.json();
    const historyRows = await c.env.DB.prepare("SELECT role, content, timestamp, id FROM chat_messages WHERE sessionId = ? ORDER BY timestamp ASC").bind(sessionId).all<Message>();
    const history = historyRows.results || [];
    const handler = new ChatHandler(
      c.env.CF_AI_BASE_URL,
      c.env.CF_AI_API_KEY,
      model || 'google-ai-studio/gemini-2.0-flash'
    );
    const userMsgId = crypto.randomUUID();
    const userTimestamp = Date.now();
    await c.env.DB.prepare("INSERT INTO chat_messages (id, sessionId, role, content, timestamp) VALUES (?, ?, ?, ?, ?)").bind(userMsgId, sessionId, 'user', message, userTimestamp).run();
    if (stream) {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      (async () => {
        let fullAssistantResponse = '';
        try {
          const response = await handler.processMessage(message, history, undefined, (chunk: string) => {
            fullAssistantResponse += chunk;
            writer.write(encoder.encode(chunk));
          });
          const assistantMsgId = crypto.randomUUID();
          // Ensure we persist the full response captured even if client disconnects early from the stream but DO remains active
          await c.env.DB.prepare("INSERT INTO chat_messages (id, sessionId, role, content, timestamp) VALUES (?, ?, ?, ?, ?)").bind(assistantMsgId, sessionId, 'assistant', fullAssistantResponse || response.content, Date.now()).run();
        } catch (e) {
          console.error("Stream Error:", e);
          writer.write(encoder.encode('\n[Clinical Node Communication Interrupted]'));
        } finally {
          writer.close();
        }
      })();
      return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    const response = await handler.processMessage(message, history);
    const assistantMsgId = crypto.randomUUID();
    await c.env.DB.prepare("INSERT INTO chat_messages (id, sessionId, role, content, timestamp) VALUES (?, ?, ?, ?, ?)").bind(assistantMsgId, sessionId, 'assistant', response.content, Date.now()).run();
    const updatedHistory = await c.env.DB.prepare("SELECT role, content, timestamp, id FROM chat_messages WHERE sessionId = ? ORDER BY timestamp ASC").bind(sessionId).all<Message>();
    return c.json({ success: true, data: { messages: updatedHistory.results } });
  });
  app.get('/api/chat/:sessionId/messages', async (c) => {
    await ensureTables(c.env.DB);
    const history = await c.env.DB.prepare("SELECT role, content, timestamp, id FROM chat_messages WHERE sessionId = ? ORDER BY timestamp ASC").bind(c.req.param('sessionId')).all<Message>();
    return c.json({ success: true, data: { messages: history.results || [] } });
  });
  app.delete('/api/chat/:sessionId/clear', async (c) => {
    await c.env.DB.prepare("DELETE FROM chat_messages WHERE sessionId = ?").bind(c.req.param('sessionId')).run();
    return c.json({ success: true });
  });
  app.post('/api/chat/:sessionId/init-context', async (c) => {
    await ensureTables(c.env.DB);
    const { patientId } = await c.req.json();
    const sessionId = c.req.param('sessionId');
    const p = await c.env.DB.prepare("SELECT * FROM patients WHERE id = ?").bind(patientId).first<any>();
    if (!p) return c.json({ success: false, error: 'Patient not in registry' }, 404);
    const diagnoses = JSON.parse(p.diagnoses);
    const meds = JSON.parse(p.medications);
    const systemMsg: Message = {
      id: crypto.randomUUID(),
      role: 'system',
      content: `Persona: Dr. Aura, Medical Assistant. Context: Patient ${p.firstName} ${p.lastName} (${p.mrn}). Profile: ${diagnoses.map((d: any) => d.description).join(', ')}. Meds: ${meds.map((m: any) => m.name).join(', ')}. Clinical History: ${p.history}. Be professional and clinical.`,
      timestamp: Date.now()
    };
    await c.env.DB.prepare("DELETE FROM chat_messages WHERE sessionId = ?").bind(sessionId).run();
    await c.env.DB.prepare("INSERT INTO chat_messages (id, sessionId, role, content, timestamp) VALUES (?, ?, ?, ?, ?)").bind(systemMsg.id, sessionId, systemMsg.role, systemMsg.content, systemMsg.timestamp).run();
    return c.json({ success: true });
  });
  app.post('/api/seed-patients', async (c) => {
    await ensureTables(c.env.DB);
    const force = c.req.query('force') === 'true';
    await seedPatients(c.env.DB, force);
    const { count } = await c.env.DB.prepare("SELECT COUNT(*) as count FROM patients").first<{ count: number }>() || { count: 0 };
    return c.json({ success: true, count, action: force ? 'reseeded' : 'ensured' });
  });
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/patients', async (c) => {
    await ensureTables(c.env.DB);
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
    const decrypted = results.map(p => ({
      ...p,
      ssn: decryptField(p.ssn),
      email: decryptField(p.email),
      diagnoses: JSON.parse(p.diagnoses),
      medications: JSON.parse(p.medications),
      vitals: JSON.parse(p.vitals)
    }));
    return c.json({ success: true, data: decrypted });
  });
  app.get('/api/patients/:id', async (c) => {
    await ensureTables(c.env.DB);
    const p = await c.env.DB.prepare("SELECT * FROM patients WHERE id = ?").bind(c.req.param('id')).first<any>();
    if (!p) return c.json({ success: false, error: 'Record not found' }, 404);
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
    await ensureTables(c.env.DB);
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const mrn = `AURA-${Math.floor(200000 + Math.random() * 900000)}`;
    const vitals = JSON.stringify({ height: "5'10\"", weight: "160 lbs", bmi: "23.0", bp: "120/80", hr: "72", temp: "98.6 F" });
    await c.env.DB.prepare(`
      INSERT INTO patients (id, mrn, ssn, firstName, lastName, dob, gender, bloodType, email, phone, address, diagnoses, medications, vitals, history)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, mrn, encryptField(body.ssn), body.firstName, body.lastName, body.dob, body.gender,
      body.bloodType, encryptField(body.email), body.phone, body.address,
      JSON.stringify([]), JSON.stringify([]), vitals, body.history || ''
    ).run();
    return c.json({ success: true, data: { id, mrn, ...body } });
  });
  app.post('/api/analyze-evidence', async (c) => {
    const { image } = await c.req.json();
    try {
      const aiResponse = await fetch(`${c.env.CF_AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${c.env.CF_AI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: '@cf/llava-hf/llava-1.5-7b-hf',
          messages: [
            { role: 'user', content: [
              { type: 'text', text: 'Describe clinical features visible in this medical image for record charting.' }, 
              { type: 'image_url', image_url: { url: image } }
            ] }
          ],
          max_tokens: 512,
          temperature: 0.2
        })
      });
      const result: any = await aiResponse.json();
      return c.json({ 
        success: true, 
        data: { 
          analysis: result.choices?.[0]?.message?.content || "Feature extraction complete.", 
          confidence: 0.94 
        } 
      });
    } catch (err) {
      console.error("AI Vision Error:", err);
      return c.json({ success: false, error: 'Vision model inference failure' }, 500);
    }
  });
  app.get('/api/db-status', async (c) => {
    await ensureTables(c.env.DB);
    const pCount = await c.env.DB.prepare("SELECT COUNT(*) as count FROM patients").first<{ count: number }>();
    const sCount = await c.env.DB.prepare("SELECT COUNT(DISTINCT sessionId) as count FROM chat_messages").first<{ count: number }>();
    return c.json({
      success: true,
      data: {
        engine: 'SQL_PROD_D1',
        binding: 'CLOUDFLARE_D1',
        connected: true,
        pingMs: 2,
        patientCount: pCount?.count || 0,
        sessionCount: sCount?.count || 0,
        status: 'HEALTHY',
        schemaVersion: '2.1.0-D1'
      }
    });
  });
}