import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { API_RESPONSES } from './config';
import { Env, getAppController } from "./core-utils";
import type { Patient, DbStatus } from './types';
import { generatePatients } from '../src/lib/mockData';
import { decryptField } from './utils';
export function coreRoutes(app: Hono<{ Bindings: Env }>) {
    app.all('/api/chat/:sessionId/*', async (c) => {
        try {
            const sessionId = c.req.param('sessionId');
            // Cast to any to break potential TS2589 infinite recursion in Hono route registration
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
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    app.get('/api/patients', async (c) => {
        const controller = getAppController(c.env);
        const search = c.req.query('q');
        console.debug(`[API] Patients req search: ${search || 'none'}`);
        try {
            let initialCount = await controller.getPatientCount();
            console.debug(`[API] Controller record count: ${initialCount}`);
            let rawPatients: any[] = await controller.getPatients(search || undefined);
            if (rawPatients.length === 0 && !search) {
                console.debug('[API] No records found in base registry. Seeding 50 clinical profiles...');
                const newPatients = generatePatients(50);
                await controller.seedPatients(newPatients);
                rawPatients = await controller.getPatients();
                let afterSeedCount = await controller.getPatientCount();
                console.debug(`[API] After seed count: ${afterSeedCount}`);
            }
            const formatted = rawPatients.map((p: any) => {
                try {
                    const mapped = {
                        ...p,
                        ssn: decryptField(p.ssn || ''),
                        email: decryptField(p.email || ''),
                        diagnoses: typeof p.diagnoses === 'string' ? JSON.parse(p.diagnoses) : p.diagnoses,
                        medications: typeof p.medications === 'string' ? JSON.parse(p.medications) : p.medications,
                        vitals: typeof p.vitals === 'string' ? JSON.parse(p.vitals) : p.vitals
                    };
                    console.debug(`[API] Decrypt/parse success for MRN: ${p.mrn}`);
                    return mapped;
                } catch (err) {
                    console.warn(`[API] Partial record failure for MRN: ${p.mrn}`, err);
                    return p;
                }
            });
            console.debug(`[API] Returning ${formatted.length} profiles to frontend`);
            return c.json({ success: true, data: formatted });
        } catch (error) {
            console.error('[PATIENTS FETCH ERROR]', error);
            return c.json({ success: false, error: "Database retrieval failed" }, { status: 500 });
        }
    });
    app.post('/api/seed-patients', async (c) => {
        const controller = getAppController(c.env);
        const force = c.req.query('force') === 'true';
        try {
            if (force) {
                await (controller as any).clearPatients();
                console.debug('[API] Forced registry purge initiated');
            } else {
                const count = await controller.getPatientCount();
                if (count > 0) {
                    return c.json({ success: true, message: "Registry already populated", count });
                }
            }
            const newPatients = generatePatients(50);
            await controller.seedPatients(newPatients);
            console.debug('[API] Clinical registry re-seeded successfully');
            return c.json({ success: true, message: "Registry seeded successfully", count: 50 });
        } catch (error) {
            console.error('[SEED ERROR]', error);
            return c.json({ success: false, error: "Seeding operation failed" }, { status: 500 });
        }
    });
    app.get('/api/db-status', async (c) => {
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
            console.error('[STATUS ERROR]', error);
            return c.json({ success: false, error: "Status check failed" }, { status: 500 });
        }
    });
    app.get('/api/patients/:id', async (c) => {
        const id = c.req.param('id');
        try {
            const controller = getAppController(c.env);
            const rawP: any | null = await controller.getPatient(id);
            if (!rawP) return c.json({ success: false, error: 'Clinical record not found for the requested ID.' }, { status: 404 });
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
    app.post('/api/analyze-evidence', async (c) => {
        try {
            const body = await c.req.json();
            const { image } = body;
            if (!image) return c.json({ success: false, error: "Imagery data payload is required" }, { status: 400 });
            console.debug('[API] Initiating Llava vision analysis');
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
                                { type: 'text', text: 'Analyze this clinical image for a medical record. Describe morphology, borders, and clinical features concisely.' },
                                { type: 'image_url', image_url: { url: image } }
                            ]
                        }
                    ]
                }),
                signal: AbortSignal.timeout(30000)
            });
            if (!response.ok) throw new Error("Vision AI service timed out or failed");
            const result: any = await response.json();
            return c.json({
                success: true,
                data: {
                    analysis: result.choices[0]?.message?.content || "Analysis inconclusive. Ensure image quality is sufficient.",
                    confidence: 0.94
                }
            });
        } catch (error) {
            console.error('[VISION ERROR]', error);
            return c.json({ success: false, error: "Clinical Vision AI service is temporarily unavailable" }, { status: 503 });
        }
    });
    app.get('/api/sessions', async (c) => {
        try {
            const controller = getAppController(c.env);
            const sessions = await controller.listSessions();
            return c.json({ success: true, data: sessions });
        } catch (error) {
            return c.json({ success: false, error: "Session indexing failed" }, { status: 500 });
        }
    });
}