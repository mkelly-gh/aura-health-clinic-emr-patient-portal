import { Agent } from 'agents';
import type { Env } from './core-utils';
import type { ChatState, Patient } from './types';
import { ChatHandler } from './chat';
import { API_RESPONSES } from './config';
import { createMessage, createStreamResponse, createEncoder, decryptField } from './utils';
import { getAppController } from './core-utils';
export class ChatAgent extends Agent<Env, ChatState> {
  private chatHandler?: ChatHandler;
  initialState: ChatState = {
    messages: [],
    sessionId: crypto.randomUUID(),
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
      if (method === 'GET' && url.pathname === '/messages') return this.handleGetMessages();
      if (method === 'POST' && url.pathname === '/chat') return this.handleChatMessage(await request.json());
      if (method === 'DELETE' && url.pathname === '/clear') return this.handleClearMessages();
      if (method === 'POST' && url.pathname === '/model') return this.handleModelUpdate(await request.json());
      if (method === 'POST' && url.pathname === '/init-context') return this.handleInitContext(await request.json());
      return Response.json({ success: false, error: API_RESPONSES.NOT_FOUND }, { status: 404 });
    } catch (error) {
      console.error('Request handling error:', error);
      return Response.json({ success: false, error: API_RESPONSES.INTERNAL_ERROR }, { status: 500 });
    }
  }
  private handleGetMessages(): Response {
    return Response.json({ success: true, data: this.state });
  }
  private async handleInitContext(body: { patientId: string }): Promise<Response> {
    const controller = getAppController(this.env);
    const rawP: any = await controller.getPatient(body.patientId);
    if(!rawP) return Response.json({success:false,error:'Patient not found'},{status:404});
    const p: Patient = {
      ...rawP,
      ssn:decryptField(rawP.ssn||''),
      email:decryptField(rawP.email||''),
      diagnoses:JSON.parse(rawP.diagnoses||'[]'),
      medications:JSON.parse(rawP.medications||'[]'),
      vitals:JSON.parse(rawP.vitals||'{}')
    };
    const context = {
      summary: `${p.firstName} ${p.lastName}, ${p.gender}, born ${p.dob}. History: ${p.history}`,
      activeMedications: p.medications.filter((m:any)=>m.status==='Active').map((m:any)=>`${m.name} ${m.dosage}`),
      recentDiagnoses: p.diagnoses.map((d:any)=>`${d.code}: ${d.description} (${d.date})`)
    };
    this.setState({ ...this.state, patientContext: context } as ChatState);
    return Response.json({success:true, data:context});
  }
  private async handleChatMessage(body: { message: string; model?: string; stream?: boolean }): Promise<Response> {
    const { message, model, stream } = body;
    if (!message?.trim()) return Response.json({ success: false, error: API_RESPONSES.MISSING_MESSAGE }, { status: 400 });
    if (model && model !== this.state.model) {
      this.setState({ ...this.state, model } as ChatState);
      this.chatHandler?.updateModel(model);
    }
    const systemPrompt = this.state.patientContext
      ? `You are Dr. Aura at Aura Health Clinic. You are assisting patient ${this.state.patientContext.summary}.
         Active Medications: ${this.state.patientContext.activeMedications.join(', ')}.
         Current Diagnoses: ${this.state.patientContext.recentDiagnoses.join(', ')}.
         Provide personalized, safe medical context. Never prescribe. Always emphasize consultation with a human physician.`
      : undefined;
    const userMessage = createMessage('user', message.trim());
    this.setState({ ...this.state, messages: [...this.state.messages, userMessage], isProcessing: true } as ChatState);
    try {
      if (stream) {
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = createEncoder();
        (async () => {
          try {
            this.setState({ ...this.state, streamingMessage: '' } as ChatState);
            const response = await this.chatHandler!.processMessage(message, this.state.messages, systemPrompt, (chunk) => {
              this.setState({ ...this.state, streamingMessage: (this.state.streamingMessage || '') + chunk } as ChatState);
              writer.write(encoder.encode(chunk));
            });
            const assistantMessage = createMessage('assistant', response.content, response.toolCalls);
            this.setState({ ...this.state, messages: [...this.state.messages, assistantMessage], isProcessing: false, streamingMessage: '' } as ChatState);
          } catch (error) {
            writer.write(encoder.encode('I encountered an error processing your request.'));
            this.setState({ ...this.state, isProcessing: false, streamingMessage: '' } as ChatState);
          } finally {
            writer.close();
          }
        })();
        return createStreamResponse(readable);
      }
      const response = await this.chatHandler!.processMessage(message, this.state.messages, systemPrompt);
      const assistantMessage = createMessage('assistant', response.content, response.toolCalls);
      this.setState({ ...this.state, messages: [...this.state.messages, assistantMessage], isProcessing: false } as ChatState);
      return Response.json({ success: true, data: this.state });
    } catch (error) {
      this.setState({ ...this.state, isProcessing: false } as ChatState);
      return Response.json({ success: false, error: API_RESPONSES.PROCESSING_ERROR }, { status: 500 });
    }
  }
  private handleClearMessages(): Response {
    this.setState({ ...this.state, messages: [] } as ChatState);
    return Response.json({ success: true, data: this.state });
  }
  private handleModelUpdate(body: { model: string }): Response {
    const { model } = body;
    this.setState({ ...this.state, model } as ChatState);
    this.chatHandler?.updateModel(model);
    return Response.json({ success: true, data: this.state });
  }
}