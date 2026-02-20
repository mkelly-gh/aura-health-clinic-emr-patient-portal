import { Agent } from 'agents';
import type { Env } from './core-utils';
// Minimal shell to satisfy mandatory export requirements in index.ts
export class ChatAgent extends (Agent as any)<Env, any> {
  async onRequest(request: Request): Promise<Response> {
    return new Response("Durable Object logic deprecated in favor of volatile storage.", { status: 410 });
  }
}