import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { API_RESPONSES } from './config';
import { Env, getAppController, registerSession, unregisterSession } from "./core-utils";
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
            return c.json({ success: false, error: API_RESPONSES.AGENT_ROUTING_FAILED }, { status: 500 });
        }
    });
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    app.get('/api/patients', async (c) => {
        const controller = getAppController(c.env);
        let patients = await controller.getPatients();
        if (patients.length === 0) {
            // Seed on first access if empty
            try {
                const { generatePatients } = await import('../src/lib/mockData');
                const newPatients = generatePatients(50);
                await controller.seedPatients(newPatients);
                patients = newPatients;
            } catch (e) {
                console.error("Seeding failed", e);
            }
        }
        return c.json({ success: true, data: patients });
    });
    app.get('/api/patients/:id', async (c) => {
        const controller = getAppController(c.env);
        const patient = await controller.getPatient(c.req.param('id'));
        if (!patient) return c.json({ success: false, error: 'Patient not found' }, { status: 404 });
        return c.json({ success: true, data: patient });
    });
    app.post('/api/analyze-evidence', async (c) => {
        // Stub for Phase 2 vision logic
        return c.json({ success: true, data: { analysis: "Vision analysis placeholder: Evidence appears stable." } });
    });
    app.get('/api/sessions', async (c) => {
        const controller = getAppController(c.env);
        const sessions = await controller.listSessions();
        return c.json({ success: true, data: sessions });
    });
}