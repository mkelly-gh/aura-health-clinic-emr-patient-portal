import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { API_RESPONSES } from './config';
import { Env, getAppController } from "./core-utils";
import type { Patient } from './types';
import { generatePatients } from '../src/lib/mockData';
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
        // Explicitly cast the patients result to ignore incorrectly inferred Disposable traits
        const rawPatients = await controller.getPatients();
        let patients = Array.from(rawPatients) as Patient[];
        console.log('Initial patients count:', patients.length);
        if (patients.length === 0) {
            console.log('Attempting to seed patients');
            try {
                const newPatients = generatePatients(50);
                await controller.seedPatients(newPatients);
                console.log('Seeding completed, returning new patients');
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
        try {
            const body = await c.req.json();
            const { image } = body;
            if (!image) {
                return c.json({ success: false, error: "Image data required" }, { status: 400 });
            }
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
                                { type: 'text', text: 'Analyze this clinical image and provide a professional medical observation. Mention specific visible features.' },
                                { type: 'image_url', image_url: { url: image } }
                            ]
                        }
                    ]
                })
            });
            if (!response.ok) throw new Error("Vision AI request failed");
            const result: any = await response.json();
            return c.json({
                success: true,
                data: {
                    analysis: result.choices[0]?.message?.content || "No analysis generated.",
                    timestamp: Date.now(),
                    confidence: 0.89
                }
            });
        } catch (error) {
            console.error("Vision error:", error);
            return c.json({ success: false, error: "Failed to analyze evidence" }, { status: 500 });
        }
    });
    app.get('/api/sessions', async (c) => {
        const controller = getAppController(c.env);
        const sessions = await controller.listSessions();
        return c.json({ success: true, data: sessions });
    });
}