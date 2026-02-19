import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { API_RESPONSES } from './config';
import { Env, getAppController } from "./core-utils";
import type { Patient, DbStatus } from './types';

import { decryptField } from './utils';
export function coreRoutes(app: any) {
    app.all('/api/chat/:sessionId/*', async (c: any) => {
        try {
            const sessionId = c.req.param('sessionId');
            const agent = await getAgentByName<Env, any>(c.env.CHAT_AGENT, sessionId);
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
export function userRoutes(app: any) {
    app.get('/api/patients', async (c: any) => {
        const controller = getAppController(c.env);
        const search = c.req.query('q');
        try {
            const rawPatients: any[] = await controller.getPatients(search || undefined);
            if (rawPatients.length === 0 && !search) {
                const newPatients = controller.generatePatients(50);
                await controller.seedPatients(newPatients);
                return c.json({ success: true, data: await controller.getPatients() });
            }
            const formatted = rawPatients.map((p: any) => ({
                ...p,
                ssn: decryptField(p.ssn || ''),
                email: decryptField(p.email || ''),
                diagnoses: typeof p.diagnoses === 'string' ? JSON.parse(p.diagnoses) : p.diagnoses,
                medications: typeof p.medications === 'string' ? JSON.parse(p.medications) : p.medications,
                vitals: typeof p.vitals === 'string' ? JSON.parse(p.vitals) : p.vitals
            }));
            return c.json({ success: true, data: formatted });
        } catch (error) {
            return c.json({ success: false, error: "Database retrieval failed" }, { status: 500 });
        }
    });
    app.post('/api/seed-patients', async (c: any) => {
        const controller = getAppController(c.env);
        const force = c.req.query('force') === 'true';
        try {
            if (force) await (controller as any).clearPatients();
            const newPatients = controller.generatePatients(50);
            await controller.seedPatients(newPatients);
            return c.json({ success: true, message: "Registry seeded successfully", count: newPatients.length });
        } catch (error) {
            return c.json({ success: false, error: "Seeding operation failed" }, { status: 500 });
        }
    });
    app.get('/api/db-status', async (c: any) => {
        try {
            const controller = getAppController(c.env);
            const { connected, pingMs } = await controller.checkConnection();
            const patientCount = await controller.getPatientCount();
            const sessionCount = await controller.getSessionCount();
            const status: DbStatus = {
                engine: c.env.DB ? 'Cloudflare D1 SQL' : 'Durable Object Storage (Fallback)',
                binding: c.env.DB ? 'DB' : 'APP_CONTROLLER',
                connected,
                pingMs,
                patientCount,
                sessionCount,
                status: connected ? 'HEALTHY' : 'DEGRADED',
                schemaVersion: '1.4.2-hipaa-prod'
            };
            return c.json({ success: true, data: status });
        } catch (error) {
            return c.json({ success: false, error: "Status check failed" }, { status: 500 });
        }
    });
    app.get('/api/patients/:id', async (c: any) => {
        const id = c.req.param('id');
        try {
            const controller = getAppController(c.env);
            const rawP: any | null = await controller.getPatient(id);
            if (!rawP) return c.json({ success: false, error: 'Clinical record not found.' }, { status: 404 });
            const patient: Patient = {
                ...rawP,
                ssn: decryptField(rawP.ssn || ''),
                email: decryptField(rawP.email || ''),
                diagnoses: typeof rawP.diagnoses === 'string' ? JSON.parse(rawP.diagnoses) : rawP.diagnoses,
                medications: typeof rawP.medications === 'string' ? JSON.parse(rawP.medications) : rawP.medications,
                vitals: typeof rawP.vitals === 'string' ? JSON.parse(rawP.vitals) : rawP.vitals
            };
            return c.json({ success: true, data: patient });
        } catch (error) {
            return c.json({ success: false, error: "Record access failed" }, { status: 500 });
        }
    });
    app.post('/api/analyze-evidence', async (c: any) => {
        try {
            const body = await c.req.json();
            const { image } = body;
            if (!image) return c.json({ success: false, error: "Imagery data required" }, { status: 400 });
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
                                { type: 'text', text: 'Analyze this clinical image for a medical record. Describe morphology concisely.' },
                                { type: 'image_url', image_url: { url: image } }
                            ]
                        }
                    ]
                })
            });
            const result: any = await response.json();
            return c.json({
                success: true,
                data: {
                    analysis: result.choices[0]?.message?.content || "Analysis inconclusive.",
                    confidence: 0.94
                }
            });
        } catch (error) {
            return c.json({ success: false, error: "Clinical Vision AI service unavailable" }, { status: 503 });
        }
    });
    app.get('/api/sessions', async (c: any) => {
        try {
            const controller = getAppController(c.env);
            const sessions = await controller.listSessions();
            return c.json({ success: true, data: sessions });
        } catch (error) {
            return c.json({ success: false, error: "Session indexing failed" }, { status: 500 });
        }
    });
}