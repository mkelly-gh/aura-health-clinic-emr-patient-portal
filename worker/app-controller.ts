import { DurableObject } from 'cloudflare:workers';
import type { Env } from './core-utils';
// Minimal shell to satisfy mandatory export requirements in index.ts
export class AppController extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }
}