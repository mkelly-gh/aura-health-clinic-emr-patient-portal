import { DurableObject } from 'cloudflare:workers';
import type { SessionInfo, Patient } from './types';
import type { Env } from './core-utils';
export class AppController extends DurableObject<Env> {
  private sessions = new Map<string, SessionInfo>();
  private patients = new Map<string, Patient>();
  private loaded = false;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }
  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      const storedSessions = await this.ctx.storage.get<Record<string, SessionInfo>>('sessions') || {};
      const storedPatients = await this.ctx.storage.get<Record<string, Patient>>('patients') || {};
      this.sessions = new Map(Object.entries(storedSessions));
      this.patients = new Map(Object.entries(storedPatients));
      this.loaded = true;
    }
  }
  private async persistSessions(): Promise<void> {
    await this.ctx.storage.put('sessions', Object.fromEntries(this.sessions));
  }
  private async persistPatients(): Promise<void> {
    await this.ctx.storage.put('patients', Object.fromEntries(this.patients));
  }
  async addSession(sessionId: string, title?: string): Promise<void> {
    await this.ensureLoaded();
    const now = Date.now();
    this.sessions.set(sessionId, {
      id: sessionId,
      title: title || `Chat ${new Date(now).toLocaleDateString()}`,
      createdAt: now,
      lastActive: now
    });
    await this.persistSessions();
  }
  async listSessions(): Promise<SessionInfo[]> {
    await this.ensureLoaded();
    return Array.from(this.sessions.values()).sort((a, b) => b.lastActive - a.lastActive);
  }
  async getPatients(): Promise<Patient[]> {
    await this.ensureLoaded();
    return Array.from(this.patients.values());
  }
  async getPatient(id: string): Promise<Patient | null> {
    await this.ensureLoaded();
    return this.patients.get(id) || null;
  }
  async seedPatients(patients: Patient[]): Promise<void> {
    await this.ensureLoaded();
    for (const p of patients) {
      this.patients.set(p.id, p);
    }
    await this.persistPatients();
  }
  async removeSession(sessionId: string): Promise<boolean> {
    await this.ensureLoaded();
    const deleted = this.sessions.delete(sessionId);
    if (deleted) await this.persistSessions();
    return deleted;
  }
  async updateSessionActivity(sessionId: string): Promise<void> {
    await this.ensureLoaded();
    const session = this.sessions.get(sessionId);
    if (session) { session.lastActive = Date.now(); await this.persistSessions(); }
  }
  async updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
    await this.ensureLoaded();
    const session = this.sessions.get(sessionId);
    if (session) { session.title = title; await this.persistSessions(); return true; }
    return false;
  }
  async getSessionCount(): Promise<number> { await this.ensureLoaded(); return this.sessions.size; }
  async clearAllSessions(): Promise<number> {
    await this.ensureLoaded();
    const count = this.sessions.size;
    this.sessions.clear();
    await this.persistSessions();
    return count;
  }
}