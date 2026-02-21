import type { AppController } from './app-controller';
export interface Env {
    CF_AI_BASE_URL: string;
    CF_AI_API_KEY: string;
    SERPAPI_KEY: string;
    OPENROUTER_API_KEY: string;
    CHAT_AGENT: DurableObjectNamespace<any>;
    APP_CONTROLLER: DurableObjectNamespace<any>;
}
/**
 * DEPRECATED: Returns a mock stub as we use volatile in-memory storage now.
 */
export function getAppController(env: Env): any {
  return {
    addSession: async () => {},
    updateSessionActivity: async () => {},
    removeSession: async () => true,
    getPatients: async () => [],
    getPatient: async () => null,
    getPatientCount: async () => 0,
    seedPatients: async () => {}
  };
}
export async function registerSession(env: Env, sessionId: string, title?: string): Promise<void> {
  // Logic handled in userRoutes globals now
}
export async function updateSessionActivity(env: Env, sessionId:string): Promise<void> {
  // Logic handled in userRoutes globals now
}
export async function unregisterSession(env: Env, sessionId: string): Promise<boolean> {
  return true;
}