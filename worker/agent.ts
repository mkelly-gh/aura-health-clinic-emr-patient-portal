import { Agent } from 'agents';
import type { Env } from './core-utils';
import type { ChatState, Message, PatientContext } from './types';
import { ChatHandler } from './chat';
import { API_RESPONSES } from './config';
import { createMessage, createStreamResponse, createEncoder } from './utils';
import { getAppController } from './core-utils';
// Resolve TS2589 by being explicit about the State type and reducing complexity
export class ChatAgent extends Agent<Env, ChatState> {
  private chatHandler?: ChatHandler;
  initialState: ChatState = {
    messages: [],
    sessionId: '',
    isProcessing: false,
    model: 'google-ai-studio/gemini-2.5-flash'
  };
  async onStart(): Promise<void> {
    this.chatHandler = new ChatHandler(
      this.env.CF_AI_BASE_URL,
      this.env.CF_AI_API_KEY,
      this.state.model
    );
  }
  async onRequest(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const method = request.method;
      if (method === 'GET' && url.pathname === '/messages') {
        return Response.json({ success: true, data: this.state });
      }
      if (method === 'POST' && url.pathname === '/chat') {
        const body = await request.json();
        return this.handleChatMessage(body as any);
      }
      if (method === 'DELETE' && url.pathname === '/clear') {
        this.setState({ ...this.state, messages: [] });
        return Response.json({ success: true });
      }
      if (method === 'POST' && url.pathname === '/init-context') {
        const body = await request.json();
        return this.handleInitContext(body as any);
      }
      return Response.json({ success: false, error: API_RESPONSES.NOT_FOUND }, { status: 404 });
    } catch (error) {
      console.error('[AGENT REQ ERROR]', error);
      return Response.json({ success: false, error: API_RESPONSES.INTERNAL_ERROR }, { status: 500 });
    }
  }
  private async handleInitContext(body: { patientId: string }): Promise<Response> {
    const controller = getAppController(this.env);
    const rawP: any = await controller.getPatient(body.patientId);
    if (!rawP) return Response.json({ success: false, error: 'Patient not found' }, { status: 404 });
    const meds = typeof rawP.medications === 'string' ? JSON.parse(rawP.medications) : rawP.medications;
    const diags = typeof rawP.diagnoses === 'string' ? JSON.parse(rawP.diagnoses) : rawP.diagnoses;
    const context: PatientContext = {
      summary: `${rawP.firstName} ${rawP.lastName}, born ${rawP.dob}. History: ${rawP.history}`,
      activeMedications: Array.isArray(meds) ? meds.filter((m: any) => m.status === 'Active').map((m: any) => String(m.name)) : [],
      recentDiagnoses: Array.isArray(diags) ? diags.map((d: any) => String(d.description)) : []
    };
    this.setState({ ...this.state, patientContext: context });
    return Response.json({ success: true, data: context });
  }
  private async handleChatMessage(body: { message: string; model?: string; stream?: boolean }): Promise<Response> {
    const { message, stream } = body;
    if (!message?.trim()) return Response.json({ success: false, error: API_RESPONSES.MISSING_MESSAGE }, { status: 400 });
    const ctx = this.state.patientContext;
    const systemPrompt = ctx
      ? `You are Dr. Aura at Aura Health Clinic. Patient Context: ${ctx.summary}.
         Active Medications: ${ctx.activeMedications.join(', ')}.
         Diagnoses: ${ctx.recentDiagnoses.join(', ')}.
         Provide safe, relevant medical context based on this chart.`
      : undefined;
    const userMessage = createMessage('user', message.trim());
    const currentMessages = [...this.state.messages, userMessage];
    this.setState({ ...this.state, messages: currentMessages, isProcessing: true });
    try {
      if (stream) {
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = createEncoder();
        (async () => {
          try {
            const response = await this.chatHandler!.processMessage(message, currentMessages, systemPrompt, (chunk) => {
              writer.write(encoder.encode(chunk));
            });
            const assistantMessage = createMessage('assistant', response.content, response.toolCalls);
            this.setState({ ...this.state, messages: [...currentMessages, assistantMessage], isProcessing: false });
          } catch (e) {
            writer.write(encoder.encode('Error processing AI response.'));
          } finally {
            writer.close();
          }
        })();
        return createStreamResponse(readable);
      }
      const response = await this.chatHandler!.processMessage(message, currentMessages, systemPrompt);
      const assistantMessage = createMessage('assistant', response.content, response.toolCalls);
      this.setState({ ...this.state, messages: [...currentMessages, assistantMessage], isProcessing: false });
      return Response.json({ success: true, data: this.state });
    } catch (error) {
      this.setState({ ...this.state, isProcessing: false });
      return Response.json({ success: false, error: API_RESPONSES.PROCESSING_ERROR }, { status: 500 });
    }
  }
}