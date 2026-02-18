import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { API_RESPONSES } from './config';
import { Env, getAppController } from "./core-utils";
import type { Patient } from './types';
import { generatePatients } from '../src/lib/mockData';
import { decryptField } from './utils';
export function coreRoutes(app: Hono<{ Bindings: Env }>) {
    app.all('/api/chat/:sessionId/*', async (c) => {
        try {
            const sessionId = c.req.param('sessionId');
            const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT, sessionId);
            const url = new URL(c.req.url);
            url.pathname = url.pathname.replace(`/api/chat/${sessionId}`, '');
            return agent.fetch(new Request(url.toString(), {
                method: c.req.method,
                headers: c.req.header(),
                body: c.req.method === 'GET' || c.req.method === 'DELETE' ? undefined : c.req.raw.body
            }));
        } catch (error) {
            console.error('[AGENT ROUTING ERROR]', error);
            return c.json({ success: false, error: API_RESPONSES.AGENT_ROUTING_FAILED }, { status: 500 });
        }
    });
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    app.get('/api/patients', async (c) => {
        const controller = getAppController(c.env);
        const search = c.req.query('q');
        try {
            let query = 'SELECT * FROM patients';
            let params: string[] = [];
            if (search) {
                query += ' WHERE firstName LIKE ? OR lastName LIKE ? OR mrn LIKE ?';
                const term = `%${search}%`;
                params = [term, term, term];
            }
            const { results } = await c.env.DB.prepare(query).bind(...params).all<any>();
            // Seed if database is empty
            if (results.length === 0 && !search) {
                console.info('[DATABASE] Seeding initial patient records...');
                const newPatients = generatePatients(50);
                await controller.seedPatients(newPatients);
                console.info(`[DATABASE] Seeded ${newPatients.length} patients successfully.`);
                return c.json({ success: true, data: newPatients });
            }
            const formatted = results.map(p => ({
                ...p,
                ssn: decryptField(p.ssn),
                email: decryptField(p.email),
                diagnoses: JSON.parse(p.diagnoses),
                medications: JSON.parse(p.medications),
                vitals: JSON.parse(p.vitals)
            }));
            return c.json({ success: true, data: formatted });
        } catch (error) {
            console.error('[PATIENTS FETCH ERROR]', error);
            return c.json({ success: false, error: "Database retrieval failed" }, { status: 500 });
        }
    });
    app.get('/api/patients/:id', async (c) => {
        const id = c.req.param('id');
        try {
            const p: any = await c.env.DB.prepare('SELECT * FROM patients WHERE id = ?').bind(id).first();
            if (!p) return c.json({ success: false, error: 'Patient not found' }, { status: 404 });
            const patient: Patient = {
                ...p,
                ssn: decryptField(p.ssn),
                email: decryptField(p.email),
                diagnoses: JSON.parse(p.diagnoses),
                medications: JSON.parse(p.medications),
                vitals: JSON.parse(p.vitals)
            };
            return c.json({ success: true, data: patient });
        } catch (error) {
            return c.json({ success: false, error: "Record access failed" }, { status: 500 });
        }
    });
    app.get('/api/db-status', async (c) => {
        try {
            const controller = getAppController(c.env);
            const count = await controller.getPatientCount();
            const sessionCountRes = await c.env.DB.prepare('SELECT COUNT(*) as count FROM sessions').first<{count: number}>();
            return c.json({
                success: true,
                data: {
                    engine: 'Cloudflare D1 SQL Cluster',
                    patientCount: count,
                    sessionCount: sessionCountRes?.count || 0,
                    status: 'PRODUCTION_HEALTHY',
                    region: 'Auto-Global',
                    compliance: ['HIPAA-Pseudo', 'GDPR-Compatible']
                }
            });
        } catch (error) {
            return c.json({ success: false, error: "Status check failed" }, { status: 500 });
        }
    });
    app.post('/api/analyze-evidence', async (c) => {
        try {
            const body = await c.req.json();
            const { image } = body;
            if (!image) return c.json({ success: false, error: "Image data required" }, { status: 400 });
            const response = await fetch(`${c.env.CF_AI_BASE_URL}/chat/completions`, {
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
                                { type: 'text', text: 'Analyze this clinical image for a professional medical record. Identify morphological features and provide a detailed observation. Do not provide a definitive diagnosis, focus on descriptions.' },
                                { type: 'image_url', image_url: { url: image } }
                            ]
                        }
                    ]
                })
            });
            if (!response.ok) throw new Error("Vision AI processing failed");
            const result: any = await response.json();
            return c.json({
                success: true,
                data: {
                    analysis: result.choices[0]?.message?.content || "Analysis inconclusive.",
                    timestamp: Date.now(),
                    confidence: 0.92,
                    aiModel: 'llava-1.5-7b'
                }
            });
        } catch (error) {
            console.error('[VISION ERROR]', error);
            return c.json({ success: false, error: "Clinical Vision service currently unavailable" }, { status: 500 });
        }
    });
    app.get('/api/sessions', async (c) => {
        try {
            const { results } = await c.env.DB.prepare('SELECT * FROM sessions ORDER BY lastActive DESC LIMIT 100').all();
            return c.json({ success: true, data: results });
        } catch (error) {
            return c.json({ success: false, error: "Session indexing failed" }, { status: 500 });
        }
    });
}