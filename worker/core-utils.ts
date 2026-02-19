/**
 * Core utilities for the Cloudflare Agents template
 * Updated for Phase 14: Final Stability & Production Hardening
 */
import type { AppController } from './app-controller';
export interface Env {
    CF_AI_BASE_URL: string;
    CF_AI_API_KEY: string;
    SERPAPI_KEY: string;
    OPENROUTER_API_KEY: string;
    // Use any to bypass brand check recursion issues with complex class hierarchies
    CHAT_AGENT: DurableObjectNamespace<any>;
    APP_CONTROLLER: DurableObjectNamespace<AppController>;
    DB: D1Database;
}
/**
 * Get AppController stub for session management
 * Uses a singleton pattern with fixed ID for consistent routing
 */
export function getAppController(env: Env): DurableObjectStub<AppController> {
  const id = env.APP_CONTROLLER.idFromName("controller");
  return env.APP_CONTROLLER.get(id);
}
/**
 * Register a new chat session with the control plane
 */
export async function registerSession(env: Env, sessionId: string, title?: string): Promise<void> {
  try {
    const controller = getAppController(env);
    await controller.addSession(sessionId, title);
  } catch (error) {
    console.error('Failed to register session:', error);
  }
}
/**
 * Update session activity timestamp
 */
export async function updateSessionActivity(env: Env, sessionId: string): Promise<void> {
  try {
    const controller = getAppController(env);
    await controller.updateSessionActivity(sessionId);
  } catch (error) {
    console.error('Failed to update session activity:', error);
  }
}
/**
 * Unregister a session from the control plane
 */
export async function unregisterSession(env: Env, sessionId: string): Promise<boolean> {
  try {
    const controller = getAppController(env);
    return await controller.removeSession(sessionId);
  } catch (error) {
    console.error('Failed to unregister session:', error);
    return false;
  }
}